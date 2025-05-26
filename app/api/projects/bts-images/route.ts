// app/api/projects/bts-images/route.ts
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase-server"

export async function POST(request: Request) {
  try {
    const {
      projectId,
      images: clientImageUrls = [],
      caption = "",
      category = "general",
      replaceExisting = false,
    } = await request.json()

    if (!projectId) {
      return NextResponse.json({ success: false, error: "Project ID is required" }, { status: 400 })
    }

    // Ensure clientImageUrls is an array, even if null/undefined is passed
    const safeClientImageUrls = Array.isArray(clientImageUrls) ? clientImageUrls : []

    const supabase = createAdminClient()

    // First, check if the sort_order column exists
    const { data: columnInfo, error: columnCheckError } = await supabase.from("bts_images").select("*").limit(1)

    const hasSortOrderColumn = columnCheckError
      ? false
      : columnInfo && columnInfo.length > 0
        ? "sort_order" in columnInfo[0]
        : false

    if (replaceExisting) {
      // Fetch existing BTS media for this project
      const { data: existingBtsMedia, error: fetchError } = await supabase
        .from("bts_images")
        .select("id, image_url")
        .eq("project_id", projectId)

      if (fetchError) {
        console.error("Error fetching existing BTS media for replacement:", fetchError)
        return NextResponse.json(
          { success: false, error: `Failed to fetch existing BTS media: ${fetchError.message}` },
          { status: 500 },
        )
      }

      const dbImageUrlsMap = new Map(existingBtsMedia.map((item) => [item.image_url, item]))
      const clientImageUrlsSet = new Set(safeClientImageUrls)

      // 1. Identify URLs to delete
      const urlsToDelete = existingBtsMedia.filter((item) => !clientImageUrlsSet.has(item.image_url))
      if (urlsToDelete.length > 0) {
        const idsToDelete = urlsToDelete.map((item) => item.id)
        const { error: deleteError } = await supabase.from("bts_images").delete().in("id", idsToDelete)
        if (deleteError) {
          console.error("Error deleting old BTS media:", deleteError)
          return NextResponse.json(
            { success: false, error: `Failed to delete old BTS media: ${deleteError.message}` },
            { status: 500 },
          )
        }
      }

      // 2. Insert new URLs and Update existing ones (for sort_order)
      const upsertOperations = []
      for (let i = 0; i < safeClientImageUrls.length; i++) {
        const imageUrl = safeClientImageUrls[i]
        const existingItem = dbImageUrlsMap.get(imageUrl)

        if (existingItem) {
          // URL exists, check if sort_order needs update (only if column exists)
          if (hasSortOrderColumn) {
            upsertOperations.push(supabase.from("bts_images").update({ sort_order: i }).eq("id", existingItem.id))
          }
        } else {
          // New URL, prepare for insert
          const insertData: any = {
            project_id: projectId,
            image_url: imageUrl,
            caption: caption || `BTS Media ${i + 1}`, // Use default caption for new items
            category: category || "general", // Use default category for new items
          }

          // Only add sort_order if the column exists
          if (hasSortOrderColumn) {
            insertData.sort_order = i
          }

          upsertOperations.push(supabase.from("bts_images").insert(insertData))
        }
      }

      // Execute all upsert operations
      // Note: Supabase JS client doesn't directly support batch upserts with different values in a single command like SQL merge.
      // We execute promises sequentially or in parallel. Parallel is faster but error handling is more complex.
      // For simplicity here, let's run them and collect results.
      const results = await Promise.all(
        upsertOperations.map((op) =>
          op
            .select()
            .single()
            .catch((e) => ({ error: e })),
        ),
      )

      let errorsInUpsert = false
      results.forEach((result) => {
        if (result.error) {
          errorsInUpsert = true
          console.error("Error in BTS media upsert operation:", result.error)
        }
      })

      if (errorsInUpsert) {
        // This is tricky: some ops might have succeeded. A full transaction would be ideal.
        // For now, report a partial success or failure.
        return NextResponse.json(
          { success: false, error: "Some BTS media items failed to update or insert." },
          { status: 500 },
        )
      }

      return NextResponse.json({ success: true, message: "BTS media updated successfully (replaced)." })
    } else {
      // This is the append logic (replaceExisting = false)
      if (safeClientImageUrls.length === 0) {
        return NextResponse.json({ success: true, message: "No new BTS images to add." })
      }

      let currentMaxSortOrder = -1

      // Only fetch sort_order if the column exists
      if (hasSortOrderColumn) {
        const { data: existingImages, error: fetchError } = await supabase
          .from("bts_images")
          .select("image_url, sort_order")
          .eq("project_id", projectId)
          .order("sort_order", { ascending: false }) // Get highest sort order
          .limit(1)

        if (fetchError) {
          console.error("Error fetching existing BTS images for append:", fetchError)
          // Not necessarily fatal, can proceed assuming sort_order starts at 0
        }

        if (existingImages && existingImages.length > 0) {
          currentMaxSortOrder = existingImages[0].sort_order
        }
      }

      // Get existing URLs to avoid duplicates
      const { data: existingUrls, error: urlsError } = await supabase
        .from("bts_images")
        .select("image_url")
        .eq("project_id", projectId)

      if (urlsError) {
        console.error("Error fetching existing BTS image URLs:", urlsError)
        return NextResponse.json({ success: false, error: urlsError.message }, { status: 500 })
      }

      const existingUrlsSet = new Set(existingUrls?.map((img) => img.image_url) || [])
      const uniqueNewImages = safeClientImageUrls.filter((url) => !existingUrlsSet.has(url))

      if (uniqueNewImages.length === 0) {
        return NextResponse.json({
          success: true,
          message: "All provided BTS images already exist for this project (append mode).",
          duplicatesSkipped: safeClientImageUrls.length,
        })
      }

      const btsImagesData = uniqueNewImages.map((imageUrl, index) => {
        const data: any = {
          project_id: projectId,
          image_url: imageUrl,
          caption: caption || `BTS Image ${index + 1}`,
          category: category || "general",
        }

        // Only add sort_order if the column exists
        if (hasSortOrderColumn) {
          data.sort_order = currentMaxSortOrder + 1 + index
        }

        return data
      })

      const { data, error: insertError } = await supabase.from("bts_images").insert(btsImagesData).select()

      if (insertError) {
        console.error("Error adding new BTS images (append mode):", insertError)
        return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, data, message: `${data.length} new BTS images added.` })
    }
  } catch (error) {
    console.error("Unexpected error in POST /api/projects/bts-images:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}

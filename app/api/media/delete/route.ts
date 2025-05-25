import { createAdminClient } from "@/lib/supabase-server"
import { NextResponse } from "next/server"

interface MediaItemDeleteRequest {
  id: string
  filepath: string
  filetype: string
}

interface DeletionResult {
  id: string
  status: "success" | "error"
  dbStatus: "success" | "error" | "skipped"
  storageStatus: "success" | "error" | "skipped" | "not_applicable"
  error?: string
  dbError?: string
  storageError?: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const items: MediaItemDeleteRequest[] = body.items

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Invalid request: 'items' array is required and cannot be empty." }, { status: 400 })
    }

    const supabase = createAdminClient()
    const results: DeletionResult[] = []
    let overallSuccess = true
    let successfulDeletions = 0
    let failedDeletions = 0

    for (const item of items) {
      const { id, filepath, filetype } = item
      let currentItemSucceeded = true
      let itemDbStatus: DeletionResult["dbStatus"] = "skipped"
      let itemStorageStatus: DeletionResult["storageStatus"] = "skipped"
      let itemDbError: string | undefined
      let itemStorageError: string | undefined

      if (!id || !filepath || !filetype) {
        results.push({
          id: id || "unknown",
          status: "error",
          dbStatus: "skipped",
          storageStatus: "skipped",
          error: "Missing id, filepath, or filetype for this item.",
        })
        failedDeletions++
        overallSuccess = false
        continue
      }

      // 1. Delete from database
      try {
        const { error: dbError } = await supabase.from("media").delete().eq("id", id)
        if (dbError) {
          throw dbError
        }
        itemDbStatus = "success"
      } catch (dbError: any) {
        console.error(`Database deletion error for ID ${id}:`, dbError)
        itemDbStatus = "error"
        itemDbError = dbError.message || "Unknown database error"
        currentItemSucceeded = false
      }

      // 2. Delete from storage (only if DB deletion was successful or if forced)
      // For now, we proceed to storage deletion even if DB fails, but mark item as failed.
      // Could be changed to skip storage if DB fails and that's desired.
      itemStorageStatus = "not_applicable"
      if (filepath && !filepath.startsWith("http") && filetype !== "vimeo" && filetype !== "youtube" && filetype !== "linkedin") {
        try {
          // Ensure filepath is not empty and is a valid path component
          if (!filepath.trim()) {
            throw new Error("Filepath for storage deletion cannot be empty.")
          }
          const { error: storageError } = await supabase.storage.from("media").remove([filepath])
          if (storageError) {
            throw storageError
          }
          itemStorageStatus = "success"
        } catch (storageErr: any) {
          console.warn(`Storage deletion warning for ID ${id}, filepath ${filepath}:`, storageErr)
          itemStorageStatus = "error"
          itemStorageError = storageErr.message || "Unknown storage error"
          // If DB was fine but storage failed, the item overall is still a failure for atomicity.
          // However, the problem statement implies continuing, so we'll mark the item error but not stop.
          currentItemSucceeded = false
        }
      }

      if (currentItemSucceeded) {
        successfulDeletions++
      } else {
        failedDeletions++
        overallSuccess = false
      }

      results.push({
        id,
        status: currentItemSucceeded ? "success" : "error",
        dbStatus: itemDbStatus,
        storageStatus: itemStorageStatus,
        ...(itemDbError && { dbError: itemDbError }),
        ...(itemStorageError && { storageError: itemStorageError }),
        ...(!currentItemSucceeded && { error: `Failed to fully delete item. DB: ${itemDbStatus}, Storage: ${itemStorageStatus}` }),
      })
    }

    const responseMessage =
      failedDeletions > 0
        ? `Processed ${items.length} items. ${successfulDeletions} succeeded, ${failedDeletions} failed.`
        : `${successfulDeletions} media items processed successfully.`

    return NextResponse.json({
      success: overallSuccess,
      message: responseMessage,
      results,
    })
  } catch (error: any) {
    console.error("Error in bulk media delete API:", error)
    let errorMessage = "Failed to process request."
    if (error instanceof SyntaxError) { // JSON parsing error
      errorMessage = "Invalid JSON in request body."
    } else if (error.message) {
      errorMessage = error.message
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

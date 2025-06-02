import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function POST() {
  try {
    const supabase = createServerClient()

    // Get all media items
    const { data: allMedia, error: fetchError } = await supabase
      .from("media")
      .select("*")
      .order("created_at", { ascending: true })

    if (fetchError) {
      throw new Error(`Failed to fetch media: ${fetchError.message}`)
    }

    if (!allMedia || allMedia.length === 0) {
      return NextResponse.json({ message: "No media items found", duplicatesRemoved: 0 })
    }

    // Group by file hash to find duplicates
    const hashGroups: Record<string, any[]> = {}
    const urlGroups: Record<string, any[]> = {}

    for (const item of allMedia) {
      // Group by file hash if available
      const fileHash = item.metadata?.fileHash
      if (fileHash) {
        if (!hashGroups[fileHash]) {
          hashGroups[fileHash] = []
        }
        hashGroups[fileHash].push(item)
      }

      // Group by public URL as well
      if (item.public_url) {
        if (!urlGroups[item.public_url]) {
          urlGroups[item.public_url] = []
        }
        urlGroups[item.public_url].push(item)
      }
    }

    const duplicatesToRemove: string[] = []

    // Process hash-based duplicates
    for (const [hash, items] of Object.entries(hashGroups)) {
      if (items.length > 1) {
        // Keep the earliest created item, remove the rest
        const [keep, ...remove] = items.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
        
        console.log(`Found ${items.length} duplicates with hash ${hash}, keeping ${keep.id}`)
        duplicatesToRemove.push(...remove.map(item => item.id))
      }
    }

    // Process URL-based duplicates (excluding those already marked for removal)
    for (const [url, items] of Object.entries(urlGroups)) {
      if (items.length > 1) {
        const remaining = items.filter(item => !duplicatesToRemove.includes(item.id))
        if (remaining.length > 1) {
          const [keep, ...remove] = remaining.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )
          
          console.log(`Found ${remaining.length} duplicates with URL ${url}, keeping ${keep.id}`)
          duplicatesToRemove.push(...remove.map(item => item.id))
        }
      }
    }

    // Remove duplicates
    let removedCount = 0
    if (duplicatesToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from("media")
        .delete()
        .in("id", duplicatesToRemove)

      if (deleteError) {
        throw new Error(`Failed to delete duplicates: ${deleteError.message}`)
      }

      removedCount = duplicatesToRemove.length
      console.log(`Successfully removed ${removedCount} duplicate media items`)
    }

    return NextResponse.json({
      message: `Cleanup completed successfully`,
      duplicatesRemoved: removedCount,
      duplicateIds: duplicatesToRemove,
    })

  } catch (error) {
    console.error("Error cleaning up duplicates:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 },
    )
  }
}
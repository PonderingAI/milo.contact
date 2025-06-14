import { NextResponse } from "next/server"
import { checkMediaDuplicate } from "@/lib/media-utils"
import { createServerClient } from "@/lib/supabase-server"

/**
 * Unified Media Operations API
 * Consolidates media-related operations to reduce API calls
 * Supports: duplicate checking, cleanup, and media information
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const operation = searchParams.get('operation') || 'duplicate-check'
    
    const body = await request.json()

    switch (operation) {
      case 'duplicate-check':
        return await handleDuplicateCheck(body)
      
      case 'cleanup-duplicates':
        return await handleCleanupDuplicates()
      
      case 'media-info':
        return await handleMediaInfo(body)
      
      default:
        return NextResponse.json(
          { error: `Unknown operation: ${operation}` },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error("Error in media operations:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 }
    )
  }
}

async function handleDuplicateCheck(body: any) {
  const { url, fileHash, filename, filepath } = body

  // Validate input
  if (!url && !fileHash && !filename && !filepath) {
    return NextResponse.json(
      { error: "At least one of url, fileHash, filename, or filepath must be provided" },
      { status: 400 }
    )
  }

  // Check for duplicates
  const result = await checkMediaDuplicate({
    url,
    fileHash,
    filename,
    filepath,
  })

  return NextResponse.json(result)
}

async function handleCleanupDuplicates() {
  const supabase = createServerClient()

  // Get all media items
  const { data: mediaItems, error: fetchError } = await supabase
    .from("media")
    .select("*")
    .order("created_at", { ascending: true })

  if (fetchError) {
    throw new Error(`Failed to fetch media items: ${fetchError.message}`)
  }

  if (!mediaItems || mediaItems.length === 0) {
    return NextResponse.json({
      message: "No media items found",
      duplicatesRemoved: 0,
    })
  }

  // Group by file hash and public URL
  const hashGroups: Record<string, any[]> = {}
  const urlGroups: Record<string, any[]> = {}

  for (const item of mediaItems) {
    // Group by file hash if available
    if (item.metadata?.fileHash) {
      const hash = item.metadata.fileHash
      if (!hashGroups[hash]) {
        hashGroups[hash] = []
      }
      hashGroups[hash].push(item)
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
}

async function handleMediaInfo(body: any) {
  const { mediaId, includeUsage = false } = body
  
  if (!mediaId) {
    return NextResponse.json(
      { error: "mediaId is required" },
      { status: 400 }
    )
  }

  const supabase = createServerClient()
  
  const { data: mediaItem, error } = await supabase
    .from("media")
    .select("*")
    .eq("id", mediaId)
    .single()

  if (error) {
    return NextResponse.json(
      { error: `Failed to fetch media item: ${error.message}` },
      { status: 404 }
    )
  }

  let usageInfo = null
  if (includeUsage) {
    // This could be expanded to check actual usage across the application
    usageInfo = {
      locations: mediaItem.usage_locations || {},
      lastUsed: mediaItem.updated_at
    }
  }

  return NextResponse.json({
    media: mediaItem,
    usage: usageInfo,
    timestamp: new Date().toISOString()
  })
}
/**
 * Media Utilities
 *
 * This file contains utility functions for working with media files and URLs,
 * including duplicate detection, normalization, and validation.
 */

import { createServerClient } from "./supabase-server"
import { extractVideoInfo } from "./project-data"

/**
 * Interface for duplicate check results
 */
export interface DuplicateCheckResult {
  isDuplicate: boolean
  existingItem?: any
  reason?: string
  matchType?: "hash" | "url" | "filename" | "videoId" | "path"
}

/**
 * Check if a file already exists in the media library
 *
 * @param fileHash MD5 hash of the file
 * @param filename Original filename
 * @param filepath Path where the file would be stored
 * @returns Promise with duplicate check result
 */
export async function checkFileDuplicate(
  fileHash: string,
  filename: string,
  filepath?: string,
): Promise<DuplicateCheckResult> {
  try {
    const supabase = createServerClient()

    // Build a query to check for duplicates using multiple criteria
    let query = supabase.from("media").select("id, filename, filepath, public_url, filetype, metadata")

    // Build OR conditions array to avoid SQL injection
    const orConditions: string[] = []

    // Check by hash (most reliable) - use ->> for text extraction from JSON
    if (fileHash) {
      orConditions.push(`metadata->>fileHash.eq."${fileHash.replace(/"/g, '""')}"`)
    }

    // Also check by filename as fallback
    if (filename) {
      orConditions.push(`filename.eq."${filename.replace(/"/g, '""')}"`)
    }

    // Also check by filepath if provided
    if (filepath) {
      orConditions.push(`filepath.eq."${filepath.replace(/"/g, '""')}"`)
    }

    // Apply OR conditions if any exist
    if (orConditions.length > 0) {
      query = query.or(orConditions.join(','))
    }

    // Execute the query
    const { data, error } = await query.limit(1)

    if (error) {
      console.error("Error checking for file duplicates:", error)
      return { isDuplicate: false }
    }

    // If we found a match, return it
    if (data && data.length > 0) {
      const matchType =
        data[0].metadata?.fileHash === fileHash ? "hash" : data[0].filename === filename ? "filename" : "path"

      return {
        isDuplicate: true,
        existingItem: data[0],
        reason: `File already exists as "${data[0].filename}"`,
        matchType,
      }
    }

    // No duplicate found
    return { isDuplicate: false }
  } catch (error) {
    console.error("Error in checkFileDuplicate:", error)
    return { isDuplicate: false }
  }
}

/**
 * Normalize a URL by removing tracking parameters, standardizing protocol, etc.
 *
 * @param url URL to normalize
 * @returns Normalized URL
 */
export function normalizeUrl(url: string): string {
  try {
    if (!url) return ""

    // Create URL object to parse the URL
    const urlObj = new URL(url)

    // Remove common tracking parameters
    const paramsToRemove = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]
    paramsToRemove.forEach((param) => urlObj.searchParams.delete(param))

    // Handle YouTube URLs specially
    if (urlObj.hostname.includes("youtube.com") || urlObj.hostname.includes("youtu.be")) {
      // Keep only the video ID parameter for YouTube
      const videoInfo = extractVideoInfo(url)
      if (videoInfo && videoInfo.id) {
        return `https://www.youtube.com/watch?v=${videoInfo.id}`
      }
    }

    // Handle Vimeo URLs specially
    if (urlObj.hostname.includes("vimeo.com")) {
      // Extract just the video ID for Vimeo
      const videoInfo = extractVideoInfo(url)
      if (videoInfo && videoInfo.id) {
        return `https://vimeo.com/${videoInfo.id}`
      }
    }

    // Return the normalized URL
    return urlObj.toString()
  } catch (error) {
    console.error("Error normalizing URL:", error)
    return url // Return original URL if normalization fails
  }
}

/**
 * Check if a URL already exists in the media library
 *
 * @param url URL to check
 * @returns Promise with duplicate check result
 */
export async function checkUrlDuplicate(url: string): Promise<DuplicateCheckResult> {
  try {
    if (!url) return { isDuplicate: false }

    const supabase = createServerClient()
    const normalizedUrl = normalizeUrl(url)

    // Extract video info if it's a video URL
    const videoInfo = extractVideoInfo(url)

    // Build a query to check for duplicates using multiple criteria
    let query = supabase.from("media").select("id, filename, filepath, public_url, filetype, metadata")

    // Build OR conditions array to avoid SQL injection
    const orConditions: string[] = []

    // Check by exact URL match
    orConditions.push(`public_url.eq."${url.replace(/"/g, '""')}"`)
    orConditions.push(`filepath.eq."${url.replace(/"/g, '""')}"`)

    // If it's a normalized URL that's different from the original, check that too
    if (normalizedUrl !== url) {
      orConditions.push(`public_url.eq."${normalizedUrl.replace(/"/g, '""')}"`)
      orConditions.push(`filepath.eq."${normalizedUrl.replace(/"/g, '""')}"`)
    }

    // If it's a video URL, also check by video ID
    if (videoInfo) {
      const metadataField = `metadata->>${videoInfo.platform}Id`
      orConditions.push(`${metadataField}.eq."${videoInfo.id.replace(/"/g, '""')}"`)
    }

    // Apply OR conditions
    if (orConditions.length > 0) {
      query = query.or(orConditions.join(','))
    }

    // Execute the query
    const { data, error } = await query.limit(1)

    if (error) {
      console.error("Error checking for URL duplicates:", error)
      return { isDuplicate: false }
    }

    // If we found a match, return it
    if (data && data.length > 0) {
      let matchType: "url" | "videoId" = "url"

      // Determine the match type
      if (videoInfo && data[0].metadata && data[0].metadata[`${videoInfo.platform}Id`] === videoInfo.id) {
        matchType = "videoId"
      }

      return {
        isDuplicate: true,
        existingItem: data[0],
        reason: `URL already exists as "${data[0].filename}"`,
        matchType,
      }
    }

    // No duplicate found
    return { isDuplicate: false }
  } catch (error) {
    console.error("Error in checkUrlDuplicate:", error)
    return { isDuplicate: false }
  }
}

/**
 * Universal function to check for duplicates in the media library
 *
 * @param options Options for duplicate checking
 * @returns Promise with duplicate check result
 */
export async function checkMediaDuplicate(options: {
  url?: string
  fileHash?: string
  filename?: string
  filepath?: string
}): Promise<DuplicateCheckResult> {
  const { url, fileHash, filename, filepath } = options

  // If we have a URL, check for URL duplicates first
  if (url) {
    const urlResult = await checkUrlDuplicate(url)
    if (urlResult.isDuplicate) return urlResult
  }

  // If we have file info, check for file duplicates
  if (fileHash || filename || filepath) {
    return checkFileDuplicate(fileHash || "", filename || "", filepath)
  }

  // If we don't have enough info to check, return no duplicate
  return { isDuplicate: false }
}

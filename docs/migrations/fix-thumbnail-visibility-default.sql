-- Migration: Fix is_thumbnail_hidden default value issue
-- This fixes the bug where is_thumbnail_hidden defaulted to TRUE, hiding all media

-- Step 1: Update the default value for the column
ALTER TABLE main_media ALTER COLUMN is_thumbnail_hidden SET DEFAULT FALSE;

-- Step 2: Update existing records that were set to TRUE due to the incorrect default
-- Only update records where is_thumbnail_hidden is TRUE and they're not actually thumbnails
-- (Real video thumbnails should remain hidden, but regular media should be visible)

UPDATE main_media 
SET is_thumbnail_hidden = FALSE 
WHERE is_thumbnail_hidden = TRUE 
  AND (
    -- Regular images should be visible
    (is_video = FALSE AND video_url IS NULL) 
    OR 
    -- Videos should be visible 
    (is_video = TRUE AND video_url IS NOT NULL)
  );

-- Step 3: Keep actual video thumbnail entries hidden (these are the thumbnail-only entries)
-- These should remain hidden as they're just thumbnails for videos
UPDATE main_media 
SET is_thumbnail_hidden = TRUE 
WHERE is_video = FALSE 
  AND video_url IS NULL 
  AND image_url IN (
    -- Find images that are thumbnails for videos in the same project
    SELECT m2.image_url 
    FROM main_media m2 
    WHERE m2.is_video = TRUE 
      AND m2.project_id = main_media.project_id
      AND m2.image_url = main_media.image_url
  );

-- Add a comment to track this migration
COMMENT ON COLUMN main_media.is_thumbnail_hidden IS 'FALSE by default - only TRUE for standalone video thumbnails'; 
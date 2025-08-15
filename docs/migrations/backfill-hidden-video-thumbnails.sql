-- Backfill hidden thumbnail rows for videos and ensure visibility rules

-- 1) For every video in main_media, ensure there is a corresponding hidden image row with the same image_url
INSERT INTO main_media (
  project_id, image_url, caption, is_video, video_url, video_platform, video_id, display_order, is_thumbnail_hidden
)
SELECT 
  m.project_id,
  m.image_url,
  COALESCE(m.caption, 'Video Thumbnail'),
  FALSE,
  NULL,
  NULL,
  NULL,
  m.display_order,
  TRUE
FROM main_media m
WHERE m.is_video = TRUE
  AND NOT EXISTS (
    SELECT 1 FROM main_media i
    WHERE i.project_id = m.project_id
      AND i.image_url = m.image_url
      AND i.is_video = FALSE
  );

-- 2) Hide any image rows that are clearly video thumbnails (same image_url as a video in the same project)
UPDATE main_media i
SET is_thumbnail_hidden = TRUE
FROM main_media v
WHERE i.project_id = v.project_id
  AND i.image_url = v.image_url
  AND v.is_video = TRUE
  AND i.is_video = FALSE
  AND COALESCE(i.is_thumbnail_hidden, FALSE) = FALSE;

-- 3) Make sure regular images remain visible by default
UPDATE main_media
SET is_thumbnail_hidden = FALSE
WHERE is_video = FALSE
  AND (video_url IS NULL OR video_url = '')
  AND image_url NOT IN (
    SELECT v.image_url FROM main_media v WHERE v.is_video = TRUE AND v.project_id = main_media.project_id
  );



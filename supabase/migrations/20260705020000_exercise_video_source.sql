-- ============================================================
-- Hooper: Exercise video source (upload vs external link)
-- ============================================================
-- Exercises can have at most one video, either an uploaded file (stored in
-- the exercise-videos bucket) or a link to an external video (YouTube,
-- Vimeo, etc). video_source records which kind video_url is so the UI knows
-- whether to render a <video> player or an embed.

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS video_source text;

UPDATE exercises SET video_source = 'upload'
WHERE video_url IS NOT NULL AND video_source IS NULL;

ALTER TABLE exercises
  ADD CONSTRAINT exercises_video_source_check
    CHECK (video_source IS NULL OR video_source IN ('upload', 'link')),
  ADD CONSTRAINT exercises_video_source_pairing_check
    CHECK ((video_url IS NULL) = (video_source IS NULL));

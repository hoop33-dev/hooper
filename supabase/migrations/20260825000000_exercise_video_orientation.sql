-- ============================================================
-- Hooper: Exercise video orientation (portrait vs landscape)
-- ============================================================
-- The in-app player is always a portrait frame; a landscape-sourced video
-- is rotated to fill it edge-to-edge instead of the player switching to
-- landscape. For uploads, the mobile app reads orientation live from the
-- decoded video. Link videos (YouTube) expose no such runtime API, so
-- orientation is computed once server-side (via YouTube's oEmbed endpoint)
-- whenever a coach sets/changes a link, and persisted here. Null for
-- uploads and for exercises with no video yet — not paired with video_url
-- the way video_source is, since it's legitimately null for uploads too.

ALTER TABLE exercises ADD COLUMN IF NOT EXISTS video_orientation text;

ALTER TABLE exercises
  ADD CONSTRAINT exercises_video_orientation_check
    CHECK (video_orientation IS NULL OR video_orientation IN ('landscape', 'portrait'));

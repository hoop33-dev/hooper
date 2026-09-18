-- ============================================================
-- Hooper: Exercise Library
-- ============================================================

-- ── exercise_categories ──────────────────────────────────────
CREATE TABLE exercise_categories (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text,
  parent_id   uuid        REFERENCES exercise_categories(id) ON DELETE SET NULL,
  position    integer     NOT NULL DEFAULT 0,
  created_by  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_exercise_categories_parent_pos
  ON exercise_categories(parent_id, position);

CREATE TRIGGER set_exercise_categories_updated_at
  BEFORE UPDATE ON exercise_categories
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── exercises ────────────────────────────────────────────────
CREATE TABLE exercises (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  description text,
  video_url   text,
  created_by  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER set_exercises_updated_at
  BEFORE UPDATE ON exercises
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── exercise_category_links ───────────────────────────────────
CREATE TABLE exercise_category_links (
  exercise_id uuid NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES exercise_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (exercise_id, category_id)
);

-- ── exercise_unit_types ───────────────────────────────────────
CREATE TABLE exercise_unit_types (
  exercise_id uuid    NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  unit_type   text    NOT NULL,
  position    integer NOT NULL CHECK (position BETWEEN 0 AND 2),
  PRIMARY KEY (exercise_id, position)
);

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE exercise_categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises                ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_category_links  ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_unit_types      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercise_categories_select_all"
  ON exercise_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "exercise_categories_insert_own"
  ON exercise_categories FOR INSERT TO authenticated
  WITH CHECK (created_by = get_auth_profile_id());
CREATE POLICY "exercise_categories_update_own"
  ON exercise_categories FOR UPDATE TO authenticated
  USING (created_by = get_auth_profile_id())
  WITH CHECK (created_by = get_auth_profile_id());
CREATE POLICY "exercise_categories_delete_own"
  ON exercise_categories FOR DELETE TO authenticated
  USING (created_by = get_auth_profile_id());

CREATE POLICY "exercises_select_all"
  ON exercises FOR SELECT TO authenticated USING (true);
CREATE POLICY "exercises_insert_own"
  ON exercises FOR INSERT TO authenticated
  WITH CHECK (created_by = get_auth_profile_id());
CREATE POLICY "exercises_update_own"
  ON exercises FOR UPDATE TO authenticated
  USING (created_by = get_auth_profile_id())
  WITH CHECK (created_by = get_auth_profile_id());
CREATE POLICY "exercises_delete_own"
  ON exercises FOR DELETE TO authenticated
  USING (created_by = get_auth_profile_id());

CREATE POLICY "exercise_category_links_select_all"
  ON exercise_category_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "exercise_category_links_insert_own"
  ON exercise_category_links FOR INSERT TO authenticated
  WITH CHECK (
    exercise_id IN (SELECT id FROM exercises WHERE created_by = get_auth_profile_id())
  );
CREATE POLICY "exercise_category_links_delete_own"
  ON exercise_category_links FOR DELETE TO authenticated
  USING (
    exercise_id IN (SELECT id FROM exercises WHERE created_by = get_auth_profile_id())
  );

CREATE POLICY "exercise_unit_types_select_all"
  ON exercise_unit_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "exercise_unit_types_insert_own"
  ON exercise_unit_types FOR INSERT TO authenticated
  WITH CHECK (
    exercise_id IN (SELECT id FROM exercises WHERE created_by = get_auth_profile_id())
  );
CREATE POLICY "exercise_unit_types_delete_own"
  ON exercise_unit_types FOR DELETE TO authenticated
  USING (
    exercise_id IN (SELECT id FROM exercises WHERE created_by = get_auth_profile_id())
  );

-- ── Storage: exercise-videos bucket ──────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exercise-videos', 'exercise-videos', true, 524288000,
  ARRAY['video/mp4', 'video/quicktime', 'video/webm']
) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "exercise_videos_public_select"
  ON storage.objects FOR SELECT USING (bucket_id = 'exercise-videos');
CREATE POLICY "exercise_videos_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'exercise-videos'
    AND (storage.foldername(name))[1] = get_auth_profile_id()::text
  );
CREATE POLICY "exercise_videos_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'exercise-videos'
    AND (storage.foldername(name))[1] = get_auth_profile_id()::text
  );

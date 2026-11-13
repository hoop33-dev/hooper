-- ============================================================
-- Hooper: Harden athlete-facing write RLS
-- ============================================================
-- Two gaps in the write policies added by
-- 20260816000000_session_completions.sql and
-- 20260826000000_exercise_video_thumbnail.sql:
--
-- 1. athlete_measurement_logs insert/update checked only the denormalized
--    athlete_profile_id column, not that the referenced session_completion
--    actually belongs to the caller. Completion ids are globally SELECTable,
--    so any authenticated athlete could insert a "set complete" log against
--    another athlete's completion — a forged row the victim's resume query
--    loads by completion id and cannot delete (no delete policy) or edit
--    (update is owner-scoped). Now the referenced completion must also be
--    the caller's.
--
-- 2. The exercise-video-thumbnails bucket had INSERT/DELETE but no UPDATE
--    policy, while uploads use a deterministic path with upsert:true — the
--    overwrite on a second save was an RLS-blocked no-op.

-- ── athlete_measurement_logs: bind writes to the caller's completion ──
DROP POLICY IF EXISTS "athlete_measurement_logs_insert_own"
  ON athlete_measurement_logs;
DROP POLICY IF EXISTS "athlete_measurement_logs_update_own"
  ON athlete_measurement_logs;

CREATE POLICY "athlete_measurement_logs_insert_own"
  ON athlete_measurement_logs FOR INSERT TO authenticated
  WITH CHECK (
    athlete_profile_id = get_auth_profile_id()
    AND EXISTS (
      SELECT 1 FROM session_completions sc
      WHERE sc.id = session_completion_id
        AND sc.athlete_profile_id = get_auth_profile_id()
    )
  );

CREATE POLICY "athlete_measurement_logs_update_own"
  ON athlete_measurement_logs FOR UPDATE TO authenticated
  USING (
    athlete_profile_id = get_auth_profile_id()
    AND EXISTS (
      SELECT 1 FROM session_completions sc
      WHERE sc.id = session_completion_id
        AND sc.athlete_profile_id = get_auth_profile_id()
    )
  )
  WITH CHECK (
    athlete_profile_id = get_auth_profile_id()
    AND EXISTS (
      SELECT 1 FROM session_completions sc
      WHERE sc.id = session_completion_id
        AND sc.athlete_profile_id = get_auth_profile_id()
    )
  );

-- ── form_responses: same completion-ownership binding ─────────────────
-- (session_completion_id is nullable here — a null is fine, a non-null must
-- point at the caller's own completion.)
DROP POLICY IF EXISTS "form_responses_insert_own" ON form_responses;

CREATE POLICY "form_responses_insert_own"
  ON form_responses FOR INSERT TO authenticated
  WITH CHECK (
    athlete_profile_id = get_auth_profile_id()
    AND (
      session_completion_id IS NULL
      OR EXISTS (
        SELECT 1 FROM session_completions sc
        WHERE sc.id = session_completion_id
          AND sc.athlete_profile_id = get_auth_profile_id()
      )
    )
  );

-- ── exercise-video-thumbnails: allow the upsert overwrite ─────────────
CREATE POLICY "exercise_video_thumbnails_update_own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'exercise-video-thumbnails'
    AND (storage.foldername(name))[1] = get_auth_profile_id()::text
  )
  WITH CHECK (
    bucket_id = 'exercise-video-thumbnails'
    AND (storage.foldername(name))[1] = get_auth_profile_id()::text
  );

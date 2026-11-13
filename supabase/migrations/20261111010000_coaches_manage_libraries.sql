-- ============================================================
-- Hooper: every coach can manage every library item
-- ============================================================
-- 20261021010000_coaches_manage_all opened teams, programs and packages
-- to every coach but left the libraries creator-only. Coaches are staff,
-- not owners, so this does the same for the exercise library (with its
-- categories, styles and unit types), forms, saved blocks and sequences.
--
-- INSERT policies on the top-level rows still require created_by = the
-- caller. That only records who made the row; it doesn't limit who can
-- edit it afterwards.
--
-- Storage uploads still go under the uploader's own folder. Update and
-- delete open to every coach so replacing another coach's video or
-- photo can clean up the old file.

-- ── exercise library ──────────────────────────────────────────
DROP POLICY "exercises_update_own" ON exercises;
DROP POLICY "exercises_delete_own" ON exercises;
CREATE POLICY "exercises_update_coaches"
  ON exercises FOR UPDATE TO authenticated
  USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "exercises_delete_coaches"
  ON exercises FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "exercise_categories_update_own" ON exercise_categories;
DROP POLICY "exercise_categories_delete_own" ON exercise_categories;
CREATE POLICY "exercise_categories_update_coaches"
  ON exercise_categories FOR UPDATE TO authenticated
  USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "exercise_categories_delete_coaches"
  ON exercise_categories FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "exercise_styles_update_own" ON exercise_styles;
DROP POLICY "exercise_styles_delete_own" ON exercise_styles;
CREATE POLICY "exercise_styles_update_coaches"
  ON exercise_styles FOR UPDATE TO authenticated
  USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "exercise_styles_delete_coaches"
  ON exercise_styles FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "unit_types_update_own" ON unit_types;
DROP POLICY "unit_types_delete_own" ON unit_types;
CREATE POLICY "unit_types_update_coaches"
  ON unit_types FOR UPDATE TO authenticated
  USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "unit_types_delete_coaches"
  ON unit_types FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "exercise_category_links_insert_own" ON exercise_category_links;
DROP POLICY "exercise_category_links_delete_own" ON exercise_category_links;
CREATE POLICY "exercise_category_links_insert_coaches"
  ON exercise_category_links FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "exercise_category_links_delete_coaches"
  ON exercise_category_links FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "exercise_photos_insert_own" ON exercise_photos;
DROP POLICY "exercise_photos_delete_own" ON exercise_photos;
CREATE POLICY "exercise_photos_insert_coaches"
  ON exercise_photos FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "exercise_photos_delete_coaches"
  ON exercise_photos FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "exercise_unit_types_insert_own" ON exercise_unit_types;
DROP POLICY "exercise_unit_types_delete_own" ON exercise_unit_types;
CREATE POLICY "exercise_unit_types_insert_coaches"
  ON exercise_unit_types FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "exercise_unit_types_delete_coaches"
  ON exercise_unit_types FOR DELETE TO authenticated
  USING (is_coach());


-- ── forms ─────────────────────────────────────────────────────
DROP POLICY "forms_update_own" ON forms;
DROP POLICY "forms_delete_own" ON forms;
CREATE POLICY "forms_update_coaches"
  ON forms FOR UPDATE TO authenticated
  USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "forms_delete_coaches"
  ON forms FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "form_questions_insert_own" ON form_questions;
DROP POLICY "form_questions_update_own" ON form_questions;
DROP POLICY "form_questions_delete_own" ON form_questions;
CREATE POLICY "form_questions_insert_coaches"
  ON form_questions FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "form_questions_update_coaches"
  ON form_questions FOR UPDATE TO authenticated
  USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "form_questions_delete_coaches"
  ON form_questions FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "form_question_options_insert_own" ON form_question_options;
DROP POLICY "form_question_options_delete_own" ON form_question_options;
CREATE POLICY "form_question_options_insert_coaches"
  ON form_question_options FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "form_question_options_delete_coaches"
  ON form_question_options FOR DELETE TO authenticated
  USING (is_coach());


-- ── block library (session_templates own the saved blocks) ────
DROP POLICY "session_templates_update_own" ON session_templates;
DROP POLICY "session_templates_delete_own" ON session_templates;
CREATE POLICY "session_templates_update_coaches"
  ON session_templates FOR UPDATE TO authenticated
  USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "session_templates_delete_coaches"
  ON session_templates FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "block_templates_insert_own" ON block_templates;
DROP POLICY "block_templates_update_own" ON block_templates;
DROP POLICY "block_templates_delete_own" ON block_templates;
CREATE POLICY "block_templates_insert_coaches"
  ON block_templates FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "block_templates_update_coaches"
  ON block_templates FOR UPDATE TO authenticated
  USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "block_templates_delete_coaches"
  ON block_templates FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "block_template_exercises_insert_own" ON block_template_exercises;
DROP POLICY "block_template_exercises_update_own" ON block_template_exercises;
DROP POLICY "block_template_exercises_delete_own" ON block_template_exercises;
CREATE POLICY "block_template_exercises_insert_coaches"
  ON block_template_exercises FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "block_template_exercises_update_coaches"
  ON block_template_exercises FOR UPDATE TO authenticated
  USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "block_template_exercises_delete_coaches"
  ON block_template_exercises FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "block_template_exercise_measurements_insert_own" ON block_template_exercise_measurements;
DROP POLICY "block_template_exercise_measurements_update_own" ON block_template_exercise_measurements;
DROP POLICY "block_template_exercise_measurements_delete_own" ON block_template_exercise_measurements;
CREATE POLICY "block_template_exercise_measurements_insert_coaches"
  ON block_template_exercise_measurements FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "block_template_exercise_measurements_update_coaches"
  ON block_template_exercise_measurements FOR UPDATE TO authenticated
  USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "block_template_exercise_measurements_delete_coaches"
  ON block_template_exercise_measurements FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "block_template_exercise_sequence_steps_insert_own" ON block_template_exercise_sequence_steps;
DROP POLICY "block_template_exercise_sequence_steps_delete_own" ON block_template_exercise_sequence_steps;
CREATE POLICY "block_template_exercise_sequence_steps_insert_coaches"
  ON block_template_exercise_sequence_steps FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "block_template_exercise_sequence_steps_delete_coaches"
  ON block_template_exercise_sequence_steps FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "block_template_exercise_sequence_picks_insert_own" ON block_template_exercise_sequence_picks;
DROP POLICY "block_template_exercise_sequence_picks_delete_own" ON block_template_exercise_sequence_picks;
CREATE POLICY "block_template_exercise_sequence_picks_insert_coaches"
  ON block_template_exercise_sequence_picks FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "block_template_exercise_sequence_picks_delete_coaches"
  ON block_template_exercise_sequence_picks FOR DELETE TO authenticated
  USING (is_coach());


-- ── sequences ─────────────────────────────────────────────────
DROP POLICY "sequences_update_own" ON sequences;
DROP POLICY "sequences_delete_own" ON sequences;
CREATE POLICY "sequences_update_coaches"
  ON sequences FOR UPDATE TO authenticated
  USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "sequences_delete_coaches"
  ON sequences FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "sequence_steps_insert_own" ON sequence_steps;
DROP POLICY "sequence_steps_update_own" ON sequence_steps;
DROP POLICY "sequence_steps_delete_own" ON sequence_steps;
CREATE POLICY "sequence_steps_insert_coaches"
  ON sequence_steps FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "sequence_steps_update_coaches"
  ON sequence_steps FOR UPDATE TO authenticated
  USING (is_coach()) WITH CHECK (is_coach());
CREATE POLICY "sequence_steps_delete_coaches"
  ON sequence_steps FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "sequence_step_picks_insert_own" ON sequence_step_picks;
DROP POLICY "sequence_step_picks_delete_own" ON sequence_step_picks;
CREATE POLICY "sequence_step_picks_insert_coaches"
  ON sequence_step_picks FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "sequence_step_picks_delete_coaches"
  ON sequence_step_picks FOR DELETE TO authenticated
  USING (is_coach());

DROP POLICY "sequence_measurements_insert_own" ON sequence_measurements;
DROP POLICY "sequence_measurements_delete_own" ON sequence_measurements;
CREATE POLICY "sequence_measurements_insert_coaches"
  ON sequence_measurements FOR INSERT TO authenticated
  WITH CHECK (is_coach());
CREATE POLICY "sequence_measurements_delete_coaches"
  ON sequence_measurements FOR DELETE TO authenticated
  USING (is_coach());

-- ── storage ──────────────────────────────────────────────────
DROP POLICY "exercise_videos_delete_own" ON storage.objects;
CREATE POLICY "exercise_videos_delete_coaches"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'exercise-videos' AND is_coach());

DROP POLICY "exercise_video_thumbnails_update_own" ON storage.objects;
DROP POLICY "exercise_video_thumbnails_delete_own" ON storage.objects;
CREATE POLICY "exercise_video_thumbnails_update_coaches"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'exercise-video-thumbnails' AND is_coach())
  WITH CHECK (bucket_id = 'exercise-video-thumbnails' AND is_coach());
CREATE POLICY "exercise_video_thumbnails_delete_coaches"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'exercise-video-thumbnails' AND is_coach());

DROP POLICY "exercise_photos_storage_update_own" ON storage.objects;
DROP POLICY "exercise_photos_storage_delete_own" ON storage.objects;
CREATE POLICY "exercise_photos_storage_update_coaches"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'exercise-photos' AND is_coach())
  WITH CHECK (bucket_id = 'exercise-photos' AND is_coach());
CREATE POLICY "exercise_photos_storage_delete_coaches"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'exercise-photos' AND is_coach());

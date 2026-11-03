-- ============================================================
-- Hooper: Program Sources (copy-lineage graph)
-- ============================================================
-- Records one edge per "copy program S's weeks into program D" operation,
-- so a cycle-safety check (S must not already be an ancestor of D) can be
-- computed before allowing a new copy. Immutable/append-only — no columns
-- ever change after insert, so no updated_at/trigger.

CREATE TABLE program_sources (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source_program_id       uuid        NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  destination_program_id  uuid        NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  created_at              timestamptz NOT NULL DEFAULT now(),
  CHECK (source_program_id <> destination_program_id)
);

CREATE INDEX idx_program_sources_source ON program_sources(source_program_id);
CREATE INDEX idx_program_sources_destination ON program_sources(destination_program_id);

-- ── Row Level Security ────────────────────────────────────────
-- Like sessions/blocks/block_exercises, this is a child/edge table with no
-- created_by of its own — ownership chains through destination_program_id
-- only. Reads are open (matches every other table in this schema); a coach
-- may import from a program they don't own (no team/org scoping exists
-- anywhere in this app), but may only record an edge landing in a program
-- they own, since that's the only program they're allowed to write
-- sessions into in the same operation.
ALTER TABLE program_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "program_sources_select_all"
  ON program_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "program_sources_insert_own"
  ON program_sources FOR INSERT TO authenticated
  WITH CHECK (
    destination_program_id IN (SELECT id FROM programs WHERE created_by = get_auth_profile_id())
  );
CREATE POLICY "program_sources_delete_own"
  ON program_sources FOR DELETE TO authenticated
  USING (
    destination_program_id IN (SELECT id FROM programs WHERE created_by = get_auth_profile_id())
  );
-- No UPDATE policy: edges carry no mutable fields beyond the immutable key
-- pair, so there's nothing to update — RLS enabled with no UPDATE policy
-- simply denies updates, which is the correct behavior here.

-- ============================================================
-- Hooper: Session links
-- ============================================================
-- Sessions duplicated across weeks (and their blocks/block_exercises) can
-- share a link_group_id — a plain grouping tag, not a foreign key — marking
-- them as "the same thing, placed in different weeks" so edits to one can
-- propagate to the rest. No RLS changes needed: these are just extra
-- columns on tables whose row-level policies already chain through
-- programs.created_by.

ALTER TABLE sessions ADD COLUMN link_group_id uuid;
ALTER TABLE blocks ADD COLUMN link_group_id uuid;
ALTER TABLE block_exercises ADD COLUMN link_group_id uuid;

CREATE INDEX idx_sessions_link_group
  ON sessions(link_group_id) WHERE link_group_id IS NOT NULL;
CREATE INDEX idx_blocks_link_group
  ON blocks(link_group_id) WHERE link_group_id IS NOT NULL;
CREATE INDEX idx_block_exercises_link_group
  ON block_exercises(link_group_id) WHERE link_group_id IS NOT NULL;

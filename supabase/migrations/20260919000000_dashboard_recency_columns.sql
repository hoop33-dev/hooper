-- ============================================================
-- Hooper: add recency_at to the dashboard recency views
-- ============================================================
-- 20260916000000_dashboard_recency.sql was edited after it had already
-- been applied, so databases that ran the earlier revision have the
-- three views WITHOUT the `recency_at` column the dashboard orders by
-- (every dashboard query failed with 42703 and the cards rendered as
-- empty). CREATE OR REPLACE VIEW can append a trailing column, so this
-- brings those databases in line and is a no-op on fresh ones.

CREATE OR REPLACE VIEW program_recency WITH (security_invoker = true) AS
SELECT
  p.id AS program_id,
  p.updated_at,
  lc.last_completed_at,
  COALESCE(lc.last_completed_at, p.updated_at) AS recency_at
FROM programs p
LEFT JOIN (
  SELECT s.program_id, MAX(sc.completed_at) AS last_completed_at
  FROM sessions s
  JOIN session_completions sc
    ON sc.session_id = s.id AND sc.status = 'completed'
  GROUP BY s.program_id
) lc ON lc.program_id = p.id;

CREATE OR REPLACE VIEW team_recency WITH (security_invoker = true) AS
SELECT
  t.id AS team_id,
  t.updated_at,
  tm.last_member_joined_at,
  COALESCE(tm.last_member_joined_at, t.updated_at) AS recency_at
FROM teams t
LEFT JOIN (
  SELECT team_id, MAX(created_at) AS last_member_joined_at
  FROM team_members
  GROUP BY team_id
) tm ON tm.team_id = t.id;

CREATE OR REPLACE VIEW form_recency WITH (security_invoker = true) AS
SELECT
  f.id AS form_id,
  f.updated_at,
  fr.last_submitted_at,
  COALESCE(fr.last_submitted_at, f.updated_at) AS recency_at
FROM forms f
LEFT JOIN (
  SELECT form_id, MAX(submitted_at) AS last_submitted_at
  FROM form_responses
  GROUP BY form_id
) fr ON fr.form_id = f.id;

GRANT SELECT ON program_recency, team_recency, form_recency TO authenticated;

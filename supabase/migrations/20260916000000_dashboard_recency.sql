-- ============================================================
-- Hooper: Dashboard recency views + athlete last-sign-in-by-rank RPC
-- ============================================================
-- Backs the coach dashboard's 4 list cards (Programs/Athletes/Teams/
-- Forms), each sorted by a "most recently active" signal. These need
-- to rank across the coach's ENTIRE program/team/form/athlete set, not
-- just the 6 rows shown, so they're built as server-side aggregates
-- rather than reusing programProgress.service.ts's pattern of pulling
-- every session + session_completions row into JS (fine scoped to one
-- program/team detail page, not fine run over everything on every
-- dashboard load).

-- ── form_responses: index for GROUP BY form_id ──────────────────
-- idx_form_responses_athlete (athlete_profile_id, submitted_at DESC),
-- from 20260816000000_session_completions.sql, doesn't help a scan
-- grouped/ordered by form_id.
CREATE INDEX idx_form_responses_form_submitted
  ON form_responses(form_id, submitted_at DESC);

-- ── program_recency ──────────────────────────────────────────
-- Per program: most recent completed session, if any. programs,
-- sessions, and session_completions are all already
-- `FOR SELECT TO authenticated USING (true)` (every coach sees every
-- row), so `security_invoker = true` is enough here — no
-- SECURITY DEFINER needed, unlike the RPC below.
CREATE VIEW program_recency WITH (security_invoker = true) AS
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

GRANT SELECT ON program_recency TO authenticated;

-- ── team_recency ──────────────────────────────────────────────
-- Per team: most recent member join date (cheap proxy for "recently
-- active team" that needs no auth.users access, unlike a literal
-- "most recent login of any member").
CREATE VIEW team_recency WITH (security_invoker = true) AS
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

GRANT SELECT ON team_recency TO authenticated;

-- ── form_recency ──────────────────────────────────────────────
-- Per form: most recent submitted response, if any.
CREATE VIEW form_recency WITH (security_invoker = true) AS
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

GRANT SELECT ON form_recency TO authenticated;

-- ── list_athletes_by_last_sign_in ────────────────────────────────
-- Same reasoning as get_athlete_last_sign_ins (auth.users isn't
-- grant-accessible to a plain authenticated session — see that
-- function's comment in 20260725000000_athletes_and_teams.sql): this
-- has to be SECURITY DEFINER, STABLE, gated by is_coach(). Unlike
-- that function (bulk lookup for a known id list), this one ranks and
-- limits server-side, since the dashboard needs to sort across every
-- athlete, not just the ones already chosen.
CREATE OR REPLACE FUNCTION list_athletes_by_last_sign_in(p_limit integer)
RETURNS TABLE(profile_id uuid, last_sign_in_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, u.last_sign_in_at
  FROM profiles p
  JOIN auth.users u ON u.id = p.auth_user_id
  JOIN user_roles ur ON ur.profile_id = p.id AND ur.role = 'player'
  WHERE is_coach()
  ORDER BY u.last_sign_in_at DESC NULLS LAST
  LIMIT p_limit
$$;

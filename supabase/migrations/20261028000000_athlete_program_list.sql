-- ============================================================
-- Every program an athlete gets, for the coach portal's lists
-- ============================================================
-- The athletes table and the dashboard's Athletes card showed only
-- programs assigned directly (program_athletes), so an athlete on a
-- package or a team read "—". The athlete page already merges all three
-- sources; this gives the lists the same answer in one round trip, with the
-- membership → team → program hop done here rather than as a second
-- dependent query from the portal.
--
-- One row per athlete (programs aggregated as JSON) keeps a large roster
-- well under PostgREST's max-rows cap, which one row per program wouldn't.
--
-- SECURITY DEFINER because package_purchases RLS only shows a user their
-- own rows; is_coach() re-applies who may read it, like
-- get_athlete_last_sign_ins. The live-purchase filter matches
-- package_program_access and team_memberships.
CREATE OR REPLACE FUNCTION coach_athlete_programs(p_profile_ids uuid[])
RETURNS TABLE(profile_id uuid, programs jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH live AS (
    SELECT pu.athlete_profile_id AS profile_id, pu.package_id
    FROM package_purchases pu
    WHERE pu.athlete_profile_id = ANY(p_profile_ids)
      AND pu.status IN ('active', 'past_due')
      AND (pu.access_until IS NULL OR pu.access_until > now())
  ),
  team_links AS (
    SELECT tm.profile_id, tm.team_id
    FROM team_members tm
    WHERE tm.profile_id = ANY(p_profile_ids)
    UNION
    SELECT l.profile_id, pt.team_id
    FROM live l
    JOIN package_teams pt ON pt.package_id = l.package_id
  ),
  sources AS (
    -- 1 direct, 2 package, 3 team: a program reached more than one way is
    -- listed once, under the coach's own assignment when there is one.
    SELECT pa.profile_id, pa.program_id, 1 AS rank
    FROM program_athletes pa
    WHERE pa.profile_id = ANY(p_profile_ids)
    UNION ALL
    SELECT l.profile_id, pp.program_id, 2
    FROM live l
    JOIN package_programs pp ON pp.package_id = l.package_id
    UNION ALL
    SELECT t.profile_id, pt.program_id, 3
    FROM team_links t
    JOIN program_teams pt ON pt.team_id = t.team_id
  ),
  best AS (
    SELECT DISTINCT ON (s.profile_id, s.program_id)
      s.profile_id, s.program_id, s.rank
    FROM sources s
    ORDER BY s.profile_id, s.program_id, s.rank
  )
  SELECT
    b.profile_id,
    jsonb_agg(
      jsonb_build_object('id', pr.id, 'name', pr.name)
      ORDER BY b.rank, pr.name
    )
  FROM best b
  JOIN programs pr ON pr.id = b.program_id
  WHERE is_coach()
  GROUP BY b.profile_id
$$;

REVOKE ALL ON FUNCTION coach_athlete_programs(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION coach_athlete_programs(uuid[]) TO authenticated;

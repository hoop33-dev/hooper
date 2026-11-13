-- ============================================================
-- Hooper: package program access
-- ============================================================
-- Which programs each athlete gets through an active package purchase, so
-- the coach portal's athlete page can list them. package_program_ids()
-- only answers for the athlete or their parent, so coaches need this.

-- ── package_program_access ────────────────────────────────────
-- One row per (purchase, program): an athlete holding two packages that
-- share a program gets a row for each.
--
-- Like team_memberships, the view runs as its owner (not security_invoker)
-- because package_purchases RLS only shows a user their own rows, and the
-- WHERE clause re-applies who can read what: coaches see everyone, an
-- athlete sees their own rows, and a parent with an active link sees their
-- child's rows.
CREATE VIEW package_program_access AS
SELECT *
FROM (
  SELECT
    pu.athlete_profile_id AS profile_id,
    pr.id AS program_id,
    pr.name AS program_name,
    p.id AS package_id,
    p.name AS package_name
  FROM package_purchases pu
  JOIN package_programs pp ON pp.package_id = pu.package_id
  JOIN programs pr ON pr.id = pp.program_id
  JOIN packages p ON p.id = pu.package_id
  WHERE pu.status IN ('active', 'past_due')
    AND (pu.access_until IS NULL OR pu.access_until > now())
) a
WHERE is_coach()
   OR a.profile_id = get_auth_profile_id()
   OR EXISTS (
     SELECT 1 FROM parent_player_links l
     WHERE l.player_profile_id = a.profile_id
       AND l.parent_profile_id = get_auth_profile_id()
       AND l.status = 'active'
   );

REVOKE ALL ON package_program_access FROM PUBLIC, anon;
GRANT SELECT ON package_program_access TO authenticated;

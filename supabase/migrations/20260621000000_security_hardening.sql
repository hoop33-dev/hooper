-- ============================================================
-- Security hardening
-- ============================================================
-- 1. Make identity columns on `profiles` immutable via UPDATE.
-- 2. Add a server-side throttle for the public username sign-in endpoint.

-- ── 1. Immutable identity columns ─────────────────────────────
-- profiles_update_own (RLS) lets a user update their own row, but only the
-- profile fields the app exposes should be editable. auth_user_id and
-- has_real_email are set once at signup and must never change via an UPDATE —
-- flipping has_real_email would corrupt the verification / password-change
-- gating that keys off it. RLS scopes *rows*, not *columns*, so we enforce
-- column immutability here. The values are silently preserved (not rejected)
-- so updates that send the whole row still succeed.
CREATE OR REPLACE FUNCTION enforce_profile_immutable_columns()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.auth_user_id   := OLD.auth_user_id;
  NEW.has_real_email := OLD.has_real_email;
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_immutable_columns
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION enforce_profile_immutable_columns();

-- ── 2. Sign-in throttle ───────────────────────────────────────
-- signin-with-username is a public (verify_jwt = false) endpoint that verifies
-- passwords. Because the edge function calls signInWithPassword server-side,
-- GoTrue's per-IP limit sees only the function's IP and can't throttle a
-- caller — so we track attempts ourselves, keyed per-username (targeted
-- brute-force) and per-IP (spray). The counter resets on a successful sign-in.
CREATE TABLE signin_throttle (
  key          text        PRIMARY KEY,
  attempts     integer     NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now()
);

-- RLS on with no policies: unreachable by anon/authenticated. Only the
-- service-role client (used by the edge function) touches it, and that role
-- bypasses RLS.
ALTER TABLE signin_throttle ENABLE ROW LEVEL SECURITY;

-- Atomically record an attempt against `p_key`. Returns true while the count
-- stays within p_max for the rolling p_window_seconds window, false once it is
-- exceeded. The window resets the first time a request lands after it lapses.
CREATE OR REPLACE FUNCTION register_signin_attempt(
  p_key            text,
  p_max            integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now      timestamptz := now();
  v_attempts integer;
BEGIN
  INSERT INTO signin_throttle (key, attempts, window_start)
  VALUES (p_key, 1, v_now)
  ON CONFLICT (key) DO UPDATE
    SET attempts =
          CASE WHEN signin_throttle.window_start
                    < v_now - make_interval(secs => p_window_seconds)
               THEN 1
               ELSE signin_throttle.attempts + 1 END,
        window_start =
          CASE WHEN signin_throttle.window_start
                    < v_now - make_interval(secs => p_window_seconds)
               THEN v_now
               ELSE signin_throttle.window_start END
  RETURNING attempts INTO v_attempts;

  RETURN v_attempts <= p_max;
END;
$$;

-- Reset the counter for a key after a successful sign-in.
CREATE OR REPLACE FUNCTION clear_signin_throttle(p_key text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM signin_throttle WHERE key = p_key;
$$;

-- Lock these down to the service role only — they must never be callable by
-- anon/authenticated clients (which could reset or pollute the throttle).
REVOKE ALL ON FUNCTION register_signin_attempt(text, integer, integer) FROM public;
REVOKE ALL ON FUNCTION clear_signin_throttle(text) FROM public;
GRANT EXECUTE ON FUNCTION register_signin_attempt(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION clear_signin_throttle(text) TO service_role;

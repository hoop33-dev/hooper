-- Guardian relationship between two profiles.
-- Inserted and deleted only via service-role Edge Functions to prevent self-linking.
CREATE TABLE public.profile_links (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_profile_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player_profile_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (guardian_profile_id, player_profile_id)
);

ALTER TABLE public.profile_links ENABLE ROW LEVEL SECURITY;

-- Participants can read their own links; all writes go through service-role Edge Functions
CREATE POLICY "profile_links_select_participant"
  ON public.profile_links FOR SELECT
  USING (auth.uid() = guardian_profile_id OR auth.uid() = player_profile_id);

-- Short-lived one-time codes used to establish guardian links.
-- Inserted and consumed only via service-role Edge Functions to prevent tampering.
CREATE TABLE public.link_codes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id  UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  code        TEXT        NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.link_codes ENABLE ROW LEVEL SECURITY;

-- Owner can read their own codes; all writes go through service-role Edge Functions
CREATE POLICY "link_codes_select_own"
  ON public.link_codes FOR SELECT
  USING (auth.uid() = profile_id);

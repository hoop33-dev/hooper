export type RoleType = "player" | "coach" | "parent";
export type LinkStatus = "active" | "disconnected";

export type Region = {
  id: string;
  name: string;
  slug: string;
  created_at: string;
};

export type Profile = {
  id: string;
  auth_user_id: string;
  first_name: string;
  last_name: string;
  username: string;
  has_real_email: boolean;
  date_of_birth: string | null;
  mobile: string | null;
  region_id: string | null;
  bio: string | null;
  is_private: boolean;
  show_age: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type UserRole = {
  id: string;
  profile_id: string;
  role: RoleType;
  created_at: string;
};

export type ParentPlayerLink = {
  id: string;
  parent_profile_id: string;
  player_profile_id: string;
  status: LinkStatus;
  created_at: string;
  updated_at: string;
};

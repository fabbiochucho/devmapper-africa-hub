/** Typed profile matching the public.profiles table */
export interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  country: string | null;
  organization: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

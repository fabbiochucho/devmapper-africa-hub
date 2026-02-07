-- Drop problematic triggers on auth.users that are causing the "identities" error
DROP TRIGGER IF EXISTS sync_provider_trigger ON auth.users;
DROP TRIGGER IF EXISTS upsert_user_provider_trigger ON auth.users;

-- Drop the associated functions that reference invalid columns
DROP FUNCTION IF EXISTS public.sync_provider_on_auth_users();
DROP FUNCTION IF EXISTS public.upsert_user_provider_from_auth_users();

-- Drop user_providers table if it exists
DROP TABLE IF EXISTS public.user_providers;
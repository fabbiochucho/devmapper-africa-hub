-- §25/27 (Provider Failure & Fallback, Administrator Control): each of
-- the 9 connectors already has its own ad-hoc try/catch, but nothing
-- records success/failure anywhere an admin (or Ndovu Akili) could see
-- it. Adds health-tracking columns to the data_providers registry
-- (built last session) and a small SECURITY DEFINER function any edge
-- function can call to record an attempt - a genuine modification of
-- the existing registry, not a new subsystem.
ALTER TABLE public.data_providers
  ADD COLUMN last_success_at timestamptz,
  ADD COLUMN last_error_at timestamptz,
  ADD COLUMN last_error_message text,
  ADD COLUMN consecutive_failures integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.record_provider_health(
  p_provider_key text,
  p_success boolean,
  p_error_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.data_providers
  SET
    last_success_at = CASE WHEN p_success THEN now() ELSE last_success_at END,
    last_error_at = CASE WHEN NOT p_success THEN now() ELSE last_error_at END,
    last_error_message = CASE WHEN NOT p_success THEN p_error_message ELSE last_error_message END,
    consecutive_failures = CASE WHEN p_success THEN 0 ELSE consecutive_failures + 1 END
  WHERE provider_key = p_provider_key;
END;
$$;

-- Callable by any authenticated edge-function invocation (the function
-- only ever writes health metadata for a named provider, never business
-- data) and by anon, since some connectors (worldbank, sdg, iati,
-- climatetrace) don't require a signed-in caller upstream of this call.
GRANT EXECUTE ON FUNCTION public.record_provider_health(text, boolean, text) TO anon, authenticated;

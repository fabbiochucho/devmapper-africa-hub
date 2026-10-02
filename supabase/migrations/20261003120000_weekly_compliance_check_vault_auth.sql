-- weekly-compliance-check sent the anon key, which compliance-check rejects (it wants CRON_SECRET,
-- never set), so it has returned 401 every Monday. Send the service-role key from Vault instead,
-- like the other edge-function jobs.
SELECT cron.schedule('weekly-compliance-check', '0 6 * * 1', $$
  SELECT net.http_post(
    url := 'https://ptfrzwsivtetvmdotfui.supabase.co/functions/v1/compliance-check',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization',
      'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000)
$$);

-- Enable pg_cron and pg_net for scheduled compliance checks
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule compliance-check to run weekly on Mondays at 06:00 UTC
SELECT cron.schedule(
  'weekly-compliance-check',
  '0 6 * * 1',
  $$
  SELECT net.http_post(
    url := 'https://ptfrzwsivtetvmdotfui.supabase.co/functions/v1/compliance-check',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB0ZnJ6d3NpdnRldHZtZG90ZnVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5OTQ1MjAsImV4cCI6MjA2NTU3MDUyMH0.2IWT0RjoMao3zA7O2rmt5t9mHiRdsF0mPhbnHpnkLMw"}'::jsonb,
    body := concat('{"triggered_at": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);
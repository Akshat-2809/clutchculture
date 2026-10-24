-- Keep the Render API awake (free plan sleeps after 15 idle minutes, and the
-- first visitor then waits ~50 s). Supabase pings /health every 5 minutes with
-- pg_cron + pg_net; this also keeps the free Supabase project from pausing.
-- Backup: .github/workflows/keep-alive.yml (GitHub's scheduler can be unreliable).
-- If the API URL changes, update the url below and re-run this statement.
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;--> statement-breakpoint
SELECT cron.unschedule('clutchculture-keep-alive')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'clutchculture-keep-alive');--> statement-breakpoint
SELECT cron.schedule(
  'clutchculture-keep-alive',
  '*/5 * * * *',
  $$SELECT net.http_get(url := 'https://clutchculture.onrender.com/health', timeout_milliseconds := 60000)$$
);

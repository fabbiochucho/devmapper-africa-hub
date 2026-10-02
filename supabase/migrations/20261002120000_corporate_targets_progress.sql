-- CorporateTargets page records progress notes over time and a country per target.
ALTER TABLE public.corporate_targets
  ADD COLUMN IF NOT EXISTS progress_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS country_code text;

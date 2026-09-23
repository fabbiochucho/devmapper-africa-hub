-- Phase 2 roadmap item: extend the data_quality convention already used
-- by esg_indicators ('estimated' default) and esg_supplier_emissions
-- ('reported' default) to the two other tables the roadmap named -
-- project_carbon_data and project_dism_scores - "where provenance
-- already exists." No CHECK constraint on the existing columns either,
-- so matching that (free text, not an enum) rather than inventing a
-- stricter convention than what's already established.
ALTER TABLE public.project_carbon_data
  ADD COLUMN data_quality text DEFAULT 'estimated';

ALTER TABLE public.project_dism_scores
  ADD COLUMN data_quality text DEFAULT 'estimated';

-- Backfill project_carbon_data from signals that already exist on the
-- table itself: activity-based entries are calculated from a cited
-- emission factor (better provenance than a bare self-reported total),
-- and admin/verifier-confirmed entries get 'verified' regardless of how
-- they were calculated.
UPDATE public.project_carbon_data
SET data_quality = CASE
  WHEN carbon_verified THEN 'verified'
  WHEN calculation_method = 'activity_based' THEN 'estimated'
  ELSE 'self_reported'
END;

-- project_dism_scores has no comparable existing verification signal to
-- backfill from (no verified/verified_by-style column) - left at the
-- 'estimated' default rather than guessing a distinction that isn't
-- actually there yet.

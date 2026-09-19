-- Feature 1: government-responsibility taxonomy on reports, shared with
-- the country_ratings dimensions added in a later migration.
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS responsibility_area text;

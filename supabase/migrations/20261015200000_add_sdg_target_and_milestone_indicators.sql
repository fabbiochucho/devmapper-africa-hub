-- Two columns the app already writes but the schema never had, so every write failed:
-- BulkUpload sends reports.sdg_target for each row (the whole upload was rejected), and
-- AddMilestoneDialog sends project_milestones.sdg_indicators (no milestone was ever
-- created - the table is empty). Both nullable and additive; nothing existing changes.
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS sdg_target text;
ALTER TABLE public.project_milestones ADD COLUMN IF NOT EXISTS sdg_indicators integer[];

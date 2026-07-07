-- Adds a 'funder' role for the Funder Decision Dashboard (PRD #112-114).
-- Postgres forbids using a newly-added enum value inside the same transaction
-- that adds it, so this migration does nothing else - any code/migration
-- referencing the literal 'funder' must land in a later commit.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'funder';

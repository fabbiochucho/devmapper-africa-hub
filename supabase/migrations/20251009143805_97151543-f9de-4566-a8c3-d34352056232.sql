-- ============================================================
-- PHASE 0: SNAPSHOT & BACKUP MIGRATION
-- Creates backup schema and snapshots critical tables
-- ============================================================

-- Create backup schema with timestamp
CREATE SCHEMA IF NOT EXISTS backup_20250910;

-- Backup critical tables
CREATE TABLE backup_20250910.profiles AS 
SELECT * FROM public.profiles;

CREATE TABLE backup_20250910.user_roles AS 
SELECT * FROM public.user_roles;

CREATE TABLE backup_20250910.organizations AS 
SELECT * FROM public.organizations;

CREATE TABLE backup_20250910.reports AS 
SELECT * FROM public.reports;

CREATE TABLE backup_20250910.change_makers AS 
SELECT * FROM public.change_makers;

CREATE TABLE backup_20250910.fundraising_campaigns AS 
SELECT * FROM public.fundraising_campaigns;

-- Add backup metadata
CREATE TABLE backup_20250910.backup_metadata (
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_profiles INTEGER,
  total_user_roles INTEGER,
  total_organizations INTEGER,
  total_reports INTEGER,
  total_change_makers INTEGER,
  total_campaigns INTEGER
);

INSERT INTO backup_20250910.backup_metadata (
  total_profiles,
  total_user_roles,
  total_organizations,
  total_reports,
  total_change_makers,
  total_campaigns
) VALUES (
  (SELECT COUNT(*) FROM backup_20250910.profiles),
  (SELECT COUNT(*) FROM backup_20250910.user_roles),
  (SELECT COUNT(*) FROM backup_20250910.organizations),
  (SELECT COUNT(*) FROM backup_20250910.reports),
  (SELECT COUNT(*) FROM backup_20250910.change_makers),
  (SELECT COUNT(*) FROM backup_20250910.fundraising_campaigns)
);

COMMENT ON SCHEMA backup_20250910 IS 'Backup snapshot created before DevMapper Earth security migration';
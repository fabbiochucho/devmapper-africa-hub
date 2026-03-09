-- Add issue taxonomy columns to reports table
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS issue_type text,
ADD COLUMN IF NOT EXISTS issue_severity text DEFAULT 'low',
ADD COLUMN IF NOT EXISTS escalation_status text DEFAULT 'none',
ADD COLUMN IF NOT EXISTS evidence_type text,
ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false;

-- Add verification_tier to profiles if not exists
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS legal_capacity text,
ADD COLUMN IF NOT EXISTS sector_classification text,
ADD COLUMN IF NOT EXISTS verification_tier text DEFAULT 'unverified',
ADD COLUMN IF NOT EXISTS impact_area text;

-- Create government budget analytics function
CREATE OR REPLACE FUNCTION public.get_government_budget_analytics(p_user_id uuid)
RETURNS TABLE(
  sdg_goal integer,
  sdg_label text,
  total_budget numeric,
  total_spent numeric,
  project_count bigint,
  avg_completion numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    r.sdg_goal,
    'SDG ' || r.sdg_goal as sdg_label,
    COALESCE(SUM(r.cost), 0) as total_budget,
    COALESCE(SUM(pb.budget_spent), 0) as total_spent,
    COUNT(DISTINCT r.id) as project_count,
    AVG(CASE WHEN r.project_status = 'completed' THEN 100 
             WHEN r.project_status = 'in_progress' THEN 50 
             ELSE 10 END) as avg_completion
  FROM reports r
  LEFT JOIN project_budgets pb ON pb.report_id = r.id
  WHERE r.user_id = p_user_id
  GROUP BY r.sdg_goal
  ORDER BY total_budget DESC;
$$;

-- Function to sync ESG indicators to corporate targets
CREATE OR REPLACE FUNCTION public.sync_esg_to_targets(p_org_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_result json;
  v_indicator RECORD;
  v_synced_count integer := 0;
BEGIN
  FOR v_indicator IN
    SELECT * FROM esg_indicators WHERE organization_id = p_org_id
  LOOP
    IF v_indicator.carbon_scope1_tonnes IS NOT NULL THEN
      UPDATE corporate_targets
      SET current_value = v_indicator.carbon_scope1_tonnes + 
                          COALESCE(v_indicator.carbon_scope2_tonnes, 0) +
                          COALESCE(v_indicator.carbon_scope3_tonnes, 0),
          updated_at = NOW()
      WHERE company_id IN (SELECT user_id FROM organization_members WHERE organization_id = p_org_id)
        AND (title ILIKE '%carbon%' OR title ILIKE '%emission%');
      v_synced_count := v_synced_count + 1;
    END IF;
    
    IF v_indicator.renewable_energy_percentage IS NOT NULL THEN
      UPDATE corporate_targets
      SET current_value = v_indicator.renewable_energy_percentage,
          updated_at = NOW()
      WHERE company_id IN (SELECT user_id FROM organization_members WHERE organization_id = p_org_id)
        AND (title ILIKE '%renewable%' OR title ILIKE '%energy%');
      v_synced_count := v_synced_count + 1;
    END IF;
  END LOOP;
  
  v_result := json_build_object('synced_count', v_synced_count, 'timestamp', NOW());
  RETURN v_result;
END;
$$;
-- ============================================
-- FIX RLS POLICY PERFORMANCE: Part 3 - Project and verification tables
-- ============================================

-- ============================================
-- PROJECT_UPDATES TABLE
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can create updates" ON project_updates;
CREATE POLICY "Authenticated users can create updates" ON project_updates
FOR INSERT WITH CHECK (
  (SELECT auth.uid()) = created_by AND (
    report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid())) OR
    is_affiliated_with_report((SELECT auth.uid()), report_id)
  )
);

DROP POLICY IF EXISTS "Report owners can delete updates" ON project_updates;
CREATE POLICY "Report owners can delete updates" ON project_updates
FOR DELETE USING (
  report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "Update owners can edit their updates" ON project_updates;
CREATE POLICY "Update owners can edit their updates" ON project_updates
FOR UPDATE USING ((SELECT auth.uid()) = created_by);

-- ============================================
-- PROJECT_TASKS TABLE
-- ============================================
DROP POLICY IF EXISTS "Admins can manage all tasks" ON project_tasks;
CREATE POLICY "Admins can manage all tasks" ON project_tasks
FOR ALL USING (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'platform_admin'::app_role)
) WITH CHECK (
  has_role((SELECT auth.uid()), 'admin'::app_role) OR 
  has_role((SELECT auth.uid()), 'platform_admin'::app_role)
);

DROP POLICY IF EXISTS "Affiliated users can create tasks" ON project_tasks;
CREATE POLICY "Affiliated users can create tasks" ON project_tasks
FOR INSERT WITH CHECK (
  report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid())) OR
  is_affiliated_with_report((SELECT auth.uid()), report_id)
);

DROP POLICY IF EXISTS "Project owners can delete tasks" ON project_tasks;
CREATE POLICY "Project owners can delete tasks" ON project_tasks
FOR DELETE USING (
  report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid()))
);

DROP POLICY IF EXISTS "Project task access via affiliation" ON project_tasks;
CREATE POLICY "Project task access via affiliation" ON project_tasks
FOR SELECT USING (
  report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid())) OR
  is_affiliated_with_report((SELECT auth.uid()), report_id)
);

DROP POLICY IF EXISTS "Task assignees and owners can update" ON project_tasks;
CREATE POLICY "Task assignees and owners can update" ON project_tasks
FOR UPDATE USING (
  assigned_to = (SELECT auth.uid()) OR 
  created_by = (SELECT auth.uid()) OR
  report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid()))
);

-- ============================================
-- TASK_DEPENDENCIES TABLE
-- ============================================
DROP POLICY IF EXISTS "Task dependency access follows task access" ON task_dependencies;
CREATE POLICY "Task dependency access follows task access" ON task_dependencies
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_tasks pt
    WHERE pt.id = task_dependencies.task_id AND (
      pt.report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid())) OR
      is_affiliated_with_report((SELECT auth.uid()), pt.report_id)
    )
  )
);

DROP POLICY IF EXISTS "Task dependency management follows task access" ON task_dependencies;
CREATE POLICY "Task dependency management follows task access" ON task_dependencies
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM project_tasks pt
    WHERE pt.id = task_dependencies.task_id AND (
      pt.report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid())) OR
      is_affiliated_with_report((SELECT auth.uid()), pt.report_id)
    )
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_tasks pt
    WHERE pt.id = task_dependencies.task_id AND (
      pt.report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid())) OR
      is_affiliated_with_report((SELECT auth.uid()), pt.report_id)
    )
  )
);

-- ============================================
-- TASK_ACTIVITY TABLE (if exists)
-- ============================================
DROP POLICY IF EXISTS "Task activity access follows task access" ON task_activity;
CREATE POLICY "Task activity access follows task access" ON task_activity
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM project_tasks pt
    WHERE pt.id = task_activity.task_id AND (
      pt.report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid())) OR
      is_affiliated_with_report((SELECT auth.uid()), pt.report_id)
    )
  )
);

-- ============================================
-- PROJECT_VERIFICATIONS TABLE
-- ============================================
DROP POLICY IF EXISTS "Authenticated users can submit verifications" ON project_verifications;
CREATE POLICY "Authenticated users can submit verifications" ON project_verifications
FOR INSERT WITH CHECK ((SELECT auth.uid()) = verifier_id);

DROP POLICY IF EXISTS "Verifiers can update their own verifications" ON project_verifications;
CREATE POLICY "Verifiers can update their own verifications" ON project_verifications
FOR UPDATE USING ((SELECT auth.uid()) = verifier_id);

-- ============================================
-- PROJECT_BUDGETS TABLE
-- ============================================
DROP POLICY IF EXISTS "Report owners and affiliates can manage budgets" ON project_budgets;
CREATE POLICY "Report owners and affiliates can manage budgets" ON project_budgets
FOR ALL USING (
  report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid())) OR
  is_affiliated_with_report((SELECT auth.uid()), report_id)
);

DROP POLICY IF EXISTS "Budget creators can update" ON project_budgets;
CREATE POLICY "Budget creators can update" ON project_budgets
FOR UPDATE USING (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Report owners can delete budgets" ON project_budgets;
CREATE POLICY "Report owners can delete budgets" ON project_budgets
FOR DELETE USING (
  report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid()))
);

-- ============================================
-- PROJECT_INDICATORS TABLE
-- ============================================
DROP POLICY IF EXISTS "Report owners and affiliates can manage indicators" ON project_indicators;
CREATE POLICY "Report owners and affiliates can manage indicators" ON project_indicators
FOR ALL USING (
  report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid())) OR
  is_affiliated_with_report((SELECT auth.uid()), report_id)
);

DROP POLICY IF EXISTS "Indicator creators can update" ON project_indicators;
CREATE POLICY "Indicator creators can update" ON project_indicators
FOR UPDATE USING (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Report owners can delete indicators" ON project_indicators;
CREATE POLICY "Report owners can delete indicators" ON project_indicators
FOR DELETE USING (
  report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid()))
);

-- ============================================
-- EVIDENCE_ITEMS TABLE
-- ============================================
DROP POLICY IF EXISTS "Report owners and affiliates can add evidence" ON evidence_items;
CREATE POLICY "Report owners and affiliates can add evidence" ON evidence_items
FOR INSERT WITH CHECK (
  (SELECT auth.uid()) = uploaded_by AND (
    report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid())) OR
    is_affiliated_with_report((SELECT auth.uid()), report_id)
  )
);

DROP POLICY IF EXISTS "Uploaders can update their evidence" ON evidence_items;
CREATE POLICY "Uploaders can update their evidence" ON evidence_items
FOR UPDATE USING ((SELECT auth.uid()) = uploaded_by);

DROP POLICY IF EXISTS "Report owners can delete evidence" ON evidence_items;
CREATE POLICY "Report owners can delete evidence" ON evidence_items
FOR DELETE USING (
  report_id IN (SELECT id FROM reports WHERE user_id = (SELECT auth.uid()))
);

COMMENT ON POLICY "Authenticated users can create updates" ON project_updates IS 'Optimized: wrapped auth.uid() in SELECT';
COMMENT ON POLICY "Task dependency access follows task access" ON task_dependencies IS 'Optimized: wrapped auth.uid() in SELECT';
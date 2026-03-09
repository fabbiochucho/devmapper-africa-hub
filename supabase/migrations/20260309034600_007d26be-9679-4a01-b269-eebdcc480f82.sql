
-- Add visibility column to reports table for public/private toggle (PRD V7)
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'public';

-- Add project_tasks table for task management within projects (PRD V7)
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date DATE,
  tags TEXT[] DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.project_tasks ENABLE ROW LEVEL SECURITY;

-- RLS: project owners and affiliates can manage tasks
CREATE POLICY "Project owners can manage tasks" ON public.project_tasks
  FOR ALL TO authenticated
  USING (
    report_id IN (SELECT id FROM public.reports WHERE user_id = auth.uid())
    OR is_affiliated_with_report(auth.uid(), report_id)
  )
  WITH CHECK (
    report_id IN (SELECT id FROM public.reports WHERE user_id = auth.uid())
    OR is_affiliated_with_report(auth.uid(), report_id)
  );

-- RLS: anyone can view tasks on public projects
CREATE POLICY "Anyone can view tasks on public projects" ON public.project_tasks
  FOR SELECT TO authenticated
  USING (
    report_id IN (SELECT id FROM public.reports WHERE visibility = 'public')
  );

-- Trigger for updated_at
CREATE TRIGGER update_project_tasks_updated_at
  BEFORE UPDATE ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

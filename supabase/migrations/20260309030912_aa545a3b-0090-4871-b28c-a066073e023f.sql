-- Create report_flags table for content moderation
CREATE TABLE public.report_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  flagged_by UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.report_flags ENABLE ROW LEVEL SECURITY;

-- Users can flag reports
CREATE POLICY "Authenticated users can flag reports"
  ON public.report_flags FOR INSERT
  WITH CHECK (auth.uid() = flagged_by);

-- Users can view their own flags
CREATE POLICY "Users can view their own flags"
  ON public.report_flags FOR SELECT
  USING (auth.uid() = flagged_by);

-- Admins can view all flags
CREATE POLICY "Admins can view all flags"
  ON public.report_flags FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role));

-- Admins can update flags (resolve/dismiss)
CREATE POLICY "Admins can update flags"
  ON public.report_flags FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role));

-- Index for lookups
CREATE INDEX idx_report_flags_status ON public.report_flags(status);
CREATE INDEX idx_report_flags_report_id ON public.report_flags(report_id);

-- SDG Indicators Registry Table
CREATE TABLE public.sdg_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sdg_id integer NOT NULL,
  target_id text NOT NULL,
  indicator_code text NOT NULL UNIQUE,
  indicator_name text NOT NULL,
  unit text NOT NULL DEFAULT 'units',
  measurement_type text NOT NULL DEFAULT 'quantitative',
  level text DEFAULT 'Output',
  sector text DEFAULT NULL,
  source text DEFAULT NULL,
  frequency text DEFAULT 'Annual',
  verification_requirement text DEFAULT 'Self-report',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_sdg_indicators_sdg_id ON public.sdg_indicators(sdg_id);
CREATE INDEX idx_sdg_indicators_target_id ON public.sdg_indicators(target_id);

-- RLS
ALTER TABLE public.sdg_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "SDG indicators are viewable by everyone"
  ON public.sdg_indicators FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage SDG indicators"
  ON public.sdg_indicators FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'platform_admin'::app_role));

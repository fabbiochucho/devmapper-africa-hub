-- #53: RAG pipeline for report retrieval. Enables pgvector and adds a
-- report_embeddings table + cosine-similarity search RPC so Ndovu agents
-- can pull semantically-relevant prior reports as context, instead of only
-- ever looking up one exact report_id (confirmed via research: none of the
-- ndovu-*-agent functions currently do any "recent"/"similar" query at all).
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- OpenAI/Lovable-gateway-compatible text-embedding-3-small dimensionality.
CREATE TABLE public.report_embeddings (
  report_id UUID PRIMARY KEY REFERENCES public.reports(id) ON DELETE CASCADE,
  embedding extensions.vector(1536) NOT NULL,
  source_text TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.report_embeddings ENABLE ROW LEVEL SECURITY;

-- Same visibility rule as reports itself - an embedding is a derived
-- representation of the report's title+description, so it should never be
-- readable by someone who couldn't read the report itself.
CREATE POLICY "View embeddings by report access"
ON public.report_embeddings FOR SELECT
USING (
  report_id IN (
    SELECT id FROM public.reports
    WHERE visibility = 'public'
      OR user_id = (SELECT auth.uid())
      OR is_affiliated_with_report((SELECT auth.uid()), id)
      OR has_role((SELECT auth.uid()), 'admin'::app_role)
      OR has_role((SELECT auth.uid()), 'platform_admin'::app_role)
  )
);
-- No client write policy - embeddings are only ever written by the
-- report-embeddings edge function using the service role key.

-- Cosine-similarity search, filtered to whatever the requesting user is
-- actually allowed to see (mirrors the SELECT policy above, since this
-- SECURITY DEFINER function bypasses RLS to search across all reports
-- efficiently before filtering).
CREATE OR REPLACE FUNCTION public.match_report_embeddings(
  query_embedding extensions.vector(1536),
  match_count INT,
  requesting_user_id UUID
)
RETURNS TABLE(report_id UUID, title TEXT, description TEXT, similarity FLOAT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
  SELECT r.id, r.title, r.description, 1 - (re.embedding <=> query_embedding) AS similarity
  FROM public.report_embeddings re
  JOIN public.reports r ON r.id = re.report_id
  WHERE r.visibility = 'public'
     OR r.user_id = requesting_user_id
     OR is_affiliated_with_report(requesting_user_id, r.id)
     OR has_role(requesting_user_id, 'admin'::app_role)
     OR has_role(requesting_user_id, 'platform_admin'::app_role)
  ORDER BY re.embedding <=> query_embedding
  LIMIT match_count;
$$;

GRANT EXECUTE ON FUNCTION public.match_report_embeddings(extensions.vector, INT, UUID) TO authenticated;

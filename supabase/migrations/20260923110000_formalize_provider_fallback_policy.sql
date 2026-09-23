-- §25 Provider Failure & Fallback: the roadmap's own text already noted
-- fallback exists "ad hoc (one proxy falls back to a clearly-labeled
-- estimate) rather than as a formal policy." A genuine cross-provider
-- failover ("if greencalculus fails, try climatiq") isn't buildable
-- honestly yet - climatiq/carbon_interface have no API key, so there is
-- no second *active* source in any category to fail over to. Building a
-- failover chain with only one real link would be scaffolding with
-- nothing to route to.
--
-- What IS real and can be formalized: gee-proxy, alphaearth-proxy, and
-- climatetrace-proxy already fall back to an internal calculated/
-- estimated value when their live upstream call fails (confirmed in
-- their own source - generateEstimatedGEEData, calculateBenchmark,
-- generateFallbackEmissions), and this is now health-tracked
-- (record_provider_health records the fallback as a failure). This
-- migration makes that existing behavior a queryable, visible fact on
-- the registry instead of something only findable by reading each
-- function's source.
ALTER TABLE public.data_providers
  ADD COLUMN fallback_strategy text DEFAULT 'none';

COMMENT ON COLUMN public.data_providers.fallback_strategy IS
  'none: fails with an error and no data (most connectors - honest, no fabrication). internal_estimate: falls back to a locally-calculated/heuristic estimate on upstream failure, clearly labeled as such to the caller. cross_provider: automatically retries a different registered provider (not yet used by any connector - no category has two genuinely active sources yet).';

UPDATE public.data_providers SET fallback_strategy = 'internal_estimate'
WHERE provider_key IN ('gee', 'alphaearth', 'climatetrace');

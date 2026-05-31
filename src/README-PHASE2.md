# Phase 2: AlphaEarth API Security Migration

## ✅ Completed

### 1. Edge Function Created
- **File**: `supabase/functions/alphaearth-benchmark/index.ts`
- **Security**: API key stored server-side, never exposed to client
- **Methods**:
  - `GET /alphaearth-benchmark?action=benchmark` - Fetch benchmark data
  - `POST /alphaearth-benchmark?action=enrich` - Enrich supplier data
  - `POST /alphaearth-benchmark?action=usage` - Get API usage stats

### 2. Client Wrapper Created
- **File**: `src/lib/alphaearth-client.ts`
- **Functions**:
  - `getBenchmarkForOrg()` - Get sector benchmarks
  - `enrichSupplierEmissions()` - Enrich supplier data
  - `getApiUsageStats()` - Get usage statistics
- **All functions return typed responses**
- **All errors are logged via error-handler**

## 🔒 Security Improvements

✅ **Before**: API key in client-side code  
✅ **After**: API key in Supabase secrets (server-only)

✅ **Before**: Unlimited API calls possible  
✅ **After**: Edge function controls rate limiting

✅ **Before**: Direct API exposure  
✅ **After**: Indirect via secure edge function

## 📋 Deployment Checklist

- [ ] Set `ALPHAEARTH_API_KEY` in Supabase project secrets
- [ ] Run `supabase functions deploy alphaearth-benchmark`
- [ ] Update `src/pages/ESG.tsx` to use new client functions
- [ ] Update `src/components/esg/ESGDashboard.tsx` to use new client functions
- [ ] Update `src/components/esg/SupplierCSVImporter.tsx` to use new client functions
- [ ] Test all three functions in staging environment
- [ ] Monitor API usage in production

## 🚀 Next Steps

### Phase 3: Supabase Type Generation
- Generate types from Supabase schema
- Replace remaining `any` types
- Improve IDE autocomplete

### Phase 4: Testing
- Add E2E tests for edge functions
- Add unit tests for client functions
- Add integration tests

### Phase 5: Monitoring
- Set up error tracking
- Monitor API usage
- Set up alerts for failures

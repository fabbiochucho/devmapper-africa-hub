import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Free, no-key-required exchange rate API
const EXCHANGE_API = 'https://open.er-api.com/v6/latest';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { base = 'USD' } = await req.json().catch(() => ({}));
    
    const response = await fetch(`${EXCHANGE_API}/${base}`);
    if (!response.ok) {
      throw new Error(`Exchange rate API returned ${response.status}`);
    }

    const data = await response.json();
    
    // Return a slim payload with common African + major currencies
    const relevantCurrencies = [
      'USD', 'EUR', 'GBP', 'NGN', 'KES', 'ZAR', 'GHS', 'TZS', 'UGX',
      'ETB', 'EGP', 'MAD', 'XOF', 'XAF', 'RWF', 'MZN', 'AOA', 'BIF'
    ];

    const rates: Record<string, number> = {};
    for (const code of relevantCurrencies) {
      if (data.rates?.[code]) rates[code] = data.rates[code];
    }

    return new Response(JSON.stringify({
      base: data.base_code || base,
      rates,
      updated_at: data.time_last_update_utc || new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[EXCHANGE-RATES] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  updated_at: string;
}

export function useExchangeRates(base = 'USD') {
  return useQuery({
    queryKey: ['exchange-rates', base],
    queryFn: async (): Promise<ExchangeRates> => {
      const { data, error } = await supabase.functions.invoke('exchange-rates', {
        body: { base },
      });
      if (error) throw error;
      return data;
    },
    staleTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
  });
}

export function convertCurrency(
  amount: number,
  from: string,
  to: string,
  rates: Record<string, number>
): number | null {
  if (from === to) return amount;
  const fromRate = rates[from];
  const toRate = rates[to];
  if (!fromRate || !toRate) return null;
  return (amount / fromRate) * toRate;
}

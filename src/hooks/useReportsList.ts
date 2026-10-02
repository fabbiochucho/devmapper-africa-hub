import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type ReportListItem = Pick<
  Tables<"reports">,
  | "id" | "title" | "description" | "sdg_goal" | "location" | "country_code" | "project_status"
  | "verification_count" | "is_verified" | "submitted_at" | "cost" | "cost_currency" | "lat" | "lng"
>;

const COLUMNS =
  "id, title, description, sdg_goal, location, country_code, project_status, verification_count, is_verified, submitted_at, cost, cost_currency, lat, lng";

/** Reports the caller can see (RLS decides), newest first. */
export function useReportsList(limit = 500) {
  return useQuery({
    queryKey: ["reports-list", limit],
    queryFn: async (): Promise<ReportListItem[]> => {
      const { data, error } = await supabase
        .from("reports")
        .select(COLUMNS)
        .order("submitted_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}

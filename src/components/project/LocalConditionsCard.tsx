import { useQuery } from "@tanstack/react-query";
import { CloudSun } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MeteoPayload {
  current: { temperature_2m?: number; precipitation?: number; wind_speed_10m?: number } | null;
  daily: { time?: string[]; temperature_2m_max?: number[]; temperature_2m_min?: number[]; precipitation_sum?: number[] } | null;
  metadata?: { source?: string; generated_at?: string };
}

/** Current weather and 7-day forecast at a project's coordinates (Open-Meteo, via open-meteo-proxy). */
export function LocalConditionsCard({ lat, lng }: { lat: number; lng: number }) {
  const { data, error, isLoading } = useQuery({
    queryKey: ["open-meteo", lat.toFixed(2), lng.toFixed(2)],
    queryFn: async (): Promise<MeteoPayload> => {
      const { data, error } = await supabase.functions.invoke("open-meteo-proxy", { body: { lat, lng } });
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 60_000,
  });

  const d = data?.daily;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2"><CloudSun className="h-4 w-4" />Local conditions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {isLoading && <p className="text-muted-foreground">Loading weather…</p>}
        {error && <p className="text-muted-foreground">Weather data is unavailable right now.</p>}
        {data?.current && (
          <p>
            Now: <b>{data.current.temperature_2m ?? "–"}°C</b> · rain {data.current.precipitation ?? 0} mm · wind {data.current.wind_speed_10m ?? "–"} km/h
          </p>
        )}
        {d?.time && (
          <div className="overflow-x-auto">
            <table className="text-xs w-full tabular-nums">
              <thead><tr className="text-muted-foreground"><th className="text-left font-normal">Day</th><th className="text-right font-normal">Min / Max °C</th><th className="text-right font-normal">Rain mm</th></tr></thead>
              <tbody>
                {d.time.map((day, i) => (
                  <tr key={day}>
                    <td>{new Date(day).toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}</td>
                    <td className="text-right">{d.temperature_2m_min?.[i]} / {d.temperature_2m_max?.[i]}</td>
                    <td className="text-right">{d.precipitation_sum?.[i]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data?.metadata?.source && (
          <p className="text-xs text-muted-foreground">Source: {data.metadata.source}{data.metadata.generated_at ? `, fetched ${new Date(data.metadata.generated_at).toLocaleString()}` : ""}</p>
        )}
      </CardContent>
    </Card>
  );
}

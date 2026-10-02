import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Loader2, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { errorMessageOf } from "@/lib/error-handler";

interface GcResult {
  key: string;
  name: string;
  factor: { value: number; unit: string; country_iso3?: string | null };
  scope?: { ghg_protocol?: string };
  citation?: { proof_url?: string };
}

// Only factors the calculator can use as-is (see _shared/greencalculus.ts).
const usable = (f: GcResult) => /^kg CO2e per /i.test(f.factor?.unit ?? "") && /^scope[123]$/.test(f.scope?.ghg_protocol ?? "");

/** Searches GreenCalculus when the local factor library has no match, and imports the chosen factor. */
export function ExternalFactorSearch({ onImported }: { onImported: (emissionFactorId: string) => void }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GcResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);

  const search = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("greencalculus-proxy", {
        body: { path: "factors", query: { search: query.trim(), limit: "25" } },
      });
      if (error) throw error;
      if (data?.configured === false || data?.rateLimited) {
        toast.info(data.message);
        setResults([]);
        return;
      }
      setResults(((data?.factors ?? []) as GcResult[]).filter(usable));
    } catch (e) {
      toast.error(t("carbon.external.searchFailed"), { description: errorMessageOf(e) });
    } finally {
      setSearching(false);
    }
  };

  const pick = async (key: string) => {
    setImporting(key);
    try {
      const { data, error } = await supabase.functions.invoke("greencalculus-proxy", { body: { action: "import", key, path: "" } });
      if (error) throw error;
      if (!data?.emission_factor_id) throw new Error(data?.error ?? "Import failed");
      onImported(data.emission_factor_id);
      setResults(null);
      setQuery("");
    } catch (e) {
      toast.error(t("carbon.external.importFailed"), { description: errorMessageOf(e) });
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="rounded-md border border-dashed p-3 space-y-2">
      <p className="text-xs text-muted-foreground">{t("carbon.external.hint")}</p>
      <div className="flex gap-2">
        <Input
          id="external-factor-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); search(); } }}
          placeholder={t("carbon.external.placeholder")}
        />
        <Button type="button" variant="outline" size="sm" onClick={search} disabled={searching}>
          {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>
      {results && (
        results.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("carbon.external.noResults")}</p>
        ) : (
          <ul className="max-h-60 overflow-y-auto divide-y text-sm">
            {results.map((f) => (
              <li key={f.key} className="flex items-center justify-between gap-2 py-2">
                <div className="min-w-0">
                  <div className="truncate">{f.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {f.factor.value} {f.factor.unit} · {(f.factor.country_iso3 || "global").toUpperCase()} · {f.scope?.ghg_protocol}
                    {f.citation?.proof_url && (
                      <a className="ml-1 inline-flex items-center underline" href={f.citation.proof_url} target="_blank" rel="noreferrer">
                        {t("carbon.external.source")} <ExternalLink className="ml-0.5 h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
                <Button type="button" size="sm" variant="secondary" onClick={() => pick(f.key)} disabled={!!importing}>
                  {importing === f.key ? <Loader2 className="h-4 w-4 animate-spin" /> : t("carbon.external.use")}
                </Button>
              </li>
            ))}
          </ul>
        )
      )}
    </div>
  );
}

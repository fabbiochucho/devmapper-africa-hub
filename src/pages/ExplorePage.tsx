import { plainText } from '@/lib/plainText';
import { Fragment } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/seo/SEOHead";
import { useAuth } from "@/contexts/AuthContext";
import { entityMeta } from "@/lib/entities";
import { loadDetail } from "@/lib/entityDetail";
import { RelatedEntities } from "@/components/entities/RelatedEntities";
import { SaveButton } from "@/components/workspace/SaveButton";

export default function ExplorePage() {
  const { type = "", id = "" } = useParams();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["entity-detail", type, id], queryFn: () => loadDetail(type, id) });

  if (type === "project") return <Navigate to={`/project/${id}`} replace />;
  if (type === "campaign") return <Navigate to="/fundraising" replace />;

  const meta = entityMeta(type);
  const Icon = meta.icon;
  const facts = data?.facts.filter(([, v]) => v !== null && v !== undefined && v !== "") ?? [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <SEOHead title={data?.title ?? meta.label} description={data?.summary?.slice(0, 150) ?? `${meta.label} on DevMapper`} />
      <Link to="/search" className="text-sm text-muted-foreground inline-flex items-center hover:underline"><ArrowLeft className="h-4 w-4 mr-1" />Search</Link>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : !data ? (
        <p className="text-muted-foreground">This item doesn't exist or you don't have access to it.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <Badge variant="secondary" className="mb-2"><Icon className="h-3.5 w-3.5 mr-1" />{meta.label}</Badge>
              <h1 className="text-2xl font-bold">{data.title}</h1>
              {data.subtitle && <p className="text-muted-foreground">{data.subtitle}</p>}
            </div>
            <div className="flex gap-2">
              {user && (
                <Button asChild variant="outline" size="sm">
                  <Link to={`/ndovu?about=${encodeURIComponent(`${type}:${id}`)}&title=${encodeURIComponent(data.title)}`}>
                    <Sparkles className="h-4 w-4 mr-1.5" />Ask Ndovu Akili
                  </Link>
                </Button>
              )}
              <SaveButton type={type} id={id} title={data.title} />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3">
              <CardHeader><CardTitle className="text-base">About</CardTitle></CardHeader>
              <CardContent className="space-y-4 text-sm">
                {data.summary && <p className="whitespace-pre-line">{plainText(data.summary)}</p>}
                {facts.length > 0 && (
                  <dl className="grid grid-cols-[minmax(0,10rem)_1fr] gap-x-4 gap-y-1.5">
                    {facts.map(([k, v]) => (<Fragment key={k}><dt className="text-muted-foreground">{k}</dt><dd className="break-words">{v}</dd></Fragment>))}
                  </dl>
                )}
                {data.source && (
                  <p className="text-xs text-muted-foreground border-t pt-3">
                    Source: {data.source.name}
                    {data.source.publishedAt && ` · published ${new Date(data.source.publishedAt).toLocaleDateString()}`}
                    {data.source.fetchedAt && ` · retrieved ${new Date(data.source.fetchedAt).toLocaleDateString()}`}
                    {data.source.url && (
                      <a href={data.source.url} target="_blank" rel="noreferrer" className="ml-2 inline-flex items-center underline">
                        view original <ExternalLink className="h-3 w-3 ml-0.5" />
                      </a>
                    )}
                  </p>
                )}
                {type === "country" && user && <CountryIndicators iso3={id} />}
              </CardContent>
            </Card>
            <div className="lg:col-span-2">
              <RelatedEntities type={type} id={id} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CountryIndicators({ iso3 }: { iso3: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["worldbank", iso3],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("worldbank-proxy", { body: { countryCode: iso3 } });
      if (error) throw error;
      return data as { indicators?: { code: string; label: string; value: number | null; year: string | null }[]; metadata?: { source?: string } };
    },
    staleTime: 6 * 60 * 60_000,
  });
  if (isLoading) return <p className="text-xs text-muted-foreground">Loading World Bank indicators…</p>;
  if (error || !data?.indicators) return null;
  return (
    <div className="border-t pt-3">
      <h3 className="font-medium mb-2">Key indicators</h3>
      <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 tabular-nums">
        {data.indicators.map((i) => (
          <Fragment key={i.code}><dt className="text-muted-foreground">{i.label}</dt>
            <dd className="text-right">{i.value == null ? "—" : i.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}{i.year ? <span className="text-xs text-muted-foreground"> ({i.year})</span> : null}</dd></Fragment>
        ))}
      </dl>
      <p className="text-xs text-muted-foreground mt-2">Source: {data.metadata?.source ?? "World Bank Open Data"}</p>
    </div>
  );
}

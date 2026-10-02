import {
  FolderKanban, Building, User, Globe2, Target, Gauge, BookOpen, Scale, HandCoins, Network,
  FlaskConical, Database, Landmark, Users, AlertTriangle, Wrench, Factory, ShieldAlert, FileCheck,
  type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export type EntityType =
  | "project" | "organization" | "person" | "country" | "sdg" | "indicator" | "framework" | "policy"
  | "campaign" | "programme" | "research" | "dataset" | "funding_opportunity" | "community" | "issue"
  | "intervention" | "sector" | "risk" | "evidence";

export const ENTITY_META: Record<EntityType, { label: string; plural: string; icon: LucideIcon }> = {
  project: { label: "Project", plural: "Projects", icon: FolderKanban },
  organization: { label: "Organisation", plural: "Organisations", icon: Building },
  person: { label: "Person", plural: "People", icon: User },
  country: { label: "Country", plural: "Countries", icon: Globe2 },
  sdg: { label: "SDG", plural: "SDGs", icon: Target },
  indicator: { label: "Indicator", plural: "Indicators", icon: Gauge },
  framework: { label: "Standard / framework", plural: "Standards & frameworks", icon: BookOpen },
  policy: { label: "Policy", plural: "Policies", icon: Scale },
  campaign: { label: "Campaign", plural: "Campaigns", icon: HandCoins },
  programme: { label: "Programme", plural: "Programmes", icon: Network },
  research: { label: "Research", plural: "Research", icon: FlaskConical },
  dataset: { label: "Dataset", plural: "Datasets", icon: Database },
  funding_opportunity: { label: "Funding opportunity", plural: "Funding opportunities", icon: Landmark },
  community: { label: "Community", plural: "Communities", icon: Users },
  issue: { label: "Issue", plural: "Issues", icon: AlertTriangle },
  intervention: { label: "Intervention", plural: "Interventions", icon: Wrench },
  sector: { label: "Sector", plural: "Sectors", icon: Factory },
  risk: { label: "Risk", plural: "Risks", icon: ShieldAlert },
  evidence: { label: "Evidence", plural: "Evidence", icon: FileCheck },
};

export const entityMeta = (type: string) => ENTITY_META[type as EntityType] ?? ENTITY_META.project;

/** Readable relation label: "funded_by" -> "funded by". */
export const relationLabel = (relation: string) => relation.replace(/_/g, " ");

/** Provider keys shown to users as source names. */
const SOURCE_NAMES: Record<string, string> = {
  devmapper: "DevMapper", derived: "DevMapper", user: "Added by a user", iati: "IATI", openalex: "OpenAlex",
  worldbank: "World Bank", sdg_indicators: "UN SDG database", greencalculus: "GreenCalculus",
  eu_funding_tenders: "EU Funding & Tenders", hdx: "Humanitarian Data Exchange", live_search: "Live search", user_upload: "Your uploaded document",
};
export const sourceName = (source: string) => SOURCE_NAMES[source] ?? source;

export interface EntityHit {
  type: string;
  id: string;
  title: string;
  snippet: string | null;
  path: string;
  source: string;
  sourceUrl: string | null;
  countryCode: string | null;
  score: number;
  match: "keyword" | "semantic" | "live";
}

/** Search every entity type the caller can see. Signed-in users also get semantic matches and, with live, results fetched from external sources. */
export async function searchEntities(q: string, opts: { types?: string[]; country?: string; live?: boolean; signedIn: boolean }): Promise<EntityHit[]> {
  if (opts.signedIn) {
    const { data, error } = await supabase.functions.invoke("intel", {
      body: { action: "search", q, types: opts.types, country: opts.country, live: opts.live === true },
    });
    if (error) throw error;
    return (data?.results ?? []) as EntityHit[];
  }
  const { data, error } = await supabase.rpc("search_entities", {
    q, p_types: opts.types, p_country: opts.country, p_limit: 40,
  });
  if (error) throw error;
  return (data ?? []).map((h) => ({
    type: h.entity_type, id: h.entity_id, title: h.title, snippet: h.snippet, path: h.path, source: h.source,
    sourceUrl: h.source_url, countryCode: h.country_code, score: h.rank, match: "keyword" as const,
  }));
}

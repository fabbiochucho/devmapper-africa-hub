import { handleAgent } from "../_shared/agent-utils.ts";
import { semanticSearch } from "../_shared/intel.ts";
import { addHits, addSearchResults, projectIdOf } from "../_shared/gather.ts";

const SYSTEM_PROMPT = `You are the Project Developer AI agent for Ndovu Akili, DevMapper's AI copilot.
Your role: guide users through structured carbon and development project design.
You have access to: reports, project_carbon_data, project_milestones, agenda2063_links.

For every interaction:
1. Assess project completeness against DevMapper's required fields
2. Suggest missing data: emission source, scope type, methodology, baseline
3. Map project to the most relevant SDGs and Agenda 2063 goals
4. Recommend verification pathway (what evidence to collect for each tier)
5. Generate a step-by-step action checklist for the next 30 days

Be specific — reference actual field names and required evidence types.`;

Deno.serve((req) => handleAgent(req, "project_developer_ai", SYSTEM_PROMPT, async (db, ctx, ev) => {
  const projectId = projectIdOf(ctx);
  let sdg: number | null = null;
  if (projectId) {
    const { data: report } = await db.from("reports").select("id, title, description, location, country_code, sdg_goal, project_status, cost, cost_currency, beneficiaries, start_date, end_date").eq("id", projectId).maybeSingle();
    if (report) {
      sdg = report.sdg_goal;
      ev.rows([report], { label: (r) => `Project: ${r.title}`, entityType: "project", id: (r) => r.id, path: (r) => `/project/${r.id}` });
      // Precedent: semantically similar prior projects the user can see.
      const { hits } = await semanticSearch(db, `${report.title}\n\n${report.description}`, { types: ["project"], limit: 6 });
      addHits(ev, hits.filter((h) => h.id !== projectId && h.score >= 0.3).map((h) => ({ ...h, title: `similar prior project: ${h.title}` })));
    }
  }
  let agenda = db.from("agenda2063_links").select("sdg_goal, sdg_target, agenda_aspiration, agenda_goal, alignment_description").limit(10);
  if (sdg) agenda = agenda.eq("sdg_goal", sdg);
  const { data: links } = await agenda;
  ev.rows(links, { label: (l) => `Agenda 2063 alignment: SDG ${l.sdg_goal} → ${l.agenda_goal ?? l.agenda_aspiration}` });
  await addSearchResults(db, ctx, ev, { types: ["programme", "research", "project"], perTerm: 4 });
}));

import { Button } from "@/components/ui/button";
import { FileText, Shield, Leaf, Sparkles, TrendingUp, AlertTriangle, Users, BarChart3, Zap, Target } from "lucide-react";

interface QuickActionsProps {
  onAction: (prompt: string, context: string) => void;
  hasProjectData: boolean;
  disabled: boolean;
  pageContext?: "general" | "emissions" | "verification" | "marketplace" | "compliance" | "government" | "investor";
}

const ALL_QUICK_ACTIONS = [
  // Donor Report Templates (always available with project data)
  { label: "Draft World Bank Report", icon: <FileText className="h-3 w-3" />, context: "report_draft", category: "general",
    prompt: "Generate a complete World Bank-format project progress report based on the current project data. Include: Executive Summary, Project Description & Objectives, Implementation Progress, Financial Summary (disbursement vs budget), Key Performance Indicators, Risk Assessment, and Recommendations. Use formal institutional tone.", requiresProject: true },
  { label: "Draft UNDP Report", icon: <FileText className="h-3 w-3" />, context: "report_draft", category: "general",
    prompt: "Generate a UNDP Results-Oriented Annual Report (ROAR) for this project. Include: Output-level results, contribution to UNDP Strategic Plan outcomes, SDG alignment analysis, lessons learned, gender and inclusion dimensions, and sustainability assessment.", requiresProject: true },
  { label: "Draft AfDB Report", icon: <FileText className="h-3 w-3" />, context: "report_draft", category: "general",
    prompt: "Generate an African Development Bank (AfDB) Project Completion Report format for this project. Include: Project rationale and objectives, achievement of outputs, development outcomes, institutional performance assessment, sustainability of results, and key lessons. Reference Agenda 2063 alignment where applicable.", requiresProject: true },
  { label: "Draft GEF Report", icon: <FileText className="h-3 w-3" />, context: "report_draft", category: "general",
    prompt: "Generate a GEF (Global Environment Facility) Project Implementation Report (PIR) for this project. Include: Progress toward project objectives, implementation progress rating, risk assessment, co-financing status, stakeholder engagement summary, and environmental/social safeguards status.", requiresProject: true },

  // Emissions & Reporting (show on ESG/Carbon pages)
  { label: "Emissions Analysis", icon: <BarChart3 className="h-3 w-3" />, context: "carbon", category: "emissions",
    prompt: "Analyze the emissions data and provide a breakdown of Scope 1, 2, and 3 emissions. Identify major emission sources, inefficiencies, and benchmark comparison. Then recommend top 3 reduction opportunities with quick wins vs long-term strategies.", requiresProject: false },
  { label: "Emissions Gap Detection", icon: <AlertTriangle className="h-3 w-3" />, context: "carbon", category: "emissions",
    prompt: "Review the emissions dataset and identify missing or incomplete data. Check for missing Scope 3 categories, inconsistent values, and unusual spikes or anomalies. Explain what is missing and suggest how to collect or estimate the missing data.", requiresProject: false },
  { label: "ESG Report (CDP/ISSB/SBTi)", icon: <FileText className="h-3 w-3" />, context: "compliance", category: "emissions",
    prompt: "Generate an ESG summary report aligned with CDP, ISSB, and SBTi frameworks. Include emissions overview, reduction progress, offset usage, and risks/compliance gaps. Use the structured output format: Summary, Key Insights, Risks, Recommended Actions.", requiresProject: false },
  { label: "Supplier Engagement Strategy", icon: <Users className="h-3 w-3" />, context: "carbon", category: "emissions",
    prompt: "Design a supplier engagement plan to reduce Scope 3 emissions. Include data collection approach, incentives for suppliers, monitoring system, and estimated reduction potential from supplier engagement.", requiresProject: false },
  { label: "Net-Zero Roadmap", icon: <Target className="h-3 w-3" />, context: "carbon", category: "emissions",
    prompt: "Create a net-zero roadmap for this organization. Include baseline emissions, reduction targets (short/medium/long term), key interventions, and the role of offsets. Make it realistic and actionable for an African market context.", requiresProject: false },

  // Verification (show on verification pages)
  { label: "Project Credibility Check", icon: <Shield className="h-3 w-3" />, context: "compliance", category: "verification",
    prompt: "Evaluate the credibility of this carbon/sustainability project. Assess methodology validity, data completeness, alignment with recognized standards (Verra, Gold Standard), and satellite verification signals if available. Flag any risks of greenwashing or missing verification elements.", requiresProject: true },
  { label: "Verification Assistant", icon: <Shield className="h-3 w-3" />, context: "compliance", category: "verification",
    prompt: "You are assisting a certified verifier. Review this project submission and identify missing documentation, highlight inconsistencies, suggest verification steps. Then provide an approval recommendation (Approve / Needs Revision / Reject) with justification.", requiresProject: true },

  // Marketplace & Investment (show on marketplace pages)
  { label: "Carbon Credit Recommendation", icon: <Leaf className="h-3 w-3" />, context: "carbon", category: "marketplace",
    prompt: "Recommend the best carbon credits for this organization. Consider emissions profile, budget, geography preference, and ESG goals. Suggest 3-5 projects, explain why each is suitable, and provide risk assessment.", requiresProject: false },
  { label: "Portfolio Builder", icon: <TrendingUp className="h-3 w-3" />, context: "carbon", category: "marketplace",
    prompt: "Build a diversified carbon credit portfolio. Consider risk tolerance, impact focus areas, budget constraints, and SDG alignment. Output portfolio allocation percentages, expected impact, and risk analysis.", requiresProject: false },
  { label: "ROI Analysis", icon: <BarChart3 className="h-3 w-3" />, context: "carbon", category: "marketplace",
    prompt: "Analyze the financial and environmental return of this carbon project. Include expected revenue from credits, cost vs return, payback period, and risk factors. Use African market pricing context.", requiresProject: true },

  // Compliance & Risk
  { label: "Compliance Gap Scan", icon: <Shield className="h-3 w-3" />, context: "compliance", category: "compliance",
    prompt: "Perform a comprehensive compliance gap analysis for this project. Identify which African regulatory frameworks apply (NGX, NESRA, CBN, SEC, JSE, NEMA, NSE), assess current compliance status against each, highlight critical gaps and missing data, and provide a prioritized remediation roadmap with deadlines.", requiresProject: true },
  { label: "Regulatory Alert", icon: <AlertTriangle className="h-3 w-3" />, context: "compliance", category: "compliance",
    prompt: "Based on current regulations and trends, identify upcoming compliance risks and highlight changes relevant to this organization. Recommend proactive steps to stay ahead of regulatory changes across African markets.", requiresProject: false },
  { label: "Carbon Footprint Analysis", icon: <Leaf className="h-3 w-3" />, context: "carbon", category: "general",
    prompt: "Analyze the carbon footprint and climate impact of this project. Estimate Scope 1, 2, and 3 emissions where possible, identify carbon reduction opportunities, suggest offset strategies relevant to African carbon markets, and recommend climate disclosure improvements for TCFD/CDP alignment.", requiresProject: true },

  // Government
  { label: "Government Review", icon: <Users className="h-3 w-3" />, context: "compliance", category: "government",
    prompt: "Review this project from a regulatory perspective. Check alignment with national climate goals, environmental impact, and compliance readiness. Provide approval recommendation and required changes.", requiresProject: true },

  // Investor
  { label: "Investor Due Diligence", icon: <TrendingUp className="h-3 w-3" />, context: "compliance", category: "investor",
    prompt: "Perform due diligence on this carbon project. Assess financial viability, verification status, risk exposure, and market demand. Provide investment recommendation (INVEST / CAUTION / AVOID) with justification.", requiresProject: true },

  // General
  { label: "SDG Impact Summary", icon: <Sparkles className="h-3 w-3" />, context: "general", category: "general",
    prompt: "Create a comprehensive SDG impact summary for this project. Map all activities to specific SDG targets and indicators, assess the depth of contribution (direct vs indirect), identify SDG interlinkages, and highlight areas where impact measurement could be strengthened. Also map to relevant Agenda 2063 aspirations.", requiresProject: true },
  { label: "Reduction Strategy", icon: <Zap className="h-3 w-3" />, context: "carbon", category: "emissions",
    prompt: "Identify the most effective ways to reduce emissions. Prioritize by cost efficiency, speed of implementation, and impact. Rank top strategies and provide estimated reduction potential for each.", requiresProject: false },
];

export default function AICopilotQuickActions({ onAction, hasProjectData, disabled, pageContext = "general" }: QuickActionsProps) {
  // Show context-relevant actions first, then general ones
  const relevant = ALL_QUICK_ACTIONS.filter(a => {
    if (a.requiresProject && !hasProjectData) return false;
    if (pageContext === "general") return a.category === "general";
    return a.category === pageContext || a.category === "general";
  });

  // Limit to 8 actions to avoid overwhelming UI
  const shown = relevant.slice(0, 8);

  if (shown.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((action) => (
        <Button
          key={action.label}
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1 border-dashed"
          disabled={disabled}
          onClick={() => onAction(action.prompt, action.context)}
        >
          {action.icon}
          {action.label}
        </Button>
      ))}
    </div>
  );
}

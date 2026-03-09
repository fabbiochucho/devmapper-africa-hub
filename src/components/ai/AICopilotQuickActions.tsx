import { Button } from "@/components/ui/button";
import { FileText, Shield, Leaf, Sparkles } from "lucide-react";

interface QuickActionsProps {
  onAction: (prompt: string, context: string) => void;
  hasProjectData: boolean;
  disabled: boolean;
}

const QUICK_ACTIONS = [
  {
    label: "Draft World Bank Report",
    icon: <FileText className="h-3 w-3" />,
    context: "report_draft",
    prompt: "Generate a complete World Bank-format project progress report based on the current project data. Include: Executive Summary, Project Description & Objectives, Implementation Progress, Financial Summary (disbursement vs budget), Key Performance Indicators, Risk Assessment, and Recommendations. Use formal institutional tone.",
    requiresProject: true,
  },
  {
    label: "Draft UNDP Report",
    icon: <FileText className="h-3 w-3" />,
    context: "report_draft",
    prompt: "Generate a UNDP Results-Oriented Annual Report (ROAR) for this project. Include: Output-level results, contribution to UNDP Strategic Plan outcomes, SDG alignment analysis, lessons learned, gender and inclusion dimensions, and sustainability assessment.",
    requiresProject: true,
  },
  {
    label: "Draft AfDB Report",
    icon: <FileText className="h-3 w-3" />,
    context: "report_draft",
    prompt: "Generate an African Development Bank (AfDB) Project Completion Report format for this project. Include: Project rationale and objectives, achievement of outputs, development outcomes, institutional performance assessment, sustainability of results, and key lessons. Reference Agenda 2063 alignment where applicable.",
    requiresProject: true,
  },
  {
    label: "Draft GEF Report",
    icon: <FileText className="h-3 w-3" />,
    context: "report_draft",
    prompt: "Generate a GEF (Global Environment Facility) Project Implementation Report (PIR) for this project. Include: Progress toward project objectives, implementation progress rating, risk assessment, co-financing status, stakeholder engagement summary, and environmental/social safeguards status.",
    requiresProject: true,
  },
  {
    label: "Compliance Gap Scan",
    icon: <Shield className="h-3 w-3" />,
    context: "compliance",
    prompt: "Perform a comprehensive compliance gap analysis for this project. Identify which African regulatory frameworks apply (NGX, NESRA, CBN, SEC, JSE, NEMA, NSE), assess current compliance status against each, highlight critical gaps and missing data, and provide a prioritized remediation roadmap with deadlines.",
    requiresProject: true,
  },
  {
    label: "Carbon Footprint Analysis",
    icon: <Leaf className="h-3 w-3" />,
    context: "carbon",
    prompt: "Analyze the carbon footprint and climate impact of this project. Estimate Scope 1, 2, and 3 emissions where possible, identify carbon reduction opportunities, suggest offset strategies relevant to African carbon markets, and recommend climate disclosure improvements for TCFD/CDP alignment.",
    requiresProject: true,
  },
  {
    label: "SDG Impact Summary",
    icon: <Sparkles className="h-3 w-3" />,
    context: "general",
    prompt: "Create a comprehensive SDG impact summary for this project. Map all activities to specific SDG targets and indicators, assess the depth of contribution (direct vs indirect), identify SDG interlinkages, and highlight areas where impact measurement could be strengthened. Also map to relevant Agenda 2063 aspirations.",
    requiresProject: true,
  },
];

export default function AICopilotQuickActions({ onAction, hasProjectData, disabled }: QuickActionsProps) {
  const available = QUICK_ACTIONS.filter(a => !a.requiresProject || hasProjectData);

  if (available.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {available.map((action) => (
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

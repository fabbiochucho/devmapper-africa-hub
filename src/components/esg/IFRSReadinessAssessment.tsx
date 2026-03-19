import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, AlertTriangle, Clock, Shield, FileText, 
  Building, Users, BarChart3, Target, Leaf 
} from 'lucide-react';
import { toast } from 'sonner';

interface ReadinessStage {
  id: string;
  title: string;
  timing: string;
  description: string;
  items: { id: string; label: string; description: string }[];
}

const FRC_READINESS_STAGES: ReadinessStage[] = [
  {
    id: 'stage1',
    title: 'Stage 1: Pre-Adoption',
    timing: '3 months before reporting date',
    description: 'Board-level approval and planning documents required before adoption begins.',
    items: [
      { id: 's1_board_resolution', label: 'Board Resolution', description: 'Board resolution approving adoption of IFRS Sustainability Disclosure Standards' },
      { id: 's1_gap_analysis', label: 'GAP Analysis Report', description: 'Comprehensive gap analysis comparing current reporting to IFRS S1/S2 requirements' },
      { id: 's1_implementation_plan', label: 'Implementation Plan', description: 'Detailed plan with timelines, resource allocation, and milestones for adoption' },
    ],
  },
  {
    id: 'stage2',
    title: 'Stage 2: Early Implementation',
    timing: 'Within 3 months after reporting date',
    description: 'Disclosure policies, materiality assessment, and governance structures must be established.',
    items: [
      { id: 's2_disclosure_policies', label: 'IFRS Sustainability Disclosure Policies', description: 'Documented sustainability disclosure policies aligned with IFRS S1 requirements' },
      { id: 's2_transitional_reliefs', label: 'Transitional Reliefs Identification', description: 'Identification and documentation of applicable transitional reliefs (climate-first, Scope 3 deferral, comparative data)' },
      { id: 's2_materiality', label: 'Materiality Assessment', description: 'Identification and materiality assessment of sustainability and climate-related risks and opportunities' },
      { id: 's2_governance', label: 'Governance Structure', description: 'Evidence of establishment of a governance structure for sustainability reporting' },
      { id: 's2_board_approval_policy', label: 'Board Approval of Policies', description: 'Evidence of Board approval of IFRS Sustainability Disclosure Policies' },
      { id: 's2_training', label: 'Regulatory Training', description: 'Evidence of FRC-accredited sustainability training for Board Members, Management, and Preparers' },
    ],
  },
  {
    id: 'stage3',
    title: 'Stage 3: Full Readiness',
    timing: 'Within 6 months after reporting date',
    description: 'Scenario analysis, risk frameworks, metrics, and internal controls must be in place.',
    items: [
      { id: 's3_frc_registration', label: 'FRC Registration', description: 'Evidence of registration of entity and professionals with FRC (Section 41, FRC Act 2011)' },
      { id: 's3_scenario_models', label: 'Scenario Analysis Models', description: 'Description of models used for climate-related scenario analysis (qualitative or quantitative)' },
      { id: 's3_risk_framework', label: 'Risk Management Framework', description: 'Enterprise and Sustainability Risk Management Framework documented and operational' },
      { id: 's3_board_risk_approval', label: 'Board Risk Framework Approval', description: 'Evidence of Board approval of Enterprise and Sustainability Risk Management Framework' },
      { id: 's3_metrics', label: 'Cross-Industry & Industry Metrics', description: 'Description of identified cross-industry and industry-specific metrics and targets (SASB aligned)' },
      { id: 's3_board_metrics_approval', label: 'Board Metrics Approval', description: 'Evidence of Board approval of metrics and targets for sustainability and climate-related risks' },
      { id: 's3_financial_effect', label: 'Current Financial Effect of SRRO', description: 'Documentation of current financial effect of sustainability-related risks and opportunities' },
      { id: 's3_icsr', label: 'Internal Control Over Sustainability Reporting (ICSR)', description: 'Controls ensuring sustainability data integrity: ownership, documented methodologies, validation checks, audit trails' },
    ],
  },
];

const ADOPTION_PHASES = [
  { phase: 'Phase 1', label: 'Early Adopters', period: 'Dec 31, 2023', status: 'closed' },
  { phase: 'Phase 2', label: 'Voluntary Adopters (incl. CPSEs)', period: '2024–2027', status: 'active' },
  { phase: 'Phase 3', label: 'Mandatory – All PIEs', period: 'Jan 1, 2028', status: 'upcoming' },
  { phase: 'Phase 4', label: 'SMEs & Government Orgs', period: 'Jan 1, 2030', status: 'upcoming' },
];

const ASSURANCE_TIMELINE = [
  { year: 'Years 1–3', requirement: 'No mandatory assurance', detail: 'Voluntary assurance encouraged' },
  { year: 'Years 4–5', requirement: 'Limited assurance', detail: 'S1 and S2 disclosures excluding Scope 3 emissions, scenario analysis, and transition plans' },
  { year: 'Year 6', requirement: 'Limited + Reasonable', detail: 'Limited assurance on Scope 3, scenarios, transition plans; reasonable assurance on all other disclosures' },
  { year: 'Year 7+', requirement: 'Full reasonable assurance', detail: 'Reasonable assurance on all sustainability disclosures (ISSA 5000)' },
];

interface IFRSReadinessAssessmentProps {
  organizationId: string;
  organizationName: string;
}

export default function IFRSReadinessAssessment({ organizationId, organizationName }: IFRSReadinessAssessmentProps) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  const totalItems = FRC_READINESS_STAGES.reduce((sum, stage) => sum + stage.items.length, 0);
  const completedCount = completedItems.size;
  const progressPercent = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  const toggleItem = (itemId: string) => {
    setCompletedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const getStageProgress = (stage: ReadinessStage) => {
    const done = stage.items.filter(i => completedItems.has(i.id)).length;
    return { done, total: stage.items.length, percent: stage.items.length > 0 ? Math.round((done / stage.items.length) * 100) : 0 };
  };

  const getReadinessStatus = () => {
    if (progressPercent >= 100) return { label: 'Fully Ready', color: 'bg-green-500/10 text-green-700', icon: <CheckCircle2 className="h-4 w-4" /> };
    if (progressPercent >= 60) return { label: 'Progressing', color: 'bg-yellow-500/10 text-yellow-700', icon: <AlertTriangle className="h-4 w-4" /> };
    return { label: 'Early Stage', color: 'bg-orange-500/10 text-orange-700', icon: <Clock className="h-4 w-4" /> };
  };

  const status = getReadinessStatus();

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                FRC IFRS SDS Readiness Assessment
              </CardTitle>
              <CardDescription>
                Nigeria FRC Sustainability Reporting Guideline (SRG1) 2026 — 3-stage readiness checklist
              </CardDescription>
            </div>
            <Badge className={status.color}>
              <span className="flex items-center gap-1">{status.icon} {status.label}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Progress value={progressPercent} className="flex-1" />
            <span className="text-sm font-medium text-muted-foreground">{completedCount}/{totalItems} items</span>
          </div>

          {/* Adoption Phase Indicator */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {ADOPTION_PHASES.map(p => (
              <div
                key={p.phase}
                className={`p-3 rounded-lg border text-center text-xs ${
                  p.status === 'active' ? 'border-primary bg-primary/5' :
                  p.status === 'closed' ? 'border-muted bg-muted/30 opacity-60' :
                  'border-border'
                }`}
              >
                <div className="font-semibold text-sm">{p.phase}</div>
                <div className="text-muted-foreground">{p.label}</div>
                <div className="font-medium mt-1">{p.period}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stage Checklists */}
      {FRC_READINESS_STAGES.map(stage => {
        const sp = getStageProgress(stage);
        return (
          <Card key={stage.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{stage.title}</CardTitle>
                  <CardDescription>{stage.timing} — {stage.description}</CardDescription>
                </div>
                <Badge variant={sp.percent === 100 ? 'default' : 'secondary'}>
                  {sp.done}/{sp.total}
                </Badge>
              </div>
              <Progress value={sp.percent} className="h-1.5" />
            </CardHeader>
            <CardContent className="space-y-2">
              {stage.items.map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleItem(item.id)}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    completedItems.has(item.id) ? 'border-primary/40 bg-primary/5' : 'hover:border-primary/30'
                  }`}
                >
                  <Checkbox checked={completedItems.has(item.id)} className="mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        );
      })}

      {/* Assurance Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Nigeria Assurance Roadmap (ISSA 5000)
          </CardTitle>
          <CardDescription>Progressive assurance requirements per FRC Amended Roadmap 2026</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {ASSURANCE_TIMELINE.map((t, i) => (
              <div key={i} className="p-3 rounded-lg border space-y-1">
                <div className="text-sm font-semibold">{t.year}</div>
                <Badge variant={i === 0 ? 'secondary' : 'default'} className="text-xs">{t.requirement}</Badge>
                <div className="text-xs text-muted-foreground">{t.detail}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, AlertTriangle, Clock, Shield, FileText} from 'lucide-react';

interface ReadinessStage {
  id: string;
  title: string;
  timing: string;
  description: string;
  items: { id: string; label: string; description: string }[];
}

const getFrcReadinessStages = (t: (key: string) => string): ReadinessStage[] => [
  {
    id: 'stage1',
    title: t('esg.ifrsReadiness.stage1Title'),
    timing: t('esg.ifrsReadiness.stage1Timing'),
    description: t('esg.ifrsReadiness.stage1Description'),
    items: [
      { id: 's1_board_resolution', label: t('esg.ifrsReadiness.s1BoardResolutionLabel'), description: t('esg.ifrsReadiness.s1BoardResolutionDescription') },
      { id: 's1_gap_analysis', label: t('esg.ifrsReadiness.s1GapAnalysisLabel'), description: t('esg.ifrsReadiness.s1GapAnalysisDescription') },
      { id: 's1_implementation_plan', label: t('esg.ifrsReadiness.s1ImplementationPlanLabel'), description: t('esg.ifrsReadiness.s1ImplementationPlanDescription') },
    ],
  },
  {
    id: 'stage2',
    title: t('esg.ifrsReadiness.stage2Title'),
    timing: t('esg.ifrsReadiness.stage2Timing'),
    description: t('esg.ifrsReadiness.stage2Description'),
    items: [
      { id: 's2_disclosure_policies', label: t('esg.ifrsReadiness.s2DisclosurePoliciesLabel'), description: t('esg.ifrsReadiness.s2DisclosurePoliciesDescription') },
      { id: 's2_transitional_reliefs', label: t('esg.ifrsReadiness.s2TransitionalReliefsLabel'), description: t('esg.ifrsReadiness.s2TransitionalReliefsDescription') },
      { id: 's2_materiality', label: t('esg.ifrsReadiness.s2MaterialityLabel'), description: t('esg.ifrsReadiness.s2MaterialityDescription') },
      { id: 's2_governance', label: t('esg.ifrsReadiness.s2GovernanceLabel'), description: t('esg.ifrsReadiness.s2GovernanceDescription') },
      { id: 's2_board_approval_policy', label: t('esg.ifrsReadiness.s2BoardApprovalPolicyLabel'), description: t('esg.ifrsReadiness.s2BoardApprovalPolicyDescription') },
      { id: 's2_training', label: t('esg.ifrsReadiness.s2TrainingLabel'), description: t('esg.ifrsReadiness.s2TrainingDescription') },
    ],
  },
  {
    id: 'stage3',
    title: t('esg.ifrsReadiness.stage3Title'),
    timing: t('esg.ifrsReadiness.stage3Timing'),
    description: t('esg.ifrsReadiness.stage3Description'),
    items: [
      { id: 's3_frc_registration', label: t('esg.ifrsReadiness.s3FrcRegistrationLabel'), description: t('esg.ifrsReadiness.s3FrcRegistrationDescription') },
      { id: 's3_scenario_models', label: t('esg.ifrsReadiness.s3ScenarioModelsLabel'), description: t('esg.ifrsReadiness.s3ScenarioModelsDescription') },
      { id: 's3_risk_framework', label: t('esg.ifrsReadiness.s3RiskFrameworkLabel'), description: t('esg.ifrsReadiness.s3RiskFrameworkDescription') },
      { id: 's3_board_risk_approval', label: t('esg.ifrsReadiness.s3BoardRiskApprovalLabel'), description: t('esg.ifrsReadiness.s3BoardRiskApprovalDescription') },
      { id: 's3_metrics', label: t('esg.ifrsReadiness.s3MetricsLabel'), description: t('esg.ifrsReadiness.s3MetricsDescription') },
      { id: 's3_board_metrics_approval', label: t('esg.ifrsReadiness.s3BoardMetricsApprovalLabel'), description: t('esg.ifrsReadiness.s3BoardMetricsApprovalDescription') },
      { id: 's3_financial_effect', label: t('esg.ifrsReadiness.s3FinancialEffectLabel'), description: t('esg.ifrsReadiness.s3FinancialEffectDescription') },
      { id: 's3_icsr', label: t('esg.ifrsReadiness.s3IcsrLabel'), description: t('esg.ifrsReadiness.s3IcsrDescription') },
    ],
  },
];

const getAdoptionPhases = (t: (key: string) => string) => [
  { phase: t('esg.ifrsReadiness.phase1Name'), label: t('esg.ifrsReadiness.phase1Label'), period: t('esg.ifrsReadiness.phase1Period'), status: 'closed' },
  { phase: t('esg.ifrsReadiness.phase2Name'), label: t('esg.ifrsReadiness.phase2Label'), period: t('esg.ifrsReadiness.phase2Period'), status: 'active' },
  { phase: t('esg.ifrsReadiness.phase3Name'), label: t('esg.ifrsReadiness.phase3Label'), period: t('esg.ifrsReadiness.phase3Period'), status: 'upcoming' },
  { phase: t('esg.ifrsReadiness.phase4Name'), label: t('esg.ifrsReadiness.phase4Label'), period: t('esg.ifrsReadiness.phase4Period'), status: 'upcoming' },
];

const getAssuranceTimeline = (t: (key: string) => string) => [
  { year: t('esg.ifrsReadiness.assuranceYear1Range'), requirement: t('esg.ifrsReadiness.assuranceYear1Requirement'), detail: t('esg.ifrsReadiness.assuranceYear1Detail') },
  { year: t('esg.ifrsReadiness.assuranceYear2Range'), requirement: t('esg.ifrsReadiness.assuranceYear2Requirement'), detail: t('esg.ifrsReadiness.assuranceYear2Detail') },
  { year: t('esg.ifrsReadiness.assuranceYear3Range'), requirement: t('esg.ifrsReadiness.assuranceYear3Requirement'), detail: t('esg.ifrsReadiness.assuranceYear3Detail') },
  { year: t('esg.ifrsReadiness.assuranceYear4Range'), requirement: t('esg.ifrsReadiness.assuranceYear4Requirement'), detail: t('esg.ifrsReadiness.assuranceYear4Detail') },
];

interface IFRSReadinessAssessmentProps {
  organizationId: string;
  organizationName: string;
}

export default function IFRSReadinessAssessment(_props: IFRSReadinessAssessmentProps) {
  const { t } = useTranslation();
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());

  const FRC_READINESS_STAGES = getFrcReadinessStages(t);
  const ADOPTION_PHASES = getAdoptionPhases(t);
  const ASSURANCE_TIMELINE = getAssuranceTimeline(t);

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
    if (progressPercent >= 100) return { label: t('esg.ifrsReadiness.statusFullyReady'), color: 'bg-green-500/10 text-green-700', icon: <CheckCircle2 className="h-4 w-4" /> };
    if (progressPercent >= 60) return { label: t('esg.ifrsReadiness.statusProgressing'), color: 'bg-yellow-500/10 text-yellow-700', icon: <AlertTriangle className="h-4 w-4" /> };
    return { label: t('esg.ifrsReadiness.statusEarlyStage'), color: 'bg-orange-500/10 text-orange-700', icon: <Clock className="h-4 w-4" /> };
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
                {t('esg.ifrsReadiness.assessmentTitle')}
              </CardTitle>
              <CardDescription>
                {t('esg.ifrsReadiness.assessmentSubtitle')}
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
            <span className="text-sm font-medium text-muted-foreground">{t('esg.ifrsReadiness.itemsCount', { completed: completedCount, total: totalItems })}</span>
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
            {t('esg.ifrsReadiness.assuranceRoadmapTitle')}
          </CardTitle>
          <CardDescription>{t('esg.ifrsReadiness.assuranceRoadmapSubtitle')}</CardDescription>
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

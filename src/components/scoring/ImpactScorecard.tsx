import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { DISM_DIMENSION_DETAILS, DISM_RATING_CONFIG, computeFullDISM, type DISMDimensions, type DISMResult } from '@/lib/dism-engine';
import { Award } from 'lucide-react';

interface ImpactScorecardProps {
  initialDimensions?: Partial<DISMDimensions>;
  readOnly?: boolean;
}

const DEFAULT_DIMS: DISMDimensions = {
  sdgAlignment: 0, impactScale: 0, impactDepth: 0, outcomeEffectiveness: 0,
  sustainability: 0, evidenceVerification: 0, governanceEthics: 0, innovationReplicability: 0,
};

export default function ImpactScorecard({ initialDimensions, readOnly = false }: ImpactScorecardProps) {
  const [dimensions, setDimensions] = useState<DISMDimensions>({ ...DEFAULT_DIMS, ...initialDimensions });

  const result: DISMResult = useMemo(() => computeFullDISM(dimensions), [dimensions]);

  const handleChange = (key: keyof DISMDimensions, value: number[]) => {
    if (readOnly) return;
    setDimensions(prev => ({ ...prev, [key]: value[0] }));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2"><Award className="h-4 w-4" /> DISM Impact Scorecard</CardTitle>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold" style={{ color: result.ratingColor }}>{result.totalScore}</div>
            <div className="text-right">
              <Badge style={{ backgroundColor: result.ratingColor, color: '#fff' }}>{result.rating}</Badge>
              <p className="text-xs text-muted-foreground mt-0.5">{result.impactCategory}</p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {(Object.entries(DISM_DIMENSION_DETAILS) as [keyof DISMDimensions, typeof DISM_DIMENSION_DETAILS[keyof DISMDimensions]][]).map(([key, dim]) => (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{dim.label}</span>
              <span className="text-sm font-bold text-foreground">{dimensions[key]}/{dim.maxScore}</span>
            </div>
            <Slider
              min={0} max={dim.maxScore} step={1}
              value={[dimensions[key]]}
              onValueChange={(v) => handleChange(key, v)}
              disabled={readOnly}
            />
          </div>
        ))}
        <Separator />
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Composite Rating Formula: Impact×0.5 + Verification×0.3 + Evidence×0.2</span>
          <span className="font-bold text-foreground" style={{ color: result.ratingColor }}>{result.ratingLabel}</span>
        </div>
      </CardContent>
    </Card>
  );
}

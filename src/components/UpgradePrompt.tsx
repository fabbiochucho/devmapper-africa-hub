import { AlertCircle, Zap } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  feature: string;
  requiredPlan: 'lite' | 'pro';
  inline?: boolean;
}

const planFeatures: Record<string, string[]> = {
  lite: [
    'ESG Lite Dashboard',
    'Limited Earth Intelligence layers',
    'SDG × Agenda 2063 linkage',
    'Basic supplier emissions tracking'
  ],
  pro: [
    'Full ESG Pro Analytics',
    'Complete Earth Intelligence suite',
    'Benchmark against peers',
    'API access for integrations',
    'Export reports and data',
    'Advanced scenario modeling'
  ]
};

export default function UpgradePrompt({ 
  feature, 
  requiredPlan,
  inline = false 
}: UpgradePromptProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/billing-upgrade');
  };

  if (inline) {
    return (
      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
        <AlertCircle className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Upgrade to {requiredPlan.toUpperCase()} to access this feature
        </span>
        <Button size="sm" variant="outline" onClick={handleUpgrade}>
          Upgrade
        </Button>
      </div>
    );
  }

  return (
    <Alert className="border-primary/50 bg-primary/5">
      <Zap className="h-5 w-5 text-primary" />
      <AlertTitle className="text-lg font-semibold">
        Upgrade Required
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          This feature requires a <span className="font-semibold">{requiredPlan.toUpperCase()}</span> plan subscription.
        </p>
        
        <div>
          <p className="font-medium mb-2">What you'll get:</p>
          <ul className="space-y-1 text-sm">
            {planFeatures[requiredPlan].map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary mt-0.5">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button onClick={handleUpgrade} className="w-full sm:w-auto">
          <Zap className="w-4 h-4 mr-2" />
          Upgrade to {requiredPlan.toUpperCase()}
        </Button>
      </AlertDescription>
    </Alert>
  );
}

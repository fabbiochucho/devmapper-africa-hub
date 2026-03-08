import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ArrowRight, ArrowLeft, MapPin, FileText, BarChart3, Users, Sparkles } from 'lucide-react';

interface WalkthroughStep {
  title: string;
  description: string;
  icon: React.ElementType;
  tip: string;
}

const steps: WalkthroughStep[] = [
  {
    title: 'Welcome to DevMapper',
    description: 'Track SDG-aligned development projects across Africa. Submit reports, manage projects, and measure real impact.',
    icon: Sparkles,
    tip: 'This walkthrough takes about 30 seconds.',
  },
  {
    title: 'Submit Reports',
    description: 'Document development projects with location, SDG alignment, funding details, and evidence. Your reports contribute to the continental SDG dashboard.',
    icon: FileText,
    tip: 'Go to "Submit Report" in the sidebar to get started.',
  },
  {
    title: 'Track on the Map',
    description: 'Every project appears on our interactive map. Filter by SDG goal, country, or status to explore Africa\'s development landscape.',
    icon: MapPin,
    tip: 'The map updates in real-time as new projects are submitted.',
  },
  {
    title: 'Manage Your Projects',
    description: 'View all your projects and affiliated ones in "My Projects". Add milestones, track progress, and upload evidence of impact.',
    icon: BarChart3,
    tip: 'Milestone tracking helps with ESG and donor reporting.',
  },
  {
    title: 'Collaborate Across Roles',
    description: 'NGOs, corporates, governments, and change makers all connect through project affiliations — one project, multiple stakeholders.',
    icon: Users,
    tip: 'Invite sponsors and partners to your projects from the project detail page.',
  },
];

const STORAGE_KEY = 'devmapper_walkthrough_completed';

export default function ProductWalkthrough() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      // Small delay so dashboard renders first
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  if (!isVisible) return null;

  const step = steps[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <StepIcon className="h-6 w-6 text-primary" />
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
          <p className="text-muted-foreground mb-4">{step.description}</p>
          
          <div className="bg-muted/50 rounded-lg p-3 mb-6">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">💡 Tip:</span> {step.tip}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 mb-4">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-2 rounded-full transition-all ${
                  i === currentStep ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-1"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <span className="text-xs text-muted-foreground">
              {currentStep + 1} of {steps.length}
            </span>
            <Button onClick={handleNext} className="gap-1">
              {isLast ? 'Get Started' : 'Next'} {!isLast && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Call this to reset the walkthrough (e.g., from settings) */
export function resetWalkthrough() {
  localStorage.removeItem(STORAGE_KEY);
}

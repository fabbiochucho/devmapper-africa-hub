import { useState } from 'react';
import { useRouter } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Globe, 
  Leaf, 
  ChevronDown, 
  BarChart3, 
  Users, 
  Target,
  Building,
  Factory,
  Zap
} from 'lucide-react';

interface ModuleSwitcherProps {
  currentModule?: 'sdg' | 'esg';
  organizationId?: string;
  showCompact?: boolean;
}

const ModuleSwitcher = ({ 
  currentModule = 'sdg', 
  organizationId,
  showCompact = false 
}: ModuleSwitcherProps) => {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const modules = [
    {
      id: 'sdg',
      name: 'SDG Impact',
      description: 'Sustainable Development Goals tracking',
      icon: Globe,
      color: 'blue',
      features: ['Impact Reports', 'Change Makers', 'Forum', 'Analytics'],
      path: '/'
    },
    {
      id: 'esg',
      name: 'ESG Management', 
      description: 'Environmental, Social & Governance',
      icon: Leaf,
      color: 'green',
      features: ['Carbon Tracking', 'Suppliers', 'Scenarios', 'Benchmarks'],
      path: '/esg'
    }
  ];

  const currentModuleData = modules.find(m => m.id === currentModule);

  const handleModuleSwitch = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (module) {
      router.push(module.path);
      setIsOpen(false);
    }
  };

  if (showCompact) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            {currentModuleData && (
              <currentModuleData.icon className="w-4 h-4" />
            )}
            {currentModuleData?.name}
            <ChevronDown className="w-3 h-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {modules.map((module) => {
            const Icon = module.icon;
            const isActive = module.id === currentModule;
            
            return (
              <DropdownMenuItem
                key={module.id}
                onClick={() => handleModuleSwitch(module.id)}
                className={`flex items-center gap-3 p-3 ${isActive ? 'bg-muted' : ''}`}
              >
                <div className={`p-2 rounded-lg ${
                  module.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    module.color === 'blue' ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{module.name}</div>
                  <div className="text-xs text-muted-foreground">{module.description}</div>
                </div>
                {isActive && (
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {modules.map((module) => {
        const Icon = module.icon;
        const isActive = module.id === currentModule;
        
        return (
          <Card 
            key={module.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              isActive ? 'ring-2 ring-primary shadow-lg' : ''
            }`}
            onClick={() => !isActive && handleModuleSwitch(module.id)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${
                    module.color === 'blue' 
                      ? 'bg-blue-100 dark:bg-blue-900' 
                      : 'bg-green-100 dark:bg-green-900'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      module.color === 'blue' 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-green-600 dark:text-green-400'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{module.name}</h3>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </div>
                </div>
                {isActive && (
                  <Badge variant="default">Active</Badge>
                )}
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Key Features:</p>
                <div className="flex flex-wrap gap-2">
                  {module.features.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {!isActive && (
                <div className="mt-4 pt-4 border-t">
                  <Button size="sm" className="w-full">
                    Switch to {module.name}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ModuleSwitcher;
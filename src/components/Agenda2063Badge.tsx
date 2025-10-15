import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Agenda2063Data {
  aspiration: number;
  goal: string;
  description: string;
  data_source: string;
}

interface Agenda2063BadgeProps {
  sdgGoal: number;
  variant?: 'default' | 'outline' | 'secondary';
  showDetails?: boolean;
}

const aspirationColors: Record<number, string> = {
  1: 'bg-blue-500 hover:bg-blue-600',
  3: 'bg-green-500 hover:bg-green-600',
  6: 'bg-purple-500 hover:bg-purple-600',
  7: 'bg-teal-500 hover:bg-teal-600',
};

export default function Agenda2063Badge({ 
  sdgGoal, 
  variant = 'outline',
  showDetails = true 
}: Agenda2063BadgeProps) {
  const [alignments, setAlignments] = useState<Agenda2063Data[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgenda2063Alignment();
  }, [sdgGoal]);

  const fetchAgenda2063Alignment = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_agenda2063_for_sdg', { p_sdg_goal: sdgGoal });

      if (error) throw error;
      setAlignments(data || []);
    } catch (error) {
      console.error('Error fetching Agenda 2063 alignment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || alignments.length === 0) {
    return null;
  }

  const primaryAlignment = alignments[0];

  if (!showDetails) {
    return (
      <Badge variant={variant} className="text-xs">
        Agenda 2063 Aspiration {primaryAlignment.aspiration}
      </Badge>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Badge 
          variant={variant} 
          className={`cursor-pointer text-xs ${variant === 'default' ? aspirationColors[primaryAlignment.aspiration] || '' : ''}`}
        >
          <Info className="w-3 h-3 mr-1" />
          Agenda 2063
        </Badge>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-sm mb-1">
              SDG {sdgGoal} × Agenda 2063 Alignment
            </h4>
            <p className="text-xs text-muted-foreground">
              How this project contributes to Africa's development agenda
            </p>
          </div>
          
          {alignments.map((alignment, index) => (
            <div key={index} className="border-t pt-2">
              <div className="flex items-center gap-2 mb-1">
                <Badge className={aspirationColors[alignment.aspiration] || 'bg-gray-500'}>
                  Aspiration {alignment.aspiration}
                </Badge>
                <span className="text-xs font-medium">{alignment.goal}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-1">
                {alignment.description}
              </p>
              <p className="text-xs text-muted-foreground italic">
                Data: {alignment.data_source}
              </p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

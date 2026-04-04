import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface QuickAction {
  label: string;
  prompt: string;
}

interface NdovuQuickActionsProps {
  actions: QuickAction[];
  onAction?: (prompt: string) => void;
}

export default function NdovuQuickActions({ actions, onAction }: NdovuQuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.label}
          size="sm"
          variant="outline"
          className="h-8 text-xs gap-1 border-dashed"
          onClick={() => onAction?.(action.prompt)}
        >
          <Sparkles className="h-3 w-3" />
          {action.label}
        </Button>
      ))}
    </div>
  );
}

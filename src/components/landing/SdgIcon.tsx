
import React from "react";
import { sdgGoalColors } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface SdgIconProps {
  goal: string;
  className?: string;
}

export default function SdgIcon({ goal, className }: SdgIconProps) {
  const goalNumber = parseInt(goal);
  if (isNaN(goalNumber) || goalNumber < 1 || goalNumber > 17) {
    return null;
  }

  const color = sdgGoalColors[goal as keyof typeof sdgGoalColors];

  return (
    <div
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0",
        className
      )}
      style={{ backgroundColor: color }}
    >
      {goal}
    </div>
  );
}

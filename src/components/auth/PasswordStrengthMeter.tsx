import { useMemo } from 'react';
import { evaluatePasswordStrength } from '@/lib/passwordSecurity';
import { cn } from '@/lib/utils';

interface PasswordStrengthMeterProps {
  password: string;
  isBreached?: boolean;
}

export default function PasswordStrengthMeter({ password, isBreached }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => evaluatePasswordStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              i < strength.score
                ? isBreached ? 'bg-destructive' : strength.color
                : 'bg-muted'
            )}
          />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <p className={cn(
          'text-xs font-medium',
          isBreached ? 'text-destructive' : 'text-muted-foreground'
        )}>
          {isBreached
            ? '⚠ This password was found in a data breach — choose a different one'
            : strength.label}
        </p>
      </div>
    </div>
  );
}

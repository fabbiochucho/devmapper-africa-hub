import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Copy } from 'lucide-react';

export const CodeBlock = ({ code, language = 'bash' }: { code: string; language?: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      <pre className="text-sm bg-muted/80 border border-border p-4 rounded-lg overflow-x-auto font-mono">
        <code>{code}</code>
      </pre>
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2"
        onClick={handleCopy}
      >
        {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      </Button>
    </div>
  );
};

export const MethodBadge = ({ method }: { method: string }) => {
  const colors: Record<string, string> = {
    GET: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
    POST: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
    PUT: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
    PATCH: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30',
    DELETE: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold border ${colors[method] || 'bg-muted text-muted-foreground'}`}>
      {method}
    </span>
  );
};

export const StatusCode = ({ code, description }: { code: number; description: string }) => {
  const color = code < 300 ? 'text-green-600' : code < 400 ? 'text-amber-600' : 'text-red-600';
  return (
    <div className="flex items-center gap-2 text-sm">
      <code className={`font-bold ${color}`}>{code}</code>
      <span className="text-muted-foreground">{description}</span>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Shield, CheckCircle2, XCircle, Link as LinkIcon, Lock, FileText,
  Upload, Bot, UserCheck, Award, Eye, AlertTriangle
} from 'lucide-react';
import { fetchAndVerifyLedger, type LedgerEntry } from '@/lib/verification-ledger';

interface VerificationLedgerViewProps {
  reportId: string;
}

const EVENT_ICONS: Record<string, React.ReactNode> = {
  application_submitted: <Upload className="h-4 w-4" />,
  evidence_uploaded: <FileText className="h-4 w-4" />,
  evidence_verified: <CheckCircle2 className="h-4 w-4" />,
  stage_started: <Eye className="h-4 w-4" />,
  stage_completed: <CheckCircle2 className="h-4 w-4 text-primary" />,
  stage_failed: <XCircle className="h-4 w-4 text-destructive" />,
  score_updated: <Shield className="h-4 w-4" />,
  certification_issued: <Award className="h-4 w-4 text-primary" />,
  certification_revoked: <XCircle className="h-4 w-4 text-destructive" />,
  human_verification: <UserCheck className="h-4 w-4" />,
  ai_verification: <Bot className="h-4 w-4" />,
  governance_approved: <Shield className="h-4 w-4 text-primary" />,
  governance_rejected: <AlertTriangle className="h-4 w-4 text-destructive" />,
};

export default function VerificationLedgerView({ reportId }: VerificationLedgerViewProps) {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [isValid, setIsValid] = useState(true);
  const [brokenAt, setBrokenAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showHashes, setShowHashes] = useState(false);

  useEffect(() => {
    load();
  }, [reportId]);

  const load = async () => {
    setLoading(true);
    const result = await fetchAndVerifyLedger(reportId);
    setEntries(result.entries);
    setIsValid(result.isValid);
    setBrokenAt(result.brokenAt);
    setLoading(false);
  };

  if (loading) {
    return <Card><CardContent className="py-8 text-center text-muted-foreground">Loading audit trail...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <LinkIcon className="h-4 w-4" />
              Immutable Verification Ledger
            </CardTitle>
            <CardDescription>
              Hash-chain audit trail — tamper-evident record of all verification events
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowHashes(!showHashes)}>
              <Lock className="h-3 w-3 mr-1" />
              {showHashes ? 'Hide' : 'Show'} Hashes
            </Button>
            {isValid ? (
              <Badge variant="default" className="bg-emerald-600">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Chain Valid
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" /> Chain Broken
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!isValid && brokenAt !== null && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Chain Integrity Violation</AlertTitle>
            <AlertDescription>
              Hash chain broken at entry #{brokenAt + 1}. This indicates potential data tampering.
              All entries after this point should be treated as unverified.
            </AlertDescription>
          </Alert>
        )}

        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No verification events recorded yet. Events will appear here once the certification process begins.
          </p>
        ) : (
          <ScrollArea className="max-h-[500px]">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-4">
                {entries.map((entry, idx) => {
                  const isBroken = brokenAt !== null && idx >= brokenAt;
                  return (
                    <div
                      key={entry.id}
                      className={`relative flex gap-4 pl-2 ${isBroken ? 'opacity-50' : ''}`}
                    >
                      {/* Timeline dot */}
                      <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                        isBroken ? 'border-destructive bg-destructive/10' : 'border-primary bg-background'
                      }`}>
                        {EVENT_ICONS[entry.event_type] || <Shield className="h-4 w-4" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 border rounded-lg p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium capitalize">
                            {entry.event_type.replace(/_/g, ' ')}
                          </p>
                          <span className="text-xs text-muted-foreground">
                            #{entry.sequence_number} · {new Date(entry.created_at).toLocaleString()}
                          </span>
                        </div>

                        {/* Payload summary */}
                        {Object.keys(entry.payload).length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {Object.entries(entry.payload).slice(0, 3).map(([k, v]) => (
                              <span key={k} className="mr-3">
                                <span className="font-medium">{k}:</span>{' '}
                                {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Hash details */}
                        {showHashes && (
                          <div className="text-[10px] font-mono text-muted-foreground/60 mt-2 space-y-0.5 break-all">
                            <p>hash: {entry.entry_hash}</p>
                            <p>prev: {entry.prev_hash || 'GENESIS'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollArea>
        )}

        {/* Chain info */}
        <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>{entries.length} entries · SHA-256 hash chain</span>
          <span className="flex items-center gap-1">
            <Lock className="h-3 w-3" />
            Append-only, tamper-evident
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

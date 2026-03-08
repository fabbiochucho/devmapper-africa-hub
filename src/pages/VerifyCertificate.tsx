import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Shield, Award, CheckCircle2, XCircle, Search, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { RATING_CONFIG, type CertificationRating } from '@/lib/spvf-engine';
import { SEOHead } from '@/components/seo/SEOHead';

interface CertificateData {
  id: string;
  certificate_number: string;
  rating: string;
  status: string;
  issued_at: string;
  expires_at: string | null;
  certification_body: string | null;
  certified_by_name: string | null;
  report_id: string;
  report?: { title: string; sdg_goal: number; country_code: string | null; location: string | null };
  score?: { total_sis: number };
}

const VerifyCertificate = () => {
  const { certNumber } = useParams();
  const [searchInput, setSearchInput] = useState(certNumber || '');
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (certNumber) lookup(certNumber);
  }, [certNumber]);

  const lookup = async (num: string) => {
    setLoading(true);
    setSearched(true);
    const { data, error } = await supabase
      .from('project_certifications')
      .select('*, score:verification_scores!project_certifications_score_id_fkey(total_sis)')
      .eq('certificate_number', num.trim())
      .maybeSingle();

    if (data) {
      // Fetch report info separately
      const { data: report } = await supabase
        .from('reports')
        .select('title, sdg_goal, country_code, location')
        .eq('id', data.report_id)
        .single();
      setCertificate({ ...data, report } as CertificateData);
    } else {
      setCertificate(null);
    }
    setLoading(false);
  };

  const isActive = certificate?.status === 'active' &&
    (!certificate.expires_at || new Date(certificate.expires_at) > new Date());

  const ratingConfig = certificate ? RATING_CONFIG[certificate.rating as CertificationRating] : null;

  return (
    <>
      <SEOHead
        title="Verify SDG Certificate | DevMapper"
        description="Verify the authenticity of an SDG project certification issued through DevMapper's SPVF verification framework."
      />
      <div className="min-h-screen bg-background">
        <div className="container max-w-2xl mx-auto py-16 px-4 space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <Shield className="h-12 w-12 mx-auto text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Verify SDG Certificate</h1>
            <p className="text-muted-foreground">
              Enter a certificate number to verify its authenticity and view project impact details.
            </p>
          </div>

          {/* Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. DM-GOLD-M1ABC23"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && lookup(searchInput)}
                  className="font-mono"
                />
                <Button onClick={() => lookup(searchInput)} disabled={!searchInput.trim() || loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? 'Checking...' : 'Verify'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          {searched && !loading && (
            certificate ? (
              <Card className={`border-2 ${isActive ? 'border-primary' : 'border-destructive'}`}>
                <CardHeader className="text-center pb-2">
                  {isActive ? (
                    <CheckCircle2 className="h-16 w-16 mx-auto text-primary" />
                  ) : (
                    <XCircle className="h-16 w-16 mx-auto text-destructive" />
                  )}
                  <CardTitle className="text-xl mt-3">
                    {isActive ? 'Certificate Verified ✓' : 'Certificate Expired / Revoked'}
                  </CardTitle>
                  <CardDescription>
                    {isActive
                      ? 'This is an authentic SDG project certification issued by DevMapper.'
                      : 'This certificate is no longer active.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Separator />

                  {/* Rating badge */}
                  <div className="text-center">
                    {ratingConfig && (
                      <Badge
                        className="text-lg px-4 py-1"
                        style={{ backgroundColor: ratingConfig.color, color: '#fff' }}
                      >
                        {ratingConfig.label}
                      </Badge>
                    )}
                    {certificate.score?.total_sis != null && (
                      <p className="text-sm text-muted-foreground mt-2">
                        SDG Impact Score: <span className="font-bold">{certificate.score.total_sis}</span>/100
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Certificate Number</p>
                      <p className="font-mono font-semibold">{certificate.certificate_number}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <Badge variant={isActive ? 'default' : 'destructive'}>{certificate.status}</Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Issued</p>
                      <p className="font-medium">{new Date(certificate.issued_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expires</p>
                      <p className="font-medium">
                        {certificate.expires_at ? new Date(certificate.expires_at).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    {certificate.certification_body && (
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Certification Body</p>
                        <p className="font-medium">{certificate.certification_body}</p>
                      </div>
                    )}
                  </div>

                  {/* Project info */}
                  {certificate.report && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Project Details</p>
                        <p className="font-semibold">{certificate.report.title}</p>
                        <div className="flex gap-2 flex-wrap">
                          <Badge variant="outline">SDG {certificate.report.sdg_goal}</Badge>
                          {certificate.report.country_code && (
                            <Badge variant="outline">{certificate.report.country_code}</Badge>
                          )}
                          {certificate.report.location && (
                            <Badge variant="secondary">{certificate.report.location}</Badge>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />
                  <div className="text-center text-xs text-muted-foreground space-y-1">
                    <p>Verified under <strong>SDG-PVS 1000</strong> — DevMapper Standardized SDG Project Verification Framework</p>
                    <Link to="/spvf-standards" className="text-primary underline inline-flex items-center gap-1">
                      View SPVF Standards <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-destructive">
                <CardContent className="py-8 text-center">
                  <XCircle className="h-12 w-12 mx-auto text-destructive mb-3" />
                  <p className="font-semibold">Certificate Not Found</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No certification matches "{searchInput}". Please check the certificate number and try again.
                  </p>
                </CardContent>
              </Card>
            )
          )}

          {/* How it works */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4" />How SDG Certification Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>DevMapper issues SDG project certifications through the <strong>SPVF 7-stage verification process</strong>:</p>
              <ol className="list-decimal pl-5 space-y-1">
                <li>Project registration & SDG mapping</li>
                <li>Baseline verification</li>
                <li>Design validation</li>
                <li>Implementation verification</li>
                <li>Output verification</li>
                <li>Outcome & impact verification</li>
                <li>Certification & impact rating</li>
              </ol>
              <p className="pt-2">
                Projects achieving an <strong>SDG Impact Score ≥ 60</strong> receive a certification rating:
                Platinum (90+), Gold (80+), Silver (70+), or Bronze (60+).
              </p>
              <div className="flex gap-2 pt-2">
                <Link to="/spvf-standards">
                  <Button variant="outline" size="sm">View SPVF Standards</Button>
                </Link>
                <Link to="/pricing">
                  <Button variant="outline" size="sm">Certification Pricing</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default VerifyCertificate;

import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2, Leaf, XCircle } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";

/**
 * Public retirement certificate verification page - no auth required, by
 * design: this is the whole point of a retirement certificate (anyone
 * holding the certificate number/link can verify a claimed retirement),
 * matching how real registries (Verra, Gold Standard) publish retirement
 * certificates. Backed by retirement_certificates, a public-SELECT table
 * populated only by the SECURITY DEFINER retire_carbon_credit_order() RPC.
 */
export default function CertificateVerification() {
  const { certificateNumber } = useParams<{ certificateNumber: string }>();

  const { data: certificate, isLoading } = useQuery({
    queryKey: ["retirement-certificate", certificateNumber],
    queryFn: async () => {
      if (!certificateNumber) return null;
      const { data } = await supabase
        .from("retirement_certificates")
        .select("*")
        .eq("certificate_number", certificateNumber)
        .maybeSingle();
      return data;
    },
    enabled: !!certificateNumber,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <SEOHead title={`Retirement Certificate ${certificateNumber ?? ""}`} description="Verify a carbon credit retirement certificate" />

      {isLoading && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      )}

      {!isLoading && !certificate && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="w-5 h-5" />
              Certificate not found
            </CardTitle>
            <CardDescription>
              No retirement certificate matches "{certificateNumber}". Double-check the certificate number or link.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && certificate && (
        <Card className="border-primary/30">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Leaf className="w-7 h-7 text-primary" />
            </div>
            <CardTitle className="text-2xl">Carbon Credit Retirement Certificate</CardTitle>
            <Badge variant="default" className="mx-auto w-fit">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Certificate Number</p>
              <p className="text-lg font-mono font-semibold">{certificate.certificate_number}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
              <div>
                <p className="text-muted-foreground">Project</p>
                <p className="font-medium">{certificate.project_title}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Quantity Retired</p>
                <p className="font-medium">{Number(certificate.quantity).toLocaleString()} tCO2e</p>
              </div>
              {certificate.project_type && (
                <div>
                  <p className="text-muted-foreground">Project Type</p>
                  <p className="font-medium capitalize">{certificate.project_type.replace(/_/g, " ")}</p>
                </div>
              )}
              {certificate.methodology && (
                <div>
                  <p className="text-muted-foreground">Methodology</p>
                  <p className="font-medium">{certificate.methodology}</p>
                </div>
              )}
              {certificate.country_code && (
                <div>
                  <p className="text-muted-foreground">Country</p>
                  <p className="font-medium">{certificate.country_code}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Retired On</p>
                <p className="font-medium">{new Date(certificate.retired_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground border-t pt-4">
              This certificate confirms these carbon credits have been permanently retired on DevMapper Africa Hub and cannot be resold or reused.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

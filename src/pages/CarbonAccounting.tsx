import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, Recycle, Thermometer, Scale, DollarSign, BarChart3 } from "lucide-react";
import CarbonCalculator from "@/components/carbon/CarbonCalculator";
import ProductLifecycle from "@/components/carbon/ProductLifecycle";
import SupplyChainLogistics from "@/components/carbon/SupplyChainLogistics";
import ComplianceAssessment from "@/components/compliance/ComplianceAssessment";
import { useUserRole } from "@/contexts/UserRoleContext";

const CarbonAccounting = () => {
  const { currentRole } = useUserRole();

  const actorType = currentRole === "company_representative" ? "corporate" :
    currentRole === "ngo_member" ? "ngo" :
    currentRole === "government_official" ? "government" : "corporate";

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <SEOHead
        title="Carbon Accounting - DevMapper"
        description="GHG Protocol-aligned carbon accounting with transparent calculations, lifecycle assessment, and supply chain intelligence."
      />

      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Leaf className="h-7 w-7 text-primary" />
          Carbon Intelligence Suite
        </h1>
        <p className="text-muted-foreground mt-1">
          GHG Protocol-aligned accounting, lifecycle analysis, and compliance tracking
        </p>
      </div>

      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="calculator" className="gap-1">
            <BarChart3 className="h-3 w-3" />Calculator
          </TabsTrigger>
          <TabsTrigger value="lifecycle" className="gap-1">
            <Recycle className="h-3 w-3" />Product Lifecycle
          </TabsTrigger>
          <TabsTrigger value="logistics" className="gap-1">
            <Scale className="h-3 w-3" />Supply Chain
          </TabsTrigger>
          <TabsTrigger value="compliance" className="gap-1">
            <Thermometer className="h-3 w-3" />Compliance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculator">
          <CarbonCalculator />
        </TabsContent>

        <TabsContent value="lifecycle">
          <ProductLifecycle />
        </TabsContent>

        <TabsContent value="logistics">
          <SupplyChainLogistics />
        </TabsContent>

        <TabsContent value="compliance">
          <ComplianceAssessment actorType={actorType} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CarbonAccounting;

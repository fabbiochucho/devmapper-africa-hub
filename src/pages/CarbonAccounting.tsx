import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SEOHead } from "@/components/seo/SEOHead";
import CarbonCalculator from "@/components/carbon/CarbonCalculator";
import ProductLifecycle from "@/components/carbon/ProductLifecycle";
import SupplyChainLogistics from "@/components/carbon/SupplyChainLogistics";

const CarbonAccounting = () => {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <SEOHead
        title="Carbon Accounting - DevMapper"
        description="GHG Protocol-aligned carbon accounting with transparent calculations, lifecycle assessment, and supply chain intelligence."
      />

      <Tabs defaultValue="calculator" className="space-y-6">
        <TabsList className="flex-wrap">
          <TabsTrigger value="calculator">Carbon Calculator</TabsTrigger>
          <TabsTrigger value="lifecycle">Product Lifecycle</TabsTrigger>
          <TabsTrigger value="logistics">Supply Chain</TabsTrigger>
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
      </Tabs>
    </div>
  );
};

export default CarbonAccounting;

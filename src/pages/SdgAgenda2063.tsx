import SdgAgenda2063Alignment from "@/components/SdgAgenda2063Alignment";
import { SEOHead } from "@/components/seo/SEOHead";

export default function SdgAgenda2063() {
  return (
    <div className="container mx-auto py-8">
      <SEOHead
        title="SDG ↔ AU Agenda 2063 Alignment — Dev Mapper"
        description="Visualise how UN Sustainable Development Goals align with African Union Agenda 2063 aspirations across the continent."
        canonicalUrl="/sdg-agenda2063"
      />
      <SdgAgenda2063Alignment />
    </div>
  );
}

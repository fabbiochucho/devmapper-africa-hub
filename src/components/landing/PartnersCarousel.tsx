
import { useState, useEffect } from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";

interface Partner {
  id: string;
  name: string;
  logo_url: string;
  website_url?: string;
  display_order: number;
}

export default function PartnersCarousel() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || partners.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Our Partners</h2>
          <p className="text-gray-600">Working together to achieve sustainable development across Africa</p>
        </div>
        
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full max-w-6xl mx-auto"
        >
          <CarouselContent className="-ml-4">
            {partners.map((partner) => (
              <CarouselItem key={partner.id} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <div className="p-6 bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow duration-200">
                  {partner.website_url && partner.website_url !== '#' ? (
                    <a 
                      href={partner.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block group"
                    >
                      <div className="aspect-[2/1] flex items-center justify-center mb-4 bg-gray-50 rounded-lg overflow-hidden">
                        <img
                          src={partner.logo_url}
                          alt={partner.name}
                          className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 text-center group-hover:text-primary transition-colors">
                        {partner.name}
                      </h3>
                    </a>
                  ) : (
                    <div>
                      <div className="aspect-[2/1] flex items-center justify-center mb-4 bg-gray-50 rounded-lg overflow-hidden">
                        <img
                          src={partner.logo_url}
                          alt={partner.name}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 text-center">
                        {partner.name}
                      </h3>
                    </div>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </section>
  );
}

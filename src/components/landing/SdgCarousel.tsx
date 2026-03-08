import React from "react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { sdgGoals } from "@/lib/constants";
import Autoplay from "embla-carousel-autoplay";
import { Link } from "react-router-dom";

export default function SdgCarousel() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold text-foreground">Sustainable Development Goals</h2>
        <p className="text-sm text-muted-foreground">Track progress across all 17 UN SDGs</p>
      </div>
      <Carousel
        plugins={[Autoplay({ delay: 3000, stopOnInteraction: true })]}
        opts={{ align: "start", loop: true }}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {sdgGoals.map((sdg) => (
            <CarouselItem key={sdg.value} className="pl-2 basis-1/3 sm:basis-1/4 md:basis-1/5 lg:basis-[12.5%]">
              <Link
                to={`/sdg-overview?goal=${sdg.value}`}
                className="flex flex-col items-center gap-2 p-2 rounded-xl hover:bg-accent/50 transition-colors group"
              >
                <img
                  src={`/sdg-icons/sdg-${sdg.value}.jpg`}
                  alt={`SDG ${sdg.value}: ${sdg.title}`}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg shadow-md group-hover:scale-110 transition-transform object-cover"
                  loading="lazy"
                />
                <span className="text-xs text-center font-medium text-foreground leading-tight line-clamp-2 max-w-[80px]">
                  {sdg.title}
                </span>
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="-left-10" />
        <CarouselNext className="-right-10" />
      </Carousel>
    </div>
  );
}

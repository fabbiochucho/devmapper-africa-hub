
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { UserRole } from "@/contexts/UserRoleContext";
import { useTypewriter } from "@/hooks/useTypewriter";
import SdgIcon from "./SdgIcon";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { sdgGoalColors } from "@/lib/constants";

interface UserType {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  verified: boolean;
  organization?: string;
  country?: string;
}

interface HeroSectionProps {
  user: UserType | null;
  setShowAuthModal: (show: boolean) => void;
}

const sdgDetails = [
    { goal: "1", title: "No Poverty", description: "End poverty in all its forms everywhere." },
    { goal: "2", title: "Zero Hunger", description: "End hunger, achieve food security and improved nutrition and promote sustainable agriculture." },
    { goal: "3", title: "Good Health and Well-being", description: "Ensure healthy lives and promote well-being for all at all ages." },
    { goal: "4", title: "Quality Education", description: "Ensure inclusive and equitable quality education and promote lifelong learning opportunities for all." },
    { goal: "5", title: "Gender Equality", description: "Achieve gender equality and empower all women and girls." },
    { goal: "6", title: "Clean Water and Sanitation", description: "Ensure availability and sustainable management of water and sanitation for all." },
    { goal: "7", title: "Affordable and Clean Energy", description: "Ensure access to affordable, reliable, sustainable and modern energy for all." },
    { goal: "8", title: "Decent Work and Economic Growth", description: "Promote sustained, inclusive and sustainable economic growth, full and productive employment and decent work for all." },
    { goal: "9", title: "Industry, Innovation, and Infrastructure", description: "Build resilient infrastructure, promote inclusive and sustainable industrialization and foster innovation." },
    { goal: "10", title: "Reduced Inequalities", description: "Reduce inequality within and among countries." },
    { goal: "11", title: "Sustainable Cities and Communities", description: "Make cities and human settlements inclusive, safe, resilient and sustainable." },
    { goal: "12", title: "Responsible Consumption and Production", description: "Ensure sustainable consumption and production patterns." },
    { goal: "13", title: "Climate Action", description: "Take urgent action to combat climate change and its impacts." },
    { goal: "14", title: "Life Below Water", description: "Conserve and sustainably use the oceans, seas and marine resources for sustainable development." },
    { goal: "15", title: "Life on Land", description: "Protect, restore and promote sustainable use of terrestrial ecosystems, sustainably manage forests, combat desertification, and halt and reverse land degradation and halt biodiversity loss." },
    { goal: "16", title: "Peace, Justice and Strong Institutions", description: "Promote peaceful and inclusive societies for sustainable development, provide access to justice for all and build effective, accountable and inclusive institutions at all levels." },
    { goal: "17", title: "Partnerships for the Goals", description: "Strengthen the means of implementation and revitalize the global partnership for sustainable development." },
];

export default function HeroSection({ user, setShowAuthModal }: HeroSectionProps) {
  const titleText = "Track Sustainable Development Across Africa";
  const typingDuration = 30000; // 30 seconds
  const repeatInterval = 180000; // 3 minutes
  const typingSpeed = typingDuration / titleText.length;
  const repeatDelay = repeatInterval - typingDuration;

  const { displayText: typedTitle, isFinished: titleIsFinished } = useTypewriter(
    titleText,
    typingSpeed,
    repeatDelay > 0 ? repeatDelay : 0
  );
  
  const [api, setApi] = useState<CarouselApi>();
  const autoplayPlugin = useRef(
    Autoplay({ delay: 7000, stopOnInteraction: true, playOnInit: false })
  );
  const hasStartedCarousel = useRef(false);

  useEffect(() => {
    if (api && titleIsFinished && !hasStartedCarousel.current) {
      hasStartedCarousel.current = true;
      api.plugins().autoplay.play();
      setTimeout(() => api.scrollNext(), 100);
    }
  }, [api, titleIsFinished]);

  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 overflow-hidden">
      <Carousel setApi={setApi} plugins={[autoplayPlugin.current]} className="w-full">
        <CarouselContent>
          <CarouselItem>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in">
              <h2 className="text-4xl font-bold mb-4 min-h-[48px] md:min-h-[auto]">
                {typedTitle}
                {!titleIsFinished && <span className="inline-block animate-pulse w-1 h-9 bg-white ml-1"></span>}
              </h2>
              <p className="text-xl mb-8 max-w-3xl mx-auto">
                DevMapper empowers communities to report, verify, and track development projects aligned with the UN
                Sustainable Development Goals.
              </p>
              {!user && (
                <div className="space-x-4">
                  <Button
                    size="lg"
                    className="bg-white text-blue-600 hover:bg-gray-100"
                    onClick={() => setShowAuthModal(true)}
                  >
                    Get Started
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-blue-600"
                  >
                    Learn More
                  </Button>
                </div>
              )}
            </div>
          </CarouselItem>
          <CarouselItem>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in">
                <h3 className="text-3xl font-bold mb-6">The 17 Sustainable Development Goals</h3>
                <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-4 max-w-4xl mx-auto">
                    {sdgDetails.map(sdg => (
                        <div key={sdg.goal} className="flex flex-col items-center justify-center space-y-2">
                            <SdgIcon goal={sdg.goal} className="w-12 h-12 text-lg" />
                            <span className="text-xs text-center">{sdg.title}</span>
                        </div>
                    ))}
                </div>
            </div>
          </CarouselItem>
          {sdgDetails.map(sdg => (
            <CarouselItem key={sdg.goal}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center animate-fade-in flex flex-col items-center justify-center min-h-[320px]">
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-4xl shrink-0 mb-6"
                  style={{ backgroundColor: sdgGoalColors[sdg.goal as keyof typeof sdgGoalColors] }}
                >
                  {sdg.goal}
                </div>
                <h3 className="text-3xl font-bold mb-2">{sdg.title}</h3>
                <p className="text-lg max-w-2xl mx-auto">{sdg.description}</p>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}

import { Button } from "@/components/ui/button";
import { UserRole } from "@/contexts/UserRoleContext";
import { useTypewriter } from "@/hooks/useTypewriter";
import SdgCarousel from "./SdgCarousel";

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

export default function HeroSection({ user, setShowAuthModal }: HeroSectionProps) {
  const { displayText: typedTitle, isFinished: titleIsFinished } = useTypewriter(
    "Track Sustainable Development Across Africa",
    50
  );

  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
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
      {titleIsFinished && (
        <div className="mt-16 animate-fade-in">
          <SdgCarousel />
        </div>
      )}
    </section>
  );
}

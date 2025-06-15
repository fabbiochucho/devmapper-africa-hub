
import { Button } from "@/components/ui/button";
import { UserRole } from "@/contexts/UserRoleContext";

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
  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold mb-4">Track Sustainable Development Across Africa</h2>
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
    </section>
  );
}

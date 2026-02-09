import { useEffect } from "react";
import AuthModal from "@/components/AuthModal";
import { useUserRole } from "@/contexts/UserRoleContext";
import { useAuth } from "@/contexts/AuthContext";
import UnifiedDashboard from "@/components/UnifiedDashboard";
import { useState } from "react";

export default function Index() {
  const { user: authUser, loading } = useAuth();
  const { isAuthenticated, loading: roleLoading } = useUserRole();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && authUser) {
    return <UnifiedDashboard />;
  }

  // For non-authenticated users, show a landing view within the layout
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

  return (
    <div className="space-y-8">
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to Dev Mapper</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Africa's leading SDG tracking and impact measurement platform
        </p>
        <div className="flex justify-center gap-4">
          <a href="/auth" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
            Get Started
          </a>
          <a href="/about" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
            Learn More
          </a>
        </div>
      </div>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onAuthSuccess={handleAuthSuccess} 
      />
    </div>
  );
}

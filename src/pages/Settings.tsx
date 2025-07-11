
import UserProfile from "@/components/UserProfile";
import { useUserRole } from "@/contexts/UserRoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

const Settings = () => {
  const { setCurrentRole } = useUserRole();
  const { signOut, user, profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    setCurrentRole('citizen_reporter');
    navigate("/");
  };

  if (!user) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <LogIn className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">You're not signed in</h2>
            <p className="text-muted-foreground mb-6">Please sign in to view your profile and settings.</p>
            <Button asChild>
              <a href="/auth">Sign In</a>
            </Button>
        </div>
    )
  }

  // Convert user to MockUser format for UserProfile component
  const mockUser = {
    id: parseInt(user.id.slice(-6), 16),
    name: profile?.full_name || 'Anonymous',
    email: profile?.email || '',
    role: 'citizen_reporter' as any, // Default role
    verified: profile?.is_verified || false,
    organization: profile?.organization,
    country: profile?.country,
    password: '',
    createdAt: new Date().toISOString()
  };

  return (
    <div className="container mx-auto py-4 sm:py-8">
      <UserProfile user={mockUser} onLogout={handleLogout} />
    </div>
  );
};

export default Settings;

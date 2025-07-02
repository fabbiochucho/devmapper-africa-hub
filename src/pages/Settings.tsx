
import UserProfile from "@/components/UserProfile";
import { useUserRole } from "@/contexts/UserRoleContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

const Settings = () => {
  const { user, setCurrentRole } = useUserRole();
  const navigate = useNavigate();

  const handleLogout = () => {
    // This is a mock logout. In a real app, you would clear auth tokens.
    // For this demo, we reset to the default "Citizen Reporter" role.
    setCurrentRole('Citizen Reporter');
    toast.info("You have been logged out.");
    navigate("/");
  };

  if (!user) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <LogIn className="w-16 h-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold mb-2">You're not signed in</h2>
            <p className="text-muted-foreground mb-6">Please sign in to view your profile and settings.</p>
            {/* In a real app, a sign-in modal or redirect would be here. */}
        </div>
    )
  }

  return (
    <div className="container mx-auto py-4 sm:py-8">
      <UserProfile user={user} onLogout={handleLogout} />
    </div>
  );
};

export default Settings;

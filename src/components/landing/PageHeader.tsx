
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import NotificationSystem from "@/components/NotificationSystem";
import { UserRole } from "@/contexts/UserRoleContext";
import { Building, Globe, LogOut, Shield, Users, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface UserType {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  verified: boolean;
  organization?: string;
  country?: string;
}

interface PageHeaderProps {
  user: UserType | null;
  handleLogout: () => void;
  setShowAuthModal: (show: boolean) => void;
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case "Government Official":
      return <Shield className="w-4 h-4" />;
    case "Company Representative":
      return <Building className="w-4 h-4" />;
    case "NGO Member":
      return <Users className="w-4 h-4" />;
    default:
      return <Users className="w-4 h-4" />;
  }
};

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "Government Official":
      return "bg-blue-100 text-blue-800";
    case "Company Representative":
      return "bg-purple-100 text-purple-800";
    case "NGO Member":
      return "bg-green-100 text-green-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function PageHeader({ user, handleLogout, setShowAuthModal }: PageHeaderProps) {
  return (
    <header className="bg-card shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/06a46dda-ed52-44ed-8f8e-2edb1752ffa6.png" 
              alt="Dev Mapper Logo" 
              className="w-16 h-16 mr-4"
            />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dev Mapper</h1>
              <p className="text-sm text-muted-foreground font-medium">Africa SDG Tracker</p>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/contact">
                <MessageCircle className="w-4 h-4 mr-2" />
                Contact Us
              </Link>
            </Button>
            
            {user ? (
              <div className="flex items-center space-x-3">
                <NotificationSystem user={user} />
                <div className="flex items-center space-x-2">
                  {getRoleIcon(user.role)}
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">{user.name}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                  <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                  {user.verified && <Badge className="bg-green-100 text-green-800 text-xs">✓</Badge>}
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-1" />
                  Logout
                </Button>
              </div>
            ) : (
              <Button onClick={() => setShowAuthModal(true)}>Sign In</Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}


import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AuthModal from "@/components/AuthModal";
import { MapPin, Users, TrendingUp, Globe, Shield, Building, Plus, Search, LogOut, UserCheck, LayoutDashboard, Bell } from "lucide-react";
import { useUserRole, UserRole } from "@/contexts/UserRoleContext";
import { Link } from "react-router-dom";
import NotificationBell from "@/components/NotificationBell";

interface UserType {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  verified: boolean;
  organization?: string;
  country?: string;
}

export default function Index() {
  const [user, setUser] = useState<UserType | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { setRole } = useUserRole();

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setRole(parsedUser.role);
      } catch (error) {
        console.error("Error parsing user data:", error);
        handleLogout();
      }
    }
    setIsLoading(false);
  }, [setRole]);

  const handleAuthSuccess = (userData: UserType, token: string) => {
    setUser(userData);
    setRole(userData.role);
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    setUser(null);
    setRole("Citizen Reporter"); 
  };

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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading DevMapper...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Globe className="w-8 h-8 text-primary mr-3" />
              <div>
                <h1 className="text-xl font-bold text-foreground">DevMapper</h1>
                <p className="text-xs text-muted-foreground">Africa SDG Tracker</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-3">
                  <NotificationBell userId={user.id.toString()} />
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

      <main>
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

        <section className="py-12 bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">1,247</div>
                <div className="text-muted-foreground">Projects Tracked</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">12</div>
                <div className="text-muted-foreground">African Countries</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">$45.6M</div>
                <div className="text-muted-foreground">Total Investment</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">89%</div>
                <div className="text-muted-foreground">Verification Rate</div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold text-foreground mb-4">How DevMapper Works</h3>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Our platform connects communities, governments, and organizations to create transparency in development
                projects.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <MapPin className="w-12 h-12 text-blue-600 mb-4" />
                  <CardTitle>Report Projects</CardTitle>
                  <CardDescription>
                    Citizens can report development projects in their communities with location data and photos.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <Users className="w-12 h-12 text-green-600 mb-4" />
                  <CardTitle>Community Verification</CardTitle>
                  <CardDescription>
                    Multiple community members verify project details to ensure accuracy and prevent misinformation.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <TrendingUp className="w-12 h-12 text-purple-600 mb-4" />
                  <CardTitle>Track Progress</CardTitle>
                  <CardDescription>
                    Monitor project progress against SDG targets with real-time analytics and impact measurements.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {user && (
          <section className="py-16 bg-card">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">Welcome back, {user.name}!</h3>
                  <p className="text-muted-foreground">
                    Role: {user.role} {user.organization && `• ${user.organization}`}
                  </p>
                </div>
                <div className="flex space-x-3">
                  {["Government Official", "Country Admin"].includes(user.role) && (
                    <Button asChild>
                      <Link to="/government-dashboard">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    </Button>
                  )}
                  {["Platform Admin", "Country Admin"].includes(user.role) && (
                    <Button asChild variant="secondary">
                      <Link to="/user-management">
                        <UserCheck className="w-4 h-4 mr-2" />
                        User Management
                      </Link>
                    </Button>
                  )}
                  <Button asChild>
                    <Link to="/submit-report">
                      <Plus className="w-4 h-4 mr-2" />
                      Report Project
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/search">
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Projects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Water Well - Lagos</span>
                      <Badge variant="secondary">Verified</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">School Building - Nairobi</span>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Solar Panel - Accra</span>
                      <Badge variant="secondary">Verified</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Projects Reported</span>
                      <span className="font-semibold">12</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Verifications Made</span>
                      <span className="font-semibold">34</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Community Score</span>
                      <span className="font-semibold text-green-600">95%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">SDG Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Clean Water</span>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: "75%" }}></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Education</span>
                       <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: "60%" }}></div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Clean Energy</span>
                       <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-600 h-2 rounded-full" style={{ width: "45%" }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            </div>
          </section>
        )}
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Globe className="w-6 h-6 mr-2" />
                <span className="font-bold">DevMapper</span>
              </div>
              <p className="text-gray-400 text-sm">
                Empowering communities to track sustainable development across Africa.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Report Projects</li>
                <li>Verify Data</li>
                <li>Track Progress</li>
                <li>Analytics</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Community</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Guidelines</li>
                <li>Support</li>
                <li>Training</li>
                <li>Resources</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Telegram Bot</li>
                <li>Mobile App</li>
                <li>API Access</li>
                <li>Partnerships</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 DevMapper. Built for sustainable development in Africa.</p>
          </div>
        </div>
      </footer>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} onAuthSuccess={handleAuthSuccess} />
    </div>
  );
}

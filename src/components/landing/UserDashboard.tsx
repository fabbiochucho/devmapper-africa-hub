
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutDashboard, Plus, Search, Shield, UserCheck } from "lucide-react";
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

interface UserDashboardProps {
  user: UserType;
}

export default function UserDashboard({ user }: UserDashboardProps) {
  return (
    <section className="py-16 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-bold text-foreground">Welcome back, {user.name}!</h3>
            <p className="text-muted-foreground">
              Role: {user.role} {user.organization && `• ${user.organization}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {["Platform Admin", "Country Admin"].includes(user.role) && (
              <Button asChild>
                <Link to="/admin-dashboard">
                  <Shield className="w-4 h-4 mr-2" />
                  Admin Dashboard
                </Link>
              </Button>
            )}
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
  );
}

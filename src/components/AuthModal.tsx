
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Building, Shield, Users, AlertCircle, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { mockUsers } from "@/data/mockUsers";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any, token: string) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Login form state
  const [loginData, setLoginData] = useState({
    email: "citizen@demo.com", // Pre-fill for demo
    password: "password", // Pre-fill for demo
  });

  // Registration form state
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "citizen",
    organization: "",
    country: "",
    phone: "",
    document: "",
  });

  const handleDemoLogin = (userData: any) => {
    const { password, ...userToStore } = userData;
    const token = "demo-auth-token";
    onAuthSuccess(userToStore, token);
    onClose();
    setError(null);
    setLoginData({ email: "", password: "" });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // First, check if this is a demo account
    const demoUser = mockUsers.find(
      (u) => u.email.toLowerCase() === loginData.email.toLowerCase() && u.password === loginData.password
    );

    if (demoUser) {
      // Handle demo login
      setTimeout(() => {
        handleDemoLogin(demoUser);
        setIsLoading(false);
      }, 500); // Small delay to show loading state
      return;
    }

    // If not a demo account, try Supabase authentication
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) throw error;

      if (data.user && data.session) {
        onAuthSuccess(data.user, data.session.access_token);
        onClose();
        setLoginData({ email: "", password: "" });
        setError(null);
      } else {
        throw new Error("Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : "Login failed. Please check your credentials or try a demo account.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (registerData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            full_name: registerData.name,
            role: registerData.role,
            organization: registerData.organization,
            country: registerData.country,
            phone: registerData.phone,
            document: registerData.document,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      if (data.user) {
        setSuccess("Registration successful! Please check your email to confirm your account.");
        setRegisterData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "citizen",
          organization: "",
          country: "",
          phone: "",
          document: "",
        });
      } else {
        throw new Error("Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      setError(error instanceof Error ? error.message : "Registration failed. An account with this email may already exist.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (userType: string) => {
    const demoUsers = {
      citizen: mockUsers.find(u => u.role === "Citizen Reporter"),
      ngo: mockUsers.find(u => u.role === "NGO Member"),
      government: mockUsers.find(u => u.role === "Government Official"),
      corporate: mockUsers.find(u => u.role === "Company Representative"),
      admin: mockUsers.find(u => u.role === "Platform Admin"),
    };

    const selectedUser = demoUsers[userType as keyof typeof demoUsers];
    if (selectedUser) {
      setLoginData({
        email: selectedUser.email,
        password: selectedUser.password,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Welcome to DevMapper</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Demo Accounts */}
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">Try Demo Accounts (Click to auto-fill):</p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <Button variant="outline" size="sm" onClick={() => fillDemoCredentials("citizen")} className="text-xs">
                  👥 Citizen
                </Button>
                <Button variant="outline" size="sm" onClick={() => fillDemoCredentials("ngo")} className="text-xs">
                  🏢 NGO
                </Button>
                <Button variant="outline" size="sm" onClick={() => fillDemoCredentials("government")} className="text-xs">
                  🏛️ Government
                </Button>
                <Button variant="outline" size="sm" onClick={() => fillDemoCredentials("corporate")} className="text-xs">
                  🏭 Corporate
                </Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => fillDemoCredentials("admin")} className="text-xs w-full">
                🔧 Platform Admin
              </Button>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                All demo accounts use password: <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">password</code>
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div>
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) => setLoginData((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter your password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-green-600">{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <Label htmlFor="register-name">Full Name</Label>
                <Input
                  id="register-name"
                  value={registerData.name}
                  onChange={(e) => setRegisterData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="register-password">Password</Label>
                  <Input
                    id="register-password"
                    type="password"
                    value={registerData.password}
                    onChange={(e) => setRegisterData((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Password"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="register-confirm">Confirm</Label>
                  <Input
                    id="register-confirm"
                    type="password"
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="register-role">Role</Label>
                <Select
                  value={registerData.role}
                  onValueChange={(value) => setRegisterData((prev) => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="citizen">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <div>
                          <div>Citizen</div>
                          <div className="text-xs text-gray-500">Community member</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="ngo">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <div>
                          <div>NGO</div>
                          <div className="text-xs text-gray-500">Non-profit organization</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="government">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        <div>
                          <div>Government</div>
                          <div className="text-xs text-gray-500">Requires verification</div>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="corporate">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        <div>
                          <div>Corporate</div>
                          <div className="text-xs text-gray-500">Business entity</div>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(registerData.role === "ngo" ||
                registerData.role === "government" ||
                registerData.role === "corporate") && (
                <div>
                  <Label htmlFor="register-organization">Organization</Label>
                  <Input
                    id="register-organization"
                    value={registerData.organization}
                    onChange={(e) => setRegisterData((prev) => ({ ...prev, organization: e.target.value }))}
                    placeholder="Organization name"
                    required
                  />
                </div>
              )}

              <div>
                <Label htmlFor="register-country">Country</Label>
                <Select
                  value={registerData.country}
                  onValueChange={(value) => setRegisterData((prev) => ({ ...prev, country: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NGA">Nigeria</SelectItem>
                    <SelectItem value="KEN">Kenya</SelectItem>
                    <SelectItem value="ZAF">South Africa</SelectItem>
                    <SelectItem value="GHA">Ghana</SelectItem>
                    <SelectItem value="ETH">Ethiopia</SelectItem>
                    <SelectItem value="UGA">Uganda</SelectItem>
                    <SelectItem value="TZA">Tanzania</SelectItem>
                    <SelectItem value="RWA">Rwanda</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating account..." : "Create Account"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

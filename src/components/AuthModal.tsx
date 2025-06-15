
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { signInSchema, signUpSchema } from "@/lib/authSchema";
import { ALL_ROLES, UserRole } from "@/contexts/UserRoleContext";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { mockUsers } from "@/data/mockUsers";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (userData: any, token: string) => void;
}

type SignInFormValues = z.infer<typeof signInSchema>;
type SignUpFormValues = z.infer<typeof signUpSchema>;

const AuthModal = ({ isOpen, onClose, onAuthSuccess }: AuthModalProps) => {
  const [isSigningUp, setIsSigningUp] = useState(false);

  const signInForm = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", role: "Citizen Reporter" },
  });

  const handleSignIn = (values: SignInFormValues) => {
    const user = mockUsers.find(
      (u) => u.email.toLowerCase() === values.email.toLowerCase()
    );

    if (user && user.password === values.password) {
      const { password, ...userToStore } = user;
      const token = "fake-auth-token"; // This is still a mock token
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user", JSON.stringify(userToStore));
      onAuthSuccess(userToStore, token);
      toast.success("Signed in successfully!");
    } else {
      toast.error("Invalid email or password.");
      signInForm.setError("password", {
        type: "manual",
        message: "Invalid email or password",
      });
    }
  };

  const handleSignUp = (values: SignUpFormValues) => {
    // This is a mock authentication.
    const user = {
      id: 2,
      name: values.name,
      email: values.email,
      role: values.role,
      verified: false,
    };
    const token = "fake-auth-token-signup";
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user", JSON.stringify(user));
    onAuthSuccess(user, token);
    toast.success("Signed up successfully! Welcome!");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isSigningUp ? "Create an Account" : "Sign In"}</DialogTitle>
          <DialogDescription>
            {isSigningUp ? "Join DevMapper to start tracking projects." : "Access your DevMapper dashboard."}
          </DialogDescription>
        </DialogHeader>
        {isSigningUp ? (
          <Form {...signUpForm}>
            <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
              <FormField
                control={signUpForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signUpForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signUpForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signUpForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ALL_ROLES.map((role) => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                Sign Up
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...signInForm}>
            <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
              <FormField
                control={signInForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="your.email@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signInForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full">
                <LogIn className="mr-2 h-4 w-4" /> Sign In
              </Button>
            </form>
          </Form>
        )}
        <div className="mt-4 text-center text-sm">
          {isSigningUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => setIsSigningUp(!isSigningUp)} className="font-medium text-primary hover:underline">
            {isSigningUp ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;

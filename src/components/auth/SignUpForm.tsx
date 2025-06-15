
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { signUpSchema } from "@/lib/authSchema";
import { ALL_ROLES } from "@/contexts/UserRoleContext";
import { toast } from "sonner";
import { mockUsers, MockUser } from "@/data/mockUsers";

interface SignUpFormProps {
  onAuthSuccess: (userData: any, token: string) => void;
}

type SignUpFormValues = z.infer<typeof signUpSchema>;

const SignUpForm = ({ onAuthSuccess }: SignUpFormProps) => {
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", role: "Citizen Reporter" },
  });

  const handleSignUp = (values: SignUpFormValues) => {
    const existingUser = mockUsers.find(
      (u) => u.email.toLowerCase() === values.email.toLowerCase()
    );

    if (existingUser) {
      toast.error("User with this email already exists.");
      form.setError("email", {
        type: "manual",
        message: "User with this email already exists.",
      });
      return;
    }

    const newUser: MockUser = {
      id: mockUsers.length + 1,
      name: values.name,
      email: values.email,
      password: values.password, // Storing plain text for mock purposes
      role: values.role,
      verified: values.role === "Citizen Reporter", // Auto-verify citizens
      createdAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);

    const { password, ...userToStore } = newUser;
    const token = "fake-auth-token-signup";
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user", JSON.stringify(userToStore));
    onAuthSuccess(userToStore, token);
    toast.success(
      newUser.verified
        ? "Signed up successfully! Welcome!"
        : "Sign-up successful! Your account is pending verification."
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSignUp)} className="space-y-4">
        <FormField
          control={form.control}
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
          control={form.control}
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
          control={form.control}
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
          control={form.control}
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
  );
};

export default SignUpForm;


import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signInSchema } from "@/lib/authSchema";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { mockUsers } from "@/data/mockUsers";

interface SignInFormProps {
  onAuthSuccess: (userData: any, token: string) => void;
}

type SignInFormValues = z.infer<typeof signInSchema>;

const SignInForm = ({ onAuthSuccess }: SignInFormProps) => {
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleSignIn = (values: SignInFormValues) => {
    const user = mockUsers.find(
      (u) => u.email.toLowerCase() === values.email.toLowerCase()
    );

    if (user && user.password === values.password) {
      const { password, ...userToStore } = user;
      const token = "fake-auth-token";
      localStorage.setItem("auth_token", token);
      localStorage.setItem("user", JSON.stringify(userToStore));
      onAuthSuccess(userToStore, token);
      toast.success("Signed in successfully!");
    } else {
      toast.error("Invalid email or password.");
      form.setError("password", {
        type: "manual",
        message: "Invalid email or password",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSignIn)} className="space-y-4">
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
        <Button type="submit" className="w-full">
          <LogIn className="mr-2 h-4 w-4" /> Sign In
        </Button>
      </form>
    </Form>
  );
};

export default SignInForm;

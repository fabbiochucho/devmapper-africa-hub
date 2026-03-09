
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signInSchema } from "@/lib/authSchema";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { HCaptcha } from "./HCaptcha";

interface SignInFormProps {
  onAuthSuccess: () => void;
}

type SignInFormValues = z.infer<typeof signInSchema>;

const SignInForm = ({ onAuthSuccess }: SignInFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleSignIn = async (values: SignInFormValues) => {
    if (!captchaToken) {
      toast.error("Please complete the CAPTCHA verification");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
        options: {
          captchaToken,
        },
      });

      if (error) {
        toast.error(error.message);
        form.setError("password", {
          type: "manual",
          message: "Invalid credentials",
        });
        setCaptchaToken(null); // Reset captcha on error
      } else {
        toast.success("Signed in successfully!");
        onAuthSuccess();
      }
    } catch (error) {
      toast.error("An error occurred during sign in");
      setCaptchaToken(null); // Reset captcha on error
    } finally {
      setIsLoading(false);
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
        <div className="flex justify-center">
          <HCaptcha
            onVerify={(token) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken(null)}
            onError={() => {
              setCaptchaToken(null);
              toast.error("CAPTCHA verification failed. Please try again.");
            }}
          />
        </div>
        <Button type="submit" className="w-full" disabled={isLoading || !captchaToken}>
          <LogIn className="mr-2 h-4 w-4" /> {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </Form>
  );
};

export default SignInForm;


import { useState } from "react";
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
import { Turnstile, CAPTCHA_ENABLED } from "./Turnstile";

interface SignInFormProps {
  onAuthSuccess: () => void;
}

type SignInFormValues = z.infer<typeof signInSchema>;

const SignInForm = ({ onAuthSuccess }: SignInFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  // Turnstile tokens are single-use: get a fresh widget after every failed attempt.
  const resetCaptcha = () => { setCaptchaToken(null); setCaptchaKey((k) => k + 1); };
  
  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleSignIn = async (values: SignInFormValues) => {
    // Only require captcha if the site key is configured
    const captchaEnabled = CAPTCHA_ENABLED;
    if (captchaEnabled && !captchaToken) {
      toast.error("Please complete the CAPTCHA verification");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
        options: captchaToken ? { captchaToken } : undefined,
      });

      if (error) {
        toast.error(error.message);
        form.setError("password", {
          type: "manual",
          message: "Invalid credentials",
        });
        resetCaptcha();
      } else {
        toast.success("Signed in successfully!");
        onAuthSuccess();
      }
    } catch {
      toast.error("An error occurred during sign in");
      resetCaptcha();
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
        {CAPTCHA_ENABLED && (
          <div className="flex justify-center">
            <Turnstile
              key={captchaKey}
              onVerify={(token) => setCaptchaToken(token)}
              onExpire={() => setCaptchaToken(null)}
              onError={() => {
                setCaptchaToken(null);
                toast.error("CAPTCHA verification failed. Please try again.");
              }}
            />
          </div>
        )}
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isLoading || (CAPTCHA_ENABLED && !captchaToken)}
        >
          <LogIn className="mr-2 h-4 w-4" /> {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </Form>
  );
};

export default SignInForm;

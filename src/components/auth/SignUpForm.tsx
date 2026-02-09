
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { signUpSchema } from "@/lib/authSchema";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import RoleSelector from "./RoleSelector";
import type { UserRole } from "@/contexts/UserRoleContext";

interface SignUpFormProps {
  onAuthSuccess: () => void;
}

type SignUpFormValues = z.infer<typeof signUpSchema>;

const SignUpForm = ({ onAuthSuccess }: SignUpFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('citizen_reporter');
  
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { 
      name: "", 
      email: "", 
      password: "" 
    },
  });

  const watchedEmail = form.watch('email');

  const handleSignUp = async (values: SignUpFormValues) => {
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { error, data } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { full_name: values.name, selected_role: selectedRole }
        }
      });

      if (error) {
        toast.error(error.message);
        if (error.message.includes("already registered")) {
          form.setError("email", {
            type: "manual",
            message: "User with this email already exists.",
          });
        }
      } else {
        // Assign the selected role after sign-up
        if (data?.user) {
          setTimeout(async () => {
            try {
              await supabase.from('user_roles').insert([{
                user_id: data.user!.id,
                role: selectedRole,
                is_active: true
              }]);
            } catch (roleError) {
              console.error('Error assigning role:', roleError);
            }
          }, 1000);
        }
        toast.success("Check your email to confirm your account!");
        onAuthSuccess();
      }
    } catch (error) {
      toast.error("An error occurred during sign up");
    } finally {
      setIsLoading(false);
    }
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

        <RoleSelector 
          value={selectedRole} 
          onChange={setSelectedRole} 
          email={watchedEmail} 
        />
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Sign Up"}
        </Button>
      </form>
    </Form>
  );
};

export default SignUpForm;

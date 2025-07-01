
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { signUpSchema } from "@/lib/authSchema";
import { ALL_ROLES, UserRole } from "@/contexts/UserRoleContext";
import { toast } from "sonner";
import { mockUsers, MockUser } from "@/data/mockUsers";

interface SignUpFormProps {
  onAuthSuccess: (userData: any, token: string) => void;
}

const multiRoleSignUpSchema = signUpSchema.extend({
  roles: z.array(z.string()).min(1, "Please select at least one role"),
});

type SignUpFormValues = z.infer<typeof multiRoleSignUpSchema>;

const SignUpForm = ({ onAuthSuccess }: SignUpFormProps) => {
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(multiRoleSignUpSchema),
    defaultValues: { 
      name: "", 
      email: "", 
      password: "", 
      roles: ["Citizen Reporter"] 
    },
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
      password: values.password,
      role: values.roles[0] as UserRole, // Primary role
      verified: values.roles.includes("Citizen Reporter"),
      createdAt: new Date().toISOString(),
    };

    mockUsers.push(newUser);

    const { password, ...userToStore } = newUser;
    const token = "fake-auth-token-signup";
    localStorage.setItem("auth_token", token);
    localStorage.setItem("user", JSON.stringify(userToStore));
    onAuthSuccess(userToStore, token);
    toast.success("Sign-up successful! You can now access all your selected roles.");
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
          name="roles"
          render={() => (
            <FormItem>
              <FormLabel>Roles (Select all that apply)</FormLabel>
              <div className="grid grid-cols-1 gap-2">
                {ALL_ROLES.map((role) => (
                  <FormField
                    key={role}
                    control={form.control}
                    name="roles"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(role)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, role])
                                : field.onChange(field.value?.filter((value) => value !== role));
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          {role}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
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

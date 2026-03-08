
import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long." }),
});

export const signUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long." }).max(100),
  email: z.string().email({ message: "Invalid email address." }).max(255),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long." })
    .max(128, { message: "Password must be less than 128 characters." })
    .regex(/[a-z]/, { message: "Password must contain a lowercase letter." })
    .regex(/[A-Z]/, { message: "Password must contain an uppercase letter." })
    .regex(/\d/, { message: "Password must contain a number." }),
  role: z.enum(["Citizen Reporter", "NGO Member", "Government Official", "Company Representative"]).optional(),
});

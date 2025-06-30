
import * as z from "zod";

const changeMakerMemberSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.string().min(2, "Role must be at least 2 characters"),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  email: z.string().email("Invalid email address"),
  photo: z.any().optional(),
  socialMedia: z.object({
    linkedin: z.string().url().optional().or(z.literal("")),
    twitter: z.string().url().optional().or(z.literal("")),
    facebook: z.string().url().optional().or(z.literal("")),
  }).optional(),
});

export const changeMakerSchema = z.object({
  type: z.enum(['individual', 'group', 'ngo', 'corporate'], {
    required_error: "Please select a change maker type.",
  }),
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string().min(20, "Bio must be at least 20 characters"),
  description: z.string().min(50, "Description must be at least 50 characters"),
  sdg_goals: z.array(z.string()).min(1, "Please select at least one SDG goal"),
  location: z.string().min(3, "Location must be at least 3 characters"),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  photo: z.any().optional(),
  members: z.array(changeMakerMemberSchema).optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  socialMedia: z.object({
    linkedin: z.string().url().optional().or(z.literal("")),
    twitter: z.string().url().optional().or(z.literal("")),
    facebook: z.string().url().optional().or(z.literal("")),
    instagram: z.string().url().optional().or(z.literal("")),
  }).optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'group' && (!data.members || data.members.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Group change makers must have at least one member",
      path: ["members"],
    });
  }
});

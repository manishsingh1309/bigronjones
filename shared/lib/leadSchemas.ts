import { z } from "zod";

// Validates the lead-capture form on both sides.
// Frontend: zodResolver in react-hook-form.
// Backend: safeParse before touching the database.
export const LeadFormSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long"),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address"),

  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.replace(/\D/g, "").length >= 10,
      "Please enter a valid phone number"
    ),

  consent: z
    .boolean()
    .refine((val) => val === true, "You must agree to receive emails"),
});

export type LeadFormData = z.infer<typeof LeadFormSchema>;

// Optional fields the API accepts alongside the validated form payload.
export const LeadContextSchema = z.object({
  lead_magnet_slug: z.string().min(1),
  utm_source: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
  referrer_url: z.string().optional(),
});

export type LeadContext = z.infer<typeof LeadContextSchema>;

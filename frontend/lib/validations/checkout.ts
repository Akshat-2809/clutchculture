import { z } from "zod";
import { INDIAN_STATES } from "@/lib/indian-states";
import { normalizePhone } from "./auth";

export const checkoutSchema = z.object({
  email: z.string().trim().min(1, "Enter your email").pipe(z.email("Enter a valid email")),
  phone: z
    .string()
    .trim()
    .refine((v) => normalizePhone(v) !== null, "Enter a valid 10-digit mobile number"),
  fullName: z.string().trim().min(2, "Enter the recipient's name"),
  line1: z.string().trim().min(3, "Enter house / flat number and street"),
  line2: z.string().trim(),
  landmark: z.string().trim(),
  city: z.string().trim().min(2, "Enter your city"),
  state: z
    .string()
    .refine((v) => (INDIAN_STATES as readonly string[]).includes(v), "Select a state"),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit pincode"),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;

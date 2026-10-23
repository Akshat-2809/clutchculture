import { z } from "zod";

const email = z.string().trim().min(1, "Enter your email").pipe(z.email("Enter a valid email"));
const newPassword = z.string().min(8, "Use at least 8 characters");

// Indian mobile: optional +91 / 91 prefix, then 10 digits starting 6–9.
const INDIAN_MOBILE = /^(?:\+?91)?([6-9]\d{9})$/;

export function normalizePhone(value: string) {
  const match = value.replace(/[\s-]/g, "").match(INDIAN_MOBILE);
  return match ? `+91${match[1]}` : null;
}

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your name"),
    email,
    phone: z
      .string()
      .trim()
      .refine(
        (v) => v === "" || normalizePhone(v) !== null,
        "Enter a valid 10-digit mobile number",
      ),
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password: newPassword,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

export type LoginInput = z.input<typeof loginSchema>;
export type SignupInput = z.input<typeof signupSchema>;
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>;

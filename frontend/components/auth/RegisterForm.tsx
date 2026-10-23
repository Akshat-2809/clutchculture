"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { authErrorMessage, getNextParam } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { normalizePhone, signupSchema } from "@/lib/validations/auth";
import { PasswordStrength } from "./PasswordStrength";
import { SubmitButton } from "./SubmitButton";

// No email verification: requires "Confirm email" to be OFF in Supabase
// (Authentication → Sign In / Providers → Email), so signUp returns a session.
export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", phone: "", password: "", confirmPassword: "" },
  });
  const password = useWatch({ control, name: "password" });

  const onSubmit = handleSubmit(async ({ fullName, email, phone, password }) => {
    setError(null);
    const next = getNextParam();
    const { data, error } = await createClient().auth.signUp({
      email,
      password,
      options: {
        // Read by the handle_new_user DB trigger to fill the profile.
        data: { full_name: fullName, phone: phone ? normalizePhone(phone) : null },
      },
    });

    if (error) {
      setError(authErrorMessage(error));
      return;
    }
    if (!data.session) {
      // Only happens if "Confirm email" is switched back on in Supabase.
      setError("Account created, but we couldn't log you in. Please try logging in.");
      return;
    }
    router.replace(next);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && <Alert>{error}</Alert>}

      <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
        <Input
          id="fullName"
          autoComplete="name"
          invalid={!!errors.fullName}
          {...register("fullName")}
        />
      </FormField>

      <FormField label="Email" htmlFor="email" error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          invalid={!!errors.email}
          {...register("email")}
        />
      </FormField>

      <FormField label="Mobile number" htmlFor="phone" optional error={errors.phone?.message}>
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-base text-muted">
            +91
          </span>
          <Input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="98765 43210"
            className="pl-14"
            invalid={!!errors.phone}
            {...register("phone")}
          />
        </div>
      </FormField>

      <FormField label="Password" htmlFor="password" error={errors.password?.message}>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          invalid={!!errors.password}
          {...register("password")}
        />
        <PasswordStrength password={password} />
      </FormField>

      <FormField
        label="Confirm password"
        htmlFor="confirmPassword"
        error={errors.confirmPassword?.message}
      >
        <PasswordInput
          id="confirmPassword"
          autoComplete="new-password"
          invalid={!!errors.confirmPassword}
          {...register("confirmPassword")}
        />
      </FormField>

      <SubmitButton loading={isSubmitting}>Create account</SubmitButton>

      <p className="text-center text-xs text-muted">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="underline underline-offset-2">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </p>

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-ink underline underline-offset-2">
          Log in
        </Link>
      </p>
    </form>
  );
}

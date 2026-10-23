"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { authCallbackUrl, authErrorMessage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async ({ email }) => {
    setError(null);
    const { error } = await createClient().auth.resetPasswordForEmail(email, {
      redirectTo: authCallbackUrl("/reset-password"),
    });
    if (error) {
      setError(authErrorMessage(error));
      return;
    }
    setSentTo(email);
  });

  if (sentTo) {
    return (
      <div className="space-y-5 text-center">
        <Alert variant="success" className="text-left">
          If an account exists for <strong>{sentTo}</strong>, you&apos;ll get an email with a link
          to reset your password.
        </Alert>
        <Link href="/login" className="inline-block font-semibold underline underline-offset-2">
          Back to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && <Alert>{error}</Alert>}

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

      <Button type="submit" loading={isSubmitting} className="w-full">
        Send reset link
      </Button>

      <p className="text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-ink underline underline-offset-2">
          Log in
        </Link>
      </p>
    </form>
  );
}

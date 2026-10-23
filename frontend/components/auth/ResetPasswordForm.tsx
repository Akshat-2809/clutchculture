"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { authErrorMessage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema } from "@/lib/validations/auth";

// Reached via the emailed link → /auth/callback, which signs the user in first.
export function ResetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<{ message: string; expired?: boolean } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async ({ password }) => {
    setError(null);
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setError({
        message: "Your reset link has expired or was already used.",
        expired: true,
      });
      return;
    }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError({ message: authErrorMessage(error) });
      return;
    }
    router.replace("/account?password=updated");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && (
        <Alert>
          {error.message}{" "}
          {error.expired && (
            <Link href="/forgot-password" className="font-medium underline underline-offset-2">
              Request a new link
            </Link>
          )}
        </Alert>
      )}

      <FormField
        label="New password"
        htmlFor="password"
        error={errors.password?.message}
        hint="At least 8 characters."
      >
        <PasswordInput
          id="password"
          autoComplete="new-password"
          invalid={!!errors.password}
          {...register("password")}
        />
      </FormField>

      <FormField
        label="Confirm new password"
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

      <Button type="submit" loading={isSubmitting} className="w-full">
        Update password
      </Button>
    </form>
  );
}

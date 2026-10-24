"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { authErrorMessage, getNextParam } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { loginSchema } from "@/lib/validations/auth";
import { SubmitButton } from "./SubmitButton";

export function LoginForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(null);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    if (error) {
      setError(authErrorMessage(error));
      setShake(true);
      return;
    }
    // The navbar only checks the session on load; tell it about the new login.
    queryClient.invalidateQueries({ queryKey: ["me"] });
    router.replace(getNextParam());
    router.refresh();
  });

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      onAnimationEnd={() => setShake(false)}
      className={cn("space-y-5", shake && "animate-shake motion-reduce:animate-none")}
    >
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

      <FormField
        label="Password"
        htmlFor="password"
        error={errors.password?.message}
        action={
          <Link
            href="/forgot-password"
            className="text-sm text-muted underline-offset-2 hover:text-ink hover:underline"
          >
            Forgot password?
          </Link>
        }
      >
        <PasswordInput
          id="password"
          autoComplete="current-password"
          invalid={!!errors.password}
          {...register("password")}
        />
      </FormField>

      <SubmitButton loading={isSubmitting}>Log in</SubmitButton>

      <p className="text-center text-sm text-muted">
        New to Clutch Culture?{" "}
        <Link href="/register" className="font-semibold text-ink underline underline-offset-2">
          Create an account
        </Link>
      </p>
    </form>
  );
}

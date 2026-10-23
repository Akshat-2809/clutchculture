import type { Metadata } from "next";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeader
        title="Forgot password"
        subtitle="Enter your email and we'll send you a link to reset it."
      />
      <ForgotPasswordForm />
    </>
  );
}

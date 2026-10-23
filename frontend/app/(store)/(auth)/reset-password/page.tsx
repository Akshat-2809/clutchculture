import type { Metadata } from "next";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = { title: "Reset password", robots: { index: false } };

export default function ResetPasswordPage() {
  return (
    <>
      <AuthHeader title="New password" subtitle="Choose a new password for your account." />
      <ResetPasswordForm />
    </>
  );
}

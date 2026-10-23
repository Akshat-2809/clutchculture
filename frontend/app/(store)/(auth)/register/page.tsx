import type { Metadata } from "next";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <>
      <AuthHeader title="Join the garage" subtitle="It takes less than a minute." />
      <RegisterForm />
    </>
  );
}

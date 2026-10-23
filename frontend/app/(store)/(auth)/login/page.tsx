import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { LinkExpiredNotice } from "@/components/auth/LinkExpiredNotice";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <>
      <AuthHeader title="Welcome back" subtitle="Log in to get back to your garage." />
      <Suspense>
        <LinkExpiredNotice />
      </Suspense>
      <LoginForm />
    </>
  );
}

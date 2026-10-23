import { AuthPanel } from "@/components/auth/AuthPanel";

// Split layout: form on the left, brand panel on the right (desktop).
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-[calc(100svh-7.25rem)] lg:grid-cols-2">
      <section className="flex items-center justify-center px-4 py-12 sm:py-16">
        <div className="w-full max-w-sm animate-fade-up motion-reduce:animate-none">{children}</div>
      </section>
      <AuthPanel />
    </div>
  );
}

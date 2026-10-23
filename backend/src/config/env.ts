import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),

  // Comma-separated list, e.g. "http://localhost:3000,https://clutchculture.in"
  CORS_ORIGINS: z
    .string()
    .default("http://localhost:3000")
    .transform((v) =>
      v
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean),
    ),

  // Supabase Postgres. DATABASE_URL = transaction pooler (port 6543) for the app,
  // DIRECT_URL = session/direct connection (port 5432) for migrations.
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().optional(),

  SUPABASE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
  // Only needed if the project still signs JWTs with the legacy HS256 secret.
  SUPABASE_JWT_SECRET: z.string().optional(),

  // Required from Phase 4 (payments & orders).
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("Clutch Culture <orders@clutchculture.in>"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:\n", z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === "production";

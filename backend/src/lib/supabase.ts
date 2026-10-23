import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";

// Server-only admin client (storage uploads, auth admin). Never expose this key.
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const PRODUCT_IMAGES_BUCKET = "product-images";

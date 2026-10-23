-- Supabase-specific setup that Drizzle can't express in schema.ts.

-- 1. Create a profile row whenever someone signs up via Supabase Auth.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.phone
  );
  RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
--> statement-breakpoint
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
--> statement-breakpoint

-- 2. Enable RLS on every table with no policies. This blocks direct access through
-- Supabase's public REST API (anon/authenticated keys). The Express API connects
-- as the postgres role, which bypasses RLS, so all reads/writes go through it.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- 3. Public bucket for product images (public read; uploads only via the API's secret key).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO NOTHING;

-- Login is email-only; the optional phone number entered at signup is passed in
-- user metadata (supabase.auth.signUp({ options: { data: { full_name, phone } } })).
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
    NULLIF(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NULLIF(NEW.raw_user_meta_data ->> 'phone', ''), NEW.phone)
  );
  RETURN NEW;
END;
$$;

-- Like 0001: RLS on with no policies, so only the API's server connection can
-- read or write subscriber emails (not the browser's publishable key).
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

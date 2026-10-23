# Clutch Culture — Frontend

Next.js 16 (App Router) + Tailwind v4, deployed on Vercel. See `../ROADMAP.md`.

```bash
cp .env.example .env.local   # fill in Supabase keys
npm run dev                  # http://localhost:3000
```

- `proxy.ts` — refreshes the Supabase session, guards `/account` and `/admin`
- `lib/supabase/` — browser, server and proxy Supabase clients
- `lib/api.ts` — fetch wrapper for the Express API (`api("/me", { auth: true })`)
- `app/globals.css` — brand tokens (`@theme`)

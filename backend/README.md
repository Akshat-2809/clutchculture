# Clutch Culture — API

Express 5 + TypeScript + Drizzle (Supabase Postgres), deployed on Render. See `../ROADMAP.md`.

```bash
cp .env.example .env     # fill in Supabase keys
npm run db:migrate       # apply migrations to Supabase
npm run dev              # http://localhost:4000/health
```

| Script | |
|---|---|
| `npm run dev` | watch mode (tsx) |
| `npm run build` / `start` | compile to `dist/` and run (Render) |
| `npm run db:generate` | create a migration after editing `src/db/schema.ts` |
| `npm run db:migrate` | apply migrations (uses `DIRECT_URL`) |
| `npm run db:studio` | browse the DB |

- Auth: frontend sends the Supabase access token as `Authorization: Bearer <token>`; `requireAuth` verifies it via Supabase JWKS.
- Admin: `requireAdmin` checks `profiles.role` in the DB. Promote a user with
  `update profiles set role = 'admin' where email = '...';`
- Money is stored in paise (integers).
- Render: build `npm ci --include=dev && npm run build`, start `npm start`, health check `/health`.

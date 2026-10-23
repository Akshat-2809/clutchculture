# Clutch Culture — E-commerce Build Roadmap

## 1. Tech Stack

| Layer | Choice | Hosting |
|---|---|---|
| Frontend | Next.js 16 (App Router, Turbopack) + TypeScript + Tailwind CSS | Vercel → custom domain |
| Backend API | Node.js + Express + TypeScript | Render (Web Service) |
| Database | PostgreSQL | Supabase |
| ORM | Drizzle ORM (type-safe, migrations in repo) | — |
| Auth | Supabase Auth — email + password only (no social login); phone optional at signup | Supabase |
| File storage | Supabase Storage (product images) | Supabase |
| Payments | Razorpay (India, INR) — UPI, cards, netbanking, wallets | — |
| Emails | Resend (order confirmation, shipping, password reset) | — |
| State (client) | Zustand (cart), TanStack Query (server data) | — |
| Forms / validation | React Hook Form + Zod (schemas shared FE/BE) | — |

## 2. Client Priorities

The client's two biggest concerns are **(1) Products** and **(2) Payments & Orders**. These get the most build and testing time.

### Products — what "done" means
- Admin can add/edit/archive products without developer help (built in Phase 2, not left to the end)
- Variants per product (size, optionally color) with their own SKU, price override and stock count
- Multiple images per product with drag-to-reorder; auto-optimized on upload
- Live stock: "Only 2 left", "Sold out" per size; sold-out sizes can't be added to cart
- Draft / active / archived states so products can be prepared before launch drops
- Collections (e.g. new drop, bestsellers) managed by admin, with manual ordering
- Bulk import via CSV for initial catalog load
- Low-stock alerts on the admin dashboard

### Payments & Orders — what "done" means
- Razorpay Standard Checkout: backend creates a Razorpay order → frontend opens checkout → backend verifies signature
- Razorpay webhook (`payment.captured`, `payment.failed`, `refund.processed`) is the source of truth; signature-verified and idempotent (same event processed once)
- Totals always recalculated on the server; client-sent prices are ignored
- Stock reserved at order creation, committed on payment success, released on failure/timeout (no overselling)
- Every order has a human-readable number (e.g. `CC-10234`), full status history and timestamps
- Admin orders screen: search, filter by status/date, update status, add tracking number, cancel, trigger refund via Razorpay API
- Customer emails at each step: confirmed, shipped (with tracking), delivered, cancelled/refunded
- GST-ready invoice PDF per order
- Daily reconciliation check: paid orders in DB vs captured payments in Razorpay
- COD and shipping rules are designed as pluggable options (client to decide later), so adding them doesn't require reworking checkout

## 3. Architecture

```
 Browser
   │
   ▼
 Next.js (Vercel)  ──── Supabase Auth (login/signup, JWT issued)
   │  fetch + Bearer JWT
   ▼
 Express API (Render) ── verifies Supabase JWT, business logic
   │
   ├──► Supabase Postgres (via Drizzle)
   ├──► Supabase Storage (image uploads, admin only)
   ├──► Payment gateway (create order, verify webhook)
   └──► Resend (transactional email)
```

- Frontend never writes to the DB directly; all writes go through the API.
- Public catalog pages use Next.js server components + ISR for SEO and speed.
- Payment webhooks hit the Render API, which is the source of truth for order status.

## 4. Repository Structure

```
clutchculture/
├── ROADMAP.md
├── frontend/                      # Next.js app → Vercel (root dir: frontend)
│   ├── app/
│   │   ├── layout.tsx             # root layout: fonts, Navbar, Footer, providers
│   │   ├── page.tsx               # Home
│   │   ├── (shop)/
│   │   │   ├── shop/page.tsx              # all products + filters
│   │   │   ├── collections/[slug]/page.tsx
│   │   │   └── product/[slug]/page.tsx    # product detail
│   │   ├── cart/page.tsx
│   │   ├── checkout/page.tsx
│   │   ├── order/[orderNumber]/page.tsx   # success / status page
│   │   ├── (auth)/login/page.tsx
│   │   ├── (auth)/signup/page.tsx
│   │   ├── account/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx           # profile
│   │   │   ├── orders/page.tsx
│   │   │   └── addresses/page.tsx
│   │   ├── admin/                 # protected, role = admin
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx           # dashboard
│   │   │   ├── products/...
│   │   │   ├── orders/...
│   │   │   └── collections/...
│   │   ├── (legal)/about|contact|privacy|terms|shipping|returns/page.tsx
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── layout/   Navbar, Footer, MobileMenu, AnnouncementBar
│   │   ├── product/  ProductCard, ProductGrid, Gallery, SizeSelector, Filters
│   │   ├── cart/     CartDrawer, CartItem, CartSummary
│   │   ├── ui/       Button, Input, Modal, Badge, Skeleton, Toast
│   │   └── admin/
│   ├── lib/          api.ts, supabase.ts, utils.ts, formatPrice.ts (INR)
│   ├── store/        cart.ts (Zustand, persisted to localStorage)
│   ├── types/
│   ├── public/       logo, favicon, static assets
│   ├── app/globals.css            # Tailwind v4 @theme: brand colors, fonts from design
│   └── proxy.ts                   # Next 16 (replaces middleware.ts): session refresh, /account & /admin guards
│
└── backend/                       # Express API → Render (root dir: backend)
    ├── src/
    │   ├── index.ts               # app bootstrap
    │   ├── config/env.ts          # Zod-validated env vars
    │   ├── db/
    │   │   ├── schema.ts          # Drizzle tables
    │   │   ├── client.ts
    │   │   └── migrations/
    │   ├── middleware/  auth.ts, requireAdmin.ts, errorHandler.ts, rateLimit.ts
    │   ├── routes/      products, collections, cart, orders, payments, users, admin
    │   ├── services/    razorpay.ts, orders.ts, inventory.ts, email.ts, storage.ts, invoice.ts
    │   ├── jobs/        releaseExpiredReservations.ts, reconcilePayments.ts
    │   └── utils/
    ├── drizzle.config.ts
    └── package.json
```

## 5. Database Schema (first draft)

| Table | Key columns |
|---|---|
| `profiles` | id (= Supabase auth user id), full_name, phone, role (`customer`/`admin`), created_at |
| `addresses` | id, user_id, name, line1, line2, city, state, pincode, country, phone, is_default |
| `collections` | id, name, slug, description, image_url, sort_order, is_active |
| `products` | id, name, slug, description, base_price, compare_at_price, hsn_code, gst_rate, status (`draft`/`active`/`archived`), created_at, updated_at |
| `product_collections` | product_id, collection_id, sort_order |
| `product_images` | id, product_id, url, alt, sort_order |
| `product_variants` | id, product_id, sku (unique), size, color, price_override, stock_qty, reserved_qty, low_stock_threshold |
| `inventory_movements` | id, variant_id, change (+/-), reason (`order`/`cancel`/`restock`/`manual`), order_id, created_at — audit trail for every stock change |
| `cart_items` | user_id, variant_id, qty — logged-in users only (guest cart lives in localStorage, merged on login) |
| `orders` | id, order_number (`CC-10234`), user_id (nullable for guest), email, phone, status, payment_status, payment_method (`razorpay`/`cod` later), subtotal, shipping_fee, discount, tax, total (all in paise), coupon_id, shipping_address (jsonb), tracking_number, courier, reserved_until, created_at, updated_at |
| `order_items` | id, order_id, variant_id, product_name, sku, size, color, unit_price, qty (snapshotted at purchase) |
| `order_status_history` | id, order_id, from_status, to_status, note, changed_by, created_at |
| `payments` | id, order_id, razorpay_order_id, razorpay_payment_id, amount, status, method (upi/card/…), raw (jsonb), created_at |
| `refunds` | id, order_id, payment_id, razorpay_refund_id, amount, reason, status, created_at |
| `webhook_events` | id (Razorpay event id, unique), type, payload, processed_at — makes webhooks idempotent |
| `coupons` | id, code, type (`percent`/`flat`), value, min_order, max_uses, used_count, expires_at |
| `wishlist` | user_id, product_id |

All money stored as integers in **paise** (₹499 = 49900), matching Razorpay's API.

Order status flow: `pending_payment → confirmed → processing → shipped → delivered`, plus `cancelled`, `payment_failed`, `refunded`.
Every status change writes a row to `order_status_history`.
Enable Row Level Security on all tables; the API uses the service role key server-side only.

## 6. API Endpoints (v1)

```
Public
GET    /api/products?collection=&size=&sort=&page=
GET    /api/products/:slug
GET    /api/collections
GET    /api/collections/:slug
POST   /api/coupons/validate

Customer (Bearer JWT)
GET    /api/me                  PATCH /api/me
GET    /api/addresses           POST/PATCH/DELETE /api/addresses/:id
GET    /api/cart                PUT /api/cart  (sync)
POST   /api/orders              # validates cart, reserves stock, creates Razorpay order
GET    /api/orders              GET /api/orders/:orderNumber
GET    /api/orders/:orderNumber/invoice   # PDF
GET/POST/DELETE /api/wishlist

Payments
POST   /api/payments/verify     # checks razorpay_signature after checkout success
POST   /api/payments/webhook    # Razorpay → server, source of truth (raw body + signature check)

Admin (role = admin)
CRUD   /api/admin/products, /variants, /collections, /coupons
POST   /api/admin/products/import         # CSV bulk import
PATCH  /api/admin/variants/:id/stock      # restock / adjust (logged)
POST   /api/admin/uploads                 # image → Supabase Storage
GET    /api/admin/orders?status=&from=&to=&q=
GET    /api/admin/orders/:id
PATCH  /api/admin/orders/:id/status       # + tracking number, triggers email
POST   /api/admin/orders/:id/cancel       # releases stock
POST   /api/admin/orders/:id/refund       # full/partial via Razorpay API
GET    /api/admin/stats
```

## 7. Phased Roadmap

Products and Payments & Orders (the client's priorities) each get a dedicated phase that covers storefront, API **and** admin together, so they're fully usable and testable early instead of waiting on a final "admin" phase.

### Phase 0 — Setup (Days 1–2)
- [x] Scaffold `frontend/` (Next.js 16.4, Tailwind v4, TS) and `backend/` (Express 5 + TS, ESM)
- [x] ESLint + Prettier, tsconfig conventions
- [x] Supabase clients (browser/server/proxy), `proxy.ts` session refresh + route guard, API fetch wrapper
- [x] API skeleton: env validation, Supabase JWT auth, requireAdmin, error handler, rate limits, `/health`, `/api/me`
- [x] Drizzle schema (all tables) + migrations generated: `0000_init.sql`, `0001_supabase_setup.sql` (signup → profile trigger, RLS, `product-images` bucket)
- [x] `.env.example` files for both apps
- [x] Create Supabase project (Singapore, ap-southeast-1), fill `.env` files
- [x] Run migrations — verified: 17 tables, RLS on, signup trigger, bucket, ES256 auth end-to-end
- [ ] Create Razorpay account in **test mode**, get test keys
- [ ] Git init + GitHub → Vercel/Render preview deploys — *deferred, do when told*

### Phase 1 — Design System & Layout (Days 3–5) — *waiting on design*
- [ ] Extract brand tokens from design: colors, fonts, spacing, radii → `@theme` in `globals.css`
- [ ] Root layout: AnnouncementBar, Navbar (logo, links, search, cart, account), Footer
- [ ] Mobile menu, CartDrawer shell
- [ ] UI primitives: Button, Input, Badge, Modal, Skeleton, Toast
- [ ] Static pages: Home (hero, featured collections, new arrivals), About, Contact, policies

### Phase 2 — Products ★ priority (Days 6–11)
Backend
- [ ] Products, variants, images, collections API with filters, sort, pagination
- [ ] Inventory service: stock checks, `inventory_movements` log on every change
- [ ] Image upload to Supabase Storage (resize/compress), CSV bulk import
- [ ] Seed script with sample products

Admin
- [ ] Role-protected `/admin` (proxy.ts guard + API `requireAdmin`)
- [ ] Product list (search, status filter), create/edit form with variants table and image drag-reorder
- [ ] Draft/active/archived toggle, collections management with manual ordering
- [ ] Stock adjust screen + low-stock list

Storefront
- [ ] Shop page with filters (size, collection, price), sort
- [ ] Product detail: gallery, size selector, per-size stock state ("Only 2 left" / "Sold out"), add to cart
- [ ] Search (Postgres full-text to start)
- [ ] SEO: metadata, Open Graph, sitemap.xml, robots.txt, JSON-LD product schema

✅ Exit check: client can add a real product with sizes and photos from admin and see it live on the shop.

### Phase 3 — Cart & Auth (Days 12–14)
- [ ] Zustand cart (guest, persisted) + CartDrawer + Cart page, stock re-validated on open
- [x] Supabase Auth pages: /login, /signup (name, email, password, optional phone), /forgot-password, /reset-password, /auth/callback, email verification + resend
- [ ] API auth middleware (verify Supabase JWT), `profiles` row on signup
- [ ] Merge guest cart into user cart on login
- [ ] Account: profile, addresses (Indian format, pincode validation), wishlist

### Phase 4 — Payments & Orders ★ priority (Days 15–22)
Checkout & payment
- [ ] Checkout page: contact, address, coupon, order summary (shipping fee = placeholder until client decides)
- [ ] `POST /orders`: recalc prices server-side, reserve stock in a DB transaction, create Razorpay order
- [ ] Razorpay Checkout (UPI, cards, netbanking, wallets) on frontend
- [ ] `/payments/verify`: HMAC signature check → mark confirmed
- [ ] Webhook: signature check, idempotency via `webhook_events`, handles captured/failed/refunded
- [ ] Reservation expiry job (e.g. 15 min) releases stock for abandoned payments
- [ ] Edge cases: user closes tab after paying, double-click submit, payment succeeds but verify call fails

Orders
- [ ] Order confirmation page + emails (confirmed, shipped, delivered, cancelled, refunded)
- [ ] Customer: order history, order detail with status timeline, invoice PDF download
- [ ] Admin: orders list with filters/search, order detail, status update + tracking number, cancel (restocks), refund via Razorpay API
- [ ] GST-ready invoice generation
- [ ] Daily reconciliation job: DB vs Razorpay payments, flag mismatches
- [ ] Keep payment method pluggable so COD can be added later without rework

✅ Exit check: full test-mode run of every scenario — success, failure, abandon, refund, cancel — with stock counts correct after each.

### Phase 5 — Admin Dashboard & Extras (Days 23–24)
- [ ] Dashboard: today's revenue, orders by status, top products, low-stock alerts
- [ ] Coupons management
- [ ] Shipping rules + COD (once client decides)

### Phase 6 — Polish, QA & Launch (Days 25–30)
- [ ] Loading/empty/error states, 404 page, accessibility pass
- [ ] Image optimization (`next/image`, Supabase image transforms)
- [ ] Lighthouse ≥ 90 on mobile, Core Web Vitals check
- [ ] Rate limiting, Helmet, CORS locked to production domain
- [ ] Analytics (Vercel Analytics / GA4 / Meta Pixel as client wants)
- [ ] Razorpay KYC/activation done by client, switch to live keys, one real ₹1 test order + refund
- [ ] Connect custom domain on Vercel, `api.` subdomain on Render, SSL
- [ ] Supabase backups enabled, uptime monitor on API (Render free tier sleeps — use paid tier for prod)

### Post-launch (later)
- Reviews & ratings, size guide, shipping partner integration (Shiprocket/Delhivery), abandoned cart emails, newsletter, Instagram feed, returns flow.

## 8. Environment Variables

Full templates with comments: `frontend/.env.example` and `backend/.env.example`.

**frontend/.env.local**
```
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # sb_publishable_...
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

**backend/.env**
```
PORT=4000
CORS_ORIGINS=                       # comma-separated
DATABASE_URL=                       # Supabase transaction pooler (6543)
DIRECT_URL=                         # session pooler (5432), for migrations
SUPABASE_URL=
SUPABASE_SECRET_KEY=                # sb_secret_...
SUPABASE_JWT_SECRET=                # only for legacy HS256 projects
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
```

## 9. Deployment

| Service | Config |
|---|---|
| Vercel | Root dir `frontend`, framework Next.js, env vars per environment, domain `clutchculture.<tld>` + `www` redirect |
| Render | Root dir `backend`, build `npm ci --include=dev && npm run build`, start `node dist/index.js`, health check `/health`, custom domain `api.clutchculture.<tld>` |
| Supabase | Production project separate from dev project; migrations run from CI or manually via Drizzle |

## 10. Open Questions for Client

**Decided**
- Market: India, INR, Razorpay (likely — confirm before Phase 4)
- Design: provided by client, build follows it

**Pending — client to decide later (built as pluggable)**
- Shipping rules — flat rate, free above ₹X, by pincode, courier partner?
- Cash on Delivery — yes/no, any extra fee or order limit?

**Still to ask**
1. Product variants — sizes only, or size + color? Size chart per product?
2. Guest checkout allowed, or login required?
3. GST registration number + business details (needed on invoices and for Razorpay KYC)
4. Return/exchange policy — window, who pays return shipping?
5. Expected catalog size at launch (decides if CSV import is needed day one)
6. Domain registrar and email (for Resend sender domain DNS)
7. Brand assets: logo files, fonts, product photos, copy for policy pages

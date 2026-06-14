# Luxe Moon — Premium Korean Haircare E-Commerce Platform

A full-stack e-commerce platform for **Luxe Moon**, a premium Korean haircare brand serving Nepal and global markets. Built with Next.js 15 (App Router), Prisma ORM, Supabase PostgreSQL, and deployed on AWS Amplify with SSR.

---

## 🌐 Live URLs

| Environment | URL |
|-------------|-----|
| Production (AWS Amplify) | `https://aws-amplify.d226t1rmntoblu.amplifyapp.com` |
| Staging / Development | `http://localhost:3000` |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, SSR) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Database ORM | Prisma 6 |
| Database | Supabase (PostgreSQL) |
| Auth | JWT via `jose` + HTTP-only cookies |
| Image Storage | Cloudinary |
| Email | Resend |
| Rich Text | Tiptap v3 |
| Animations | Framer Motion 12 |
| Deployment | AWS Amplify (WEB_COMPUTE / SSR) |
| CI/CD | GitHub → Amplify auto-build on push |

---

## 📁 Project Structure

```
Luxemoon/
├── app/
│   ├── admin/               # Admin panel (orders, products, settings, etc.)
│   │   ├── layout.tsx       # Admin sidebar + auth guard (client component)
│   │   ├── page.tsx         # Order dashboard with stats
│   │   ├── AdminOrderTable.tsx  # Client-side order management table
│   │   ├── actions.ts       # All admin server actions (CRUD + auth guard)
│   │   ├── products/        # Product management (list, create, edit)
│   │   ├── settings/        # Store settings (tabbed UI, rich text editors)
│   │   ├── homepage/        # Homepage content management
│   │   ├── reviews/         # Review moderation
│   │   ├── orders/          # Order detail + manual order creation
│   │   ├── categories/      # Category management
│   │   ├── coupons/         # Promo code management
│   │   ├── customers/       # Customer blacklist
│   │   ├── users/           # Registered user management
│   │   ├── messages/        # Contact form messages
│   │   └── transformations/ # Before/after product results
│   ├── api/
│   │   ├── orders/          # POST: create order (public, rate-limited)
│   │   ├── reviews/         # POST: submit review (authenticated users)
│   │   ├── products/        # GET: product listing
│   │   ├── settings/        # GET: public site config
│   │   ├── auth/            # Admin + user auth endpoints
│   │   ├── upload/          # Cloudinary image upload
│   │   ├── admin/           # Admin-only API routes (order details, etc.)
│   │   └── user/            # User profile API
│   ├── (storefront)/        # Public pages (home, shop, product, checkout)
│   └── layout.tsx           # Root layout with Providers + Navbar
├── components/
│   ├── admin/               # Admin-specific components (ImageUpload, etc.)
│   ├── checkout/            # Checkout flow components
│   ├── products/            # Product detail components
│   ├── ui/                  # Shared UI (ConfirmModal, etc.)
│   ├── Providers.tsx        # Cart, Config, i18n, Location contexts
│   ├── Navbar.tsx           # Storefront navigation
│   └── HeroSlider.tsx       # Homepage hero carousel
├── lib/
│   ├── prisma.ts            # Prisma client singleton
│   ├── auth.ts              # Session management (server-side)
│   ├── auth-edge.ts         # JWT encrypt/decrypt (edge-compatible)
│   ├── settings-server.ts   # Site config with unstable_cache
│   ├── notifications.ts     # Email/SMS notification helpers
│   ├── i18n.ts              # Internationalization (EN/NP)
│   └── currency.ts          # Currency conversion (USD ↔ NPR)
├── prisma/
│   └── schema.prisma        # Full database schema
├── middleware.ts             # Edge middleware (admin + user auth)
├── next.config.ts           # Next.js config (standalone, image domains)
└── amplify.yml              # AWS Amplify build configuration
```

---

## ⚙️ Environment Variables

Set these in your `.env` file locally or in the **AWS Amplify Console → Environment Variables**:

```env
# Database (use Supabase connection POOLER for serverless)
DATABASE_URL=postgresql://postgres.XXXXX:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:PASSWORD@db.XXXXX.supabase.co:5432/postgres?sslmode=require

# Auth
JWT_SECRET=<64-char hex string>

# Admin credentials
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<strong-password>

# Cloudinary (image hosting)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

# Email notifications (optional)
RESEND_API_KEY=re_xxxxxxxxxxxx
```

> ⚠️ **IMPORTANT**: The `DATABASE_URL` must use the **Supabase connection pooler** (port 6543, `pgbouncer=true`) for AWS Amplify Lambda. Using the direct connection (port 5432) will fail because Lambda cannot maintain persistent connections.

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- npm 10+
- PostgreSQL (via Supabase)
- Cloudinary account

### Local Development

```bash
# Install dependencies
npm install

# Push database schema
npx prisma db push

# Seed database with sample data (optional)
npm run seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Admin panel: [http://localhost:3000/admin](http://localhost:3000/admin)

### Production Build

```bash
npm run build
npm start
```

---

## 🗄️ Database Schema

Key models:

| Model | Description |
|-------|-------------|
| `Product` | Products with pricing, discounts, images, SEO |
| `Order` | Customer orders with items, status, delivery info |
| `OrderItem` | Individual line items linked to orders and products |
| `Review` | Product reviews (moderated, verified purchase support) |
| `Coupon` | Promo codes with usage limits and product restrictions |
| `SiteConfig` | Store-wide settings (delivery, currency, notifications) |
| `HomepageContent` | Hero slides, banners, community reviews |
| `Category` | Product categories with archiving support |
| `User` | Registered customer accounts |
| `BlockedCustomer` | Phone number blacklist for fraud prevention |
| `ContactMessage` | Customer contact form submissions |
| `Transformation` | Before/after product result images |
| `NotificationLog` | SMS/email notification audit trail |

---

## 🔐 Authentication

### Admin
- Session stored in `session` HTTP-only cookie (JWT signed with `JWT_SECRET`)
- Protected by **edge middleware** (`middleware.ts`)
- All server actions call `verifyAdmin()` which decrypts the session
- Admin credentials set via `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars

### Users (Customers)
- Session stored in `user-session` HTTP-only cookie (JWT, 24h expiry)
- Protected paths: `/account/**`
- Guest checkout still works without login

---

## 🛒 Order Flow

1. Customer adds to cart (localStorage via `Providers.tsx`)
2. Checkout form validates with Zod
3. `POST /api/orders` — rate limited (5/min per IP), honeypot bot check, blacklist check, idempotency key
4. Prisma transaction: stock decrement → order create
5. Email notification sent via Resend (async, non-blocking)
6. Admin sees order in dashboard, changes status, customer notified

---

## 🚢 Deployment (AWS Amplify)

### Branch Strategy
- `aws-amplify` — production branch (auto-deploys on push)
- `main` / `prod` — source branches

### Build Configuration (`amplify.yml`)
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - nvm install 20 && nvm use 20
        - npm install
        - npx prisma generate
    build:
      commands:
        - export NODE_OPTIONS="--max-old-space-size=8192"
        - printenv | grep -E '^(DATABASE_URL|...)=' > .env.production
        - npm run build
        - cp .env.production .next/standalone/.env
  artifacts:
    baseDirectory: .next
```

### Key Deployment Notes
- Uses **WEB_COMPUTE** (SSR) mode, not static
- Prisma binary targets include `linux-arm64-openssl-3.0.x` for Amplify Lambda
- **Must use Supabase connection pooler** in `DATABASE_URL` (not direct connection)
- Env vars are written to `.env.production` during build to persist into Lambda runtime

---

## 🌍 Internationalisation

Supports **English** and **Nepali** via `lib/i18n.ts`. Toggle controlled via `SiteConfig.languageToggleEnabled`. Locale stored in a cookie (`lm_locale`).

---

## 💰 Currency

Supports **USD** and **NPR** (Nepali Rupee). Conversion rate configurable in Admin → Settings → Brand. Changing currency automatically converts all product and delivery prices.

---

## 📊 Admin Panel

Access at `/admin/login` with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

| Section | Features |
|---------|----------|
| **Orders** | View, filter, paginate, update status, track payment, view details |
| **Products** | Create, edit, archive, manage images, SEO, discounts |
| **Categories** | Create/edit/archive categories |
| **Promo Codes** | Create coupons with usage limits, date ranges, product restrictions |
| **Reviews** | Approve/reject/hide, toggle verified purchase, featured status |
| **Homepage** | Hero slides, banners, promotional images, community reviews, notice bar |
| **Settings** | Store name, logo, SEO, delivery charges, currency, notifications |
| **Results** | Before/after transformation images linked to products |
| **Blacklist** | Block customers by phone number |
| **Users** | View registered customer accounts |
| **Messages** | Contact form submissions with resolve/delete |

---

## 🔧 Known Issues & Roadmap

See the [Audit Report](./AUDIT.md) for the complete list. Immediate priorities:

- [ ] Add brute-force protection on `/admin/login`
- [ ] Add DB indexes on `order.ipAddress`, `order.status`, `order.createdAt`
- [ ] Fix admin products category filter (currently uses hardcoded strings instead of DB)
- [ ] Implement actual SMS/email resend in `resendNotification` action
- [ ] Server-side pagination for admin order dashboard (currently client-side on 100 fetched orders)

---

## 📝 License

Private — All rights reserved. Luxe Moon © 2026.

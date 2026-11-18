# Master Prompt: Production-Ready C2C E-Commerce Marketplace (PWA)

> **Context & Source of Truth:** Aligned 100% with `PRD.md` (e-commerce v1.0, dated 2026-11-17).  
> Build a distinctive, production-grade, chat-first C2C e-commerce platform built as a high-performance PWA with manual payment verification and visual media reviews.

---

## 1. Product Direction & Persona
- **Product Vision:** A contemporary C2C marketplace prioritizing personal interaction (chat-first commerce) to maximize buyer trust, conversion, and social commerce interactions.
- **Target Audience:** Gen-Z & Millennials (ages 18–35) who value mobile agility, personal chat inquiry, and visual product authenticity over generic star ratings.
- **Branding:** Use a temporary, modular, easily replaceable brand identity (e.g. `Vellum C2C` or `Sora Market`) managed strictly via a single configuration file (`src/config/site.ts`). Do not hardcode permanent brand strings across components.

---

## 2. Design System & Visual Direction (Contemporary Editorial Marketplace)
- **Aesthetic:** Minimalist-Modern & Contemporary Editorial. Premium typography, intentional whitespace, structured editorial grids, and tactile micro-interactions. No generic AI templates, excessive gradients, or unnecessary glassmorphism.
- **Design Tokens:**
  - **Colors:** Base: Slate (`slate-900` text/contrast, `slate-100`/`slate-50` subtle backgrounds), Primary/Action: Indigo (`indigo-600` primary, `indigo-700` hover, `indigo-50` tints), Canvas: Pure White (`#ffffff`).
  - **Typography:** Inter (Sans-serif) with clear hierarchical weights (Regular 400, Medium 500, Semibold 600, Bold 700).
  - **Grid & Spacing:** Strict 4px grid system (`gap-2`, `gap-4`, `p-6`, etc.).
- **Responsive Layout:**
  - **Mobile (PWA):** Mobile-first single column, sticky bottom navigation bar (Home, Explore/Search, Chat, Orders, Profile/Dashboard), fluid touch targets (min 44px).
  - **Desktop:** Editorial wide multi-column product grids, persistent top navigation, and sidebar navigation for the Seller Dashboard.
  - **Animations:** Subtle Framer Motion transitions (page enter/exit, sheet slide-overs, drawer menus, chat message delivery).

---

## 3. Strict Scope & Boundaries

### ✅ In-Scope (Must-Have Core Features):
1. **FR-01: Chat-to-Checkout**
   - Direct buyer-seller real-time chat with product context.
   - Starting a chat from a product page automatically attaches the interactive Product Card link into the message thread.
   - Actionable "Create Order" trigger inside the chat bubble, pre-filling product details, seller ID, price, and selected quantity.
2. **FR-02: Review Media**
   - Media-based customer reviews (photos and short videos uploaded by verified buyers) proving genuine product delivery.
   - Text commentary attached to media.
   - Visual community showcase instead of generic numeric/star ratings.
3. **FR-03: Dashboard Monetisasi (Seller Dashboard)**
   - Product catalog & stock inventory management.
   - Order pipeline tracking (Pending, Payment Uploaded, Verified, Rejected, Cancelled).
   - Modal/drawer to inspect uploaded payment proofs and execute manual **Verify (Approve)** or **Reject**.
   - Sales analytics, revenue tracking, transaction volume, and commission/monetization breakdown.
4. **FR-04: Real-time Status**
   - Real-time online/offline presence indicator for sellers powered by Supabase Realtime Presence.
   - Dynamic badge ("Active Now" / "Last seen recently") on product pages and chat headers.
5. **FR-05: Guest & Member Checkout**
   - 3-Step Checkout flow: 1. Customer Details -> 2. Shipping Address -> 3. Manual Payment & Proof Upload.
   - Support for both Guest (unregistered instant checkout) and Member (logged-in with saved profiles and order histories).

### ❌ Strict Out-of-Scope (DO NOT Implement):
- **Automated Payment Gateways:** Strictly NO Midtrans, Stripe, PayPal, or automated virtual accounts. All payments are manual bank transfer / e-wallet QRIS with manual proof upload and seller verification.
- **Star / Numeric Ratings:** Strictly NO 1–5 star rating components. Product feedback is handled purely through **Media Reviews (FR-02)**.
- **Wishlist / Bookmarks:** Excluded (marked for future roadmap).

---

## 4. User Roles & Permission Matrix (Strict Enforcement)

| Capability / Action | Guest | Member | Seller |
| :--- | :---: | :---: | :---: |
| Browse Products & Search | ✅ Yes | ✅ Yes | ✅ Yes |
| Initiate & Participate in Real-Time Chat | ❌ No (Prompt Login) | ✅ Yes | ✅ Yes |
| Direct 3-Step Checkout | ✅ Yes | ✅ Yes | ✅ Yes |
| Upload Payment Proof | ✅ Yes (via secure token/order ID) | ✅ Yes | ✅ Yes |
| Verify / Reject Payment Proofs | ❌ No | ❌ No | ✅ Yes (own orders only) |
| Manage Products & View Dashboard | ❌ No | ❌ No | ✅ Yes |

*Enforce all permissions through Supabase Row Level Security (RLS) and server-side route guards. Never rely solely on client-side UI hiding.*

---

## 5. Technology Stack & Architecture

- **Frontend Framework:** Next.js 14 (App Router), React 18, TypeScript (Strict Mode).
- **Styling & UI:** Tailwind CSS, Framer Motion, Lucide React icons, Radix UI primitives.
- **Data Fetching & Client Cache:** SWR for reactive data fetching and optimistic UI updates.
- **Backend & Database:** Supabase:
  - **PostgreSQL:** Relational database with strict Row Level Security (RLS) on all tables.
  - **Supabase Auth:** HttpOnly secure cookies / JWT.
  - **Supabase Realtime:** WebSocket-based messaging and presence tracking.
  - **Supabase Storage / S3:** Secure buckets for product images, payment receipts, and review media with signed URLs and MIME validation.
- **Rate Limiting & Security:** Upstash Redis / Redis for brute-force and endpoint throttling.
- **Observability:** Sentry (error logging and monitoring), PostHog (event analytics).
- **PWA & Performance:** `next-pwa` / service worker, `manifest.json`, offline fallback page, target load time < 2.0s, WCAG 2.1 AA accessibility.
- **Testing:** Vitest for unit/integration tests, Playwright for E2E validation of the critical Chat-to-Checkout and Verification journey.

---

## 6. Critical Business Logic, Concurrency & Security

1. **Race-Condition & Overselling Protection:**
   - Order creation must run a database transaction executing `SELECT stock FROM products WHERE id = $1 FOR UPDATE`.
   - Prevent stock decrement below zero; reject concurrent checkout requests when stock is insufficient.
2. **24-Hour Auto-Cancel Rule:**
   - Orders in `pending` status where payment has not been uploaded or verified within 24 hours must automatically transition to `cancelled`, releasing reserved stock back to the inventory.
   - Handled via Supabase Cron / scheduled Edge Function or state evaluation check.
3. **Audit Logging:**
   - All critical transaction transitions must write an immutable record to the `audit_logs` table (`ORDER_CREATED`, `PAYMENT_PROOF_UPLOADED`, `PAYMENT_VERIFIED`, `PAYMENT_REJECTED`, `ORDER_CANCELLED`).
4. **Security & OWASP Compliance:**
   - **IDOR Defense:** Primary keys must use cryptographically secure `UUID v4` (`gen_random_uuid()`).
   - **File Upload Protection:** Strict MIME type validation (`image/jpeg`, `image/png`, `image/webp`, `video/mp4`), 5MB max payload for receipts, 25MB max for review videos.
   - **Rate Limiting:** Protect `/api/orders/create` and chat endpoints using Redis-backed token bucket or sliding window.
   - **Cookies & Sessions:** `SameSite=Strict`, `HttpOnly`, `Secure`.

---

## 7. Concrete Database Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles / User Data
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'seller', 'admin')),
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Products Table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(12,2) NOT NULL CHECK (price >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category TEXT NOT NULL,
  images TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Nullable for Guest Checkout
  seller_id UUID NOT NULL REFERENCES profiles(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_price DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'payment_uploaded', 'verified', 'rejected', 'cancelled')),
  payment_proof_url TEXT,
  shipping_address JSONB NOT NULL,
  customer_contact JSONB NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Audit Logs Table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Chat Messages Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb, -- e.g. order draft triggers
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Media-based Reviews Table (Strictly NO Star Ratings)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  media_urls TEXT[] NOT NULL DEFAULT '{}',
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 8. Detailed User Journey & Page Specifications

1. **Homepage & Catalog (`/`, `/explore`):**
   - Hero editorial banner, curated categories, search bar with debounce.
   - Responsive product grid with cursor-based pagination (infinite scroll / load more via SWR).
   - Product cards showing primary image, title, price, seller name, and live online status badge.

2. **Product Detail Page (`/products/[id]`):**
   - Multi-image gallery with thumbnail preview.
   - Real-time seller presence indicator (green dot "Active Now" / grey dot "Offline").
   - Action buttons: "Chat with Seller" (redirects to chat with auto-attached product) and "Buy Now" (direct to 3-step checkout).
   - "Community Visual Reviews" section displaying authentic photos and videos submitted by verified buyers.

3. **Chat Experience (`/chat`, `/chat/[sellerId]`):**
   - Dual-pane layout on desktop; single active conversation view with back navigation on mobile.
   - Opening chat with a `?product_id=...` parameter auto-sends or embeds an interactive product preview card.
   - "Create Order" button inside the chat header or message widget that triggers a quick pre-filled modal (quantity, subtotal, direct checkout launch).

4. **3-Step Checkout (`/checkout`):**
   - **Step 1 (Contact):** Name, email, phone (pre-filled if logged in; inputs enabled for guest).
   - **Step 2 (Shipping Address):** Destination address, city, postal code, delivery notes.
   - **Step 3 (Payment & Transfer):** Display seller's designated bank account / QRIS instructions, total amount with unique code if applicable, and drag-and-drop payment proof upload.
   - Concurrency check executed upon submit with immediate order confirmation screen.

5. **Seller Management Dashboard (`/dashboard`):**
   - **Overview:** Total GMV, verified orders, pending payments, conversion rate.
   - **Orders Management:** Tabbed views (`All`, `Pending Verification`, `Completed`, `Cancelled`).
   - **Verification Modal:** Side-by-side view of order details and zoomable payment proof receipt with one-click **"Approve & Mark Verified"** or **"Reject"** (with rejection reason).
   - **Product Manager:** Create/Edit products with drag-and-drop multi-image uploader and live stock controls.

---

## 9. Deliverables & Acceptance Checklist

- [ ] Complete Next.js 14 App Router project setup with TypeScript, Tailwind CSS, and Framer Motion.
- [ ] Database schema migrations and Supabase RLS security policies implemented.
- [ ] Working Supabase Auth with HttpOnly cookies, supporting Member and Seller roles.
- [ ] Real-time presence indicator showing seller online/offline status dynamically.
- [ ] Real-time chat system with automatic product card attachment and in-chat order creation.
- [ ] 3-Step Checkout supporting both Guests and authenticated Members.
- [ ] Concurrency-safe inventory deduction (`SELECT FOR UPDATE` or transactional RPC).
- [ ] Payment proof upload with strict MIME validation and seller verification modal.
- [ ] 24-hour auto-cancellation logic for stale pending orders.
- [ ] Media-based visual reviews section (photos/videos only, zero star ratings).
- [ ] Responsive PWA support with valid `manifest.json` and load times < 2 seconds.
- [ ] Comprehensive unit tests (Vitest) and critical E2E checkout test (Playwright).

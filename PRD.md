# e-commerce — Product Requirements Document (PRD)
- Document Version: v1.0
- Date: 2026-11-17
- Author: AI Product Architect
- Status: Ready for Development

## 1. Project Overview
Platform e-commerce C2C berbasis PWA yang memfasilitasi transaksi sosial dengan fokus pada interaksi real-time, verifikasi manual, dan visual review untuk membangun kepercayaan antar pengguna.

## 2. Product Vision & Objectives
Menjadi platform marketplace C2C yang mengutamakan interaksi personal (chat-first) untuk meningkatkan konversi transaksi dengan dukungan fitur media sosial.

## 3. Problem Statement
Kurangnya kepercayaan pada transaksi C2C akibat minimnya bukti visual produk dan lambatnya respon penjual. Solusi: Chat-to-Checkout, Review Media, dan Status Online.

## 4. Target Audience & User Personas
- Gen-Z & Millennial (18-35): Literasi digital tinggi, menyukai interaksi chat, mencari keaslian produk melalui media.

## 5. Scope & Project Boundaries
- In Scope: Chat-to-Checkout, Review Media, Dashboard Monetisasi, Real-time Status, Guest/Member Checkout.
- Out of Scope: Payment Gateway otomatis, Rating Bintang, Wishlist (Future Roadmap).

## 6. Functional Requirements
- FR-01: Chat-to-Checkout (Must-have)
- FR-02: Review Media (Must-have)
- FR-03: Dashboard Monetisasi (Must-have)
- FR-04: Real-time Status (Must-have)
- FR-05: Guest/Member Checkout (Must-have)

## 7. Non-Functional Requirements
- Performance: PWA Load < 2s.
- Reliability: 99.9% Uptime.
- Scalability: Horizontal scaling via Supabase.
- Observability: Sentry & PostHog integration.

## 8. User Roles & Permission Matrix
| Role | Browse | Chat | Checkout | Verify Payment | Manage Product |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Guest | Yes | No | Yes | No | No |
| Member | Yes | Yes | Yes | No | No |
| Seller | Yes | Yes | Yes | Yes | Yes |

## 9. User Journey & Workflow
Discovery -> Chat (Auto-attach link) -> Create Order (Pre-filled) -> Payment (Upload Bukti) -> Verification (Seller) -> Completion.

## 10. Business Logic & Validation Rules
- Auto-Cancel: 24 jam jika status 'Pending' tidak diverifikasi.
- Stok: SELECT FOR UPDATE pada tabel produk saat checkout.

## 11. UI/UX Design Direction
Minimalist-Modern (Contemporary Editorial Marketplace). Palet: Slate (Base: Slate-900 untuk teks), Indigo (Primary/Action: Indigo-600), White (Background). Mobile-first PWA.

## 12. Design System & Component Guidelines
- Font: Inter (Sans-serif).
- Spacing: 4px grid system.
- Colors: Indigo-600 (Primary), Slate-900 (Text), White (Background).

## 13. Page-by-Page UI Specifications
- Product Detail: Image gallery, Chat button, Create Order button.
- Chat: Real-time message, Auto-attach link, Create Order action.
- Checkout: 3-step form (Detail, Address, Payment).

## 14. Responsive Design Specifications
- Mobile: Single column, bottom navigation.
- Desktop: Grid layout, sidebar navigation for dashboard.

## 15. System Architecture
Next.js 14 (Frontend) <-> Supabase (Auth, DB, Realtime, Storage) <-> Redis (Rate Limiting).

## 16. Technology Stack
- Frontend: Next.js 14, TailwindCSS, Framer Motion.
- Backend: Supabase (PostgreSQL, RLS, Edge Functions).
- Auth: NextAuth.js / Supabase Auth.
- Real-time: Supabase Realtime (Socket.io).

## 17. Database Schema & Relationships
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  category TEXT,
  images TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES auth.users(id),
  seller_id UUID NOT NULL REFERENCES auth.users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL DEFAULT 1,
  total_price DECIMAL(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, verified, rejected, cancelled
  payment_proof_url TEXT,
  shipping_address JSONB NOT NULL,
  customer_contact JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  action TEXT NOT NULL,
  actor_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  receiver_id UUID NOT NULL REFERENCES auth.users(id),
  product_id UUID REFERENCES products(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id),
  product_id UUID NOT NULL REFERENCES products(id),
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  media_urls TEXT[] NOT NULL DEFAULT '{}',
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## 18. API Specifications
- POST `/api/orders/create` { "product_id": "uuid", "quantity": 1, "address": {...}, "contact": {...} }
  Response: { "order_id": "uuid", "status": "pending" }
- POST `/api/orders/[id]/upload-payment` { "payment_proof_url": "url" }
- POST `/api/orders/[id]/verify` { "action": "approve" | "reject" }

## 19. Authentication & Authorization
JWT-based with HttpOnly cookies. RLS policies on all tables using `auth.uid()`.

## 20. Security Architecture & OWASP Compliance
- IDOR: UUID usage & strict RLS check.
- CSRF: SameSite=Strict cookies.
- Brute-force: Redis Rate Limiting.
- File Upload: MIME validation & Signed Storage URLs.

## 21. Error Handling & Edge Cases
Standard JSON: `{ "error": "code", "message": "string" }`. Fallback to offline mode for PWA.

## 22. Third-Party Integrations
- Sentry (Error Tracking).
- PostHog (Analytics).
- Supabase Storage / S3.

## 23. Performance & Scalability
- Caching: SWR for data fetching.
- Pagination: Cursor-based pagination for product lists.

## 24. SEO & Accessibility
- Metadata: Next.js Metadata API.
- Accessibility: WCAG 2.1 AA compliance (ARIA labels).

## 25. Testing Strategy
- Unit: Vitest / Jest.
- E2E: Playwright for critical checkout flow.

## 26. Acceptance Criteria
Given a buyer in chat, When clicking 'Create Order', Then order is created with pre-filled product data.

## 27. Deployment & Environment Configuration
- Vercel (Frontend).
- Supabase (Backend).
- Environment: `.env.production` (DB_URL, SUPABASE_URL, SUPABASE_ANON_KEY, REDIS_URL, etc.).

## 28. Risks, Assumptions & Dependencies
- Assumption: Penjual responsif.
- Risk: Keterlambatan verifikasi manual (Mitigasi: Auto-cancel 24 jam).

## 29. Development Roadmap & Milestones
- Sprint 1: Auth, Role Architecture & Database Setup.
- Sprint 2: Product Catalog & Chat Real-time (Presence & Auto-attach).
- Sprint 3: 3-Step Checkout, Concurrency Stock Lock & Payment Proof Upload.
- Sprint 4: Seller Dashboard, Manual Verification, Auto-Cancel & Media Reviews.

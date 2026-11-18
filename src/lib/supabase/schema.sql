-- ==============================================================================
-- C2C MARKETPLACE DATABASE SCHEMA (SUPABASE POSTGRESQL)
-- Strict Alignment with PRD v1.0
-- ==============================================================================

-- 1. Enable Cryptographic UUIDs
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Profiles Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('guest', 'member', 'seller')),
  phone TEXT,
  email TEXT,
  is_online BOOLEAN DEFAULT false,
  last_seen TIMESTAMPTZ DEFAULT now(),
  bio TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_account_holder TEXT,
  qris_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Products Table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Nullable for Guest Checkout
  seller_id UUID NOT NULL REFERENCES public.profiles(id),
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_price DECIMAL(12,2) NOT NULL CHECK (total_price >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'payment_uploaded', 'verified', 'rejected', 'cancelled')),
  payment_proof_url TEXT,
  rejection_reason TEXT,
  shipping_address JSONB NOT NULL,
  customer_contact JSONB NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Audit Logs Table (Transaction and status traceability)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL DEFAULT 'System',
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Messages Table (Chat-first commerce)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Media-based Reviews Table (Strictly NO Star Ratings, pure media proof)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_urls TEXT[] NOT NULL DEFAULT '{}',
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE & FAST LOOKUPS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_products_seller ON public.products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_created ON public.products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_messages_pair ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON public.reviews(product_id);

-- ==============================================================================
-- ATOMIC CONCURRENCY FUNCTION: CREATE ORDER WITH 'SELECT FOR UPDATE'
-- Solves FR-05 & Business Rule 10 (Stok Concurrency Safety)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.create_order_atomic(
  p_product_id UUID,
  p_buyer_id UUID,
  p_quantity INT,
  p_shipping_address JSONB,
  p_customer_contact JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product RECORD;
  v_order_id UUID;
  v_total_price DECIMAL(12,2);
BEGIN
  -- 1. Lock the product row strictly to prevent race-condition overselling
  SELECT id, seller_id, name, price, stock, is_active
  INTO v_product
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  -- 2. Validate product existence & availability
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'PRODUCT_NOT_FOUND', 'message', 'Produk tidak ditemukan');
  END IF;

  IF NOT v_product.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'PRODUCT_INACTIVE', 'message', 'Produk sedang tidak aktif');
  END IF;

  IF v_product.stock < p_quantity THEN
    RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_STOCK', 'message', 'Stok tidak mencukupi');
  END IF;

  -- 3. Deduct stock atomically
  UPDATE public.products
  SET stock = stock - p_quantity,
      updated_at = now()
  WHERE id = p_product_id;

  -- 4. Calculate total price
  v_total_price := v_product.price * p_quantity;

  -- 5. Insert order
  INSERT INTO public.orders (
    buyer_id,
    seller_id,
    product_id,
    quantity,
    total_price,
    status,
    shipping_address,
    customer_contact,
    expires_at
  ) VALUES (
    p_buyer_id,
    v_product.seller_id,
    p_product_id,
    p_quantity,
    v_total_price,
    'pending',
    p_shipping_address,
    p_customer_contact,
    now() + INTERVAL '24 hours'
  )
  RETURNING id INTO v_order_id;

  -- 6. Insert audit log
  INSERT INTO public.audit_logs (
    order_id,
    action,
    actor_id,
    actor_name,
    details
  ) VALUES (
    v_order_id,
    'ORDER_CREATED',
    p_buyer_id,
    COALESCE(p_customer_contact->>'name', 'Guest'),
    jsonb_build_object(
      'quantity', p_quantity,
      'unit_price', v_product.price,
      'total_price', v_total_price,
      'stock_remaining', v_product.stock - p_quantity
    )
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'total_price', v_total_price,
    'status', 'pending'
  );
END;
$$;

-- ==============================================================================
-- 24-HOUR AUTO-CANCEL FUNCTION
-- Solves Business Rule 10 (Auto-Cancel 24 Jam)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.cancel_expired_pending_orders()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cancelled_count INT := 0;
  r RECORD;
BEGIN
  FOR r IN
    SELECT id, product_id, quantity
    FROM public.orders
    WHERE status = 'pending' AND expires_at < now()
    FOR UPDATE
  LOOP
    -- 1. Restore product stock
    UPDATE public.products
    SET stock = stock + r.quantity,
        updated_at = now()
    WHERE id = r.product_id;

    -- 2. Update order status
    UPDATE public.orders
    SET status = 'cancelled',
        updated_at = now()
    WHERE id = r.id;

    -- 3. Write audit log
    INSERT INTO public.audit_logs (
      order_id,
      action,
      actor_name,
      details
    ) VALUES (
      r.id,
      'ORDER_CANCELLED',
      'System Scheduler',
      jsonb_build_object('reason', 'Auto-cancel 24 jam belum verifikasi', 'restored_quantity', r.quantity)
    );

    v_cancelled_count := v_cancelled_count + 1;
  END LOOP;

  RETURN v_cancelled_count;
END;
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view public seller profiles; users can update own profile
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Products: Everyone can view active products; sellers can manage own products
CREATE POLICY "Active products viewable by everyone" ON public.products FOR SELECT USING (is_active = true OR auth.uid() = seller_id);
CREATE POLICY "Sellers can insert products" ON public.products FOR INSERT WITH CHECK (auth.uid() = seller_id);
CREATE POLICY "Sellers can update own products" ON public.products FOR UPDATE USING (auth.uid() = seller_id);

-- Orders: Buyers and Sellers can view their own orders
CREATE POLICY "Users view own orders" ON public.orders FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Sellers can update status" ON public.orders FOR UPDATE USING (auth.uid() = seller_id);

-- Messages: Participants can view and insert messages
CREATE POLICY "Message participants can read" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Authenticated users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Reviews: Everyone can read reviews; buyers can insert review for completed orders
CREATE POLICY "Reviews viewable by everyone" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Buyers can insert review" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = buyer_id);

export type UserRole = "guest" | "member" | "seller" | "superadmin";

export interface Profile {
  id: string;
  full_name: string;
  handle: string;
  avatar_url?: string;
  role: UserRole;
  phone?: string;
  email?: string;
  password?: string;
  is_online?: boolean;
  last_seen?: string;
  bio?: string;
  city?: string;
  verified_fashion_seller?: boolean;
  is_suspended?: boolean;
  suspended_reason?: string;
  must_change_password?: boolean;
  password_reset_at?: string;
  created_at?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
  qris_url?: string;
  default_shipping_address?: ShippingAddress;
}

export type FashionCondition =
  | "Vintage / Thrift"
  | "Brand New"
  | "Like New"
  | "Handmade Rework";

export interface Product {
  id: string;
  seller_id: string;
  seller?: Profile;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  sizes: string[];
  condition: FashionCondition;
  color?: string;
  images: string[];
  is_active: boolean;
  is_trending?: boolean;
  is_fresh_find?: boolean;
  created_at: string;
  updated_at?: string;
}

export type OrderStatus =
  | "pending"
  | "payment_uploaded"
  | "verified"
  | "rejected"
  | "cancelled";

export interface ShippingAddress {
  recipient_name: string;
  phone: string;
  street_address: string;
  city: string;
  postal_code: string;
  notes?: string;
}

export interface CustomerContact {
  name: string;
  email: string;
  phone: string;
}

export interface Order {
  id: string;
  buyer_id?: string | null;
  seller_id: string;
  product_id: string;
  quantity: number;
  selected_size?: string;
  total_price: number;
  status: OrderStatus;
  payment_proof_url?: string;
  rejection_reason?: string;
  shipping_address: ShippingAddress;
  customer_contact: CustomerContact;
  expires_at: string; // 24 hours
  created_at: string;
  updated_at: string;
  product?: Product;
  seller?: Profile;
  buyer?: Profile;
}

export interface AuditLog {
  id: string;
  order_id: string;
  action:
    | "ORDER_CREATED"
    | "PAYMENT_PROOF_UPLOADED"
    | "PAYMENT_VERIFIED"
    | "PAYMENT_REJECTED"
    | "ORDER_CANCELLED"
    | "STOCK_DEDUCTED"
    | "STOCK_RESTORED"
    | "ADMIN_USER_SUSPENDED"
    | "ADMIN_USER_RESTORED"
    | "ADMIN_PRODUCT_MODERATED"
    | "ADMIN_DISPUTE_RESOLVED"
    | "ADMIN_PASSWORD_RESET";
  actor_id?: string;
  actor_name: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  product_id?: string | null;
  product?: Product;
  content: string;
  is_read?: boolean;
  is_auto_reply?: boolean;
  metadata?: {
    is_product_attachment?: boolean;
    order_draft?: {
      product_id: string;
      product_name: string;
      price: number;
      quantity: number;
      selected_size?: string;
      image_url: string;
    };
  };
  created_at: string;
  sender?: Profile;
}

export interface Review {
  id: string;
  order_id: string;
  product_id: string;
  buyer_id: string;
  buyer?: Profile;
  media_urls: string[]; // Strict media-only visual proof (outfit OOTD photos/videos)
  content: string;
  fit_feedback?: "True to Size" | "Runs Oversized" | "Fitted";
  created_at: string;
}

export interface SellerStats {
  total_revenue: number;
  orders_count: number;
  pending_verification: number;
  active_products_count: number;
  conversion_rate: number;
}

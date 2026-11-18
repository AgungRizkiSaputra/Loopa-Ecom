import { Product, Profile, Order, Message, Review, AuditLog, OrderStatus, SellerStats, UserRole, FashionCondition } from "@/types";
import { mockProducts, mockProfiles, mockOrders, mockMessages, mockReviews, mockAuditLogs } from "./mock-data";
import { generateUUID } from "./utils";

const STORAGE_KEYS = {
  USERS: "loopa_registered_users_v2",
  PRODUCTS: "loopa_products_v2",
  ORDERS: "loopa_orders_v2",
  MESSAGES: "loopa_messages_v2",
  REVIEWS: "loopa_reviews_v2",
  AUDIT_LOGS: "loopa_audit_logs_v2",
  CURRENT_USER: "loopa_current_user_v3",
};

// Official Superadmin account (Platform Owner)
export const SUPERADMIN_ACCOUNT: Profile = {
  id: "superadmin_loopa",
  full_name: "Superadmin LOOPA",
  handle: "superadmin",
  email: "superadmin@loopa.id",
  password: "adminloopa123",
  phone: "081100009999",
  role: "superadmin",
  city: "Jakarta HQ",
  bio: "Platform Owner & Trust/Safety Administrator LOOPA Marketplace.",
  is_online: true,
  last_seen: new Date().toISOString(),
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
};

// Initial Registered Users seed (catalog sellers + platform superadmin)
const INITIAL_USERS: Profile[] = [
  SUPERADMIN_ACCOUNT,
  {
    ...mockProfiles.member_agung,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
  {
    ...mockProfiles.seller_rasa,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    ...mockProfiles.seller_zoe,
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    ...mockProfiles.seller_archive,
    created_at: new Date(Date.now() - 8 * 86400000).toISOString(),
  },
];

let memoryState = {
  users: [...INITIAL_USERS],
  products: [...mockProducts],
  orders: [...mockOrders],
  messages: [...mockMessages],
  reviews: [...mockReviews],
  auditLogs: [...mockAuditLogs],
  currentUser: null as Profile | null,
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function getItem<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Storage error:", err);
  }
}

export const DataStore = {
  init() {
    if (!isBrowser()) return;
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      setItem(STORAGE_KEYS.USERS, INITIAL_USERS);
    } else {
      // Ensure official Superadmin account always exists in existing storage
      const existingUsers = getItem<Profile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
      const hasSuperadmin = existingUsers.some(
        (u) => u.id === SUPERADMIN_ACCOUNT.id || u.role === "superadmin"
      );
      if (!hasSuperadmin) {
        setItem(STORAGE_KEYS.USERS, [SUPERADMIN_ACCOUNT, ...existingUsers]);
      }
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      setItem(STORAGE_KEYS.PRODUCTS, mockProducts);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
      setItem(STORAGE_KEYS.ORDERS, mockOrders);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MESSAGES)) {
      setItem(STORAGE_KEYS.MESSAGES, mockMessages);
    }
    if (!localStorage.getItem(STORAGE_KEYS.REVIEWS)) {
      setItem(STORAGE_KEYS.REVIEWS, mockReviews);
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
      setItem(STORAGE_KEYS.AUDIT_LOGS, mockAuditLogs);
    }
    // Guest by default — users must register & log in to access Member/Seller/Superadmin features
  },

  // --- USERS & AUTH ---
  getAllUsers(): Profile[] {
    return isBrowser()
      ? getItem<Profile[]>(STORAGE_KEYS.USERS, INITIAL_USERS)
      : memoryState.users;
  },

  getUserById(userId: string): Profile | undefined {
    return this.getAllUsers().find((u) => u.id === userId);
  },

  getSellers(): Profile[] {
    return this.getAllUsers().filter((u) => u.role === "seller" && !u.is_suspended);
  },

  getCurrentUser(): Profile | null {
    if (!isBrowser()) return memoryState.currentUser;
    return getItem(STORAGE_KEYS.CURRENT_USER, null);
  },

  setCurrentUser(profile: Profile | null) {
    if (isBrowser()) {
      if (profile === null) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      } else {
        setItem(STORAGE_KEYS.CURRENT_USER, profile);
      }
    } else {
      memoryState.currentUser = profile;
    }
  },

  registerUser(data: {
    fullName: string;
    handle: string;
    email: string;
    phone: string;
    password: string;
    role: UserRole;
    city?: string;
    bio?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountHolder?: string;
    autoLogin?: boolean;
  }): { success: boolean; user?: Profile; error?: string } {
    this.init();
    const users = this.getAllUsers();
    const cleanEmail = data.email.trim().toLowerCase();
    const rawCleanHandle = data.handle
      .trim()
      .toLowerCase()
      .replace(/^@/, "")
      .replace(/[^a-z0-9_]/g, "");
    const cleanHandle =
      rawCleanHandle || cleanEmail.split("@")[0].replace(/[^a-z0-9_]/g, "");

    if (!cleanHandle) {
      return { success: false, error: "Username (@handle) harus berisi huruf atau angka." };
    }

    if (!data.password || data.password.length < 6) {
      return { success: false, error: "Kata sandi minimal 6 karakter." };
    }

    const existing = users.find(
      (u) =>
        u.email?.trim().toLowerCase() === cleanEmail ||
        u.handle.trim().toLowerCase() === cleanHandle
    );

    if (existing) {
      return {
        success: false,
        error: "Email atau username (@handle) ini sudah terdaftar. Silakan gunakan yang lain atau langsung masuk.",
      };
    }

    const newUser: Profile = {
      id: `usr-${generateUUID().slice(0, 8)}`,
      full_name: data.fullName.trim(),
      handle: cleanHandle,
      email: cleanEmail,
      phone: data.phone.trim(),
      password: data.password,
      role: data.role,
      city: data.city?.trim() || "Jakarta",
      bio:
        data.bio?.trim() ||
        (data.role === "seller"
          ? "Independent Fashion Creator on LOOPA"
          : "Fashion lover on LOOPA"),
      avatar_url:
        data.role === "seller"
          ? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"
          : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80",
      is_online: true,
      last_seen: new Date().toISOString(),
      created_at: new Date().toISOString(),
      is_suspended: false,
      bank_name: data.bankName || (data.role === "seller" ? "BCA" : undefined),
      bank_account_number: data.bankAccountNumber?.trim(),
      bank_account_holder:
        data.bankAccountHolder?.trim() || data.fullName.trim().toUpperCase(),
      verified_fashion_seller: data.role === "seller",
    };

    const updatedUsers = [...users, newUser];
    if (isBrowser()) setItem(STORAGE_KEYS.USERS, updatedUsers);
    else memoryState.users = updatedUsers;

    if (data.autoLogin) {
      this.setCurrentUser(newUser);
    }

    return { success: true, user: newUser };
  },

  loginUser(
    emailOrHandle: string,
    password: string
  ): { success: boolean; user?: Profile; error?: string } {
    this.init();
    const users = this.getAllUsers();
    const query = emailOrHandle.toLowerCase().trim().replace(/^@/, "");

    if (!query) {
      return { success: false, error: "Email atau username wajib diisi." };
    }

    if (!password) {
      return { success: false, error: "Kata sandi wajib diisi." };
    }

    const found = users.find(
      (u) =>
        u.email?.trim().toLowerCase() === query ||
        u.handle.trim().toLowerCase() === query
    );

    if (!found || !found.password || found.password !== password) {
      return {
        success: false,
        error:
          "Email/username atau kata sandi salah. Pastikan Anda sudah mendaftar akun terlebih dahulu.",
      };
    }

    if (found.is_suspended) {
      return {
        success: false,
        error: `Akun ini sedang ditangguhkan oleh Superadmin LOOPA.${found.suspended_reason ? ` Alasan: ${found.suspended_reason}` : ""
          }`,
      };
    }

    const userWithOnlineStatus: Profile = {
      ...found,
      is_online: true,
      last_seen: new Date().toISOString(),
    };

    // Update last_seen in users table as well
    const updatedUsers = users.map((u) =>
      u.id === found.id ? userWithOnlineStatus : u
    );
    if (isBrowser()) setItem(STORAGE_KEYS.USERS, updatedUsers);
    else memoryState.users = updatedUsers;

    this.setCurrentUser(userWithOnlineStatus);
    return { success: true, user: userWithOnlineStatus };
  },

  logoutUser() {
    this.setCurrentUser(null);
  },

  updateProfile(userId: string, updates: Partial<Profile>): Profile | null {
    const users = this.getAllUsers().map((u) => {
      if (u.id === userId) {
        return { ...u, ...updates };
      }
      return u;
    });

    if (isBrowser()) setItem(STORAGE_KEYS.USERS, users);
    else memoryState.users = users;

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      const updatedCurrent = { ...current, ...updates };
      this.setCurrentUser(updatedCurrent);
      return updatedCurrent;
    }

    return users.find((u) => u.id === userId) || null;
  },

  // --- PRODUCTS ---
  getAllProductsAdmin(): Product[] {
    return isBrowser()
      ? getItem<Product[]>(STORAGE_KEYS.PRODUCTS, mockProducts)
      : memoryState.products;
  },

  getProducts(): Product[] {
    return this.getAllProductsAdmin().filter((p) => p.is_active);
  },

  getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id);
  },

  addProduct(productData: Omit<Product, "id" | "created_at" | "is_active">): Product {
    const products = this.getAllProductsAdmin();
    const newProduct: Product = {
      ...productData,
      id: `prod-fsh-${generateUUID().slice(0, 6)}`,
      created_at: new Date().toISOString(),
      is_active: true,
    };
    const updated = [newProduct, ...products];
    if (isBrowser()) setItem(STORAGE_KEYS.PRODUCTS, updated);
    else memoryState.products = updated;
    return newProduct;
  },

  updateProductStock(productId: string, newStock: number): void {
    const products = this.getAllProductsAdmin().map((p) =>
      p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p
    );
    if (isBrowser()) setItem(STORAGE_KEYS.PRODUCTS, products);
    else memoryState.products = products;
  },

  deleteProduct(productId: string): void {
    const products = this.getAllProductsAdmin().map((p) =>
      p.id === productId ? { ...p, is_active: false } : p
    );
    if (isBrowser()) setItem(STORAGE_KEYS.PRODUCTS, products);
    else memoryState.products = products;
  },

  // --- SUPERADMIN MODERATION ACTIONS ---
  toggleUserSuspended(userId: string, reason?: string): Profile | null {
    const target = this.getUserById(userId);
    if (!target || target.role === "superadmin") return null;

    const nextSuspended = !target.is_suspended;
    const updated = this.updateProfile(userId, {
      is_suspended: nextSuspended,
      suspended_reason: nextSuspended
        ? reason?.trim() || "Pelanggaran kebijakan platform LOOPA"
        : undefined,
    });

    this.addAuditLog({
      order_id: "PLATFORM-MOD",
      action: nextSuspended ? "ADMIN_USER_SUSPENDED" : "ADMIN_USER_RESTORED",
      actor_name: "Superadmin LOOPA",
      details: {
        target_user: `${target.full_name} (@${target.handle})`,
        role: target.role,
        reason: nextSuspended
          ? reason?.trim() || "Pelanggaran kebijakan platform LOOPA"
          : "Akun dipulihkan kembali",
      },
    });

    return updated;
  },

  toggleSellerVerified(userId: string): Profile | null {
    const target = this.getUserById(userId);
    if (!target || target.role !== "seller") return null;
    return this.updateProfile(userId, {
      verified_fashion_seller: !target.verified_fashion_seller,
    });
  },

  adminResetUserPassword(
    userId: string,
    tempPassword: string
  ): { success: boolean; error?: string; tempPassword?: string } {
    const target = this.getUserById(userId);
    if (!target || target.role === "superadmin") {
      return { success: false, error: "Akun target tidak valid." };
    }
    const cleanPass = tempPassword.trim();
    if (cleanPass.length < 6) {
      return { success: false, error: "Kata sandi sementara minimal 6 karakter." };
    }

    this.updateProfile(userId, {
      password: cleanPass,
      must_change_password: true,
      password_reset_at: new Date().toISOString(),
    });

    // Audit log NEVER records the raw password (OWASP best practice)
    this.addAuditLog({
      order_id: "PLATFORM-SEC",
      action: "ADMIN_PASSWORD_RESET",
      actor_name: "Superadmin LOOPA",
      details: {
        target_user: `${target.full_name} (@${target.handle})`,
        role: target.role,
        note: "Kata sandi sementara diterbitkan; user diminta mengganti saat login",
      },
    });

    return { success: true, tempPassword: cleanPass };
  },

  changeOwnPassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): { success: boolean; error?: string } {
    const target = this.getUserById(userId);
    if (!target) return { success: false, error: "Pengguna tidak ditemukan." };
    if (target.password && target.password !== currentPassword) {
      return { success: false, error: "Kata sandi saat ini tidak sesuai." };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: "Kata sandi baru minimal 6 karakter." };
    }

    this.updateProfile(userId, {
      password: newPassword,
      must_change_password: false,
    });
    return { success: true };
  },

  toggleProductActive(productId: string, reason?: string): Product | null {
    const products = this.getAllProductsAdmin();
    const target = products.find((p) => p.id === productId);
    if (!target) return null;

    const nextActive = !target.is_active;
    const updatedList = products.map((p) =>
      p.id === productId ? { ...p, is_active: nextActive } : p
    );
    if (isBrowser()) setItem(STORAGE_KEYS.PRODUCTS, updatedList);
    else memoryState.products = updatedList;

    this.addAuditLog({
      order_id: "PLATFORM-MOD",
      action: "ADMIN_PRODUCT_MODERATED",
      actor_name: "Superadmin LOOPA",
      details: {
        product_name: target.name,
        status: nextActive ? "Dipulihkan ke Etalase" : "Diturunkan (Takedown)",
        reason: reason?.trim() || (nextActive ? "Lolos tinjauan ulang" : "Moderasi konten Superadmin"),
      },
    });

    return { ...target, is_active: nextActive };
  },

  adminResolveOrder(
    orderId: string,
    action: "approve" | "reject" | "cancel",
    note?: string
  ): Order | null {
    const target = this.getOrderById(orderId);
    if (!target) return null;

    const newStatus: OrderStatus =
      action === "approve"
        ? "verified"
        : action === "reject"
          ? "rejected"
          : "cancelled";

    const shouldRestoreStock =
      (action === "reject" || action === "cancel") &&
      target.status !== "rejected" &&
      target.status !== "cancelled";

    const orders = this.getOrders().map((o) =>
      o.id === orderId
        ? {
          ...o,
          status: newStatus,
          rejection_reason:
            action === "reject" || action === "cancel"
              ? note?.trim() || "Keputusan resolusi sengketa Superadmin"
              : undefined,
          updated_at: new Date().toISOString(),
        }
        : o
    );

    if (isBrowser()) setItem(STORAGE_KEYS.ORDERS, orders);
    else memoryState.orders = orders;

    if (shouldRestoreStock) {
      const prod = this.getAllProductsAdmin().find((p) => p.id === target.product_id);
      if (prod) {
        this.updateProductStock(prod.id, prod.stock + target.quantity);
      }
    }

    this.addAuditLog({
      order_id: orderId,
      action: "ADMIN_DISPUTE_RESOLVED",
      actor_name: "Superadmin LOOPA",
      details: {
        product_name: target.product?.name,
        decision: newStatus,
        reason: note?.trim() || `Intervensi Superadmin (${newStatus})`,
      },
    });

    return this.getOrderById(orderId) || null;
  },

  // --- ORDERS ---
  getOrders(): Order[] {
    const orders = isBrowser()
      ? getItem<Order[]>(STORAGE_KEYS.ORDERS, mockOrders)
      : memoryState.orders;
    return orders;
  },

  getOrderById(id: string): Order | undefined {
    return this.getOrders().find((o) => o.id === id);
  },

  createOrder(data: {
    productId: string;
    quantity: number;
    selectedSize?: string;
    shippingAddress: Order["shipping_address"];
    customerContact: Order["customer_contact"];
    buyerId?: string | null;
  }): { success: boolean; order?: Order; error?: string } {
    const product = this.getProductById(data.productId);
    if (!product) {
      return { success: false, error: "Produk fashion tidak ditemukan." };
    }
    if (product.stock < data.quantity) {
      return { success: false, error: "Stok produk ini tidak mencukupi." };
    }

    // Atomic stock reduction
    this.updateProductStock(product.id, product.stock - data.quantity);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
    const orderId = `ord-lp-${generateUUID().slice(0, 6)}`;
    const totalPrice = product.price * data.quantity;

    const newOrder: Order = {
      id: orderId,
      buyer_id: data.buyerId || null,
      seller_id: product.seller_id,
      product_id: product.id,
      product,
      seller: product.seller || mockProfiles.seller_rasa,
      quantity: data.quantity,
      selected_size: data.selectedSize || product.sizes[0] || "Standard",
      total_price: totalPrice,
      status: "pending",
      shipping_address: data.shippingAddress,
      customer_contact: data.customerContact,
      expires_at: expiresAt,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    const orders = [newOrder, ...this.getOrders()];
    if (isBrowser()) setItem(STORAGE_KEYS.ORDERS, orders);
    else memoryState.orders = orders;

    this.addAuditLog({
      order_id: orderId,
      action: "ORDER_CREATED",
      actor_id: data.buyerId || undefined,
      actor_name: data.customerContact.name || "Guest Buyer",
      details: {
        product_name: product.name,
        size: newOrder.selected_size,
        quantity: data.quantity,
        total_price: totalPrice,
      },
    });

    return { success: true, order: newOrder };
  },

  uploadPaymentProof(orderId: string, proofUrl: string): Order | null {
    const orders = this.getOrders().map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          status: "payment_uploaded" as OrderStatus,
          payment_proof_url: proofUrl,
          updated_at: new Date().toISOString(),
        };
      }
      return o;
    });

    if (isBrowser()) setItem(STORAGE_KEYS.ORDERS, orders);
    else memoryState.orders = orders;

    this.addAuditLog({
      order_id: orderId,
      action: "PAYMENT_PROOF_UPLOADED",
      actor_name: "Buyer",
      details: { proof_url: proofUrl },
    });

    return this.getOrderById(orderId) || null;
  },

  verifyOrder(
    orderId: string,
    action: "approve" | "reject",
    rejectionReason?: string
  ): Order | null {
    const orders = this.getOrders().map((o) => {
      if (o.id === orderId) {
        const newStatus: OrderStatus = action === "approve" ? "verified" : "rejected";
        return {
          ...o,
          status: newStatus,
          rejection_reason: action === "reject" ? rejectionReason : undefined,
          updated_at: new Date().toISOString(),
        };
      }
      return o;
    });

    if (isBrowser()) setItem(STORAGE_KEYS.ORDERS, orders);
    else memoryState.orders = orders;

    const targetOrder = this.getOrderById(orderId);
    if (action === "reject" && targetOrder) {
      const prod = this.getProductById(targetOrder.product_id);
      if (prod) {
        this.updateProductStock(prod.id, prod.stock + targetOrder.quantity);
      }
    }

    this.addAuditLog({
      order_id: orderId,
      action: action === "approve" ? "PAYMENT_VERIFIED" : "PAYMENT_REJECTED",
      actor_name: "Fashion Seller",
      details: { action, reason: rejectionReason },
    });

    return targetOrder || null;
  },

  checkAndCancelExpiredOrders(): number {
    const now = new Date().getTime();
    let cancelledCount = 0;

    const orders = this.getOrders().map((o) => {
      if (o.status === "pending" && new Date(o.expires_at).getTime() < now) {
        cancelledCount++;
        const prod = this.getProductById(o.product_id);
        if (prod) {
          this.updateProductStock(prod.id, prod.stock + o.quantity);
        }
        this.addAuditLog({
          order_id: o.id,
          action: "ORDER_CANCELLED",
          actor_name: "System 24h Auto-Cancel",
          details: { reason: "Melewati batas 24 jam belum diverifikasi" },
        });
        return {
          ...o,
          status: "cancelled" as OrderStatus,
          updated_at: new Date().toISOString(),
        };
      }
      return o;
    });

    if (cancelledCount > 0) {
      if (isBrowser()) setItem(STORAGE_KEYS.ORDERS, orders);
      else memoryState.orders = orders;
    }

    return cancelledCount;
  },

  // --- AUDIT LOGS ---
  getAuditLogs(orderId?: string): AuditLog[] {
    const logs = isBrowser()
      ? getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, mockAuditLogs)
      : memoryState.auditLogs;
    if (orderId) return logs.filter((l) => l.order_id === orderId);
    return logs;
  },

  addAuditLog(entry: Omit<AuditLog, "id" | "created_at">): void {
    const newLog: AuditLog = {
      ...entry,
      id: `log-lp-${generateUUID().slice(0, 6)}`,
      created_at: new Date().toISOString(),
    };
    const logs = [newLog, ...this.getAuditLogs()];
    if (isBrowser()) setItem(STORAGE_KEYS.AUDIT_LOGS, logs);
    else memoryState.auditLogs = logs;
  },

  // --- MESSAGES ---
  getMessages(): Message[] {
    return isBrowser()
      ? getItem<Message[]>(STORAGE_KEYS.MESSAGES, mockMessages)
      : memoryState.messages;
  },

  sendMessage(data: {
    senderId: string;
    receiverId: string;
    content: string;
    productId?: string | null;
    isAutoReply?: boolean;
    metadata?: Message["metadata"];
  }): Message {
    const product = data.productId ? this.getProductById(data.productId) : undefined;
    const senderProfile =
      this.getUserById(data.senderId) ||
      this.getCurrentUser() ||
      mockProfiles.member_agung;

    const newMessage: Message = {
      id: `msg-lp-${generateUUID().slice(0, 6)}`,
      sender_id: data.senderId,
      receiver_id: data.receiverId,
      product_id: data.productId || null,
      product,
      content: data.content,
      is_read: false,
      is_auto_reply: Boolean(data.isAutoReply),
      metadata: data.metadata,
      created_at: new Date().toISOString(),
      sender: senderProfile,
    };

    const messages = [...this.getMessages(), newMessage];
    if (isBrowser()) {
      setItem(STORAGE_KEYS.MESSAGES, messages);
      window.dispatchEvent(new Event("messages_updated"));
    } else {
      memoryState.messages = messages;
    }

    return newMessage;
  },

  markConversationAsRead(currentUserId: string, partnerId: string): Message[] {
    let changed = false;
    const updated = this.getMessages().map((m) => {
      if (
        m.sender_id === partnerId &&
        m.receiver_id === currentUserId &&
        m.is_read !== true
      ) {
        changed = true;
        return { ...m, is_read: true };
      }
      return m;
    });

    if (changed) {
      if (isBrowser()) {
        setItem(STORAGE_KEYS.MESSAGES, updated);
        window.dispatchEvent(new Event("messages_updated"));
      } else {
        memoryState.messages = updated;
      }
    }

    return updated;
  },

  getUnreadMessageCount(userId: string): number {
    return this.getMessages().filter(
      (m) => m.receiver_id === userId && m.is_read === false && !m.is_auto_reply
    ).length;
  },

  // --- REVIEWS ---
  getReviews(productId?: string): Review[] {
    const reviews = isBrowser()
      ? getItem<Review[]>(STORAGE_KEYS.REVIEWS, mockReviews)
      : memoryState.reviews;
    if (productId) return reviews.filter((r) => r.product_id === productId);
    return reviews;
  },

  addReview(data: {
    orderId: string;
    productId: string;
    buyerId: string;
    mediaUrls: string[];
    content: string;
    fitFeedback?: Review["fit_feedback"];
  }): Review {
    const newReview: Review = {
      id: `rev-lp-${generateUUID().slice(0, 6)}`,
      order_id: data.orderId,
      product_id: data.productId,
      buyer_id: data.buyerId,
      media_urls: data.mediaUrls,
      content: data.content,
      fit_feedback: data.fitFeedback || "True to Size",
      created_at: new Date().toISOString(),
      buyer: this.getCurrentUser() || mockProfiles.member_agung,
    };

    const reviews = [newReview, ...this.getReviews()];
    if (isBrowser()) setItem(STORAGE_KEYS.REVIEWS, reviews);
    else memoryState.reviews = reviews;

    return newReview;
  },

  // --- SELLER STATS ---
  getSellerStats(sellerId: string): SellerStats {
    const orders = this.getOrders().filter((o) => o.seller_id === sellerId);
    const verifiedOrders = orders.filter((o) => o.status === "verified");
    const pendingVerification = orders.filter((o) => o.status === "payment_uploaded");
    const products = this.getProducts().filter((p) => p.seller_id === sellerId);

    const totalRevenue = verifiedOrders.reduce((sum, o) => sum + o.total_price, 0);
    const conversionRate =
      orders.length > 0 ? Math.round((verifiedOrders.length / orders.length) * 100) : 0;

    return {
      total_revenue: totalRevenue,
      orders_count: orders.length,
      pending_verification: pendingVerification.length,
      active_products_count: products.length,
      conversion_rate: conversionRate,
    };
  },
};

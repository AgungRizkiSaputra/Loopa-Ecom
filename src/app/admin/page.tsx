"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataStore } from "@/lib/storage";
import { startAuthTransition } from "@/lib/auth-transition";
import { Order, Product, Profile, AuditLog, OrderStatus } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SellerAnalyticsCharts } from "@/components/seller-analytics-charts";
import {
  Shield,
  LayoutDashboard,
  Users,
  Shirt,
  Package,
  History,
  Lock,
  ArrowUpRight,
  LogOut,
  ChevronRight,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Ban,
  RotateCcw,
  BadgeCheck,
  Search,
  Eye,
  RefreshCw,
  Store,
  X,
  KeyRound,
  Copy,
  Check,
  Sparkles,
  Radio,
} from "lucide-react";

type AdminTab = "overview" | "users" | "products" | "orders" | "audit";

export default function SuperadminPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  const [users, setUsers] = useState<Profile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Filters
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<
    "all" | "member" | "seller" | "suspended"
  >("all");
  const [productSearch, setProductSearch] = useState("");
  const [productStatusFilter, setProductStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [orderStatusFilter, setOrderStatusFilter] = useState<"all" | OrderStatus>(
    "all"
  );

  // Toast / feedback banner
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Order Dispute Inspection Modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [disputeNote, setDisputeNote] = useState("");

  // Secure Temporary Password Reset Modal
  const [resetTargetUser, setResetTargetUser] = useState<Profile | null>(null);
  const [tempPasswordInput, setTempPasswordInput] = useState("");
  const [issuedTempPass, setIssuedTempPass] = useState<string | null>(null);
  const [copiedResetMsg, setCopiedResetMsg] = useState(false);

  const generateRandomTempPass = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const c1 = chars[Math.floor(Math.random() * chars.length)];
    const c2 = chars[Math.floor(Math.random() * chars.length)];
    return `LOOPA-${c1}${c2}${num}`;
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const refreshAll = () => {
    DataStore.init();
    const user = DataStore.getCurrentUser();
    setCurrentUser(user);
    if (user && user.role === "superadmin") {
      setUsers(DataStore.getAllUsers().filter((u) => u.role !== "superadmin"));
      setProducts(DataStore.getAllProductsAdmin());
      setOrders(DataStore.getOrders());
      setAuditLogs(DataStore.getAuditLogs());
    }
    setMounted(true);
  };

  useEffect(() => {
    refreshAll();
    window.addEventListener("user_role_changed", refreshAll);
    return () => window.removeEventListener("user_role_changed", refreshAll);
  }, []);

  // Platform-wide KPIs
  const platformStats = useMemo(() => {
    const verifiedOrders = orders.filter((o) => o.status === "verified");
    const totalGMV = verifiedOrders.reduce((sum, o) => sum + o.total_price, 0);
    const totalSellers = users.filter((u) => u.role === "seller").length;
    const totalMembers = users.filter((u) => u.role === "member").length;
    const suspendedUsers = users.filter((u) => u.is_suspended).length;
    const activeProducts = products.filter((p) => p.is_active).length;
    const attentionOrders = orders.filter(
      (o) => o.status === "payment_uploaded" || o.status === "rejected"
    ).length;

    return {
      totalGMV,
      totalUsers: users.length,
      totalSellers,
      totalMembers,
      suspendedUsers,
      activeProducts,
      totalProducts: products.length,
      totalOrders: orders.length,
      attentionOrders,
    };
  }, [users, products, orders]);

  // Top Sellers Leaderboard
  const topSellers = useMemo(() => {
    return users
      .filter((u) => u.role === "seller")
      .map((seller) => {
        const sellerOrders = orders.filter((o) => o.seller_id === seller.id);
        const verifiedGMV = sellerOrders
          .filter((o) => o.status === "verified")
          .reduce((s, o) => s + o.total_price, 0);
        const activeCount = products.filter(
          (p) => p.seller_id === seller.id && p.is_active
        ).length;
        return {
          seller,
          verifiedGMV,
          ordersCount: sellerOrders.length,
          activeCount,
        };
      })
      .sort((a, b) => b.verifiedGMV - a.verifiedGMV || b.ordersCount - a.ordersCount);
  }, [users, orders, products]);

  // Filtered Lists
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchRole =
        userRoleFilter === "all"
          ? true
          : userRoleFilter === "suspended"
          ? Boolean(u.is_suspended)
          : u.role === userRoleFilter;
      const q = userSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        u.full_name.toLowerCase().includes(q) ||
        u.handle.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q));
      return matchRole && matchSearch;
    });
  }, [users, userRoleFilter, userSearch]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchStatus =
        productStatusFilter === "all"
          ? true
          : productStatusFilter === "active"
          ? p.is_active
          : !p.is_active;
      const q = productSearch.trim().toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.seller?.full_name && p.seller.full_name.toLowerCase().includes(q));
      return matchStatus && matchSearch;
    });
  }, [products, productStatusFilter, productSearch]);

  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === "all") return orders;
    return orders.filter((o) => o.status === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-loopa-cream text-xs font-bold text-loopa-muted">
        Memuat Superadmin Console...
      </div>
    );
  }

  // Strict Superadmin Role Guard
  if (!currentUser || currentUser.role !== "superadmin") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-loopa-cream">
        <div className="max-w-md w-full bg-white rounded-4xl border-2 border-loopa-charcoal p-8 shadow-playful text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-loopa-coral border-2 border-loopa-charcoal shadow-playful-sm flex items-center justify-center text-white mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl text-loopa-charcoal">
              Akses Superadmin Terkunci
            </h1>
            <p className="text-xs text-loopa-muted font-medium mt-1.5 leading-relaxed">
              Portal ini hanya dapat diakses oleh Pemilik Platform (Superadmin) LOOPA. Silakan masuk dengan akun Superadmin Anda.
            </p>
          </div>
          <div className="space-y-2 pt-2">
            <Link
              href="/login"
              className="w-full py-3 px-4 rounded-full bg-loopa-charcoal text-white text-xs font-black hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal transition-all shadow-playful-sm block"
            >
              Masuk sebagai Superadmin
            </Link>
            <Link
              href="/"
              className="w-full py-3 px-4 rounded-full bg-white text-loopa-charcoal text-xs font-black hover:bg-loopa-cream border-2 border-loopa-charcoal transition-all block"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Action Handlers
  const handleToggleSuspend = (u: Profile) => {
    const updated = DataStore.toggleUserSuspended(
      u.id,
      u.is_suspended ? undefined : "Ditangguhkan melalui moderasi Superadmin"
    );
    if (updated) {
      refreshAll();
      showToast(
        updated.is_suspended
          ? `Akun @${u.handle} berhasil ditangguhkan.`
          : `Akun @${u.handle} telah diaktifkan kembali.`
      );
    }
  };

  const handleToggleVerifySeller = (u: Profile) => {
    const updated = DataStore.toggleSellerVerified(u.id);
    if (updated) {
      refreshAll();
      showToast(
        updated.verified_fashion_seller
          ? `Badge Verified Seller diberikan ke ${u.full_name}.`
          : `Badge Verified Seller dicabut dari ${u.full_name}.`
      );
    }
  };

  const handleToggleProduct = (p: Product) => {
    const updated = DataStore.toggleProductActive(p.id);
    if (updated) {
      refreshAll();
      showToast(
        updated.is_active
          ? `Produk "${p.name}" dipulihkan ke etalase.`
          : `Produk "${p.name}" diturunkan (takedown) dari etalase.`
      );
    }
  };

  const handleResolveDispute = (action: "approve" | "reject" | "cancel") => {
    if (!selectedOrder) return;
    DataStore.adminResolveOrder(selectedOrder.id, action, disputeNote);
    setSelectedOrder(null);
    setDisputeNote("");
    refreshAll();
    showToast(
      action === "approve"
        ? `Pesanan ${selectedOrder.id} disetujui lunas oleh Superadmin.`
        : `Pesanan ${selectedOrder.id} di-${action} dan stok dikembalikan.`
    );
  };

  const handleGlobalAutoCancel = () => {
    const count = DataStore.checkAndCancelExpiredOrders();
    refreshAll();
    showToast(
      count > 0
        ? `Auto-Cancel Global selesai: ${count} pesanan kadaluwarsa dibatalkan.`
        : "Tidak ada pesanan pending yang melewati batas 24 jam."
    );
  };

  const sidebarItems: {
    id: AdminTab;
    num: string;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    accent: string;
    badge?: number;
    badgeTone?: "coral" | "charcoal";
  }[] = [
    {
      id: "overview",
      num: "01",
      label: "Ringkasan & Kurva",
      sublabel: "Analitik GMV Global",
      icon: LayoutDashboard,
      accent: "bg-loopa-lime",
    },
    {
      id: "users",
      num: "02",
      label: "Pengguna & Penjual",
      sublabel: "Akses & Reset Sandi",
      icon: Users,
      accent: "bg-loopa-lavender",
      badge: platformStats.totalUsers,
      badgeTone: "charcoal",
    },
    {
      id: "products",
      num: "03",
      label: "Moderasi Produk",
      sublabel: "Kurasi & Takedown",
      icon: Shirt,
      accent: "bg-loopa-lime",
      badge: platformStats.totalProducts,
      badgeTone: "charcoal",
    },
    {
      id: "orders",
      num: "04",
      label: "Transaksi & Sengketa",
      sublabel: "Bukti & Intervensi",
      icon: Package,
      accent: "bg-loopa-coral",
      badge: platformStats.attentionOrders || undefined,
      badgeTone: "coral",
    },
    {
      id: "audit",
      num: "05",
      label: "Log Audit Global",
      sublabel: "Jejak Keamanan",
      icon: History,
      accent: "bg-loopa-cream",
    },
  ];

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-loopa-cream flex flex-col md:flex-row">
      {/* =========================================================================
          FLOATING TACTILE EDITORIAL COMMAND DOCK (DISTINCTIVE SUPERADMIN SIDEBAR)
          ========================================================================= */}
      <div className="w-full md:w-80 shrink-0 p-3 sm:p-4 md:p-5">
        <aside className="w-full bg-white rounded-4xl border-2 border-loopa-charcoal shadow-playful overflow-hidden flex flex-col justify-between md:sticky md:top-5 md:min-h-[calc(100vh-2.5rem)]">
          <div>
            {/* Editorial Electric Lime Header Ribbon */}
            <div className="bg-loopa-lime border-b-2 border-loopa-charcoal p-5 relative overflow-hidden">
              <div className="flex items-start justify-between gap-2 relative z-10">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-loopa-charcoal text-loopa-lime text-[9px] font-black uppercase tracking-widest mb-2">
                    <Radio className="w-2.5 h-2.5 animate-pulse" />
                    <span>ROOT // HQ LIVE</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display font-black text-3xl tracking-tight text-loopa-charcoal leading-none">
                      loopa
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-loopa-charcoal -rotate-3 inline-block shadow-playful-sm">
                      admin
                    </span>
                  </div>
                </div>

                <Link
                  href="/"
                  title="Buka Etalase Publik"
                  className="p-2 rounded-2xl bg-white hover:bg-loopa-charcoal hover:text-loopa-lime text-loopa-charcoal border-2 border-loopa-charcoal shadow-playful-sm transition-colors"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Mini Live Telemetry Strip inside Sidebar */}
              <div className="grid grid-cols-3 gap-1.5 mt-4 relative z-10">
                <div className="bg-white/95 rounded-2xl border border-loopa-charcoal px-2 py-1.5 text-center">
                  <span className="text-[9px] font-black uppercase text-loopa-muted block leading-none">
                    Akun
                  </span>
                  <span className="font-display font-black text-xs text-loopa-charcoal">
                    {platformStats.totalUsers}
                  </span>
                </div>
                <div className="bg-white/95 rounded-2xl border border-loopa-charcoal px-2 py-1.5 text-center">
                  <span className="text-[9px] font-black uppercase text-loopa-muted block leading-none">
                    Produk
                  </span>
                  <span className="font-display font-black text-xs text-loopa-charcoal">
                    {platformStats.activeProducts}
                  </span>
                </div>
                <div className="bg-loopa-charcoal text-white rounded-2xl border border-loopa-charcoal px-2 py-1.5 text-center">
                  <span className="text-[9px] font-black uppercase text-loopa-lime block leading-none">
                    Pantau
                  </span>
                  <span className="font-display font-black text-xs">
                    {platformStats.attentionOrders}
                  </span>
                </div>
              </div>
            </div>

            {/* Numbered Editorial Navigation Stack */}
            <nav className="p-3.5 space-y-2">
              <div className="flex items-center justify-between px-2 pb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-loopa-muted">
                  Command Deck
                </span>
                <span className="text-[10px] font-mono font-bold text-loopa-muted">
                  v2.0
                </span>
              </div>

              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full group p-2.5 rounded-3xl border-2 text-left transition-all flex items-center gap-3 ${
                      isActive
                        ? "bg-loopa-charcoal text-white border-loopa-charcoal shadow-playful-sm"
                        : "bg-loopa-cream/55 text-loopa-charcoal border-transparent hover:border-loopa-charcoal hover:bg-white"
                    }`}
                  >
                    {/* Colored Icon Medallion */}
                    <div
                      className={`w-10 h-10 rounded-2xl border-2 border-loopa-charcoal flex items-center justify-center shrink-0 transition-transform ${
                        isActive
                          ? `${item.accent} text-loopa-charcoal -rotate-3`
                          : "bg-white text-loopa-charcoal group-hover:rotate-3"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-mono font-black ${
                            isActive ? "text-loopa-lime" : "text-loopa-muted"
                          }`}
                        >
                          {item.num}
                        </span>
                        <span className="font-display font-black text-xs truncate">
                          {item.label}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold block truncate ${
                          isActive ? "text-white/70" : "text-loopa-muted"
                        }`}
                      >
                        {item.sublabel}
                      </span>
                    </div>

                    {item.badge !== undefined ? (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black border shrink-0 ${
                          item.badgeTone === "coral"
                            ? "bg-loopa-coral text-white border-loopa-charcoal"
                            : isActive
                            ? "bg-loopa-lime text-loopa-charcoal border-loopa-charcoal"
                            : "bg-white text-loopa-charcoal border-loopa-charcoal"
                        }`}
                      >
                        {item.badge}
                      </span>
                    ) : (
                      <ChevronRight
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isActive ? "text-loopa-lime" : "opacity-40"
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Operator Footer Dock */}
          <div className="p-3.5 border-t-2 border-loopa-charcoal bg-loopa-cream/70 space-y-2.5">
            <div className="flex items-center gap-2.5 px-2">
              <div className="w-8 h-8 rounded-xl bg-loopa-lavender border-2 border-loopa-charcoal flex items-center justify-center text-loopa-charcoal shrink-0">
                <Shield className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display font-black text-xs text-loopa-charcoal truncate">
                  {currentUser.full_name}
                </p>
                <p className="text-[10px] font-semibold text-loopa-muted truncate">
                  {currentUser.email}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/"
                className="py-2 px-2.5 rounded-2xl bg-white hover:bg-loopa-lime text-loopa-charcoal border-2 border-loopa-charcoal text-[11px] font-black transition-colors flex items-center justify-center gap-1"
              >
                <span>Toko</span>
                <ArrowUpRight className="w-3 h-3" />
              </Link>
              <button
                type="button"
                onClick={() => {
                  startAuthTransition({ mode: "logout" }, () => {
                    DataStore.logoutUser();
                    window.dispatchEvent(new Event("user_role_changed"));
                    router.push("/login");
                  });
                }}
                className="py-2 px-2.5 rounded-2xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border-2 border-rose-300 text-[11px] font-black transition-colors flex items-center justify-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* =========================================================================
          RIGHT MAIN SUPERADMIN CONTENT PANE
          ========================================================================= */}
      <main className="flex-1 min-w-0 p-4 sm:p-8 lg:p-10 max-w-6xl w-full overflow-x-clip">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-loopa-charcoal mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-loopa-coral animate-pulse border border-loopa-charcoal" />
              <span className="text-[10px] font-black uppercase tracking-wider text-loopa-muted">
                LOOPA Platform Governance
              </span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-loopa-charcoal mt-1">
              {activeTab === "overview" && "Ringkasan & Analitik Seluruh Platform"}
              {activeTab === "users" && "Manajemen Pengguna & Penjual"}
              {activeTab === "products" && "Moderasi Katalog Produk"}
              {activeTab === "orders" && "Pantauan Transaksi & Resolusi Sengketa"}
              {activeTab === "audit" && "Log Audit Keamanan Global"}
            </h1>
          </div>

          <button
            type="button"
            onClick={handleGlobalAutoCancel}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white hover:bg-loopa-lime text-loopa-charcoal border-2 border-loopa-charcoal text-xs font-black transition-all shadow-playful-sm w-fit"
          >
            <RefreshCw className="w-3.5 h-3.5 text-loopa-coral" />
            <span>Jalankan Auto-Cancel 24h</span>
          </button>
        </div>

        {/* Toast Feedback */}
        {toastMsg && (
          <div className="mb-6 p-4 rounded-3xl bg-loopa-lime border-2 border-loopa-charcoal text-xs font-black text-loopa-charcoal flex items-center justify-between shadow-playful-sm">
            <span>✓ {toastMsg}</span>
            <button type="button" onClick={() => setToastMsg(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* =====================================================================
            TAB 1: PLATFORM OVERVIEW & ANALYTICS
            ===================================================================== */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* 4 Global KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl border-2 border-loopa-charcoal p-5 shadow-playful-sm">
                <div className="flex items-center justify-between text-loopa-muted mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    Total GMV Platform
                  </span>
                  <DollarSign className="w-4 h-4 text-loopa-charcoal" />
                </div>
                <div className="text-2xl font-black text-loopa-charcoal font-display">
                  {formatCurrency(platformStats.totalGMV)}
                </div>
                <span className="text-[10px] font-black bg-loopa-lime px-2 py-0.5 rounded-full border border-loopa-charcoal inline-block mt-2">
                  Semua Penjual Lunas
                </span>
              </div>

              <div className="bg-white rounded-3xl border-2 border-loopa-charcoal p-5 shadow-playful-sm">
                <div className="flex items-center justify-between text-loopa-muted mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    Pengguna Terdaftar
                  </span>
                  <Users className="w-4 h-4 text-loopa-charcoal" />
                </div>
                <div className="text-2xl font-black text-loopa-charcoal font-display">
                  {platformStats.totalUsers} Akun
                </div>
                <span className="text-[11px] text-loopa-muted font-bold block mt-2">
                  {platformStats.totalSellers} Penjual • {platformStats.totalMembers} Pembeli
                </span>
              </div>

              <div className="bg-white rounded-3xl border-2 border-loopa-charcoal p-5 shadow-playful-sm">
                <div className="flex items-center justify-between text-loopa-muted mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    Katalog Etalase
                  </span>
                  <Shirt className="w-4 h-4 text-loopa-charcoal" />
                </div>
                <div className="text-2xl font-black text-loopa-charcoal font-display">
                  {platformStats.activeProducts} Aktif
                </div>
                <span className="text-[11px] text-loopa-muted font-bold block mt-2">
                  Dari total {platformStats.totalProducts} produk terdaftar
                </span>
              </div>

              <div className="bg-white rounded-3xl border-2 border-loopa-charcoal p-5 shadow-playful-sm">
                <div className="flex items-center justify-between text-loopa-muted mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">
                    Perlu Pantauan
                  </span>
                  <AlertTriangle className="w-4 h-4 text-loopa-coral" />
                </div>
                <div className="text-2xl font-black text-loopa-coral font-display">
                  {platformStats.attentionOrders} Order
                </div>
                <span className="text-[11px] text-loopa-muted font-bold block mt-2">
                  {platformStats.suspendedUsers} akun ditangguhkan
                </span>
              </div>
            </div>

            {/* Platform-wide Interactive Analytics Charts */}
            <SellerAnalyticsCharts
              orders={orders}
              products={products.filter((p) => p.is_active)}
            />

            {/* Top Sellers Leaderboard */}
            <div className="bg-white rounded-4xl border-2 border-loopa-charcoal p-6 shadow-playful space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-loopa-coral" />
                  <h2 className="font-display font-black text-base text-loopa-charcoal">
                    Peringkat Studio Penjual di Platform
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("users")}
                  className="text-xs font-black text-loopa-charcoal hover:underline"
                >
                  Kelola Semua Pengguna →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {topSellers.map((row, idx) => (
                  <div
                    key={row.seller.id}
                    className="p-4 rounded-3xl bg-loopa-cream border border-loopa-charcoal flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-7 h-7 rounded-full bg-loopa-charcoal text-white text-xs font-black flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-display font-black text-xs text-loopa-charcoal truncate">
                            {row.seller.full_name}
                          </h4>
                          {row.seller.verified_fashion_seller && (
                            <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-loopa-muted font-semibold truncate">
                          @{row.seller.handle} • {row.activeCount} produk • {row.ordersCount} order
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-loopa-muted uppercase block">
                        GMV Lunas
                      </span>
                      <span className="text-xs font-black text-loopa-charcoal">
                        {formatCurrency(row.verifiedGMV)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: USER & SELLER MANAGEMENT
            ===================================================================== */}
        {activeTab === "users" && (
          <div className="space-y-5">
            {/* Search & Role Filter */}
            <div className="bg-white rounded-3xl border-2 border-loopa-charcoal p-4 shadow-playful-sm flex flex-col sm:flex-row gap-3 justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-loopa-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Cari nama, @handle, atau email pengguna..."
                  className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-full border-2 border-loopa-charcoal bg-loopa-cream focus:bg-white focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { key: "all", label: "Semua" },
                    { key: "seller", label: "Penjual" },
                    { key: "member", label: "Pembeli" },
                    { key: "suspended", label: "Ditangguhkan" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setUserRoleFilter(f.key)}
                    className={`px-3.5 py-2 rounded-full text-xs font-black border-2 border-loopa-charcoal transition-colors ${
                      userRoleFilter === f.key
                        ? "bg-loopa-charcoal text-white"
                        : "bg-white text-loopa-charcoal hover:bg-loopa-cream"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Users List */}
            <div className="space-y-3">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className={`bg-white rounded-3xl border-2 p-4 sm:p-5 shadow-playful-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    u.is_suspended
                      ? "border-rose-400 bg-rose-50/40"
                      : "border-loopa-charcoal"
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    {u.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={u.avatar_url}
                        alt={u.full_name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-loopa-charcoal shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-loopa-lavender font-black flex items-center justify-center border-2 border-loopa-charcoal shrink-0">
                        {u.full_name.charAt(0)}
                      </div>
                    )}

                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display font-black text-sm text-loopa-charcoal">
                          {u.full_name}
                        </h3>
                        <span
                          className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-loopa-charcoal ${
                            u.role === "seller"
                              ? "bg-loopa-lime text-loopa-charcoal"
                              : "bg-loopa-lavender text-loopa-charcoal"
                          }`}
                        >
                          {u.role === "seller" ? "Penjual" : "Pembeli"}
                        </span>
                        {u.role === "seller" && u.verified_fashion_seller && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                            <BadgeCheck className="w-3 h-3" />
                            Verified
                          </span>
                        )}
                        {u.is_suspended && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-800 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
                            <Ban className="w-3 h-3" />
                            Ditangguhkan
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-loopa-muted font-semibold break-words">
                        @{u.handle} • {u.email || "-"} • {u.phone || "-"} •{" "}
                        {u.city || "Indonesia"}
                      </p>

                      {u.role === "seller" && u.bank_account_number && (
                        <p className="text-[11px] font-bold text-loopa-charcoal">
                          Rekening: {u.bank_name} {u.bank_account_number} (a.n.{" "}
                          {u.bank_account_holder})
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-loopa-muted bg-loopa-cream px-2 py-0.5 rounded-full border border-loopa-border">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Sandi: •••••••• (Terenkripsi)</span>
                        </span>
                        {u.must_change_password && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                            <KeyRound className="w-2.5 h-2.5" />
                            <span>Sandi Sementara Aktif</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Moderation Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setResetTargetUser(u);
                        setTempPasswordInput(generateRandomTempPass());
                        setIssuedTempPass(null);
                        setCopiedResetMsg(false);
                      }}
                      className="px-3.5 py-2 rounded-full bg-loopa-lavender/70 hover:bg-loopa-lavender text-loopa-charcoal text-xs font-black border-2 border-loopa-charcoal transition-colors inline-flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Reset Sandi</span>
                    </button>

                    {u.role === "seller" && (
                      <button
                        type="button"
                        onClick={() => handleToggleVerifySeller(u)}
                        className="px-3.5 py-2 rounded-full bg-white hover:bg-loopa-lime text-loopa-charcoal text-xs font-black border-2 border-loopa-charcoal transition-colors inline-flex items-center gap-1.5"
                      >
                        <BadgeCheck className="w-3.5 h-3.5" />
                        <span>
                          {u.verified_fashion_seller
                            ? "Cabut Verified"
                            : "Verifikasi Seller"}
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleToggleSuspend(u)}
                      className={`px-3.5 py-2 rounded-full text-xs font-black border-2 transition-colors inline-flex items-center gap-1.5 ${
                        u.is_suspended
                          ? "bg-loopa-lime text-loopa-charcoal border-loopa-charcoal hover:bg-loopa-charcoal hover:text-white"
                          : "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-600 hover:text-white"
                      }`}
                    >
                      {u.is_suspended ? (
                        <>
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Aktifkan Akun</span>
                        </>
                      ) : (
                        <>
                          <Ban className="w-3.5 h-3.5" />
                          <span>Tangguhkan</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 3: PRODUCT MODERATION
            ===================================================================== */}
        {activeTab === "products" && (
          <div className="space-y-5">
            <div className="bg-white rounded-3xl border-2 border-loopa-charcoal p-4 shadow-playful-sm flex flex-col sm:flex-row gap-3 justify-between">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-loopa-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Cari nama produk, kategori, atau studio penjual..."
                  className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-full border-2 border-loopa-charcoal bg-loopa-cream focus:bg-white focus:outline-none"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { key: "all", label: "Semua" },
                    { key: "active", label: "Tayang Aktif" },
                    { key: "inactive", label: "Diturunkan" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setProductStatusFilter(f.key)}
                    className={`px-3.5 py-2 rounded-full text-xs font-black border-2 border-loopa-charcoal transition-colors ${
                      productStatusFilter === f.key
                        ? "bg-loopa-charcoal text-white"
                        : "bg-white text-loopa-charcoal hover:bg-loopa-cream"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className={`bg-white rounded-3xl border-2 p-4 shadow-playful-sm flex gap-4 ${
                    p.is_active
                      ? "border-loopa-charcoal"
                      : "border-rose-300 bg-rose-50/40"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.images[0] || ""}
                    alt={p.name}
                    className="w-20 h-24 rounded-2xl object-cover border-2 border-loopa-charcoal shrink-0"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-black uppercase text-loopa-muted truncate">
                          {p.category}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            p.is_active
                              ? "bg-loopa-lime text-loopa-charcoal border-loopa-charcoal"
                              : "bg-rose-100 text-rose-800 border-rose-300"
                          }`}
                        >
                          {p.is_active ? "Aktif" : "Diturunkan"}
                        </span>
                      </div>
                      <h4 className="font-display font-black text-xs text-loopa-charcoal line-clamp-2 mt-0.5">
                        {p.name}
                      </h4>
                      <p className="text-[11px] text-loopa-muted font-semibold mt-0.5">
                        Oleh: {p.seller?.full_name || "Seller"} • Stok: {p.stock}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-loopa-border">
                      <span className="font-display font-black text-xs text-loopa-charcoal">
                        {formatCurrency(p.price)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleProduct(p)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-black border transition-colors ${
                          p.is_active
                            ? "bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-600 hover:text-white"
                            : "bg-loopa-lime text-loopa-charcoal border-loopa-charcoal hover:bg-loopa-charcoal hover:text-white"
                        }`}
                      >
                        {p.is_active ? "Takedown" : "Pulihkan"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 4: PLATFORM ORDERS & DISPUTE RESOLUTION
            ===================================================================== */}
        {activeTab === "orders" && (
          <div className="space-y-5">
            <div className="bg-white rounded-3xl border-2 border-loopa-charcoal p-3 shadow-playful-sm flex flex-wrap gap-2">
              {(
                [
                  { key: "all", label: "Semua" },
                  { key: "pending", label: "Menunggu Bayar" },
                  { key: "payment_uploaded", label: "Menunggu Verifikasi" },
                  { key: "verified", label: "Terverifikasi" },
                  { key: "rejected", label: "Ditolak" },
                  { key: "cancelled", label: "Dibatalkan" },
                ] as const
              ).map((st) => (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => setOrderStatusFilter(st.key)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-black border-2 transition-colors ${
                    orderStatusFilter === st.key
                      ? "bg-loopa-charcoal text-white border-loopa-charcoal"
                      : "bg-loopa-cream text-loopa-charcoal border-transparent hover:border-loopa-charcoal"
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border-2 border-loopa-charcoal p-5 shadow-playful-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={order.product?.images[0] || ""}
                      alt={order.product?.name || "Piece"}
                      className="w-14 h-16 rounded-2xl object-cover border-2 border-loopa-charcoal shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono font-black text-loopa-muted">
                          {order.id}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border border-loopa-charcoal uppercase ${
                            order.status === "verified"
                              ? "bg-loopa-lime text-loopa-charcoal"
                              : order.status === "payment_uploaded"
                              ? "bg-loopa-coral text-white"
                              : order.status === "rejected"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-loopa-cream text-loopa-charcoal"
                          }`}
                        >
                          {order.status.replace("_", " ")}
                        </span>
                      </div>
                      <h4 className="font-display font-black text-sm text-loopa-charcoal truncate mt-0.5">
                        {order.product?.name}
                      </h4>
                      <p className="text-[11px] text-loopa-muted font-semibold">
                        Pembeli: <strong>{order.customer_contact.name}</strong> → Penjual:{" "}
                        <strong>{order.seller?.full_name}</strong> •{" "}
                        {formatCurrency(order.total_price)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedOrder(order);
                      setDisputeNote("");
                    }}
                    className="px-4 py-2 rounded-full bg-loopa-charcoal hover:bg-loopa-lime hover:text-loopa-charcoal text-white text-xs font-black border-2 border-loopa-charcoal transition-colors inline-flex items-center gap-1.5 shrink-0 w-fit"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspeksi / Resolusi</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 5: GLOBAL AUDIT LOGS
            ===================================================================== */}
        {activeTab === "audit" && (
          <div className="bg-white rounded-4xl border-2 border-loopa-charcoal p-6 shadow-playful space-y-3">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-3xl bg-loopa-cream border border-loopa-charcoal flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-loopa-charcoal text-white text-[10px] font-black font-mono">
                      {log.action}
                    </span>
                    <span className="font-black text-loopa-charcoal">
                      {log.actor_name}
                    </span>
                    <span className="text-[11px] font-mono text-loopa-muted">
                      ({log.order_id})
                    </span>
                  </div>
                  {log.details && (
                    <p className="text-[11px] text-loopa-muted font-semibold break-words">
                      {Object.entries(log.details)
                        .filter(([, v]) => v !== undefined && v !== null)
                        .map(([k, v]) => `${k}: ${String(v)}`)
                        .join(" • ")}
                    </p>
                  )}
                </div>
                <span className="text-[11px] font-bold text-loopa-muted whitespace-nowrap shrink-0">
                  {formatDate(log.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* =========================================================================
          DISPUTE / ORDER INTERVENTION MODAL
          ========================================================================= */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="max-w-xl w-full bg-white rounded-4xl border-2 border-loopa-charcoal p-6 shadow-playful space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b-2 border-loopa-border">
              <div>
                <span className="text-[10px] font-mono font-bold text-loopa-muted block">
                  INTERVENSI SUPERADMIN • {selectedOrder.id}
                </span>
                <h3 className="font-display font-black text-lg text-loopa-charcoal">
                  Inspeksi Bukti &amp; Resolusi Sengketa
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-full bg-loopa-cream border border-loopa-charcoal hover:bg-loopa-coral hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-loopa-cream border border-loopa-charcoal text-xs space-y-1">
              <p>
                <strong>Produk:</strong> {selectedOrder.product?.name} (Size{" "}
                {selectedOrder.selected_size})
              </p>
              <p>
                <strong>Pembeli:</strong> {selectedOrder.customer_contact.name} (
                {selectedOrder.customer_contact.phone})
              </p>
              <p>
                <strong>Penjual:</strong> {selectedOrder.seller?.full_name} (@
                {selectedOrder.seller?.handle})
              </p>
              <p>
                <strong>Total Tagihan:</strong>{" "}
                <span className="font-black">
                  {formatCurrency(selectedOrder.total_price)}
                </span>
              </p>
            </div>

            {selectedOrder.payment_proof_url ? (
              <div className="rounded-2xl overflow-hidden border-2 border-loopa-charcoal bg-stone-900 max-h-64 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedOrder.payment_proof_url}
                  alt="Bukti Transfer"
                  className="max-h-64 w-auto object-contain"
                />
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-loopa-cream border-2 border-dashed border-loopa-charcoal text-center text-xs font-bold text-loopa-muted">
                Pembeli belum mengunggah bukti transfer.
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                Catatan Keputusan Superadmin (Opsional):
              </label>
              <input
                type="text"
                value={disputeNote}
                onChange={(e) => setDisputeNote(e.target.value)}
                placeholder="Contoh: Bukti valid terkonfirmasi atau bukti tidak sesuai mutasi..."
                className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleResolveDispute("approve")}
                className="py-2.5 px-3 rounded-full bg-loopa-lime hover:bg-loopa-charcoal hover:text-white text-loopa-charcoal text-xs font-black border-2 border-loopa-charcoal transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Setujui Lunas</span>
              </button>
              <button
                type="button"
                onClick={() => handleResolveDispute("reject")}
                className="py-2.5 px-3 rounded-full bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white text-xs font-black border-2 border-rose-300 transition-colors flex items-center justify-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Tolak Bukti</span>
              </button>
              <button
                type="button"
                onClick={() => handleResolveDispute("cancel")}
                className="py-2.5 px-3 rounded-full bg-white hover:bg-loopa-cream text-loopa-charcoal text-xs font-black border-2 border-loopa-charcoal transition-colors"
              >
                Batalkan Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SECURE TEMPORARY PASSWORD RESET MODAL (OWASP BEST PRACTICE)
          ========================================================================= */}
      {resetTargetUser && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setResetTargetUser(null)}
        >
          <div
            className="max-w-lg w-full bg-white rounded-4xl border-2 border-loopa-charcoal p-6 shadow-playful space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b-2 border-loopa-border">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-loopa-lavender border border-loopa-charcoal">
                  <KeyRound className="w-4 h-4 text-loopa-charcoal" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-loopa-muted block">
                    Pemulihan Akun Aman (OWASP)
                  </span>
                  <h3 className="font-display font-black text-base text-loopa-charcoal">
                    Reset Kata Sandi Sementara
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetTargetUser(null)}
                className="p-1.5 rounded-full bg-loopa-cream border border-loopa-charcoal hover:bg-loopa-coral hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Security explanation */}
            <div className="p-3.5 rounded-2xl bg-loopa-cream border border-loopa-charcoal text-[11px] text-loopa-charcoal leading-relaxed">
              <strong className="font-black">Mengapa kata sandi asli tidak ditampilkan?</strong>{" "}
              Sesuai standar keamanan OWASP &amp; privasi pengguna, kata sandi lama bersifat terenkripsi satu arah. Jika pengguna lupa kata sandi, Superadmin menerbitkan <strong>Kata Sandi Sementara</strong> dan pengguna akan diminta menggantinya di menu Profil setelah masuk.
            </div>

            {/* Target Account Info */}
            <div className="p-3.5 rounded-2xl bg-white border-2 border-loopa-charcoal text-xs flex items-center justify-between gap-2">
              <div>
                <p className="font-black text-loopa-charcoal">
                  {resetTargetUser.full_name} (@{resetTargetUser.handle})
                </p>
                <p className="text-[11px] text-loopa-muted font-semibold">
                  {resetTargetUser.email || "-"} • {resetTargetUser.phone || "-"}
                </p>
              </div>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-loopa-lime border border-loopa-charcoal">
                {resetTargetUser.role}
              </span>
            </div>

            {!issuedTempPass ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                    Kata Sandi Sementara Baru (min. 6 karakter):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tempPasswordInput}
                      onChange={(e) => setTempPasswordInput(e.target.value)}
                      placeholder="Contoh: LOOPA-8492"
                      className="flex-1 px-3.5 py-2.5 font-mono text-xs font-black rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
                    />
                    <button
                      type="button"
                      onClick={() => setTempPasswordInput(generateRandomTempPass())}
                      className="px-3.5 py-2 rounded-2xl bg-loopa-cream hover:bg-loopa-lime border-2 border-loopa-charcoal text-xs font-black text-loopa-charcoal inline-flex items-center gap-1 shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Acak</span>
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const res = DataStore.adminResetUserPassword(
                      resetTargetUser.id,
                      tempPasswordInput
                    );
                    if (!res.success || !res.tempPassword) {
                      showToast(res.error || "Gagal reset kata sandi.");
                      return;
                    }
                    setIssuedTempPass(res.tempPassword);
                    refreshAll();
                    showToast(
                      `Kata sandi sementara untuk @${resetTargetUser.handle} berhasil diterapkan.`
                    );
                  }}
                  className="w-full py-3 rounded-full bg-loopa-charcoal hover:bg-loopa-lime hover:text-loopa-charcoal text-white text-xs font-black border-2 border-loopa-charcoal transition-all shadow-playful-sm"
                >
                  Terapkan Reset Kata Sandi Sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-3xl bg-loopa-lime border-2 border-loopa-charcoal space-y-2 text-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-loopa-charcoal block">
                    ✓ Reset Berhasil • Kirimkan ke Pengguna
                  </span>
                  <div className="font-mono font-black text-2xl text-loopa-charcoal tracking-wider bg-white py-2 px-4 rounded-2xl border-2 border-loopa-charcoal inline-block">
                    {issuedTempPass}
                  </div>
                  <p className="text-[11px] font-bold text-loopa-charcoal">
                    Pengguna kini bisa login dengan sandi ini dan akan mendapat pengingat ganti sandi di halaman Profil.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const msg = `Halo ${resetTargetUser.full_name}, ini kata sandi sementara akun LOOPA Anda (@${resetTargetUser.handle}): ${issuedTempPass}. Silakan login lalu segera ganti kata sandi Anda di menu Profil > Keamanan & Kata Sandi.`;
                    navigator.clipboard?.writeText(msg);
                    setCopiedResetMsg(true);
                    setTimeout(() => setCopiedResetMsg(false), 2500);
                  }}
                  className="w-full py-3 rounded-full bg-loopa-charcoal hover:bg-loopa-lavender hover:text-loopa-charcoal text-white text-xs font-black border-2 border-loopa-charcoal transition-colors flex items-center justify-center gap-2"
                >
                  {copiedResetMsg ? (
                    <>
                      <Check className="w-4 h-4 text-loopa-lime" />
                      <span>Pesan Pemulihan Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Pesan Pemulihan untuk WhatsApp / Email</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

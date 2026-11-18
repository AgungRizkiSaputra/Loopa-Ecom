"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataStore } from "@/lib/storage";
import { startAuthTransition } from "@/lib/auth-transition";
import { Order, Product, Profile, SellerStats, FashionCondition } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { SellerAnalyticsCharts } from "@/components/seller-analytics-charts";
import {
  LayoutDashboard,
  DollarSign,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ShieldCheck,
  RefreshCw,
  Eye,
  AlertTriangle,
  Lock,
  Sparkles,
  Store,
  Shirt,
  Settings,
  ArrowUpRight,
  LogOut,
  ChevronRight,
  TrendingUp,
  MessageSquare,
  Radio,
} from "lucide-react";

export default function SellerDashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Sidebar navigation active view: 'overview' | 'orders' | 'inventory' | 'autocancel'
  const [activeSidebarNav, setActiveSidebarNav] = useState<
    "overview" | "orders" | "inventory" | "autocancel"
  >("overview");

  // Verification modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoCancelCount, setAutoCancelCount] = useState<number | null>(null);

  // New fashion piece form state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("Vintage Archive");
  const [newProdCondition, setNewProdCondition] = useState<FashionCondition>("Vintage / Thrift");
  const [newProdSizes, setNewProdSizes] = useState("S, M, L");
  const [newProdColor, setNewProdColor] = useState("Faded Moss");
  const [newProdPrice, setNewProdPrice] = useState<number>(450000);
  const [newProdStock, setNewProdStock] = useState<number>(3);
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdImg, setNewProdImg] = useState("");

  const refreshDashboard = () => {
    DataStore.init();
    const user = DataStore.getCurrentUser();
    setCurrentUser(user);

    if (user && user.role === "seller") {
      setStats(DataStore.getSellerStats(user.id));
      setOrders(DataStore.getOrders().filter((o) => o.seller_id === user.id));
      setProducts(DataStore.getProducts().filter((p) => p.seller_id === user.id));
      setUnreadChatCount(DataStore.getUnreadMessageCount(user.id));
    }
  };

  useEffect(() => {
    refreshDashboard();
    if (typeof window !== "undefined") {
      const tab = new URLSearchParams(window.location.search).get("tab");
      if (tab === "orders" || tab === "inventory" || tab === "autocancel" || tab === "overview") {
        setActiveSidebarNav(tab);
      }
    }
    window.addEventListener("user_role_changed", refreshDashboard);
    window.addEventListener("messages_updated", refreshDashboard);
    return () => {
      window.removeEventListener("user_role_changed", refreshDashboard);
      window.removeEventListener("messages_updated", refreshDashboard);
    };
  }, []);

  // PRD Role Guard: Only sellers have access to the dashboard
  if (!currentUser || currentUser.role !== "seller") {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white rounded-4xl border-2 border-loopa-charcoal p-8 shadow-playful text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-loopa-coral border-2 border-loopa-charcoal shadow-playful-sm flex items-center justify-center text-white mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-display font-black text-2xl text-loopa-charcoal">
              Akses Seller Studio Terkunci
            </h2>
            <p className="text-xs text-loopa-muted font-medium mt-1 leading-relaxed">
              Halaman admin ini khusus untuk penjual (stylist). Silakan masuk ke akun penjual atau daftar studio baru.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <Link
              href="/login"
              className="w-full py-3 px-4 rounded-full bg-loopa-charcoal text-white text-xs font-black hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal transition-all shadow-playful-sm block"
            >
              Masuk ke Akun Penjual
            </Link>
            <Link
              href="/register"
              className="w-full py-3 px-4 rounded-full bg-white text-loopa-charcoal text-xs font-black hover:bg-loopa-cream border-2 border-loopa-charcoal transition-all shadow-playful-sm block"
            >
              Daftar sebagai Penjual Baru
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleVerifyAction = (action: "approve" | "reject") => {
    if (!selectedOrder) return;
    setIsProcessing(true);

    setTimeout(() => {
      DataStore.verifyOrder(selectedOrder.id, action, rejectionReason || undefined);
      setIsProcessing(false);
      setSelectedOrder(null);
      setRejectionReason("");
      refreshDashboard();
    }, 500);
  };

  const handleRunAutoCancel = () => {
    const count = DataStore.checkAndCancelExpiredOrders();
    setAutoCancelCount(count);
    refreshDashboard();
    setTimeout(() => setAutoCancelCount(null), 4000);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdImg.trim()) return;

    const sizesArray = newProdSizes.split(",").map((s) => s.trim()).filter(Boolean);

    DataStore.addProduct({
      seller_id: currentUser.id,
      seller: currentUser,
      name: newProdName.trim(),
      description: newProdDesc.trim(),
      price: Number(newProdPrice),
      stock: Number(newProdStock),
      category: newProdCategory,
      sizes: sizesArray.length > 0 ? sizesArray : ["One Size"],
      condition: newProdCondition,
      color: newProdColor.trim() || undefined,
      images: [newProdImg.trim()],
    });

    setShowAddProductModal(false);
    setNewProdName("");
    setNewProdDesc("");
    setNewProdImg("");
    refreshDashboard();
  };

  const pendingVerificationOrders = orders.filter((o) => o.status === "payment_uploaded");

  const sellerSidebarItems: {
    id: "overview" | "orders" | "inventory" | "autocancel";
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
        sublabel: "Omzet & Analitik Toko",
        icon: LayoutDashboard,
        accent: "bg-loopa-lime",
      },
      {
        id: "orders",
        num: "02",
        label: "Pesanan & Verifikasi",
        sublabel: "Inspeksi Bukti Transfer",
        icon: Package,
        accent: "bg-loopa-coral",
        badge: pendingVerificationOrders.length || undefined,
        badgeTone: "coral",
      },
      {
        id: "inventory",
        num: "03",
        label: "Koleksi & Stok",
        sublabel: "Kelola Etalase Pakaian",
        icon: Shirt,
        accent: "bg-loopa-lavender",
        badge: products.length,
        badgeTone: "charcoal",
      },
      {
        id: "autocancel",
        num: "04",
        label: "Auto-Cancel 24 Jam",
        sublabel: "Proteksi Stok Pending",
        icon: RefreshCw,
        accent: "bg-loopa-cream",
      },
    ];

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-loopa-cream flex flex-col md:flex-row">
      {/* =========================================================================
          FLOATING TACTILE EDITORIAL COMMAND DOCK (MATCHING SUPERADMIN SIDEBAR)
          ========================================================================= */}
      <div className="w-full md:w-80 shrink-0 p-3 sm:p-4 md:p-5">
        <aside className="w-full bg-white rounded-4xl border-2 border-loopa-charcoal shadow-playful overflow-hidden flex flex-col justify-between md:sticky md:top-5 md:min-h-[calc(100vh-2.5rem)]">
          <div>
            {/* Editorial Electric Lime Studio Ribbon */}
            <div className="bg-loopa-lime border-b-2 border-loopa-charcoal p-5 relative overflow-hidden">
              <div className="flex items-start justify-between gap-2 relative z-10">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-loopa-charcoal text-loopa-lime text-[9px] font-black uppercase tracking-widest mb-2">
                    <Radio className="w-2.5 h-2.5 animate-pulse" />
                    <span>STUDIO // LIVE</span>
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display font-black text-3xl tracking-tight text-loopa-charcoal leading-none">
                      loopa
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white border border-loopa-charcoal -rotate-3 inline-block shadow-playful-sm">
                      studio
                    </span>
                  </div>
                </div>

                <Link
                  href="/"
                  title="Lihat Etalase Publik"
                  className="p-2 rounded-2xl bg-white hover:bg-loopa-charcoal hover:text-loopa-lime text-loopa-charcoal border-2 border-loopa-charcoal shadow-playful-sm transition-colors"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Mini Live Studio Telemetry Strip */}
              <div className="grid grid-cols-3 gap-1.5 mt-4 relative z-10">
                <div className="bg-white/95 rounded-2xl border border-loopa-charcoal px-2 py-1.5 text-center">
                  <span className="text-[9px] font-black uppercase text-loopa-muted block leading-none">
                    Pieces
                  </span>
                  <span className="font-display font-black text-xs text-loopa-charcoal">
                    {products.length}
                  </span>
                </div>
                <div className="bg-white/95 rounded-2xl border border-loopa-charcoal px-2 py-1.5 text-center">
                  <span className="text-[9px] font-black uppercase text-loopa-muted block leading-none">
                    Order
                  </span>
                  <span className="font-display font-black text-xs text-loopa-charcoal">
                    {orders.length}
                  </span>
                </div>
                <div className="bg-loopa-charcoal text-white rounded-2xl border border-loopa-charcoal px-2 py-1.5 text-center">
                  <span className="text-[9px] font-black uppercase text-loopa-lime block leading-none">
                    Verif
                  </span>
                  <span className="font-display font-black text-xs">
                    {pendingVerificationOrders.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Numbered Editorial Navigation Stack */}
            <nav className="p-3.5 space-y-2">
              <div className="flex items-center justify-between px-2 pb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-loopa-muted">
                  Studio Deck
                </span>
                <span className="text-[10px] font-mono font-bold text-loopa-muted">
                  @{currentUser.handle}
                </span>
              </div>

              {sellerSidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSidebarNav === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveSidebarNav(item.id)}
                    className={`w-full group p-2.5 rounded-3xl border-2 text-left transition-all flex items-center gap-3 ${isActive
                        ? "bg-loopa-charcoal text-white border-loopa-charcoal shadow-playful-sm"
                        : "bg-loopa-cream/55 text-loopa-charcoal border-transparent hover:border-loopa-charcoal hover:bg-white"
                      }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-2xl border-2 border-loopa-charcoal flex items-center justify-center shrink-0 transition-transform ${isActive
                          ? `${item.accent} text-loopa-charcoal -rotate-3`
                          : "bg-white text-loopa-charcoal group-hover:rotate-3"
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-mono font-black ${isActive ? "text-loopa-lime" : "text-loopa-muted"
                            }`}
                        >
                          {item.num}
                        </span>
                        <span className="font-display font-black text-xs truncate">
                          {item.label}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-semibold block truncate ${isActive ? "text-white/70" : "text-loopa-muted"
                          }`}
                      >
                        {item.sublabel}
                      </span>
                    </div>

                    {item.badge !== undefined ? (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black border shrink-0 ${item.badgeTone === "coral"
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
                        className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-loopa-lime" : "opacity-40"
                          }`}
                      />
                    )}
                  </button>
                );
              })}

              {/* Quick Studio Links */}
              <div className="pt-2 mt-2 border-t border-loopa-border space-y-1.5">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(true)}
                  className="w-full py-2.5 px-3.5 rounded-2xl bg-loopa-lime hover:bg-loopa-charcoal hover:text-white text-loopa-charcoal border-2 border-loopa-charcoal text-xs font-black transition-all shadow-playful-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Drop Piece Baru</span>
                </button>

                <div className="grid grid-cols-2 gap-1.5">
                  <Link
                    href="/chat"
                    className="py-2 px-2.5 rounded-2xl bg-loopa-cream hover:bg-white text-loopa-charcoal border border-loopa-charcoal text-[11px] font-black transition-colors flex items-center justify-center gap-1.5 relative"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-loopa-coral shrink-0" />
                    <span className="truncate">Chat</span>
                    {unreadChatCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-loopa-coral text-white text-[9px] font-black border border-loopa-charcoal">
                        {unreadChatCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    href="/profile"
                    className="py-2 px-2.5 rounded-2xl bg-loopa-cream hover:bg-white text-loopa-charcoal border border-loopa-charcoal text-[11px] font-black transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Store className="w-3.5 h-3.5 text-loopa-charcoal" />
                    <span>Rekening</span>
                  </Link>
                </div>
              </div>
            </nav>
          </div>

          {/* Stylist Operator Footer Dock */}
          <div className="p-3.5 border-t-2 border-loopa-charcoal bg-loopa-cream/70 space-y-2.5">
            <div className="flex items-center gap-2.5 px-2">
              {currentUser.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.full_name}
                  className="w-8 h-8 rounded-xl object-cover border-2 border-loopa-charcoal shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-xl bg-loopa-lavender border-2 border-loopa-charcoal flex items-center justify-center text-xs font-black text-loopa-charcoal shrink-0">
                  {currentUser.full_name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-display font-black text-xs text-loopa-charcoal truncate">
                  {currentUser.full_name}
                </p>
                <p className="text-[10px] font-semibold text-loopa-muted truncate">
                  {currentUser.city || "Jakarta"} • {currentUser.bank_name || "BCA"}
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
          RIGHT MAIN ADMIN CONTENT PANE
          ========================================================================= */}
      <main className="flex-1 min-w-0 p-4 sm:p-8 lg:p-10 max-w-6xl w-full overflow-x-clip">
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b-2 border-loopa-charcoal mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-loopa-lime animate-pulse border border-loopa-charcoal" />
              <span className="text-[10px] font-black uppercase tracking-wider text-loopa-muted">
                Studio Active Session
              </span>
            </div>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-loopa-charcoal mt-1">
              {activeSidebarNav === "overview" && "Ringkasan Penjualan & Monetisasi"}
              {activeSidebarNav === "orders" && "Manajemen Verifikasi Pembayaran"}
              {activeSidebarNav === "inventory" && "Katalog Pakaian & Kontrol Stok"}
              {activeSidebarNav === "autocancel" && "Sistem Otomatis Auto-Cancel 24 Jam"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunAutoCancel}
              title="Cek pesanan expired"
              className="p-2.5 rounded-full bg-white border-2 border-loopa-charcoal hover:bg-loopa-cream shadow-playful-sm transition-all"
            >
              <RefreshCw className="w-4 h-4 text-loopa-coral" />
            </button>

            <button
              onClick={() => setShowAddProductModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-loopa-charcoal text-white hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal text-xs font-black transition-all shadow-playful"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Piece Baru</span>
            </button>
          </div>
        </div>

        {/* Auto Cancel Notification Alert */}
        {autoCancelCount !== null && (
          <div className="mb-6 p-4 rounded-3xl bg-loopa-lime border-2 border-loopa-charcoal text-xs font-bold text-loopa-charcoal flex items-center justify-between animate-in fade-in shadow-playful-sm">
            <span>
              {autoCancelCount > 0
                ? `Auto-cancel 24 jam sukses: ${autoCancelCount} pesanan kadaluwarsa dibatalkan dan stok dikembalikan ke etalase.`
                : "Tidak ada pesanan pending yang melewati batas 24 jam saat ini."}
            </span>
            <span className="font-black">Berhasil</span>
          </div>
        )}

        {/* TAB 1: OVERVIEW & GMV ANALYTICS */}
        {activeSidebarNav === "overview" && (
          <div className="space-y-8 animate-in fade-in">
            {/* 4 Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-3xl border-2 border-loopa-charcoal p-5 shadow-playful-sm">
                <div className="flex items-center justify-between text-loopa-muted mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">Total GMV Omzet</span>
                  <DollarSign className="w-4 h-4 text-loopa-charcoal" />
                </div>
                <div className="text-2xl font-black text-loopa-charcoal font-display">
                  {formatCurrency(stats?.total_revenue || 0)}
                </div>
                <span className="text-[10px] text-loopa-charcoal font-black bg-loopa-lime px-2 py-0.5 rounded-full border border-loopa-charcoal inline-block mt-2">
                  Terverifikasi Lunas
                </span>
              </div>

              <div className="bg-white rounded-3xl border-2 border-loopa-charcoal p-5 shadow-playful-sm">
                <div className="flex items-center justify-between text-loopa-muted mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">Perlu Verifikasi</span>
                  <Clock className="w-4 h-4 text-loopa-coral" />
                </div>
                <div className="text-2xl font-black text-loopa-coral font-display">
                  {stats?.pending_verification || 0}
                </div>
                <span className="text-[10px] text-white font-bold bg-loopa-coral px-2 py-0.5 rounded-full border border-loopa-charcoal inline-block mt-2">
                  Struk menunggu
                </span>
              </div>

              <div className="bg-white rounded-3xl border-2 border-loopa-charcoal p-5 shadow-playful-sm">
                <div className="flex items-center justify-between text-loopa-muted mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">Total Pesanan</span>
                  <Package className="w-4 h-4 text-loopa-charcoal" />
                </div>
                <div className="text-2xl font-black text-loopa-charcoal font-display">
                  {stats?.orders_count || 0}
                </div>
                <span className="text-[11px] text-loopa-muted font-bold block mt-2">
                  Konversi: {stats?.conversion_rate || 0}%
                </span>
              </div>

              <div className="bg-white rounded-3xl border-2 border-loopa-charcoal p-5 shadow-playful-sm">
                <div className="flex items-center justify-between text-loopa-muted mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">Stok Katalog</span>
                  <Shirt className="w-4 h-4 text-loopa-charcoal" />
                </div>
                <div className="text-2xl font-black text-loopa-charcoal font-display">
                  {stats?.active_products_count || 0} Pieces
                </div>
                <span className="text-[11px] text-loopa-muted font-bold block mt-2">
                  Etalase aktif
                </span>
              </div>
            </div>

            {/* Interactive Sales, Status, Category & Product Performance Charts */}
            <SellerAnalyticsCharts orders={orders} products={products} />

            {/* Quick Action Pending Orders Alert */}
            {pendingVerificationOrders.length > 0 && (
              <div className="bg-white rounded-4xl border-2 border-loopa-charcoal p-6 shadow-playful space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-loopa-coral animate-ping" />
                    <h3 className="font-display font-black text-base text-loopa-charcoal">
                      Pesanan Masuk Menunggu Verifikasi ({pendingVerificationOrders.length})
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveSidebarNav("orders")}
                    className="text-xs font-bold text-loopa-charcoal hover:underline"
                  >
                    Buka Semua
                  </button>
                </div>

                <div className="space-y-3">
                  {pendingVerificationOrders.slice(0, 2).map((order) => (
                    <div
                      key={order.id}
                      className="p-4 rounded-3xl bg-loopa-cream border-2 border-loopa-charcoal flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={order.product?.images[0] || ""}
                          alt="Piece"
                          className="w-12 h-14 rounded-xl object-cover border border-loopa-charcoal shrink-0"
                        />
                        <div className="min-w-0">
                          <h4 className="font-display font-bold text-xs text-loopa-charcoal truncate">
                            {order.product?.name}
                          </h4>
                          <p className="text-[11px] text-loopa-muted font-semibold">
                            Pembeli: {order.customer_contact.name} ({order.shipping_address.city}) • Size: {order.selected_size}
                          </p>
                          <span className="text-xs font-black text-loopa-charcoal">
                            {formatCurrency(order.total_price)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="px-4 py-2 rounded-full bg-loopa-lime hover:bg-loopa-charcoal hover:text-white text-loopa-charcoal text-xs font-black border-2 border-loopa-charcoal transition-all shadow-playful-sm shrink-0 flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Verifikasi</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ORDERS & MANUAL VERIFICATION */}
        {activeSidebarNav === "orders" && (
          <div className="space-y-4 animate-in fade-in">
            {orders.length > 0 ? (
              orders.map((order) => {
                const needsVerification = order.status === "payment_uploaded";

                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-4xl border-2 p-5 sm:p-6 transition-all ${needsVerification
                      ? "border-loopa-charcoal shadow-playful ring-2 ring-loopa-lime"
                      : "border-loopa-charcoal shadow-playful-sm"
                      }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-loopa-border">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono font-black text-loopa-charcoal">
                          ID: {order.id}
                        </span>
                        <span className="text-xs text-loopa-muted">•</span>
                        <span className="text-xs font-bold text-loopa-charcoal">
                          Pembeli: {order.customer_contact.name} ({order.customer_contact.phone})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border border-loopa-charcoal ${order.status === "verified"
                            ? "bg-loopa-lime text-loopa-charcoal"
                            : order.status === "payment_uploaded"
                              ? "bg-loopa-coral text-white animate-pulse"
                              : order.status === "rejected"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-loopa-cream text-loopa-charcoal"
                            }`}
                        >
                          {order.status === "payment_uploaded"
                            ? "Perlu Verifikasi"
                            : order.status.replace("_", " ")}
                        </span>
                        <span className="text-[11px] text-loopa-muted font-semibold">
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                    </div>

                    <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={order.product?.images[0] || ""}
                          alt={order.product?.name || "Piece"}
                          className="w-16 h-20 rounded-2xl object-cover shrink-0 border-2 border-loopa-charcoal"
                        />
                        <div>
                          <h4 className="font-display font-bold text-xs sm:text-sm text-loopa-charcoal">
                            {order.product?.name}
                          </h4>
                          <p className="text-xs text-loopa-muted font-medium mt-1">
                            {order.quantity} unit • Size: <strong>{order.selected_size || "Standard"}</strong> • Tujuan: {order.shipping_address.street_address}, {order.shipping_address.city}
                          </p>
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-bold text-loopa-muted uppercase tracking-wider block">
                          Total Tagihan
                        </span>
                        <span className="text-base font-black text-loopa-charcoal font-display">
                          {formatCurrency(order.total_price)}
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t-2 border-loopa-border flex items-center justify-between">
                      <div className="text-[11px] text-loopa-muted font-semibold">
                        {order.payment_proof_url ? (
                          <span className="text-loopa-charcoal font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-loopa-coral" />
                            Struk transfer pembeli telah dilampirkan
                          </span>
                        ) : (
                          <span>Menunggu upload bukti transfer</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {order.payment_proof_url && (
                          <button
                            onClick={() => setSelectedOrder(order)}
                            className="px-4 py-2 rounded-full text-xs font-black bg-loopa-lime hover:bg-loopa-charcoal hover:text-white text-loopa-charcoal border-2 border-loopa-charcoal transition-all shadow-playful-sm flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspeksi Bukti Bayar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20 bg-white rounded-4xl border-2 border-dashed border-loopa-charcoal p-6">
                <Package className="w-10 h-10 text-loopa-muted mx-auto mb-2" />
                <h3 className="font-display font-black text-base text-loopa-charcoal">
                  Belum Ada Pesanan
                </h3>
                <p className="text-xs text-loopa-muted font-medium mt-1">
                  Pesanan masuk dari pembeli akan muncul di sini untuk verifikasi manual.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INVENTORY & STOCK */}
        {activeSidebarNav === "inventory" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-4xl border-2 border-loopa-charcoal overflow-hidden shadow-playful p-4 flex flex-col justify-between"
                >
                  <div>
                    <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-loopa-cream mb-3 border-2 border-loopa-charcoal">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={prod.images[0] || ""}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[10px] uppercase font-black text-loopa-muted">
                        {prod.category}
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-loopa-lavender border border-loopa-charcoal">
                        {prod.condition}
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-xs sm:text-sm text-loopa-charcoal line-clamp-1">
                      {prod.name}
                    </h4>
                    <p className="text-xs text-loopa-muted font-semibold mt-0.5">
                      Sizes: {prod.sizes.join(", ")}
                    </p>
                    <p className="text-sm font-black text-loopa-charcoal mt-1">
                      {formatCurrency(prod.price)}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t-2 border-loopa-border flex items-center justify-between">
                    <span className="text-xs font-bold text-loopa-charcoal">
                      Stok: <strong>{prod.stock} pcs</strong>
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => DataStore.updateProductStock(prod.id, Math.max(0, prod.stock - 1))}
                        className="w-8 h-8 rounded-full border-2 border-loopa-charcoal bg-white hover:bg-loopa-cream text-xs font-black shadow-playful-sm"
                      >
                        -
                      </button>
                      <button
                        onClick={() => DataStore.updateProductStock(prod.id, prod.stock + 1)}
                        className="w-8 h-8 rounded-full border-2 border-loopa-charcoal bg-white hover:bg-loopa-cream text-xs font-black shadow-playful-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: AUTO-CANCEL 24H SIMULATOR */}
        {activeSidebarNav === "autocancel" && (
          <div className="bg-white rounded-4xl border-2 border-loopa-charcoal p-6 sm:p-8 shadow-playful space-y-4 animate-in fade-in max-w-2xl">
            <div className="flex items-center gap-2 pb-3 border-b-2 border-loopa-border">
              <RefreshCw className="w-5 h-5 text-loopa-coral" />
              <h3 className="font-display font-black text-base text-loopa-charcoal">
                Aturan & Eksekusi Auto-Cancel 24 Jam
              </h3>
            </div>
            <p className="text-xs text-loopa-charcoal leading-relaxed font-medium">
              Sesuai ketentuan PRD v1.0, pesanan dengan status <code>pending</code> yang tidak diunggah atau tidak diverifikasi dalam waktu 24 jam akan otomatis dibatalkan sistem, dan stok barang akan langsung dikembalikan ke etalase Anda.
            </p>

            <div className="p-4 rounded-3xl bg-loopa-cream border-2 border-loopa-charcoal space-y-2">
              <span className="text-xs font-black text-loopa-charcoal">Trigger Manual:</span>
              <p className="text-[11px] text-loopa-muted font-medium">
                Klik tombol di bawah untuk menjalankan cron task pemeriksaan seluruh pesanan kadaluwarsa saat ini.
              </p>
              <button
                onClick={handleRunAutoCancel}
                className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-loopa-charcoal text-white text-xs font-black hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal transition-all shadow-playful-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Jalankan Auto-Cancel Sekarang</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          MODAL: MANUAL PAYMENT VERIFICATION
          ========================================================================= */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-loopa-charcoal/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-4xl max-w-2xl w-full p-6 sm:p-8 shadow-playful border-2 border-loopa-charcoal max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b-2 border-loopa-border">
              <div>
                <h3 className="font-display font-black text-base text-loopa-charcoal">
                  Inspeksi Bukti Bayar Manual
                </h3>
                <span className="text-[11px] text-loopa-muted font-mono font-bold">
                  Order ID: {selectedOrder.id}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-loopa-charcoal hover:text-loopa-coral text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold text-loopa-charcoal">
                  Foto Struk Transfer Pembeli:
                </span>
                <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-loopa-charcoal border-2 border-loopa-charcoal">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedOrder.payment_proof_url || ""}
                    alt="Struk Transfer"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-loopa-cream border-2 border-loopa-charcoal text-xs space-y-1.5 font-semibold">
                <div className="flex justify-between">
                  <span className="text-loopa-muted">Pakaian:</span>
                  <span className="text-loopa-charcoal font-bold">
                    {selectedOrder.product?.name} ({selectedOrder.quantity}x, Size {selectedOrder.selected_size})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-loopa-muted">Nominal Harus Ditransfer:</span>
                  <span className="font-black text-loopa-charcoal">
                    {formatCurrency(selectedOrder.total_price)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-loopa-muted">Nama Pengirim/Pembeli:</span>
                  <span className="text-loopa-charcoal">
                    {selectedOrder.customer_contact.name} ({selectedOrder.customer_contact.phone})
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                  Alasan Penolakan (Wajib diisi jika menolak):
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Nominal transfer kurang / struk buram"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="pt-4 border-t-2 border-loopa-border flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => handleVerifyAction("reject")}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border-2 border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-black transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Tolak Pembayaran</span>
              </button>

              <button
                type="button"
                onClick={() => handleVerifyAction("approve")}
                disabled={isProcessing}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-loopa-lime hover:bg-loopa-charcoal hover:text-white text-loopa-charcoal text-xs font-black border-2 border-loopa-charcoal transition-all shadow-playful disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Setujui (Verifikasi Lunas)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW FASHION PIECE
          ========================================================================= */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-loopa-charcoal/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-4xl max-w-lg w-full p-6 sm:p-8 shadow-playful border-2 border-loopa-charcoal max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b-2 border-loopa-border">
              <h3 className="font-display font-black text-base text-loopa-charcoal">
                Drop Piece Baru ke Etalase Studio
              </h3>
              <button
                onClick={() => setShowAddProductModal(false)}
                className="text-loopa-charcoal hover:text-loopa-coral font-bold text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="py-4 space-y-3">
              <div>
                <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                  Nama Item Fashion *
                </label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Contoh: Vintage 90s Carhartt Detroit Jacket"
                  className="w-full px-4 py-2 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                    Kategori *
                  </label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-2xl border-2 border-loopa-charcoal bg-white"
                  >
                    <option value="Vintage Archive">Vintage Archive</option>
                    <option value="Knit & Crochet">Knit & Crochet</option>
                    <option value="Streetwear & Denim">Streetwear & Denim</option>
                    <option value="Footwear & Tabi">Footwear & Tabi</option>
                    <option value="Y2K Accessories">Y2K Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                    Kondisi *
                  </label>
                  <select
                    value={newProdCondition}
                    onChange={(e) => setNewProdCondition(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-bold rounded-2xl border-2 border-loopa-charcoal bg-white"
                  >
                    <option value="Vintage / Thrift">Vintage / Thrift</option>
                    <option value="Handmade Rework">Handmade Rework</option>
                    <option value="Like New">Like New</option>
                    <option value="Brand New">Brand New</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                    Sizes (pisahkan koma) *
                  </label>
                  <input
                    type="text"
                    required
                    value={newProdSizes}
                    onChange={(e) => setNewProdSizes(e.target.value)}
                    placeholder="S, M, L, XL"
                    className="w-full px-4 py-2 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                    Stok Awal *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(Number(e.target.value))}
                    className="w-full px-4 py-2 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                    Harga Jual (Rp) *
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={10000}
                    required
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full px-4 py-2 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                    Varian Warna
                  </label>
                  <input
                    type="text"
                    value={newProdColor}
                    onChange={(e) => setNewProdColor(e.target.value)}
                    placeholder="Faded Moss"
                    className="w-full px-4 py-2 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                  URL Foto Produk Utama *
                </label>
                <input
                  type="url"
                  required
                  value={newProdImg}
                  onChange={(e) => setNewProdImg(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-4 py-2 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                  Deskripsi & Detail Fitting
                </label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Detail bahan, kondisi fisik, dan saran fitting..."
                  className="w-full px-4 py-2 text-xs font-medium rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t-2 border-loopa-border flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-5 py-2 text-xs font-bold rounded-full text-loopa-muted hover:text-loopa-charcoal"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-black rounded-full bg-loopa-lime text-loopa-charcoal hover:bg-loopa-charcoal hover:text-white border-2 border-loopa-charcoal transition-all shadow-playful-sm"
                >
                  Drop ke Etalase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

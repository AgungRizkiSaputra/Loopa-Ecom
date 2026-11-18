"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { DataStore } from "@/lib/storage";
import { Order, Profile, OrderStatus } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ShieldAlert,
  Lock,
  MessageSquare,
} from "lucide-react";

const STATUS_TABS: { key: "all" | OrderStatus; label: string }[] = [
  { key: "all", label: "Semua Status" },
  { key: "pending", label: "Menunggu Bayar" },
  { key: "payment_uploaded", label: "Menunggu Verifikasi" },
  { key: "verified", label: "Terverifikasi" },
  { key: "rejected", label: "Ditolak" },
  { key: "cancelled", label: "Dibatalkan" },
];

export default function OrdersPage() {
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | OrderStatus>("all");

  const loadOrders = () => {
    DataStore.init();
    DataStore.checkAndCancelExpiredOrders();

    const user = DataStore.getCurrentUser();
    setCurrentUser(user);

    if (user && user.role === "member") {
      const allOrders = DataStore.getOrders();
      const userOrders = allOrders.filter(
        (o) =>
          o.buyer_id === user.id ||
          (user.email &&
            o.customer_contact.email?.toLowerCase() === user.email.toLowerCase())
      );
      setOrders(userOrders);
    } else {
      setOrders([]);
    }
    setMounted(true);
  };

  useEffect(() => {
    loadOrders();
    window.addEventListener("user_role_changed", loadOrders);
    return () => window.removeEventListener("user_role_changed", loadOrders);
  }, []);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: orders.length,
      pending: 0,
      payment_uploaded: 0,
      verified: 0,
      rejected: 0,
      cancelled: 0,
    };
    orders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    if (filterStatus === "all") return orders;
    return orders.filter((o) => o.status === filterStatus);
  }, [orders, filterStatus]);

  if (!mounted) {
    return (
      <div className="max-w-md mx-auto py-20 text-center text-xs text-loopa-muted font-bold">
        Memuat daftar pesanan...
      </div>
    );
  }

  // Guest Guard: Guests must login first to view/manage Orders (consistent with Chat)
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-4xl border-2 border-loopa-charcoal p-8 sm:p-10 shadow-playful">
          <div className="w-16 h-16 rounded-full bg-loopa-lime border-2 border-loopa-charcoal shadow-playful-sm flex items-center justify-center text-loopa-charcoal mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-loopa-charcoal">
            Akses Daftar Pesanan Memerlukan Akun
          </h2>
          <p className="text-xs sm:text-sm text-loopa-muted font-medium mt-2 leading-relaxed max-w-md mx-auto">
            Silakan masuk atau daftar akun terlebih dahulu untuk memantau riwayat pesanan, mengunggah bukti transfer manual, dan melihat jejak audit transaksi Anda.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-loopa-charcoal text-white text-xs font-black hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal transition-all shadow-playful text-center"
            >
              Masuk ke Akun Anda
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto px-6 py-3 rounded-full border-2 border-loopa-charcoal bg-white text-loopa-charcoal text-xs font-black hover:bg-loopa-cream transition-all shadow-playful-sm text-center"
            >
              Daftar Akun Baru
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Role Separation: Seller & Superadmin manage orders in their own consoles, NOT Buyer Orders page
  if (currentUser.role === "seller" || currentUser.role === "superadmin") {
    const isSuperadmin = currentUser.role === "superadmin";
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-4xl border-2 border-loopa-charcoal p-8 sm:p-10 shadow-playful space-y-5">
          <div className="w-16 h-16 rounded-full bg-loopa-lavender border-2 border-loopa-charcoal shadow-playful-sm flex items-center justify-center text-loopa-charcoal mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-loopa-lime border border-loopa-charcoal text-[10px] font-black uppercase tracking-wider text-loopa-charcoal">
              Khusus Akun Pembeli
            </span>
            <h2 className="font-display font-black text-2xl text-loopa-charcoal">
              {isSuperadmin
                ? "Pantau Semua Transaksi di Superadmin Console"
                : "Kelola Pesanan Masuk di Seller Studio"}
            </h2>
            <p className="text-xs sm:text-sm text-loopa-muted font-medium leading-relaxed">
              {isSuperadmin
                ? "Halaman ini adalah riwayat belanja milik Pembeli. Sebagai Superadmin, Anda dapat memantau seluruh pesanan & sengketa langsung dari Superadmin Console."
                : "Halaman Daftar Pesanan Saya khusus untuk riwayat belanja Pembeli. Sebagai Penjual, seluruh pesanan masuk & verifikasi bukti transfer toko Anda dikelola di Seller Studio."}
            </p>
          </div>

          <div className="pt-2">
            <Link
              href={isSuperadmin ? "/admin" : "/dashboard?tab=orders"}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-loopa-charcoal text-white text-xs font-black hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal transition-all shadow-playful"
            >
              <span>
                {isSuperadmin
                  ? "Buka Superadmin Console"
                  : "Buka Pesanan & Verifikasi di Seller Studio"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-loopa-charcoal bg-loopa-lavender px-3 py-1 rounded-full border border-loopa-charcoal shadow-playful-sm">
            <Clock className="w-3 h-3 shrink-0" />
            <span>Menunggu Bukti Transfer</span>
          </span>
        );
      case "payment_uploaded":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-white bg-loopa-coral px-3 py-1 rounded-full border border-loopa-charcoal shadow-playful-sm">
            <Clock className="w-3 h-3 shrink-0" />
            <span>Menunggu Verifikasi Penjual</span>
          </span>
        );
      case "verified":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-loopa-charcoal bg-loopa-lime px-3 py-1 rounded-full border border-loopa-charcoal shadow-playful-sm">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>Terverifikasi &amp; Dipacking</span>
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-rose-800 bg-rose-100 px-3 py-1 rounded-full border border-rose-300 shadow-playful-sm">
            <XCircle className="w-3 h-3 shrink-0" />
            <span>Pembayaran Ditolak</span>
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-loopa-muted bg-loopa-cream px-3 py-1 rounded-full border border-loopa-charcoal">
            <ShieldAlert className="w-3 h-3 shrink-0" />
            <span>Dibatalkan (Auto-Cancel 24h)</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Header */}
      <div className="pb-6 border-b-2 border-loopa-charcoal space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="font-display font-black text-2xl sm:text-4xl text-loopa-charcoal">
              Daftar Pesanan Saya
            </h1>
            <p className="text-xs sm:text-sm text-loopa-muted font-medium mt-1">
              Pantau status verifikasi pembayaran manual dan jejak audit transaksi Anda.
            </p>
          </div>
          <span className="text-xs font-black text-loopa-charcoal bg-white px-3.5 py-1.5 rounded-full border-2 border-loopa-charcoal shadow-playful-sm w-fit">
            Total: {orders.length} Pesanan
          </span>
        </div>

        {/* Clean Multi-Row Wrapping Status Filter Bar (Zero scroll glitches) */}
        <div className="bg-white rounded-3xl border-2 border-loopa-charcoal p-2.5 shadow-playful-sm">
          <div className="flex flex-wrap items-center gap-2">
            {STATUS_TABS.map((tab) => {
              const isActive = filterStatus === tab.key;
              const count = statusCounts[tab.key] || 0;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilterStatus(tab.key)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black border-2 transition-colors ${isActive
                    ? "bg-loopa-charcoal text-white border-loopa-charcoal shadow-playful-sm"
                    : "bg-loopa-cream/70 text-loopa-charcoal border-transparent hover:border-loopa-charcoal hover:bg-white"
                    }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black leading-none ${isActive
                      ? "bg-loopa-lime text-loopa-charcoal"
                      : "bg-white text-loopa-charcoal border border-loopa-charcoal/20"
                      }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="py-8 space-y-5">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-4xl border-2 border-loopa-charcoal p-5 sm:p-6 shadow-playful transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-loopa-border">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-2xl bg-loopa-lime border border-loopa-charcoal text-loopa-charcoal shadow-playful-sm shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-loopa-muted font-mono font-bold block">
                      ID: {order.id}
                    </span>
                    <span className="text-xs font-extrabold text-loopa-charcoal truncate block">
                      Stylist: {order.seller?.full_name || "Seller"} (@{order.seller?.handle || "studio"})
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {getStatusBadge(order.status)}
                  <span className="text-[11px] text-loopa-muted font-bold">
                    {formatDate(order.created_at)}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={order.product?.images[0] || ""}
                    alt={order.product?.name || "Piece"}
                    className="w-16 h-20 rounded-2xl object-cover shrink-0 border-2 border-loopa-charcoal"
                  />
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-sm sm:text-base text-loopa-charcoal truncate">
                      {order.product?.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-loopa-cream text-[10px] font-black border border-loopa-charcoal">
                        Size: {order.selected_size || "Standard"}
                      </span>
                      <span className="text-xs text-loopa-muted font-semibold">
                        {order.quantity} unit • {order.shipping_address.city}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className="text-[10px] font-bold text-loopa-muted uppercase tracking-wider block">
                    Total Tagihan
                  </span>
                  <span className="text-base sm:text-lg font-black text-loopa-charcoal font-display">
                    {formatCurrency(order.total_price)}
                  </span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3.5 border-t border-loopa-border flex flex-wrap items-center justify-between gap-3">
                <div className="text-[11px] text-loopa-muted font-semibold">
                  {order.status === "pending" || order.status === "payment_uploaded" ? (
                    <span className="text-loopa-coral font-bold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Batas waktu verifikasi auto-cancel 24 jam.</span>
                    </span>
                  ) : order.status === "verified" ? (
                    <span className="text-loopa-charcoal font-black flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Pembayaran telah disetujui penjual.</span>
                    </span>
                  ) : order.status === "rejected" ? (
                    <span className="text-rose-700 font-bold flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Bukti ditolak. Unggah ulang bukti di halaman detail.</span>
                    </span>
                  ) : (
                    <span>Pesanan dibatalkan otomatis.</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {order.seller_id && order.seller_id !== currentUser.id && (
                    <Link
                      href={`/chat?seller_id=${order.seller_id}&product_id=${order.product_id}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-loopa-cream text-loopa-charcoal text-xs font-black border-2 border-loopa-charcoal transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat Penjual</span>
                    </Link>
                  )}

                  <Link
                    href={`/orders/${order.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-loopa-charcoal hover:bg-loopa-lime hover:text-loopa-charcoal text-white text-xs font-black border-2 border-loopa-charcoal transition-all shadow-playful-sm"
                  >
                    <span>Detail &amp; Audit Trail</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-4xl border-2 border-dashed border-loopa-charcoal p-6">
            <Package className="w-10 h-10 text-loopa-muted mx-auto mb-3" />
            <h3 className="font-display font-black text-base text-loopa-charcoal">
              {filterStatus === "all"
                ? "Belum Ada Pesanan"
                : "Tidak Ada Pesanan di Status Ini"}
            </h3>
            <p className="text-xs text-loopa-muted font-medium mt-1 max-w-sm mx-auto">
              {filterStatus === "all"
                ? "Temukan item pakaian unik dari independent creators di LOOPA dan buat pesanan pertama Anda."
                : "Coba pilih tab status lain atau lihat semua pesanan Anda."}
            </p>
            {filterStatus === "all" ? (
              <Link
                href="/explore"
                className="mt-5 inline-block px-6 py-2.5 rounded-full bg-loopa-charcoal text-white text-xs font-black hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal shadow-playful-sm transition-all"
              >
                Mulai Explore
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setFilterStatus("all")}
                className="mt-5 inline-block px-6 py-2.5 rounded-full bg-loopa-charcoal text-white text-xs font-black hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal shadow-playful-sm transition-all"
              >
                Tampilkan Semua Status
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

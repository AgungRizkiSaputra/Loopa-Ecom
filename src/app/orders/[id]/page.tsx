"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DataStore } from "@/lib/storage";
import { Order, AuditLog, Profile } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  UploadCloud,
  History,
  AlertTriangle,
  MapPin,
  User,
  Phone,
  FileText,
  CreditCard,
  Copy,
  Check,
  ZoomIn,
  X,
  Lock,
  MessageSquare,
  ShieldAlert,
  Image as ImageIcon,
} from "lucide-react";

const AUDIT_ACTION_LABELS: Record<
  AuditLog["action"],
  { title: string; badgeClass: string }
> = {
  ORDER_CREATED: {
    title: "Pesanan Dibuat",
    badgeClass: "bg-loopa-lavender text-loopa-charcoal",
  },
  PAYMENT_PROOF_UPLOADED: {
    title: "Bukti Transfer Diunggah",
    badgeClass: "bg-loopa-coral text-white",
  },
  PAYMENT_VERIFIED: {
    title: "Pembayaran Disetujui Penjual",
    badgeClass: "bg-loopa-lime text-loopa-charcoal",
  },
  PAYMENT_REJECTED: {
    title: "Pembayaran Ditolak Penjual",
    badgeClass: "bg-rose-100 text-rose-800",
  },
  ORDER_CANCELLED: {
    title: "Dibatalkan Otomatis (24 Jam)",
    badgeClass: "bg-stone-200 text-loopa-charcoal",
  },
  STOCK_DEDUCTED: {
    title: "Stok Dikunci",
    badgeClass: "bg-loopa-cream text-loopa-charcoal",
  },
  STOCK_RESTORED: {
    title: "Stok Dikembalikan",
    badgeClass: "bg-loopa-cream text-loopa-charcoal",
  },
  ADMIN_USER_SUSPENDED: {
    title: "Akun Ditangguhkan Superadmin",
    badgeClass: "bg-rose-100 text-rose-800",
  },
  ADMIN_USER_RESTORED: {
    title: "Akun Dipulihkan Superadmin",
    badgeClass: "bg-loopa-lime text-loopa-charcoal",
  },
  ADMIN_PRODUCT_MODERATED: {
    title: "Moderasi Produk Superadmin",
    badgeClass: "bg-loopa-lavender text-loopa-charcoal",
  },
  ADMIN_DISPUTE_RESOLVED: {
    title: "Resolusi Sengketa Superadmin",
    badgeClass: "bg-loopa-charcoal text-white",
  },
  ADMIN_PASSWORD_RESET: {
    title: "Reset Kata Sandi Sementara",
    badgeClass: "bg-loopa-lavender text-loopa-charcoal",
  },
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [proofInput, setProofInput] = useState("");
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [showZoomModal, setShowZoomModal] = useState(false);

  const loadOrder = () => {
    DataStore.init();
    const user = DataStore.getCurrentUser();
    setCurrentUser(user);

    const ord = DataStore.getOrderById(orderId);
    if (ord) {
      setOrder(ord);
      setAuditLogs(DataStore.getAuditLogs(orderId));
      if (ord.payment_proof_url && !ord.payment_proof_url.startsWith("data:")) {
        setProofInput(ord.payment_proof_url);
      }
    }
    setMounted(true);
  };

  useEffect(() => {
    loadOrder();
    window.addEventListener("user_role_changed", loadOrder);
    return () => window.removeEventListener("user_role_changed", loadOrder);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (!mounted) {
    return (
      <div className="max-w-md mx-auto py-20 text-center text-xs text-loopa-muted font-bold">
        Memuat detail pesanan...
      </div>
    );
  }

  // Guest Guard
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-4xl border-2 border-loopa-charcoal p-8 sm:p-10 shadow-playful">
          <div className="w-16 h-16 rounded-full bg-loopa-lime border-2 border-loopa-charcoal shadow-playful-sm flex items-center justify-center text-loopa-charcoal mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-loopa-charcoal">
            Akses Detail Pesanan Memerlukan Akun
          </h2>
          <p className="text-xs sm:text-sm text-loopa-muted font-medium mt-2 leading-relaxed">
            Silakan masuk ke akun Anda untuk melihat rincian pengiriman, bukti transfer manual, dan jejak audit transaksi.
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

  if (!order) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="bg-white border-2 border-loopa-charcoal rounded-4xl p-8 shadow-playful space-y-3">
          <Package className="w-10 h-10 text-loopa-muted mx-auto" />
          <h2 className="font-display font-extrabold text-xl text-loopa-charcoal">
            Pesanan Tidak Ditemukan
          </h2>
          <p className="text-xs text-loopa-muted font-medium">
            ID pesanan tidak ditemukan atau sudah dihapus.
          </p>
          <Link
            href="/orders"
            className="inline-flex items-center gap-1.5 mt-2 px-5 py-2.5 rounded-full bg-loopa-charcoal text-white text-xs font-black hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Daftar Pesanan</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Mohon unggah file gambar (JPG, PNG, WebP) untuk bukti transfer.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const updated = DataStore.uploadPaymentProof(order.id, dataUrl);
      if (updated) {
        setOrder(updated);
        setAuditLogs(DataStore.getAuditLogs(order.id));
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProofUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofInput.trim()) return;

    setIsUploading(true);
    setTimeout(() => {
      const updated = DataStore.uploadPaymentProof(order.id, proofInput.trim());
      if (updated) {
        setOrder(updated);
        setAuditLogs(DataStore.getAuditLogs(order.id));
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 3000);
      }
      setIsUploading(false);
    }, 350);
  };

  const handleCopyBankAccount = () => {
    const acc = order.seller?.bank_account_number || "7721-0988-12";
    navigator.clipboard?.writeText(acc);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const getStatusDisplay = () => {
    switch (order.status) {
      case "verified":
        return {
          label: "Terverifikasi & Dipacking",
          className: "bg-loopa-lime text-loopa-charcoal",
          icon: <CheckCircle2 className="w-4 h-4 shrink-0" />,
        };
      case "payment_uploaded":
        return {
          label: "Menunggu Verifikasi Penjual",
          className: "bg-loopa-coral text-white",
          icon: <Clock className="w-4 h-4 shrink-0" />,
        };
      case "rejected":
        return {
          label: "Pembayaran Ditolak",
          className: "bg-rose-100 text-rose-800 border-rose-300",
          icon: <XCircle className="w-4 h-4 shrink-0" />,
        };
      case "cancelled":
        return {
          label: "Dibatalkan (Auto-Cancel 24h)",
          className: "bg-stone-200 text-loopa-charcoal",
          icon: <ShieldAlert className="w-4 h-4 shrink-0" />,
        };
      default:
        return {
          label: "Menunggu Bukti Transfer",
          className: "bg-loopa-lavender text-loopa-charcoal",
          icon: <Clock className="w-4 h-4 shrink-0" />,
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const unitPrice = order.product?.price || Math.round(order.total_price / order.quantity);

  const isBuyerOwner =
    currentUser.role === "member" &&
    (order.buyer_id === currentUser.id ||
      (currentUser.email &&
        order.customer_contact.email?.toLowerCase() ===
          currentUser.email.toLowerCase()));
  const isSellerOwner =
    currentUser.role === "seller" && order.seller_id === currentUser.id;
  const isSuperadmin = currentUser.role === "superadmin";

  if (!isBuyerOwner && !isSellerOwner && !isSuperadmin) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="bg-white border-2 border-loopa-charcoal rounded-4xl p-8 shadow-playful space-y-4">
          <Lock className="w-10 h-10 text-loopa-coral mx-auto" />
          <h2 className="font-display font-extrabold text-xl text-loopa-charcoal">
            Akses Pesanan Ditolak
          </h2>
          <p className="text-xs text-loopa-muted font-medium leading-relaxed">
            Anda tidak memiliki hak akses untuk melihat rincian pesanan ini.
          </p>
          <Link
            href={
              currentUser.role === "seller"
                ? "/dashboard?tab=orders"
                : "/orders"
            }
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-loopa-charcoal text-white text-xs font-black hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>
              {currentUser.role === "seller"
                ? "Kembali ke Seller Studio"
                : "Kembali ke Daftar Pesanan"}
            </span>
          </Link>
        </div>
      </div>
    );
  }

  const backHref =
    currentUser.role === "seller"
      ? "/dashboard?tab=orders"
      : currentUser.role === "superadmin"
      ? "/admin"
      : "/orders";
  const backLabel =
    currentUser.role === "seller"
      ? "Kembali ke Seller Studio"
      : currentUser.role === "superadmin"
      ? "Kembali ke Superadmin Console"
      : "Kembali ke Daftar Pesanan";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      {/* Top Back Bar */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border-2 border-loopa-charcoal text-xs font-black text-loopa-charcoal hover:bg-loopa-lime transition-all shadow-playful-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{backLabel}</span>
        </Link>

        {isBuyerOwner && order.seller_id && (
          <Link
            href={`/chat?seller_id=${order.seller_id}&product_id=${order.product_id}`}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-loopa-charcoal text-white hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal text-xs font-black transition-all shadow-playful-sm"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat Penjual</span>
          </Link>
        )}
      </div>

      {/* Header Status Card */}
      <div className="bg-white border-2 border-loopa-charcoal rounded-4xl p-6 sm:p-7 shadow-playful">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b-2 border-loopa-border">
          <div>
            <span className="text-[11px] text-loopa-muted font-mono font-bold block">
              ORDER ID: {order.id}
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-loopa-charcoal mt-0.5">
              Detail &amp; Audit Pesanan
            </h1>
            <p className="text-xs text-loopa-muted font-semibold mt-1">
              Dibuat pada {formatDate(order.created_at)}
            </p>
          </div>

          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black border-2 border-loopa-charcoal shadow-playful-sm w-fit ${statusDisplay.className}`}
          >
            {statusDisplay.icon}
            <span>{statusDisplay.label}</span>
          </span>
        </div>

        {/* 24h Auto-Cancel notice if pending or payment_uploaded */}
        {(order.status === "pending" || order.status === "payment_uploaded") && (
          <div className="mt-5 p-4 rounded-3xl bg-loopa-cream border-2 border-loopa-charcoal text-xs text-loopa-charcoal flex items-start gap-3 font-medium">
            <Clock className="w-4 h-4 text-loopa-coral shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="font-black">Aturan Auto-Cancel 24 Jam:</strong>{" "}
              Pesanan akan dibatalkan otomatis dan stok dikembalikan ke etalase jika pembayaran belum diverifikasi sebelum{" "}
              <span className="font-black underline">{formatDate(order.expires_at)}</span>.
            </p>
          </div>
        )}

        {/* Rejection reason if rejected */}
        {order.status === "rejected" && (
          <div className="mt-5 p-4 rounded-3xl bg-rose-50 border-2 border-rose-300 text-xs text-rose-900 flex items-start gap-3 font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-black block">Alasan Penolakan oleh Penjual:</strong>
              <p className="mt-1 leading-relaxed">
                {order.rejection_reason ||
                  "Bukti transfer tidak terbaca atau nominal tidak sesuai. Silakan unggah ulang bukti transfer yang valid."}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main Two-Column Grid: Rincian Pakaian & Pengiriman + Bukti Transfer Manual */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN (7 Cols): Rincian Pakaian & Pengiriman */}
        <div className="lg:col-span-7 bg-white border-2 border-loopa-charcoal rounded-4xl p-6 shadow-playful space-y-6">
          <div className="flex items-center justify-between pb-3 border-b-2 border-loopa-border">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-loopa-coral" />
              <h2 className="font-display font-black text-sm text-loopa-charcoal uppercase tracking-wider">
                Rincian Pakaian &amp; Pengiriman
              </h2>
            </div>
            {order.product?.condition && (
              <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-loopa-lime border border-loopa-charcoal">
                {order.product.condition}
              </span>
            )}
          </div>

          {/* Product Item Summary Card (Fixed sizing & crisp layout!) */}
          <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-3xl bg-loopa-cream border-2 border-loopa-charcoal">
            <Link
              href={`/products/${order.product_id}`}
              className="w-full sm:w-28 h-48 sm:h-32 rounded-2xl overflow-hidden border-2 border-loopa-charcoal bg-white shrink-0 block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={order.product?.images[0] || ""}
                alt={order.product?.name || "Pakaian"}
                className="w-full h-full object-cover"
              />
            </Link>

            <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-loopa-muted block">
                  {order.product?.category || "Fashion Piece"}
                </span>
                <Link
                  href={`/products/${order.product_id}`}
                  className="font-display font-black text-sm sm:text-base text-loopa-charcoal hover:underline block mt-0.5 leading-snug"
                >
                  {order.product?.name || "Produk Fashion"}
                </Link>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-black border border-loopa-charcoal">
                    Size: {order.selected_size || "Standard"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-[11px] font-bold border border-loopa-charcoal text-loopa-charcoal">
                    Qty: {order.quantity} pcs
                  </span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-loopa-border flex items-baseline justify-between gap-2">
                <span className="text-[11px] font-semibold text-loopa-muted">
                  {formatCurrency(unitPrice)} × {order.quantity}
                </span>
                <span className="font-display font-black text-lg text-loopa-charcoal">
                  {formatCurrency(order.total_price)}
                </span>
              </div>
            </div>
          </div>

          {/* Seller Info Row */}
          {order.seller && (
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-loopa-charcoal">
              <div className="flex items-center gap-3 min-w-0">
                {order.seller.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={order.seller.avatar_url}
                    alt={order.seller.full_name}
                    className="w-9 h-9 rounded-full object-cover border border-loopa-charcoal shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-loopa-lavender font-black text-xs flex items-center justify-center border border-loopa-charcoal shrink-0">
                    {order.seller.full_name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-loopa-muted uppercase block">
                    Penjual / Stylist Studio
                  </span>
                  <p className="text-xs font-black text-loopa-charcoal truncate">
                    {order.seller.full_name}{" "}
                    <span className="text-loopa-muted font-semibold">
                      (@{order.seller.handle})
                    </span>
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-bold text-loopa-muted shrink-0">
                {order.seller.city || "Indonesia"}
              </span>
            </div>
          )}

          {/* Structured Shipping Address Box */}
          <div className="space-y-3">
            <h3 className="font-display font-black text-xs text-loopa-charcoal uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-loopa-coral" />
              <span>Alamat &amp; Informasi Pengiriman</span>
            </h3>

            <div className="p-4 rounded-3xl bg-loopa-cream border border-loopa-charcoal space-y-2.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="flex items-start gap-2">
                  <User className="w-3.5 h-3.5 text-loopa-muted shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase text-loopa-muted block">
                      Nama Penerima
                    </span>
                    <span className="font-black text-loopa-charcoal break-words">
                      {order.shipping_address.recipient_name}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Phone className="w-3.5 h-3.5 text-loopa-muted shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase text-loopa-muted block">
                      No. Telepon / WhatsApp
                    </span>
                    <span className="font-black text-loopa-charcoal break-words">
                      {order.shipping_address.phone}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2.5 border-t border-loopa-border flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-loopa-muted shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase text-loopa-muted block">
                    Alamat Lengkap
                  </span>
                  <p className="font-semibold text-loopa-charcoal leading-relaxed break-words">
                    {order.shipping_address.street_address}
                    <br />
                    {order.shipping_address.city}, Kode Pos {order.shipping_address.postal_code}
                  </p>
                </div>
              </div>

              {order.shipping_address.notes && (
                <div className="pt-2.5 border-t border-loopa-border flex items-start gap-2">
                  <FileText className="w-3.5 h-3.5 text-loopa-muted shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase text-loopa-muted block">
                      Catatan Kurir
                    </span>
                    <p className="font-medium text-loopa-charcoal break-words">
                      {order.shipping_address.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 Cols): Bukti Transfer Manual */}
        <div className="lg:col-span-5 bg-white border-2 border-loopa-charcoal rounded-4xl p-6 shadow-playful space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b-2 border-loopa-border">
            <CreditCard className="w-4 h-4 text-loopa-coral" />
            <h2 className="font-display font-black text-sm text-loopa-charcoal uppercase tracking-wider">
              Bukti Transfer Manual
            </h2>
          </div>

          {/* Seller Bank Destination Details */}
          <div className="p-4 rounded-3xl bg-loopa-cream border-2 border-loopa-charcoal space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-loopa-muted">
                Rekening Tujuan Penjual
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-loopa-lime border border-loopa-charcoal">
                {order.seller?.bank_name || "BCA"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-black text-base text-loopa-charcoal tracking-wide">
                {order.seller?.bank_account_number || "7721-0988-12"}
              </span>
              <button
                type="button"
                onClick={handleCopyBankAccount}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-loopa-charcoal text-[10px] font-black hover:bg-loopa-lime transition-colors"
              >
                {copiedAccount ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Salin</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] font-bold text-loopa-charcoal">
              a.n. {order.seller?.bank_account_holder || order.seller?.full_name?.toUpperCase()}
            </p>
            <div className="pt-2 border-t border-loopa-border flex items-center justify-between text-xs">
              <span className="text-loopa-muted font-semibold">Nominal Transfer:</span>
              <span className="font-display font-black text-loopa-charcoal">
                {formatCurrency(order.total_price)}
              </span>
            </div>
          </div>

          {/* Uploaded Proof Preview */}
          {order.payment_proof_url ? (
            <div className="space-y-2.5">
              <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden bg-loopa-charcoal border-2 border-loopa-charcoal group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={order.payment_proof_url}
                  alt="Struk Transfer Manual"
                  className="w-full h-full object-contain bg-stone-900"
                />
                <button
                  type="button"
                  onClick={() => setShowZoomModal(true)}
                  className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 text-loopa-charcoal text-[11px] font-black border border-loopa-charcoal shadow-playful-sm hover:bg-loopa-lime transition-colors"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>Perbesar Foto</span>
                </button>
              </div>
              <p className="text-[11px] text-loopa-muted font-semibold text-center">
                Struk transfer terlampir dan siap diverifikasi oleh penjual.
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-loopa-cream border-2 border-dashed border-loopa-charcoal text-center space-y-2">
              <ImageIcon className="w-8 h-8 text-loopa-muted mx-auto" />
              <p className="text-xs font-black text-loopa-charcoal">
                Belum Ada Bukti Transfer
              </p>
              <p className="text-[11px] text-loopa-muted font-medium">
                Unggah foto struk / screenshot m-banking Anda di bawah ini.
              </p>
            </div>
          )}

          {/* Upload / Update Proof Controls (Buyer ONLY, when not verified or cancelled) */}
          {isBuyerOwner && order.status !== "verified" && order.status !== "cancelled" && (
            <div className="pt-3 border-t-2 border-loopa-border space-y-3">
              {/* Toggle File Upload vs Image URL */}
              <div className="flex items-center gap-1.5 p-1 rounded-full bg-loopa-cream border border-loopa-charcoal">
                <button
                  type="button"
                  onClick={() => setUploadMode("file")}
                  className={`flex-1 py-1.5 rounded-full text-[11px] font-black transition-colors ${
                    uploadMode === "file"
                      ? "bg-loopa-charcoal text-white"
                      : "text-loopa-charcoal hover:bg-white"
                  }`}
                >
                  Upload Foto Struk
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode("url")}
                  className={`flex-1 py-1.5 rounded-full text-[11px] font-black transition-colors ${
                    uploadMode === "url"
                      ? "bg-loopa-charcoal text-white"
                      : "text-loopa-charcoal hover:bg-white"
                  }`}
                >
                  Gunakan Link URL
                </button>
              </div>

              {uploadMode === "file" ? (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 px-4 rounded-2xl bg-loopa-lime hover:bg-loopa-charcoal hover:text-white text-loopa-charcoal text-xs font-black border-2 border-loopa-charcoal transition-all shadow-playful-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>
                      {isUploading
                        ? "Mengunggah Bukti..."
                        : order.payment_proof_url
                        ? "Ganti Foto Bukti Transfer"
                        : "Pilih Foto Bukti Transfer"}
                    </span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleUpdateProofUrl} className="space-y-2">
                  <input
                    type="url"
                    value={proofInput}
                    onChange={(e) => setProofInput(e.target.value)}
                    placeholder="https://... URL foto bukti transfer"
                    required
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal focus:outline-none focus:ring-2 focus:ring-loopa-lime"
                  />
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full py-2.5 rounded-full bg-loopa-charcoal hover:bg-loopa-lime hover:text-loopa-charcoal text-white text-xs font-black border-2 border-loopa-charcoal transition-all disabled:opacity-50"
                  >
                    {isUploading ? "Menyimpan..." : "Simpan Link Bukti Transfer"}
                  </button>
                </form>
              )}

              {uploadSuccess && (
                <div className="p-2.5 rounded-2xl bg-loopa-lime border border-loopa-charcoal text-[11px] font-black text-loopa-charcoal text-center">
                  ✓ Bukti transfer berhasil diperbarui dan dikirim ke penjual!
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Transaction Audit Trail Timeline */}
      <div className="bg-white border-2 border-loopa-charcoal rounded-4xl p-6 sm:p-8 shadow-playful">
        <div className="flex items-center justify-between gap-2 pb-4 border-b-2 border-loopa-border">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-loopa-coral" />
            <h2 className="font-display font-black text-sm text-loopa-charcoal uppercase tracking-wider">
              Jejak Audit Transaksi (Audit Trail)
            </h2>
          </div>
          <span className="text-[11px] font-bold text-loopa-muted">
            {auditLogs.length} aktivitas tercatat
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {auditLogs.length > 0 ? (
            auditLogs.map((log, idx) => {
              const meta = AUDIT_ACTION_LABELS[log.action] || {
                title: log.action.replace(/_/g, " "),
                badgeClass: "bg-loopa-cream text-loopa-charcoal",
              };

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3.5 p-4 rounded-3xl bg-loopa-cream border border-loopa-charcoal"
                >
                  <div className="w-7 h-7 rounded-full bg-white border-2 border-loopa-charcoal flex items-center justify-center text-[11px] font-black text-loopa-charcoal shrink-0 mt-0.5">
                    {auditLogs.length - idx}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border border-loopa-charcoal ${meta.badgeClass}`}
                        >
                          {meta.title}
                        </span>
                        <span className="text-xs font-bold text-loopa-charcoal">
                          oleh {log.actor_name}
                        </span>
                      </div>
                      <span className="text-[11px] text-loopa-muted font-bold whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </span>
                    </div>

                    {log.details && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {log.details.product_name && (
                          <span className="px-2.5 py-0.5 rounded-full bg-white border border-loopa-border text-[11px] font-semibold text-loopa-charcoal">
                            Produk: {log.details.product_name}
                          </span>
                        )}
                        {log.details.size && (
                          <span className="px-2.5 py-0.5 rounded-full bg-white border border-loopa-border text-[11px] font-semibold text-loopa-charcoal">
                            Size: {log.details.size}
                          </span>
                        )}
                        {typeof log.details.total_price === "number" && (
                          <span className="px-2.5 py-0.5 rounded-full bg-white border border-loopa-border text-[11px] font-black text-loopa-charcoal">
                            Total: {formatCurrency(log.details.total_price)}
                          </span>
                        )}
                        {log.details.reason && (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-800">
                            Catatan: {log.details.reason}
                          </span>
                        )}
                        {log.details.proof_url && (
                          <span className="px-2.5 py-0.5 rounded-full bg-white border border-loopa-border text-[11px] font-semibold text-loopa-charcoal">
                            Lampiran bukti transfer tersimpan
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-loopa-muted text-center py-6 font-medium">
              Belum ada catatan log audit untuk pesanan ini.
            </p>
          )}
        </div>
      </div>

      {/* Fullscreen Zoom Modal for Payment Proof */}
      {showZoomModal && order.payment_proof_url && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowZoomModal(false)}
        >
          <div
            className="relative max-w-3xl w-full bg-white rounded-4xl border-2 border-loopa-charcoal p-4 shadow-playful"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-loopa-border">
              <span className="font-display font-black text-sm text-loopa-charcoal">
                Pratinjau Bukti Transfer — {order.id}
              </span>
              <button
                type="button"
                onClick={() => setShowZoomModal(false)}
                className="p-1.5 rounded-full bg-loopa-cream border border-loopa-charcoal hover:bg-loopa-coral hover:text-white transition-colors"
                aria-label="Tutup pratinjau"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto rounded-2xl bg-stone-900 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={order.payment_proof_url}
                alt="Bukti Transfer Penuh"
                className="max-h-[72vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DataStore } from "@/lib/storage";
import { startAuthTransition } from "@/lib/auth-transition";
import { Product, Profile, Order } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  UploadCloud,
  FileCheck,
  CreditCard,
  MapPin,
  User,
  Clock,
  AlertTriangle,
  Sparkles,
  Copy,
  Check,
  Image as ImageIcon,
  Trash2,
} from "lucide-react";

function CheckoutInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const productId = searchParams.get("product_id") || "prod-fsh-01";
  const initialQty = parseInt(searchParams.get("quantity") || "1", 10);
  const initialSize = searchParams.get("size") || "L";

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(initialQty);
  const [selectedSize, setSelectedSize] = useState(initialSize);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);

  // 3-Step State: 1 = Details, 2 = Address, 3 = Payment
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Contact
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Step 2: Address
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("Jakarta Selatan");
  const [postalCode, setPostalCode] = useState("12190");
  const [notes, setNotes] = useState("");

  // Step 3: Payment Proof (Real Gallery File Upload)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState("");
  const [proofFileName, setProofFileName] = useState("");
  const [proofFileSize, setProofFileSize] = useState("");
  const [copiedBank, setCopiedBank] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  useEffect(() => {
    DataStore.init();
    const prod = DataStore.getProductById(productId);
    if (prod) {
      setProduct(prod);
      if (!searchParams.get("size")) {
        setSelectedSize(prod.sizes[0] || "Standard");
      }
    }
    const user = DataStore.getCurrentUser();
    setCurrentUser(user);

    if (user) {
      setName(user.full_name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");

      if (user.default_shipping_address) {
        setStreetAddress(user.default_shipping_address.street_address || "");
        setCity(user.default_shipping_address.city || "Jakarta Selatan");
        setPostalCode(user.default_shipping_address.postal_code || "12190");
        setNotes(user.default_shipping_address.notes || "");
      } else {
        setStreetAddress("Jl. Senopati No. 42, Kebayoran Baru");
      }
    } else {
      setName("Tamu Pembeli (Guest)");
      setEmail("buyer@loopa.fashion");
      setPhone("081234567890");
      setStreetAddress("Jl. Senopati No. 42, Kebayoran Baru");
    }
  }, [productId, searchParams]);

  if (currentUser && (currentUser.role === "seller" || currentUser.role === "superadmin")) {
    const isSuperadmin = currentUser.role === "superadmin";
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-4xl border-2 border-loopa-charcoal p-8 sm:p-10 shadow-playful space-y-5">
          <div className="w-16 h-16 rounded-full bg-loopa-coral border-2 border-loopa-charcoal shadow-playful-sm flex items-center justify-center text-white mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-loopa-cream border border-loopa-charcoal text-[10px] font-black uppercase tracking-wider text-loopa-charcoal">
              Pemisahan Peran Akun
            </span>
            <h1 className="font-display font-black text-2xl text-loopa-charcoal">
              {isSuperadmin
                ? "Akun Superadmin Tidak Dapat Melakukan Checkout"
                : "Akun Penjual Tidak Dapat Melakukan Checkout"}
            </h1>
            <p className="text-xs sm:text-sm text-loopa-muted font-medium leading-relaxed">
              {isSuperadmin
                ? "Akun Superadmin khusus untuk mengelola dan memoderasi platform LOOPA, bukan untuk transaksi pembelian."
                : "Anda sedang masuk sebagai Penjual (Stylist Studio). Untuk mencegah konflik transaksi, akun penjual hanya digunakan untuk mengelola toko & menerima pesanan. Gunakan akun Pembeli (Member) jika ingin berbelanja."}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href={isSuperadmin ? "/admin" : "/dashboard"}
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-loopa-charcoal text-white text-xs font-black hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal transition-all shadow-playful-sm"
            >
              {isSuperadmin ? "Kembali ke Superadmin Console" : "Kembali ke Seller Studio"}
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
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-white text-loopa-charcoal text-xs font-black hover:bg-loopa-cream border-2 border-loopa-charcoal transition-all"
            >
              Keluar &amp; Masuk Akun Pembeli
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <h2 className="font-display font-extrabold text-xl text-loopa-charcoal">
          Pakaian Tidak Ditemukan
        </h2>
        <Link href="/" className="text-xs text-loopa-coral font-bold mt-2 inline-block">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const seller = product.seller;
  const totalPrice = product.price * quantity;

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 1) {
      if (!name.trim() || !phone.trim()) {
        setErrorMsg("Nama dan nomor WhatsApp wajib diisi.");
        return;
      }
      setErrorMsg("");
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!streetAddress.trim() || !city.trim()) {
        setErrorMsg("Alamat lengkap dan kota wajib diisi.");
        return;
      }
      setErrorMsg("");
      setCurrentStep(3);
    }
  };

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setErrorMsg("Format file tidak didukung. Gunakan foto JPG, PNG, atau WEBP dari galeri Anda.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Ukuran foto melebihi batas maksimal 5MB.");
      return;
    }

    setErrorMsg("");
    const reader = new FileReader();
    reader.onload = () => {
      setPaymentProofUrl(reader.result as string);
      setProofFileName(file.name);
      const kb = Math.round(file.size / 1024);
      setProofFileSize(kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);
    };
    reader.readAsDataURL(file);
  };

  const handleCopyAccount = () => {
    const acc = seller?.bank_account_number || "7721-0988-12";
    navigator.clipboard?.writeText(acc);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const handleFinalCheckout = async () => {
    if (!paymentProofUrl) {
      setErrorMsg("Mohon unggah foto bukti transfer dari galeri perangkat Anda terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    setTimeout(() => {
      const result = DataStore.createOrder({
        productId: product.id,
        quantity,
        selectedSize,
        shippingAddress: {
          recipient_name: name,
          phone,
          street_address: streetAddress,
          city,
          postal_code: postalCode,
          notes,
        },
        customerContact: {
          name,
          email,
          phone,
        },
        buyerId: currentUser ? currentUser.id : null,
      });

      if (!result.success || !result.order) {
        setErrorMsg(result.error || "Gagal membuat pesanan.");
        setIsSubmitting(false);
        return;
      }

      if (paymentProofUrl.trim()) {
        DataStore.uploadPaymentProof(result.order.id, paymentProofUrl.trim());
      }

      setCreatedOrder(result.order);
      setIsSubmitting(false);
    }, 600);
  };

  // SUCCESS STATE SCREEN
  if (createdOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center animate-in fade-in">
        <div className="w-20 h-20 rounded-full bg-loopa-lime border-2 border-loopa-charcoal text-loopa-charcoal flex items-center justify-center mx-auto mb-4 shadow-playful">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="font-display font-black text-3xl tracking-tight text-loopa-charcoal">
          Pesanan Loopa Berhasil Dibuat!
        </h1>
        <p className="text-xs sm:text-sm text-loopa-muted font-medium mt-2 max-w-md mx-auto leading-relaxed">
          Order ID: <strong className="text-loopa-charcoal font-mono">{createdOrder.id}</strong>. Penjual ({seller?.full_name}) akan memverifikasi bukti pembayaran Anda dalam waktu 24 jam.
        </p>

        <div className="mt-8 p-6 bg-white rounded-4xl border-2 border-loopa-charcoal shadow-playful text-left space-y-3">
          <div className="flex justify-between items-center text-xs pb-3 border-b border-loopa-border">
            <span className="text-loopa-muted font-bold">Status Pesanan:</span>
            <span className="font-black text-loopa-charcoal bg-loopa-lime px-3 py-1 rounded-full border border-loopa-charcoal text-[11px]">
              Menunggu Verifikasi Penjual
            </span>
          </div>
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-loopa-muted">Pakaian:</span>
            <span className="text-loopa-charcoal">{product.name} ({quantity}x, Size {selectedSize})</span>
          </div>
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-loopa-muted">Total Pembayaran:</span>
            <span className="font-black text-loopa-charcoal">{formatCurrency(totalPrice)}</span>
          </div>
          <div className="flex justify-between text-xs pt-3 border-t border-loopa-border">
            <span className="text-loopa-muted font-bold">Batas Waktu Verifikasi:</span>
            <span className="text-loopa-coral font-black flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Auto-Cancel 24 Jam
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/orders"
            className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-loopa-charcoal text-white text-xs font-black hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal transition-all shadow-playful"
          >
            Lihat di Daftar Pesanan
          </Link>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3.5 rounded-full border-2 border-loopa-charcoal bg-white text-loopa-charcoal text-xs font-black hover:bg-loopa-cream transition-all shadow-playful-sm"
          >
            Lanjut Explore
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Checkout Header */}
      <div className="flex items-center justify-between pb-8 border-b-2 border-loopa-charcoal">
        <div>
          <h1 className="font-display font-black text-2xl sm:text-4xl text-loopa-charcoal">
            Checkout Your Piece
          </h1>
          <p className="text-xs text-loopa-muted font-medium mt-1">
            Transaksi C2C langsung dengan {seller?.full_name || "Penjual"}
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-loopa-muted block uppercase font-extrabold tracking-wider">
            Checkout Mode
          </span>
          <span className="text-xs font-black text-loopa-charcoal bg-loopa-lavender px-3 py-1 rounded-full border border-loopa-charcoal shadow-playful-sm">
            {currentUser ? `Member: ${currentUser.full_name}` : "Guest Checkout"}
          </span>
        </div>
      </div>

      {/* 3-Step Progress Indicator with Playful Pills */}
      <div className="py-8">
        <div className="flex items-center justify-between max-w-xl mx-auto relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-loopa-border -translate-y-1/2 z-0" />

          {/* Step 1 */}
          <div className="relative z-10 flex flex-col items-center bg-loopa-cream px-2">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black border-2 border-loopa-charcoal transition-all ${
                currentStep >= 1
                  ? "bg-loopa-lime text-loopa-charcoal shadow-playful-sm scale-105"
                  : "bg-white text-loopa-muted"
              }`}
            >
              1
            </div>
            <span className="text-[11px] font-bold text-loopa-charcoal mt-1">Kontak</span>
          </div>

          {/* Step 2 */}
          <div className="relative z-10 flex flex-col items-center bg-loopa-cream px-2">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black border-2 border-loopa-charcoal transition-all ${
                currentStep >= 2
                  ? "bg-loopa-lime text-loopa-charcoal shadow-playful-sm scale-105"
                  : "bg-white text-loopa-muted"
              }`}
            >
              2
            </div>
            <span className="text-[11px] font-bold text-loopa-charcoal mt-1">Alamat</span>
          </div>

          {/* Step 3 */}
          <div className="relative z-10 flex flex-col items-center bg-loopa-cream px-2">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black border-2 border-loopa-charcoal transition-all ${
                currentStep >= 3
                  ? "bg-loopa-lime text-loopa-charcoal shadow-playful-sm scale-105"
                  : "bg-white text-loopa-muted"
              }`}
            >
              3
            </div>
            <span className="text-[11px] font-bold text-loopa-charcoal mt-1">Bayar</span>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-3xl bg-rose-50 border-2 border-rose-300 text-xs font-bold text-rose-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid: 3-Step Form (7 Cols) + Summary (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        <div className="lg:col-span-7 bg-white rounded-4xl border-2 border-loopa-charcoal p-6 sm:p-8 shadow-playful">
          {/* STEP 1: CONTACT */}
          {currentStep === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b-2 border-loopa-border">
                <User className="w-4 h-4 text-loopa-coral" />
                <h3 className="font-display font-black text-sm text-loopa-charcoal">
                  Langkah 1: Kontak Pembeli
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama penerima paket..."
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                    Email Kontak
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="email@loopa.id"
                    className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                    Nomor WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-loopa-charcoal text-white text-xs font-black hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal transition-all shadow-playful-sm"
                >
                  <span>Lanjut ke Alamat</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: ADDRESS */}
          {currentStep === 2 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b-2 border-loopa-border">
                <MapPin className="w-4 h-4 text-loopa-coral" />
                <h3 className="font-display font-black text-sm text-loopa-charcoal">
                  Langkah 2: Alamat Pengiriman
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                  Alamat Jalan & Nomor Rumah *
                </label>
                <textarea
                  rows={2}
                  required
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  placeholder="Jl. Senopati No. 42, RT 01 / RW 04"
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                    Kota / Wilayah *
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                    Kode Pos
                  </label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                  Catatan Pengiriman (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Titipkan di resepsionis / security..."
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
                />
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-loopa-charcoal hover:bg-loopa-cream"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali</span>
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-loopa-charcoal text-white text-xs font-black hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal transition-all shadow-playful-sm"
                >
                  <span>Lanjut ke Pembayaran</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: MANUAL PAYMENT & PROOF UPLOAD */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b-2 border-loopa-border">
                <CreditCard className="w-4 h-4 text-loopa-coral" />
                <h3 className="font-display font-black text-sm text-loopa-charcoal">
                  Langkah 3: Transfer Manual & Upload Bukti Bayar
                </h3>
              </div>

              {/* Seller Bank Details Card */}
              <div className="p-5 rounded-3xl bg-loopa-cream border-2 border-loopa-charcoal space-y-2 shadow-playful-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-loopa-muted">Rekening Transfer Penjual:</span>
                  <span className="text-xs font-black text-loopa-charcoal bg-loopa-lavender px-3 py-0.5 rounded-full border border-loopa-charcoal">
                    {seller?.bank_name || "BCA"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono text-lg font-black text-loopa-charcoal tracking-wider">
                    {seller?.bank_account_number || "7721-0988-12"}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white hover:bg-loopa-lime border border-loopa-charcoal text-[11px] font-black text-loopa-charcoal transition-colors"
                  >
                    {copiedBank ? (
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
                <div className="text-xs font-semibold text-loopa-charcoal">
                  Atas Nama: <strong>{seller?.bank_account_holder || "STUDIO RASA APPAREL"}</strong>
                </div>
              </div>

              {/* Payment Proof Gallery Upload Field */}
              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-loopa-charcoal">
                  Unggah Foto Resi / Bukti Transfer dari Galeri *
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleReceiptFileChange}
                  className="hidden"
                />

                {!paymentProofUrl ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full p-7 border-2 border-dashed border-loopa-charcoal rounded-3xl bg-loopa-cream/60 hover:bg-loopa-lime/30 transition-colors flex flex-col items-center justify-center text-center gap-2 cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white border-2 border-loopa-charcoal shadow-playful-sm flex items-center justify-center text-loopa-coral">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm font-black text-loopa-charcoal block">
                        Klik untuk Pilih Foto Bukti Transfer dari Galeri
                      </span>
                      <span className="text-[11px] text-loopa-muted font-semibold mt-0.5 block">
                        Format: JPG, PNG, atau WEBP • Maksimal 5 MB
                      </span>
                    </div>
                    <span className="mt-1 px-4 py-1.5 rounded-full bg-loopa-charcoal text-white text-[11px] font-black">
                      Buka Galeri / File
                    </span>
                  </button>
                ) : (
                  <div className="rounded-3xl border-2 border-loopa-charcoal bg-loopa-cream p-3.5 space-y-3 shadow-playful-sm">
                    <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden bg-stone-900 border-2 border-loopa-charcoal">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={paymentProofUrl}
                        alt="Pratinjau Bukti Transfer"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-black text-loopa-charcoal truncate">
                            {proofFileName || "bukti-transfer.jpg"}
                          </p>
                          <p className="text-[10px] font-bold text-loopa-muted">
                            {proofFileSize ? `${proofFileSize} • Siap dikirim` : "Siap dikirim"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 rounded-full bg-white hover:bg-loopa-lime border border-loopa-charcoal text-[11px] font-black text-loopa-charcoal transition-colors"
                        >
                          Ganti Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentProofUrl("");
                            setProofFileName("");
                            setProofFileSize("");
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="p-1.5 rounded-full bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-300 transition-colors"
                          aria-label="Hapus foto bukti"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-2xl bg-loopa-lime border-2 border-loopa-charcoal text-[11px] text-loopa-charcoal font-bold flex items-start gap-2 shadow-playful-sm">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Stok barang ini akan dikunci otomatis (SELECT FOR UPDATE) saat Anda menekan tombol di bawah, dan penjual memiliki waktu 24 jam untuk verifikasi.
                </span>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold text-loopa-charcoal hover:bg-loopa-cream"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Kembali</span>
                </button>
                <button
                  onClick={handleFinalCheckout}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-loopa-charcoal hover:bg-loopa-lime hover:text-loopa-charcoal text-white text-xs font-black border-2 border-loopa-charcoal transition-all shadow-playful disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Mengunci Stok & Membuat Order...</span>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Kirim Bukti & Selesaikan Pesanan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ORDER SUMMARY (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-4xl border-2 border-loopa-charcoal p-6 sm:p-8 space-y-4 shadow-playful">
            <h3 className="font-display font-black text-sm text-loopa-charcoal uppercase tracking-wider pb-3 border-b-2 border-loopa-border">
              Order Bag Summary
            </h3>

            <div className="flex gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.images[0] || ""}
                alt={product.name}
                className="w-20 h-24 rounded-2xl object-cover shrink-0 border-2 border-loopa-charcoal"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-display font-bold text-xs sm:text-sm text-loopa-charcoal line-clamp-2">
                  {product.name}
                </h4>
                <div className="mt-2 space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-loopa-lime text-[10px] font-black border border-loopa-charcoal">
                      Size: {selectedSize}
                    </span>
                    <span className="text-loopa-muted font-bold">Qty: {quantity}x</span>
                  </div>
                  <div className="font-black text-loopa-charcoal pt-1">
                    {formatCurrency(product.price * quantity)}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-loopa-border space-y-2 text-xs font-semibold">
              <div className="flex justify-between text-loopa-muted">
                <span>Subtotal Pakaian:</span>
                <span className="text-loopa-charcoal">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-loopa-muted">
                <span>Kurir Pengiriman:</span>
                <span className="text-loopa-charcoal font-black">Gratis (Promo Loopa)</span>
              </div>
              <div className="flex justify-between text-loopa-muted">
                <span>Biaya Verifikasi Manual:</span>
                <span className="text-loopa-charcoal font-black">Gratis</span>
              </div>
              <div className="pt-3 border-t-2 border-loopa-border flex justify-between text-base font-black text-loopa-charcoal font-display">
                <span>Total Tagihan:</span>
                <span className="text-loopa-coral">{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-20 text-center text-xs text-loopa-muted">
          Loading LOOPA checkout form...
        </div>
      }
    >
      <CheckoutInner />
    </Suspense>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DataStore } from "@/lib/storage";
import { Product, Review, Profile } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { SellerBadge } from "@/components/seller-badge";
import { MediaReviewCard } from "@/components/media-review-card";
import {
  MessageSquare,
  ShoppingBag,
  ShieldCheck,
  Truck,
  ArrowLeft,
  Share2,
  Camera,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Scissors,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // New OOTD review form state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewContent, setReviewContent] = useState("");
  const [reviewMediaUrl, setReviewMediaUrl] = useState("");
  const [reviewFit, setReviewFit] = useState<Review["fit_feedback"]>("True to Size");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    DataStore.init();
    const p = DataStore.getProductById(productId);
    if (p) {
      setProduct(p);
      setSelectedSize(p.sizes[0] || "Standard");
      setReviews(DataStore.getReviews(productId));
    }
    setCurrentUser(DataStore.getCurrentUser());
  }, [productId]);

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="font-display font-extrabold text-2xl text-loopa-charcoal">Piece Not Found</h2>
        <p className="text-xs text-loopa-muted mt-2">
          Pakaian ini mungkin sudah terjual atau diarsipkan oleh pemiliknya.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 rounded-full bg-loopa-charcoal text-white text-xs font-bold hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal shadow-playful-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Loopa Feed</span>
        </Link>
      </div>
    );
  }

  const seller = product.seller;
  const isSellerAccount = currentUser?.role === "seller";
  const isSuperadminAccount = currentUser?.role === "superadmin";
  const isOwnProduct = Boolean(currentUser && currentUser.id === product.seller_id);
  const canPurchase = !isSellerAccount && !isSuperadminAccount;

  const handleStartChat = () => {
    if (!canPurchase) return;
    // PRD Section 8 Rule: Guests cannot participate in chat, prompt login!
    if (!currentUser) {
      router.push(`/login`);
      return;
    }
    // FR-01: Automatically attach product link & size context
    router.push(
      `/chat?seller_id=${product.seller_id}&product_id=${product.id}&size=${encodeURIComponent(
        selectedSize
      )}`
    );
  };

  const handleBuyNow = () => {
    if (!canPurchase) return;
    router.push(
      `/checkout?product_id=${product.id}&quantity=${quantity}&size=${encodeURIComponent(
        selectedSize
      )}`
    );
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewContent.trim() || !reviewMediaUrl.trim()) {
      alert("Mohon isi deskripsi styling dan cantumkan URL foto bukti OOTD Anda.");
      return;
    }

    const created = DataStore.addReview({
      orderId: `ord-lp-${Math.floor(100000 + Math.random() * 900000)}`,
      productId: product.id,
      buyerId: currentUser?.id || "member_agung",
      mediaUrls: [reviewMediaUrl.trim()],
      content: reviewContent.trim(),
      fitFeedback: reviewFit,
    });

    setReviews([created, ...reviews]);
    setReviewSuccess(true);
    setTimeout(() => {
      setShowReviewModal(false);
      setReviewSuccess(false);
      setReviewContent("");
      setReviewMediaUrl("");
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Top Breadcrumb & Share */}
      <div className="flex items-center justify-between pb-6">
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-loopa-muted hover:text-loopa-charcoal transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Feed</span>
        </Link>

        <button
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-loopa-charcoal bg-white text-xs font-bold text-loopa-charcoal hover:bg-loopa-lime transition-all shadow-playful-sm"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{isCopied ? "Link Copied!" : "Share Piece"}</span>
        </button>
      </div>

      {/* Main Grid: Gallery (7 Cols) + Product Details (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Gallery */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative aspect-[4/5] w-full rounded-4xl overflow-hidden bg-white border-2 border-loopa-charcoal shadow-playful">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.images[activeImageIndex] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />

            {/* Condition pill tag */}
            <div className="absolute top-4 left-4">
              <span className="px-3.5 py-1 text-xs font-black uppercase tracking-wider rounded-full bg-loopa-lime text-loopa-charcoal border border-loopa-charcoal shadow-playful-sm">
                {product.condition}
              </span>
            </div>

            {/* Color tag if present */}
            {product.color && (
              <div className="absolute top-4 right-4">
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-white text-loopa-charcoal border border-loopa-charcoal shadow-playful-sm">
                  {product.color}
                </span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-24 rounded-2xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIndex === idx
                      ? "border-loopa-charcoal shadow-playful-sm scale-102"
                      : "border-loopa-border opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details & Actions */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <span className="text-[11px] font-extrabold text-loopa-muted uppercase tracking-wider block mb-1">
                {product.category}
              </span>
              <h1 className="font-display font-extrabold text-2xl sm:text-4xl text-loopa-charcoal leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Price & Stock Card */}
            <div className="p-5 rounded-3xl bg-white border-2 border-loopa-charcoal shadow-playful-sm flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-loopa-muted uppercase tracking-wider block">
                  Price
                </span>
                <span className="text-2xl sm:text-3xl font-black text-loopa-charcoal font-display">
                  {formatCurrency(product.price)}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-loopa-muted uppercase tracking-wider block">
                  Stock
                </span>
                {product.stock > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-black text-loopa-charcoal bg-loopa-lime px-2.5 py-1 rounded-full border border-loopa-charcoal">
                    <CheckCircle2 className="w-3 h-3" />
                    Sisa {product.stock} pcs
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-white bg-loopa-coral px-2.5 py-1 rounded-full border border-loopa-charcoal">
                    <AlertCircle className="w-3 h-3" />
                    Sold Out
                  </span>
                )}
              </div>
            </div>

            {/* Variant Size Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-loopa-charcoal uppercase tracking-wider">
                  Available Sizes:
                </label>
                <span className="text-[11px] text-loopa-muted font-medium">Pilih ukuran Anda</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 rounded-2xl text-xs font-black border-2 border-loopa-charcoal transition-all ${
                      selectedSize === size
                        ? "bg-loopa-charcoal text-white shadow-playful-sm scale-105"
                        : "bg-white text-loopa-charcoal hover:bg-loopa-lavender"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-loopa-charcoal uppercase tracking-wider">
                Condition & Styling Notes
              </h3>
              <p className="text-xs sm:text-sm text-loopa-charcoal/90 leading-relaxed font-medium whitespace-pre-line bg-white/60 p-4 rounded-2xl border border-loopa-border">
                {product.description}
              </p>
            </div>

            {/* Seller Profile Card (FR-04) */}
            <div className="p-4 rounded-3xl border-2 border-loopa-charcoal bg-white shadow-playful-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {seller?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={seller.avatar_url}
                      alt={seller.full_name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-loopa-charcoal"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-loopa-lavender text-loopa-charcoal font-black flex items-center justify-center border-2 border-loopa-charcoal text-sm">
                      {seller?.full_name?.charAt(0) || "S"}
                    </div>
                  )}
                  <div>
                    <h4 className="font-display font-black text-sm text-loopa-charcoal leading-tight">
                      {seller?.full_name}
                    </h4>
                    <span className="text-xs font-semibold text-loopa-muted">@{seller?.handle}</span>
                    <SellerBadge
                      isOnline={seller?.is_online}
                      lastSeen={seller?.last_seen}
                      className="mt-1"
                    />
                  </div>
                </div>

                {canPurchase && (
                  <button
                    onClick={handleStartChat}
                    className="px-3.5 py-2 rounded-full border-2 border-loopa-charcoal bg-loopa-lime text-loopa-charcoal text-xs font-black hover:bg-loopa-charcoal hover:text-white transition-all shadow-playful-sm flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat Seller</span>
                  </button>
                )}
              </div>

              {seller?.bio && (
                <p className="text-xs text-loopa-muted font-medium mt-3 pt-3 border-t border-loopa-border">
                  &ldquo;{seller.bio}&rdquo;
                </p>
              )}
            </div>

            {/* Trust Assurances */}
            <div className="grid grid-cols-2 gap-3 text-xs font-bold text-loopa-charcoal">
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-loopa-border">
                <ShieldCheck className="w-4 h-4 text-loopa-coral shrink-0" />
                <span>Verifikasi Manual 24h</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-loopa-border">
                <Truck className="w-4 h-4 text-loopa-coral shrink-0" />
                <span>Packing Kurir Terlindungi</span>
              </div>
            </div>
          </div>

          {/* Sticky Actions Container — Strictly Role-Separated */}
          <div className="mt-8 pt-6 border-t-2 border-loopa-charcoal space-y-3">
            {canPurchase ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Chat-to-Checkout Primary (FR-01) */}
                <button
                  onClick={handleStartChat}
                  className="w-full py-3.5 px-4 rounded-full border-2 border-loopa-charcoal bg-white text-loopa-charcoal hover:bg-loopa-lavender text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-playful"
                >
                  <MessageSquare className="w-4 h-4 text-loopa-coral" />
                  <span>Chat Penjual Dulu</span>
                </button>

                {/* Direct Checkout (FR-05) */}
                <button
                  onClick={handleBuyNow}
                  disabled={product.stock <= 0}
                  className="w-full py-3.5 px-4 rounded-full bg-loopa-charcoal text-white hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 shadow-playful disabled:opacity-50"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Beli Langsung ({selectedSize})</span>
                </button>
              </div>
            ) : isSellerAccount ? (
              <div className="p-4 rounded-3xl bg-loopa-cream border-2 border-loopa-charcoal space-y-3 shadow-playful-sm">
                <p className="text-xs font-bold text-loopa-charcoal leading-relaxed">
                  {isOwnProduct
                    ? "Ini adalah pakaian dari etalase studio Anda sendiri. Kelola stok atau harga langsung dari Seller Studio."
                    : "Mode Pratinjau Penjual — Akun Penjual tidak dapat melakukan pembelian atau checkout. Gunakan akun Pembeli (Member) jika ingin berbelanja."}
                </p>
                <Link
                  href={isOwnProduct ? "/dashboard?tab=inventory" : "/dashboard"}
                  className="w-full py-3 px-4 rounded-full bg-loopa-charcoal hover:bg-loopa-lime hover:text-loopa-charcoal text-white text-xs font-black border-2 border-loopa-charcoal transition-all flex items-center justify-center gap-2"
                >
                  <span>
                    {isOwnProduct
                      ? "Kelola Stok di Seller Studio"
                      : "Kembali ke Seller Studio"}
                  </span>
                </Link>
              </div>
            ) : (
              <div className="p-4 rounded-3xl bg-loopa-cream border-2 border-loopa-charcoal space-y-3 shadow-playful-sm">
                <p className="text-xs font-bold text-loopa-charcoal leading-relaxed">
                  Mode Moderasi Superadmin — Akun Superadmin tidak dapat melakukan pembelian. Anda dapat memoderasi produk ini melalui Superadmin Console.
                </p>
                <Link
                  href="/admin"
                  className="w-full py-3 px-4 rounded-full bg-loopa-charcoal hover:bg-loopa-lime hover:text-loopa-charcoal text-white text-xs font-black border-2 border-loopa-charcoal transition-all flex items-center justify-center gap-2"
                >
                  <span>Buka Superadmin Console</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Community Visual OOTD Reviews (FR-02) */}
      <section className="mt-16 sm:mt-24 pt-10 border-t-2 border-loopa-charcoal">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-extrabold text-xl sm:text-3xl text-loopa-charcoal">
                Community OOTD Reviews ({reviews.length})
              </h2>
              <span className="text-[10px] px-3 py-1 rounded-full bg-loopa-lime text-loopa-charcoal font-black border border-loopa-charcoal shadow-playful-sm">
                Pure Media Proof
              </span>
            </div>
            <p className="text-xs sm:text-sm text-loopa-muted font-medium mt-1">
              Hanya foto & video asli unboxing dan styling dari pembeli terverifikasi. No stars.
            </p>
          </div>

          {currentUser?.role === "member" && (
            <button
              onClick={() => setShowReviewModal(true)}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-loopa-charcoal text-white text-xs font-black hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal transition-all shadow-playful-sm"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Upload OOTD Review</span>
            </button>
          )}
        </div>

        {reviews.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((rev) => (
              <MediaReviewCard key={rev.id} review={rev} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-loopa-charcoal p-6">
            <Camera className="w-8 h-8 text-loopa-muted mx-auto mb-2" />
            <p className="font-display font-bold text-sm text-loopa-charcoal">
              Belum ada foto review OOTD untuk item ini
            </p>
            <p className="text-xs text-loopa-muted font-medium mt-1">
              Jadilah yang pertama mengunggah styling foto begitu paket tiba!
            </p>
          </div>
        )}
      </section>

      {/* MODAL: UPLOAD OOTD REVIEW */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-loopa-charcoal/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-4xl max-w-lg w-full p-6 sm:p-8 shadow-playful border-2 border-loopa-charcoal">
            <div className="flex items-center justify-between pb-4 border-b-2 border-loopa-charcoal">
              <h3 className="font-display font-black text-base text-loopa-charcoal">
                Upload OOTD Styling Review
              </h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="text-loopa-charcoal hover:text-loopa-coral font-bold text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {reviewSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-loopa-charcoal bg-loopa-lime p-2 rounded-full mx-auto border-2 border-loopa-charcoal" />
                <p className="font-display font-black text-base text-loopa-charcoal">
                  OOTD Review Published!
                </p>
                <p className="text-xs text-loopa-muted font-medium">
                  Terima kasih sudah berbagi bukti visual asli kepada komunitas LOOPA.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAddReview} className="space-y-4 pt-4">
                <div>
                  <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                    URL Foto OOTD / Video Unboxing *
                  </label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... atau URL foto Anda"
                    value={reviewMediaUrl}
                    onChange={(e) => setReviewMediaUrl(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
                  />
                  <span className="text-[10px] text-loopa-muted font-medium block mt-1">
                    Tip: Masukkan URL foto fashion unboxing untuk preview instan.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                    Fit Feedback *
                  </label>
                  <select
                    value={reviewFit}
                    onChange={(e) => setReviewFit(e.target.value as any)}
                    className="w-full px-4 py-2 text-xs font-bold rounded-2xl border-2 border-loopa-charcoal bg-white"
                  >
                    <option value="True to Size">True to Size (Pas Sesuai Ukuran)</option>
                    <option value="Runs Oversized">Runs Oversized (Lebih Longgar/Boxy)</option>
                    <option value="Fitted">Fitted (Lebih Ketat)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                    Catatan Material & Styling *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ceritakan bagaimana bahan dan kenyamanan pakaian ini saat dipakai..."
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    required
                    className="w-full px-4 py-2 text-xs font-medium rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    className="px-5 py-2.5 text-xs font-bold rounded-full text-loopa-muted hover:text-loopa-charcoal"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 text-xs font-black rounded-full bg-loopa-lime text-loopa-charcoal hover:bg-loopa-charcoal hover:text-white border-2 border-loopa-charcoal transition-all shadow-playful-sm"
                  >
                    Publish OOTD
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

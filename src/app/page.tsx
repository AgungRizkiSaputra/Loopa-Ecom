"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DataStore } from "@/lib/storage";
import { Product, Profile, Review } from "@/types";
import { ProductCard } from "@/components/product-card";
import { MediaReviewCard } from "@/components/media-review-card";
import { SellerBadge } from "@/components/seller-badge";
import {
  Sparkles,
  ArrowRight,
  Flame,
  MessageSquare,
  ShieldCheck,
  Search,
  Camera,
  Shirt,
  Scissors,
  Zap,
} from "lucide-react";

const CATEGORY_CARDS = [
  {
    name: "Vintage Archive",
    img: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=400&q=80",
    color: "bg-loopa-lavender",
  },
  {
    name: "Knit & Crochet",
    img: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=400&q=80",
    color: "bg-loopa-lime",
  },
  {
    name: "Streetwear & Denim",
    img: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=400&q=80",
    color: "bg-loopa-coral",
  },
  {
    name: "Footwear & Tabi",
    img: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=400&q=80",
    color: "bg-white",
  },
  {
    name: "Y2K Accessories",
    img: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80",
    color: "bg-loopa-lime",
  },
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [featuredSellers, setFeaturedSellers] = useState<Profile[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All Pieces");

  useEffect(() => {
    DataStore.init();
    setProducts(DataStore.getProducts());
    setReviews(DataStore.getReviews().slice(0, 3));

    // Featured sellers
    const sellers: Profile[] = [
      DataStore.getProductById("prod-fsh-01")?.seller,
      DataStore.getProductById("prod-fsh-02")?.seller,
      DataStore.getProductById("prod-fsh-04")?.seller,
    ].filter(Boolean) as Profile[];
    setFeaturedSellers(sellers);
  }, []);

  const trendingProducts = products.filter((p) => p.is_trending);
  const freshFinds = products.filter((p) => p.is_fresh_find || !p.is_trending);

  return (
    <div className="flex flex-col min-h-screen w-full max-w-full overflow-x-clip">
      {/* Editorial Fashion Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:py-20 bg-loopa-cream border-b-2 border-loopa-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-loopa-lime border-2 border-loopa-charcoal shadow-playful-sm text-xs font-black uppercase tracking-wider text-loopa-charcoal">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Playful Everyday Fashion Marketplace</span>
              </div>

              <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight text-loopa-charcoal leading-[1.05]">
                Style Goes <br />
                <span className="inline-block relative">
                  <span className="relative z-10 text-loopa-charcoal">Around.</span>
                  <span className="absolute left-0 right-0 bottom-2 h-4 sm:h-6 bg-loopa-lavender -z-0 rounded-lg -rotate-1 border border-loopa-charcoal" />
                </span>
              </h1>

              <p className="text-sm sm:text-base text-loopa-muted font-medium max-w-xl leading-relaxed">
                Temukan rilisan pre-loved istimewa, reworked denim, dan aksesoris rajut handmade langsung dari lemari sesama stylist & independent creators. Nego ramah via chat, bukti transfer manual, dan ulasan foto OOTD asli.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <Link
                  href="/explore"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-loopa-charcoal text-white font-extrabold text-xs sm:text-sm hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal transition-all shadow-playful"
                >
                  <span>Explore Pieces</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/chat"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-white text-loopa-charcoal font-extrabold text-xs sm:text-sm hover:bg-loopa-lavender border-2 border-loopa-charcoal transition-all shadow-playful"
                >
                  <MessageSquare className="w-4 h-4 text-loopa-coral" />
                  <span>Chat with Sellers</span>
                </Link>
              </div>

              {/* Badges */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs font-bold text-loopa-charcoal">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-loopa-lime border border-loopa-charcoal" />
                  <span>Chat-to-Checkout</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-loopa-coral border border-loopa-charcoal" />
                  <span>Pure Media Proof</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-loopa-lavender border border-loopa-charcoal" />
                  <span>Zero Fake Stars</span>
                </div>
              </div>
            </div>

            {/* Right Editorial Visual Showcase (5 Cols) */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/5] rounded-4xl border-2 border-loopa-charcoal bg-white p-3 shadow-playful rotate-1 hover:rotate-0 transition-transform duration-500 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=85"
                  alt="LOOPA Everyday Fashion Editorial"
                  className="w-full h-full object-cover rounded-3xl"
                />

                {/* Floating playful badge */}
                <div className="absolute top-6 right-6 bg-loopa-lime border-2 border-loopa-charcoal px-3 py-1.5 rounded-2xl shadow-playful-sm -rotate-6">
                  <span className="font-display font-black text-xs uppercase tracking-tight text-loopa-charcoal">
                    90s Archive Drop ✦
                  </span>
                </div>

                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm border-2 border-loopa-charcoal p-3.5 rounded-2xl shadow-playful-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-loopa-muted uppercase">Curated by</span>
                      <h4 className="font-display font-extrabold text-xs text-loopa-charcoal">
                        Studio Rasa (@studiorasa)
                      </h4>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-loopa-coral text-white font-black text-[10px] border border-loopa-charcoal">
                      Jakarta
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex items-center justify-between pb-6">
          <div>
            <h2 className="font-display font-extrabold text-xl sm:text-2xl text-loopa-charcoal">
              Trending Wardrobe Categories
            </h2>
            <p className="text-xs text-loopa-muted font-medium mt-0.5">
              Jelajahi kurasi fashion harian berdasarkan gaya favoritmu
            </p>
          </div>
          <Link
            href="/explore"
            className="text-xs font-bold text-loopa-charcoal hover:text-loopa-coral transition-colors flex items-center gap-1"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORY_CARDS.map((cat) => (
            <Link
              key={cat.name}
              href={`/explore?cat=${encodeURIComponent(cat.name)}`}
              className="group p-3 rounded-3xl bg-white border-2 border-loopa-charcoal hover:shadow-playful hover:-translate-y-1 transition-all flex flex-col items-center text-center"
            >
              <div className={`w-full aspect-square rounded-2xl overflow-hidden border-2 border-loopa-charcoal mb-3 ${cat.color}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <h3 className="font-display font-bold text-xs text-loopa-charcoal group-hover:text-loopa-coral transition-colors">
                {cat.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Independent Sellers */}
      <section className="bg-white border-y-2 border-loopa-charcoal py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between pb-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-loopa-lime border border-loopa-charcoal" />
              <h2 className="font-display font-extrabold text-xl sm:text-2xl text-loopa-charcoal">
                Featured Independent Stylists
              </h2>
            </div>
            <span className="text-xs text-loopa-muted font-semibold">Verified Sellers</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {featuredSellers.map((seller) => (
              <Link
                key={seller.id}
                href={`/chat?seller_id=${seller.id}`}
                className="p-5 rounded-3xl bg-loopa-cream border-2 border-loopa-charcoal shadow-playful-sm flex items-center gap-4 hover:shadow-playful hover:bg-loopa-lime/30 transition-all"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={seller.avatar_url || ""}
                  alt={seller.full_name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-loopa-charcoal shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display font-bold text-sm text-loopa-charcoal truncate">
                      {seller.full_name}
                    </h3>
                    <SellerBadge isOnline={seller.is_online} compact />
                  </div>
                  <span className="text-xs font-semibold text-loopa-muted">@{seller.handle}</span>
                  <p className="text-[11px] text-loopa-charcoal font-medium line-clamp-1 mt-1">
                    {seller.bio}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Now Asymmetric Product Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b-2 border-loopa-charcoal">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-loopa-coral text-white text-[10px] font-black uppercase tracking-wider border border-loopa-charcoal">
                Hot Drops
              </span>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-loopa-charcoal">
                Trending Now
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-loopa-muted font-medium mt-1">
              Potongan pakaian paling banyak diajak chat minggu ini
            </p>
          </div>

          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-2 border-loopa-charcoal bg-white hover:bg-loopa-lime text-xs font-bold transition-all shadow-playful-sm"
          >
            <span>Lihat Semua ({products.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-8">
          {trendingProducts.map((p, idx) => (
            <ProductCard key={p.id} product={p} priority={idx < 2} />
          ))}
        </div>
      </section>

      {/* Fresh Finds Section */}
      <section className="bg-loopa-cream border-t-2 border-loopa-charcoal py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="pb-8">
            <span className="px-2.5 py-0.5 rounded-full bg-loopa-lavender text-loopa-charcoal text-[10px] font-black uppercase tracking-wider border border-loopa-charcoal">
              Baru Mendarat
            </span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-loopa-charcoal mt-1">
              Fresh Finds
            </h2>
            <p className="text-xs sm:text-sm text-loopa-muted font-medium mt-0.5">
              Reworked handmade dan aksesoris kurasi teranyar
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {freshFinds.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Community Visual OOTD Reviews Gallery (FR-02) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b-2 border-loopa-charcoal">
          <div>
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-loopa-coral" />
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-loopa-charcoal">
                Community OOTD Style Reviews
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-loopa-muted font-medium mt-1">
              100% foto dan video asli unboxing dari pembeli terverifikasi. Zero bot star ratings.
            </p>
          </div>

          <Link
            href="/explore"
            className="text-xs font-bold text-loopa-charcoal hover:text-loopa-coral transition-colors flex items-center gap-1"
          >
            <span>Jelajahi Outfit Feed</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-8">
          {reviews.map((rev) => (
            <MediaReviewCard key={rev.id} review={rev} />
          ))}
        </div>
      </section>
    </div>
  );
}

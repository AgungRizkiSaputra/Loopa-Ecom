"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DataStore } from "@/lib/storage";
import { Product } from "@/types";
import { ProductCard } from "@/components/product-card";
import { Search, SlidersHorizontal, Sparkles, RefreshCw } from "lucide-react";

function ExploreInner() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("cat") || "All Pieces";
  const initialQuery = searchParams.get("q") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [condition, setCondition] = useState("All");
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [visibleCount, setVisibleCount] = useState(6);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    DataStore.init();
    setProducts(DataStore.getProducts());
  }, []);

  const categories = [
    "All Pieces",
    "Vintage Archive",
    "Knit & Crochet",
    "Streetwear & Denim",
    "Footwear & Tabi",
    "Y2K Accessories",
  ];

  const conditions = ["All", "Vintage / Thrift", "Handmade Rework", "Brand New", "Like New"];

  const filtered = products
    .filter((p) => {
      const matchCat = category === "All Pieces" || p.category === category;
      const matchCondition = condition === "All" || p.condition === condition;
      const matchSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        (p.seller?.full_name && p.seller.full_name.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchCondition && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const displayed = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 3);
      setLoadingMore(false);
    }, 400);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Editorial Header */}
      <div className="pb-8 border-b-2 border-loopa-charcoal">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-loopa-lime text-[10px] font-black uppercase tracking-wider border border-loopa-charcoal mb-2 shadow-playful-sm">
          <Sparkles className="w-3 h-3" />
          <span>Curated Community Catalog</span>
        </div>
        <h1 className="font-display font-black text-3xl sm:text-5xl text-loopa-charcoal">
          Explore Everyday Drops
        </h1>
        <p className="text-xs sm:text-sm text-loopa-muted font-medium mt-1">
          {filtered.length} potongan fashion siap pakai dan pre-loved kurasi stylist independen.
        </p>
      </div>

      {/* Filter and Control Bar */}
      <div className="py-6 space-y-4">
        {/* Search & Sort Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-loopa-muted absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by piece name, vintage jacket, boots, or seller..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 text-xs font-semibold rounded-full border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime shadow-playful-sm"
            />
          </div>

          <div className="md:col-span-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-4 py-2.5 text-xs font-bold rounded-full border-2 border-loopa-charcoal bg-white text-loopa-charcoal focus:outline-none shadow-playful-sm"
            >
              <option value="newest">Sort: Newest Drops</option>
              <option value="price_asc">Price: Lowest to Highest</option>
              <option value="price_desc">Price: Highest to Lowest</option>
            </select>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex flex-wrap items-center gap-2 py-1">
          {categories.map((c) => {
            const isSelected = category === c;
            return (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap border-2 border-loopa-charcoal transition-all ${isSelected
                    ? "bg-loopa-charcoal text-white shadow-playful-sm"
                    : "bg-white text-loopa-charcoal hover:bg-loopa-lime"
                  }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* Condition Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 py-1 text-xs">
          <span className="text-[11px] font-bold text-loopa-muted uppercase mr-1">Kondisi:</span>
          {conditions.map((cond) => {
            const isSelected = condition === cond;
            return (
              <button
                key={cond}
                onClick={() => setCondition(cond)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap border border-loopa-charcoal transition-all ${isSelected
                    ? "bg-loopa-lavender text-loopa-charcoal font-black shadow-playful-sm"
                    : "bg-loopa-cream text-loopa-muted hover:text-loopa-charcoal"
                  }`}
              >
                {cond}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Showcase */}
      {displayed.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 pt-4">
          {displayed.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-loopa-charcoal my-8 p-6">
          <p className="font-display font-extrabold text-base text-loopa-charcoal">
            Tidak ada item fashion yang cocok dengan filter ini
          </p>
          <p className="text-xs text-loopa-muted font-medium mt-1">
            Coba ganti kata kunci atau reset filter kategori.
          </p>
          <button
            onClick={() => {
              setSearch("");
              setCategory("All Pieces");
              setCondition("All");
            }}
            className="mt-4 px-5 py-2 text-xs font-extrabold rounded-full bg-loopa-charcoal text-white hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal shadow-playful-sm"
          >
            Reset Semua Filter
          </button>
        </div>
      )}

      {/* Cursor Pagination Simulator */}
      {hasMore && (
        <div className="mt-12 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-loopa-charcoal bg-white text-xs font-extrabold text-loopa-charcoal hover:bg-loopa-lime shadow-playful transition-all disabled:opacity-50"
          >
            {loadingMore ? (
              <span>Loading More Drops...</span>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-loopa-coral" />
                <span>Load More Pieces</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-20 text-center text-xs text-loopa-muted">
          Loading LOOPA catalog...
        </div>
      }
    >
      <ExploreInner />
    </Suspense>
  );
}

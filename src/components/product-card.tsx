"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Product } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { SellerBadge } from "./seller-badge";
import { MessageSquare, ArrowUpRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const router = useRouter();
  const primaryImage = product.images[0] || "/placeholder.jpg";
  const seller = product.seller;

  const handleChatDirect = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/chat?seller_id=${product.seller_id}&product_id=${product.id}`);
  };

  const getConditionStyle = (condition: string) => {
    switch (condition) {
      case "Vintage / Thrift":
        return "bg-loopa-lavender text-loopa-charcoal";
      case "Handmade Rework":
        return "bg-loopa-lime text-loopa-charcoal";
      case "Brand New":
        return "bg-loopa-coral text-white";
      default:
        return "bg-white text-loopa-charcoal";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="group relative flex flex-col bg-white rounded-3xl border-2 border-loopa-charcoal overflow-hidden hover:shadow-playful hover:-translate-y-1 transition-all duration-300"
    >
      {/* Product Image Frame with Editorial Aspect Ratio */}
      <Link
        href={`/products/${product.id}`}
        className="relative aspect-[4/5] w-full overflow-hidden bg-loopa-cream block"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={primaryImage}
          alt={product.name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
          loading={priority ? "eager" : "lazy"}
        />

        {/* Condition Sticker Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-block px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider rounded-full border border-loopa-charcoal shadow-playful-sm ${getConditionStyle(
              product.condition
            )}`}
          >
            {product.condition}
          </span>
        </div>

        {/* Size Badge */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="absolute top-3 right-3">
            <span className="inline-block px-2.5 py-0.5 text-[10px] font-bold bg-white text-loopa-charcoal rounded-full border border-loopa-charcoal shadow-playful-sm">
              {product.sizes.join(" • ")}
            </span>
          </div>
        )}

        {/* Trending pill badge */}
        {product.is_trending && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold bg-loopa-lime text-loopa-charcoal rounded-full border border-loopa-charcoal shadow-playful-sm">
              <Sparkles className="w-2.5 h-2.5" />
              trending
            </span>
          </div>
        )}
      </Link>

      {/* Details Area */}
      <div className="flex flex-col flex-1 p-4 sm:p-5 justify-between">
        {/* Seller Info with Online Presence Indicator */}
        <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-loopa-border">
          <div className="flex items-center gap-2 min-w-0">
            {seller?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={seller.avatar_url}
                alt={seller.full_name}
                className="w-5 h-5 rounded-full object-cover border border-loopa-charcoal shrink-0"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-loopa-lavender text-loopa-charcoal font-bold flex items-center justify-center text-[10px] border border-loopa-charcoal shrink-0">
                {seller?.full_name?.charAt(0) || "S"}
              </div>
            )}
            <span className="text-xs font-semibold text-loopa-muted truncate">
              @{seller?.handle || seller?.full_name?.toLowerCase().replace(/\s/g, "")}
            </span>
          </div>

          <SellerBadge
            isOnline={seller?.is_online}
            lastSeen={seller?.last_seen}
            compact
          />
        </div>

        {/* Title */}
        <Link href={`/products/${product.id}`} className="group-hover:text-loopa-coral transition-colors">
          <h3 className="font-display font-bold text-loopa-charcoal text-sm sm:text-base leading-snug line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        {/* Price & Action CTA */}
        <div className="mt-4 pt-3 flex items-center justify-between gap-3 border-t border-loopa-border">
          <div>
            <span className="text-[10px] font-semibold text-loopa-muted uppercase tracking-wider block">
              Price
            </span>
            <span className="text-base sm:text-lg font-black text-loopa-charcoal font-display tracking-tight">
              {formatCurrency(product.price)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Chat directly with seller (FR-01) */}
            <button
              onClick={handleChatDirect}
              title="Chat with seller about this piece"
              className="p-2 rounded-full border-2 border-loopa-charcoal bg-loopa-cream text-loopa-charcoal hover:bg-loopa-lime transition-colors shadow-playful-sm"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>

            {/* Direct piece detail view */}
            <Link
              href={`/products/${product.id}`}
              className="p-2 rounded-full bg-loopa-charcoal text-white hover:bg-loopa-coral hover:text-white border-2 border-loopa-charcoal transition-all shadow-playful-sm"
              title="View piece"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

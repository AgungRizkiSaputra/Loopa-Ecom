"use client";

import React, { useState } from "react";
import { Review } from "@/types";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, Image as ImageIcon, ZoomIn, Sparkles } from "lucide-react";

interface MediaReviewCardProps {
  review: Review;
}

export function MediaReviewCard({ review }: MediaReviewCardProps) {
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const activeMedia = review.media_urls[activeMediaIndex] || review.media_urls[0];

  return (
    <div className="flex flex-col bg-white border-2 border-loopa-charcoal rounded-3xl overflow-hidden shadow-playful-sm hover:shadow-playful hover:-translate-y-1 transition-all duration-300">
      {/* Visual Outfit / Unboxing Frame */}
      {review.media_urls.length > 0 && (
        <div className="relative aspect-[4/5] w-full bg-loopa-charcoal overflow-hidden group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeMedia}
            alt="Customer OOTD Style Review"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />

          {/* Fit Feedback Sticker */}
          {review.fit_feedback && (
            <div className="absolute top-3 left-3">
              <span className="px-3 py-1 rounded-full bg-loopa-lime text-loopa-charcoal font-black text-[10px] tracking-wide uppercase border border-loopa-charcoal shadow-playful-sm">
                Fit: {review.fit_feedback}
              </span>
            </div>
          )}

          {/* Multiple Media Count */}
          {review.media_urls.length > 1 && (
            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-loopa-charcoal/90 text-[10px] text-white flex items-center gap-1 font-bold">
              <ImageIcon className="w-3 h-3 text-loopa-lime" />
              <span>{review.media_urls.length} outfits</span>
            </div>
          )}
        </div>
      )}

      {/* Content & Buyer Info */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              {review.buyer?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={review.buyer.avatar_url}
                  alt={review.buyer.full_name}
                  className="w-7 h-7 rounded-full object-cover border border-loopa-charcoal"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-loopa-lavender text-loopa-charcoal font-bold flex items-center justify-center text-xs border border-loopa-charcoal">
                  {review.buyer?.full_name?.charAt(0) || "B"}
                </div>
              )}
              <span className="text-xs font-bold text-loopa-charcoal">
                @{review.buyer?.handle || "loopa_member"}
              </span>
            </div>

            <div className="flex items-center gap-1 text-[10px] font-bold text-loopa-charcoal bg-loopa-lime px-2 py-0.5 rounded-full border border-loopa-charcoal shadow-playful-sm">
              <CheckCircle2 className="w-3 h-3" />
              <span>Verified Piece</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-loopa-charcoal leading-relaxed font-medium">
            &ldquo;{review.content}&rdquo;
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-loopa-border flex items-center justify-between text-[10px] text-loopa-muted font-semibold">
          <span>{formatDate(review.created_at)}</span>
          <span className="text-loopa-coral font-bold uppercase tracking-wider">
            Verified Buyer OOTD
          </span>
        </div>
      </div>
    </div>
  );
}

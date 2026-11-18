"use client";

import React from "react";
import { formatRelativeTime } from "@/lib/utils";

interface SellerBadgeProps {
  isOnline?: boolean;
  lastSeen?: string;
  className?: string;
  compact?: boolean;
}

export function SellerBadge({
  isOnline = false,
  lastSeen,
  className = "",
  compact = false,
}: SellerBadgeProps) {
  if (compact) {
    return (
      <span
        title={isOnline ? "Active Now on loopa" : "Offline"}
        className={`inline-block w-2.5 h-2.5 rounded-full border border-loopa-charcoal ${
          isOnline ? "bg-loopa-lime animate-pulse" : "bg-slate-300"
        } ${className}`}
      />
    );
  }

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs font-semibold ${className}`}>
      <span
        className={`w-2 h-2 rounded-full border border-loopa-charcoal ${
          isOnline ? "bg-loopa-lime shadow-xs" : "bg-slate-300"
        }`}
      />
      <span className={isOnline ? "text-loopa-charcoal font-bold" : "text-loopa-muted"}>
        {isOnline
          ? "Active now"
          : lastSeen
          ? `Seen ${formatRelativeTime(lastSeen)}`
          : "Offline"}
      </span>
    </div>
  );
}

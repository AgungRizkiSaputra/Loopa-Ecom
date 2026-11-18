"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/config/site";
import { Sparkles, MessageSquare, ShieldCheck, Heart } from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  // Hide public storefront footer on dedicated admin & seller studio panels
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    return null;
  }
  return (
    <footer className="border-t-2 border-loopa-charcoal bg-loopa-cream mt-24 pb-20 md:pb-12 text-loopa-charcoal overflow-hidden">
      {/* Infinite Marquee Ticker */}
      <div className="bg-loopa-lime border-b-2 border-loopa-charcoal py-2.5 overflow-hidden font-display">
        <div className="animate-marquee whitespace-nowrap text-xs font-black tracking-wider uppercase text-loopa-charcoal">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="mx-6 flex items-center gap-4">
              <span>STYLE GOES AROUND</span>
              <span>✦</span>
              <span>CURATED C2C EVERYDAY FASHION</span>
              <span>✦</span>
              <span>DIRECT CHAT NEGOTIATIONS</span>
              <span>✦</span>
              <span>100% VISUAL OOTD REVIEWS</span>
              <span>✦</span>
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-3xl tracking-tight text-loopa-charcoal">
                loopa
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-loopa-lime border border-loopa-charcoal shadow-playful-sm" />
            </div>

            <p className="text-xs sm:text-sm text-loopa-muted max-w-md leading-relaxed font-medium">
              Everyday fashion marketplace for Gen-Z & Millennials. Where archive pieces, handmade knitwear, and streetwear find their next chapter through personal chat and authentic community proof.
            </p>

            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 rounded-full bg-loopa-lavender text-loopa-charcoal font-bold text-[11px] border border-loopa-charcoal shadow-playful-sm">
                Chat-First Commerce
              </span>
              <span className="px-3 py-1 rounded-full bg-loopa-lime text-loopa-charcoal font-bold text-[11px] border border-loopa-charcoal shadow-playful-sm">
                Manual Transfer 24h
              </span>
              <span className="px-3 py-1 rounded-full bg-loopa-coral text-white font-bold text-[11px] border border-loopa-charcoal shadow-playful-sm">
                Pure Visual Proof
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-loopa-charcoal mb-3 font-display">
              Curated Feeds
            </h4>
            <ul className="space-y-2 text-xs font-semibold text-loopa-muted">
              <li>
                <Link href="/explore?cat=Vintage+Archive" className="hover:text-loopa-charcoal transition-colors">
                  Vintage 90s Archive
                </Link>
              </li>
              <li>
                <Link href="/explore?cat=Knit+%26+Crochet" className="hover:text-loopa-charcoal transition-colors">
                  Knitwear & Balaclavas
                </Link>
              </li>
              <li>
                <Link href="/explore?cat=Streetwear+%26+Denim" className="hover:text-loopa-charcoal transition-colors">
                  Deconstructed Denim
                </Link>
              </li>
              <li>
                <Link href="/explore?cat=Footwear+%26+Tabi" className="hover:text-loopa-charcoal transition-colors">
                  Archival Footwear & Tabi
                </Link>
              </li>
            </ul>
          </div>

          {/* Trust & PRD Boundaries */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-loopa-charcoal mb-3 font-display">
              LOOPA Principles
            </h4>
            <ul className="space-y-1.5 text-xs text-loopa-muted font-medium">
              <li>• Tanpa Payment Gateway Otomatis</li>
              <li>• Tanpa Rating Bintang (Hanya Media)</li>
              <li>• Kunci Stok Transaksional Atomik</li>
              <li>• Verifikasi Manual Penjual 24 Jam</li>
            </ul>
          </div>
        </div>

        <div className="border-t-2 border-loopa-charcoal/20 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-loopa-muted gap-4 font-semibold">
          <p>© {new Date().getFullYear()} loopa. {siteConfig.tagline} All rights reserved.</p>
          <p className="flex items-center gap-1 text-[11px]">
            Designed with <Heart className="w-3.5 h-3.5 text-loopa-coral fill-loopa-coral" /> for conscious fashion lovers.
          </p>
        </div>
      </div>
    </footer>
  );
}

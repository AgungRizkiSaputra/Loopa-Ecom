"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { siteConfig } from "@/config/site";
import { DataStore } from "@/lib/storage";
import { startAuthTransition } from "@/lib/auth-transition";
import { Profile } from "@/types";
import {
  Search,
  Store,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Package,
  Sparkles,
  Shield,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [searchVal, setSearchVal] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const syncState = () => {
      DataStore.init();
      const user = DataStore.getCurrentUser();
      setCurrentUser(user);
      setUnreadChatCount(user ? DataStore.getUnreadMessageCount(user.id) : 0);
      setMounted(true);
    };

    syncState();
    window.addEventListener("user_role_changed", syncState);
    window.addEventListener("messages_updated", syncState);
    window.addEventListener("storage", syncState);
    const interval = setInterval(syncState, 2500);

    return () => {
      window.removeEventListener("user_role_changed", syncState);
      window.removeEventListener("messages_updated", syncState);
      window.removeEventListener("storage", syncState);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    setIsUserMenuOpen(false);
    startAuthTransition({ mode: "logout" }, () => {
      DataStore.logoutUser();
      setCurrentUser(null);
      setUnreadChatCount(0);
      window.dispatchEvent(new Event("user_role_changed"));
      router.push("/");
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const isSeller = currentUser?.role === "seller";
  const isSuperadmin = currentUser?.role === "superadmin";

  // Hide storefront navbar on dedicated Admin & Seller Studio panels
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-loopa-border bg-loopa-cream/95 backdrop-blur-md">
      {/* Top Playful Announcement Bar */}
      <div className="bg-loopa-charcoal text-white text-[11px] font-medium py-1 px-4 flex items-center justify-between overflow-hidden">
        <div className="flex items-center gap-2 mx-auto">
          <span className="w-1.5 h-1.5 rounded-full bg-loopa-lime animate-pulse" />
          <span>
            <strong>loopa drop:</strong> Kurasi fashion harian C2C • Transaksi langsung via Chat • Verifikasi manual 24h
          </span>
          <span className="hidden sm:inline text-loopa-lime font-bold">#StyleGoesAround</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
          {/* Brand Logo: Bold Lowercase Wordmark 'loopa' */}
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-1.5 group">
              <span className="font-display font-extrabold text-2xl sm:text-3xl tracking-tight text-loopa-charcoal group-hover:text-loopa-charcoal transition-colors">
                loopa
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-loopa-lime shadow-playful-sm border border-loopa-charcoal group-hover:scale-125 transition-transform" />
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link
                href="/"
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${pathname === "/"
                  ? "bg-loopa-charcoal text-white shadow-playful-sm"
                  : "text-loopa-charcoal hover:bg-white hover:text-black"
                  }`}
              >
                Discover
              </Link>
              <Link
                href="/explore"
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${pathname.startsWith("/explore")
                  ? "bg-loopa-charcoal text-white shadow-playful-sm"
                  : "text-loopa-charcoal hover:bg-white hover:text-black"
                  }`}
              >
                Explore
              </Link>
              {!isSuperadmin && (
                <Link
                  href="/chat"
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all relative inline-flex items-center gap-1.5 ${pathname.startsWith("/chat")
                    ? "bg-loopa-charcoal text-white shadow-playful-sm"
                    : "text-loopa-charcoal hover:bg-white hover:text-black"
                    }`}
                >
                  <span>{isSeller ? "Chat Pembeli" : "Chat"}</span>
                  {mounted && unreadChatCount > 0 ? (
                    <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-loopa-coral text-white text-[10px] font-black border border-loopa-charcoal inline-flex items-center justify-center animate-pulse">
                      {unreadChatCount}
                    </span>
                  ) : (
                    <span className="inline-block w-2 h-2 rounded-full bg-loopa-lime" />
                  )}
                </Link>
              )}

              {!isSeller && !isSuperadmin && (
                <Link
                  href="/orders"
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${pathname.startsWith("/orders")
                    ? "bg-loopa-charcoal text-white shadow-playful-sm"
                    : "text-loopa-charcoal hover:bg-white hover:text-black"
                    }`}
                >
                  Orders
                </Link>
              )}

              {isSeller && (
                <Link
                  href="/dashboard"
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 ${pathname.startsWith("/dashboard")
                    ? "bg-loopa-lime text-loopa-charcoal border border-loopa-charcoal shadow-playful-sm"
                    : "text-loopa-charcoal hover:bg-loopa-lime/60"
                    }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  Seller Studio
                </Link>
              )}

              {isSuperadmin && (
                <Link
                  href="/admin"
                  className="px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all flex items-center gap-1.5 bg-loopa-coral text-white border border-loopa-charcoal shadow-playful-sm hover:bg-loopa-charcoal"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Superadmin
                </Link>
              )}
            </nav>
          </div>

          {/* Center Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 max-w-md hidden md:flex items-center relative"
          >
            <Search className="w-4 h-4 text-loopa-muted absolute left-4 pointer-events-none" />
            <input
              type="text"
              placeholder="Search vintage carhartt, knit balaclava, tabi..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-full border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime shadow-playful-sm transition-all"
            />
          </form>

          {/* Right: Authentication Actions (Real Login/Register/User Menu) */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {mounted && currentUser ? (
              /* User Menu Dropdown */
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full border-2 border-loopa-charcoal bg-white hover:bg-loopa-cream transition-all shadow-playful-sm"
                >
                  {currentUser.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={currentUser.avatar_url}
                      alt={currentUser.full_name}
                      className="w-7 h-7 rounded-full object-cover border border-loopa-charcoal"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-loopa-lavender text-loopa-charcoal font-bold flex items-center justify-center text-xs">
                      {currentUser.full_name.charAt(0)}
                    </div>
                  )}
                  <div className="text-left hidden sm:block">
                    <span className="text-xs font-black text-loopa-charcoal block leading-none">
                      {currentUser.full_name.split(" ")[0]}
                    </span>
                    <span className="text-[10px] font-bold text-loopa-muted uppercase">
                      {currentUser.role === "superadmin"
                        ? "Superadmin"
                        : currentUser.role === "seller"
                          ? "Stylist"
                          : "Member"}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-loopa-charcoal ml-0.5" />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-3xl border-2 border-loopa-charcoal shadow-playful p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-loopa-border mb-1">
                      <p className="text-xs font-extrabold text-loopa-charcoal">
                        {currentUser.full_name}
                      </p>
                      <p className="text-[10px] font-semibold text-loopa-muted">
                        @{currentUser.handle} • {currentUser.email}
                      </p>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-loopa-charcoal hover:bg-loopa-cream rounded-2xl transition-colors"
                    >
                      <User className="w-4 h-4 text-loopa-coral" />
                      <span>
                        {isSeller
                          ? "Profil & Rekening Studio"
                          : isSuperadmin
                            ? "Pengaturan Akun"
                            : "Profil & Alamat Saya"}
                      </span>
                    </Link>

                    {isSeller && (
                      <Link
                        href="/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-loopa-charcoal bg-loopa-lime/40 hover:bg-loopa-lime rounded-2xl transition-colors mt-0.5"
                      >
                        <Store className="w-4 h-4 text-loopa-charcoal" />
                        <span>Seller Studio</span>
                      </Link>
                    )}

                    {isSuperadmin && (
                      <Link
                        href="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-white bg-loopa-coral hover:bg-loopa-charcoal rounded-2xl transition-colors mt-0.5"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Superadmin Console</span>
                      </Link>
                    )}

                    {!isSeller && !isSuperadmin && (
                      <Link
                        href="/orders"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-loopa-charcoal hover:bg-loopa-cream rounded-2xl transition-colors mt-0.5"
                      >
                        <Package className="w-4 h-4 text-loopa-muted" />
                        <span>Pesanan Saya</span>
                      </Link>
                    )}

                    <div className="border-t border-loopa-border mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Keluar (Logout)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Guest Actions: Login & Register */
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-full text-xs font-black text-loopa-charcoal hover:bg-white border-2 border-transparent hover:border-loopa-charcoal transition-all"
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-full bg-loopa-charcoal text-white text-xs font-black hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal transition-all shadow-playful-sm"
                >
                  Daftar
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

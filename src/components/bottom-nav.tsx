"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Compass, MessageSquare, Package, Store, User, Shield } from "lucide-react";
import { DataStore } from "@/lib/storage";
import { Profile } from "@/types";

export function BottomNav() {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  useEffect(() => {
    const updateUser = () => {
      DataStore.init();
      const user = DataStore.getCurrentUser();
      setCurrentUser(user);
      setUnreadChatCount(user ? DataStore.getUnreadMessageCount(user.id) : 0);
    };
    updateUser();
    window.addEventListener("user_role_changed", updateUser);
    window.addEventListener("messages_updated", updateUser);
    window.addEventListener("storage", updateUser);
    const interval = setInterval(updateUser, 2500);

    return () => {
      window.removeEventListener("user_role_changed", updateUser);
      window.removeEventListener("messages_updated", updateUser);
      window.removeEventListener("storage", updateUser);
      clearInterval(interval);
    };
  }, []);

  const isSeller = currentUser?.role === "seller";
  const isSuperadmin = currentUser?.role === "superadmin";

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    return null;
  }

  const navItems = [
    { label: "Discover", href: "/", icon: Sparkles },
    { label: "Explore", href: "/explore", icon: Compass },
    ...(!isSuperadmin
      ? [{ label: "Chat", href: "/chat", icon: MessageSquare, hasBadge: true }]
      : []),
    ...(!isSeller && !isSuperadmin
      ? [{ label: "Orders", href: "/orders", icon: Package }]
      : []),
    ...(isSuperadmin
      ? [{ label: "Admin", href: "/admin", icon: Shield }]
      : isSeller
        ? [
          { label: "Studio", href: "/dashboard", icon: Store },
          { label: "Profil", href: "/profile", icon: User },
        ]
        : currentUser
          ? [{ label: "Profile", href: "/profile", icon: User }]
          : [{ label: "Masuk", href: "/login", icon: User }]),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-loopa-cream/95 backdrop-blur-lg border-t-2 border-loopa-charcoal md:hidden px-3 py-1.5 shadow-playful">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all relative ${isActive
                ? "text-loopa-charcoal font-black scale-105"
                : "text-loopa-muted hover:text-loopa-charcoal"
                }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${isActive ? "bg-loopa-lime border border-loopa-charcoal shadow-playful-sm" : ""
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
              {item.hasBadge && unreadChatCount > 0 && (
                <span className="absolute top-0.5 right-3 min-w-[16px] h-4 px-1 rounded-full bg-loopa-coral text-white text-[9px] font-black border border-loopa-charcoal flex items-center justify-center animate-pulse">
                  {unreadChatCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { DataStore } from "@/lib/storage";
import { Message, Profile } from "@/types";
import { Bell, MessageSquare, X, ArrowRight } from "lucide-react";

interface ChatToastItem {
  id: string;
  senderId: string;
  senderName: string;
  senderHandle: string;
  senderAvatar?: string;
  senderRole: Profile["role"];
  content: string;
  unreadTotal: number;
}

const SESSION_TOASTED_KEY = "loopa_toasted_chat_ids_v1";

function getToastedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = sessionStorage.getItem(SESSION_TOASTED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveToastedId(msgId: string) {
  if (typeof window === "undefined") return;
  try {
    const set = getToastedIds();
    set.add(msgId);
    sessionStorage.setItem(SESSION_TOASTED_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore storage errors
  }
}

export function ChatNotificationListener() {
  const pathname = usePathname();
  const router = useRouter();
  const [toast, setToast] = useState<ChatToastItem | null>(null);

  const checkNewIncomingMessages = useCallback(() => {
    if (typeof window === "undefined") return;
    // Never interrupt while the user is already inside the Chat page or auth pages
    if (
      pathname.startsWith("/chat") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/register")
    ) {
      setToast(null);
      return;
    }

    DataStore.init();
    const user = DataStore.getCurrentUser();
    if (!user || user.role === "superadmin") {
      setToast(null);
      return;
    }

    const allMessages = DataStore.getMessages();
    const unreadIncoming = allMessages.filter(
      (m: Message) =>
        m.receiver_id === user.id &&
        m.is_read === false &&
        !m.is_auto_reply
    );

    if (unreadIncoming.length === 0) return;

    const toastedIds = getToastedIds();
    // Pick the newest unread message that hasn't been shown as a toast yet
    const newestUnshown = [...unreadIncoming]
      .reverse()
      .find((m) => !toastedIds.has(m.id));

    if (!newestUnshown) return;

    const senderProfile =
      DataStore.getUserById(newestUnshown.sender_id) || newestUnshown.sender;
    if (!senderProfile) return;

    saveToastedId(newestUnshown.id);
    setToast({
      id: newestUnshown.id,
      senderId: senderProfile.id,
      senderName: senderProfile.full_name,
      senderHandle: senderProfile.handle,
      senderAvatar: senderProfile.avatar_url,
      senderRole: senderProfile.role,
      content: newestUnshown.content,
      unreadTotal: unreadIncoming.length,
    });
  }, [pathname]);

  useEffect(() => {
    checkNewIncomingMessages();

    const handleSync = () => checkNewIncomingMessages();
    window.addEventListener("messages_updated", handleSync);
    window.addEventListener("user_role_changed", handleSync);
    window.addEventListener("storage", handleSync);

    // Lightweight periodic poll so cross-tab/local updates feel instant
    const interval = setInterval(checkNewIncomingMessages, 2500);

    return () => {
      window.removeEventListener("messages_updated", handleSync);
      window.removeEventListener("user_role_changed", handleSync);
      window.removeEventListener("storage", handleSync);
      clearInterval(interval);
    };
  }, [checkNewIncomingMessages]);

  // Auto-dismiss after 7.5 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 7500);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleOpenChat = () => {
    if (!toast) return;
    const targetSenderId = toast.senderId;
    setToast(null);
    router.push(`/chat?seller_id=${encodeURIComponent(targetSenderId)}`);
  };

  return (
    <div className="fixed top-20 sm:top-24 right-4 left-4 sm:left-auto z-[70] pointer-events-none flex justify-end">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -18, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="pointer-events-auto max-w-sm w-full bg-white rounded-3xl border-2 border-loopa-charcoal shadow-playful overflow-hidden"
            role="alert"
          >
            {/* Top Notification Strip */}
            <div className="bg-loopa-lime border-b-2 border-loopa-charcoal px-4 py-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-loopa-charcoal">
                <Bell className="w-3.5 h-3.5 text-loopa-charcoal animate-bounce" />
                <span>
                  {toast.senderRole === "seller"
                    ? "Balasan Baru dari Penjual"
                    : "Pesan Baru dari Pembeli"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setToast(null)}
                aria-label="Tutup notifikasi"
                className="p-0.5 rounded-full hover:bg-white text-loopa-charcoal transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="relative shrink-0">
                  {toast.senderAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={toast.senderAvatar}
                      alt={toast.senderName}
                      className="w-11 h-11 rounded-full object-cover border-2 border-loopa-charcoal"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-loopa-lavender text-loopa-charcoal font-black flex items-center justify-center text-sm border-2 border-loopa-charcoal">
                      {toast.senderName.charAt(0)}
                    </div>
                  )}
                  <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-display font-black text-xs text-loopa-charcoal truncate">
                      {toast.senderName}
                    </h4>
                    <span className="text-[10px] font-bold text-loopa-muted shrink-0">
                      @{toast.senderHandle}
                    </span>
                  </div>
                  <p className="text-xs text-loopa-charcoal font-medium line-clamp-2 mt-1 leading-snug">
                    &ldquo;{toast.content}&rdquo;
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[10px] font-bold text-loopa-muted">
                  {toast.unreadTotal > 1
                    ? `+${toast.unreadTotal - 1} pesan belum dibaca lainnya`
                    : "Baru saja dibalas"}
                </span>

                <button
                  type="button"
                  onClick={handleOpenChat}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-loopa-charcoal hover:bg-loopa-lime hover:text-loopa-charcoal text-white text-[11px] font-black border-2 border-loopa-charcoal transition-all shadow-playful-sm"
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Lihat Chat</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

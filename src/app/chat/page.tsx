"use client";

import React, { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DataStore } from "@/lib/storage";
import { Product, Profile, Message } from "@/types";
import { formatCurrency, formatRelativeTime } from "@/lib/utils";
import { SellerBadge } from "@/components/seller-badge";
import {
  Send,
  ShoppingBag,
  ArrowLeft,
  Paperclip,
  CheckCheck,
  ShieldCheck,
  Lock,
  Search,
  MessageSquare,
  X,
  PlusCircle,
  Compass,
  Tag,
} from "lucide-react";

function ChatInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialSellerId = searchParams.get("seller_id");
  const initialProductId = searchParams.get("product_id");
  const initialSize = searchParams.get("size") || "";

  const [mounted, setMounted] = useState(false);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);

  const [activePartnerId, setActivePartnerId] = useState<string | null>(null);
  const [attachedProduct, setAttachedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>(initialSize);
  const [inputContent, setInputContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [inboxFilter, setInboxFilter] = useState<"all" | "needs_reply" | "replied">("all");
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "chat">(
    initialProductId || initialSellerId ? "chat" : "list"
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadChatData = () => {
    DataStore.init();
    const user = DataStore.getCurrentUser();
    const users = DataStore.getAllUsers();
    const products = DataStore.getProducts();
    const msgs = DataStore.getMessages();

    setCurrentUser(user);
    setAllUsers(users);
    setAllProducts(products);
    setAllMessages(msgs);
    setMounted(true);

    if (!user) return;

    // Resolve target seller & product from query params (when coming from Product Detail)
    let targetPartnerId: string | null = null;
    if (initialProductId) {
      const prod = products.find((p) => p.id === initialProductId);
      if (prod) {
        setAttachedProduct(prod);
        setSelectedSize(initialSize || prod.sizes[0] || "Standard");
        targetPartnerId = prod.seller_id;
      }
    }
    if (!targetPartnerId && initialSellerId) {
      targetPartnerId = initialSellerId;
    }

    if (targetPartnerId && targetPartnerId !== user.id) {
      setActivePartnerId(targetPartnerId);
      setMobileView("chat");
    } else {
      // Only auto-select a partner if the user already has existing conversation messages
      setActivePartnerId((prev) => {
        if (prev && prev !== user.id) return prev;
        const myMsgs = msgs.filter(
          (m) => m.sender_id === user.id || m.receiver_id === user.id
        );
        if (myMsgs.length === 0) return null;
        const lastMsg = myMsgs[myMsgs.length - 1];
        return lastMsg.sender_id === user.id
          ? lastMsg.receiver_id
          : lastMsg.sender_id;
      });
    }
  };

  useEffect(() => {
    loadChatData();
    window.addEventListener("user_role_changed", loadChatData);
    return () => window.removeEventListener("user_role_changed", loadChatData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSellerId, initialProductId, initialSize]);

  // Build list of ACTIVE product conversations ONLY (plus currently initiated product chat)
  const conversations = useMemo(() => {
    if (!currentUser) return [];

    const partnerMap = new Map<string, Profile>();

    // Include partners who already have messages with currentUser
    allMessages.forEach((m) => {
      if (m.sender_id === currentUser.id && m.receiver_id !== currentUser.id) {
        const found = allUsers.find((u) => u.id === m.receiver_id);
        if (found) partnerMap.set(found.id, found);
      } else if (m.receiver_id === currentUser.id && m.sender_id !== currentUser.id) {
        const found = allUsers.find((u) => u.id === m.sender_id);
        if (found) partnerMap.set(found.id, found);
      }
    });

    // Include currently initiated seller if user just clicked "Chat Penjual" from a product
    if (activePartnerId && activePartnerId !== currentUser.id) {
      const target = allUsers.find((u) => u.id === activePartnerId);
      if (target) partnerMap.set(target.id, target);
    }

    const list = Array.from(partnerMap.values()).map((partner) => {
      const threadMsgs = allMessages.filter(
        (m) =>
          (m.sender_id === currentUser.id && m.receiver_id === partner.id) ||
          (m.sender_id === partner.id && m.receiver_id === currentUser.id)
      );
      const lastMessage =
        threadMsgs.length > 0 ? threadMsgs[threadMsgs.length - 1] : null;

      // Count unread messages sent by partner to currentUser (ignore automated greeting)
      const unreadCount = threadMsgs.filter(
        (m) =>
          m.sender_id === partner.id &&
          m.receiver_id === currentUser.id &&
          m.is_read === false &&
          !m.is_auto_reply
      ).length;

      // Determine latest real human message to know if Seller/User has responded yet
      const humanMsgs = threadMsgs.filter((m) => !m.is_auto_reply);
      const lastHumanMsg =
        humanMsgs.length > 0 ? humanMsgs[humanMsgs.length - 1] : null;
      const needsReply =
        lastHumanMsg !== null && lastHumanMsg.sender_id === partner.id;
      const isReplied =
        lastHumanMsg !== null && lastHumanMsg.sender_id === currentUser.id;

      // Determine latest product discussed in this thread
      let threadProduct: Product | null = null;
      if (attachedProduct && attachedProduct.seller_id === partner.id) {
        threadProduct = attachedProduct;
      } else {
        for (let i = threadMsgs.length - 1; i >= 0; i--) {
          const msg = threadMsgs[i];
          if (msg.product) {
            threadProduct = msg.product;
            break;
          }
          if (msg.product_id) {
            const p = allProducts.find((prod) => prod.id === msg.product_id);
            if (p) {
              threadProduct = p;
              break;
            }
          }
        }
      }

      return {
        partner,
        lastMessage,
        messageCount: threadMsgs.length,
        unreadCount,
        needsReply,
        isReplied,
        threadProduct,
      };
    });

    // Sort: unread first, then needs reply, then latest timestamp
    list.sort((a, b) => {
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      if (a.lastMessage && b.lastMessage) {
        return (
          new Date(b.lastMessage.created_at).getTime() -
          new Date(a.lastMessage.created_at).getTime()
        );
      }
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      return a.partner.full_name.localeCompare(b.partner.full_name);
    });

    const filteredByTab = list.filter((item) => {
      if (inboxFilter === "needs_reply") {
        return item.unreadCount > 0 || item.needsReply;
      }
      if (inboxFilter === "replied") {
        return item.unreadCount === 0 && item.isReplied;
      }
      return true;
    });

    if (!searchQuery.trim()) return filteredByTab;
    const q = searchQuery.toLowerCase();
    return filteredByTab.filter(
      ({ partner, threadProduct }) =>
        partner.full_name.toLowerCase().includes(q) ||
        partner.handle.toLowerCase().includes(q) ||
        (threadProduct && threadProduct.name.toLowerCase().includes(q))
    );
  }, [allUsers, allMessages, allProducts, currentUser, activePartnerId, attachedProduct, searchQuery, inboxFilter]);

  const activePartner = useMemo(() => {
    if (!activePartnerId) return null;
    return allUsers.find((u) => u.id === activePartnerId) || null;
  }, [activePartnerId, allUsers]);

  const activeThreadMessages = useMemo(() => {
    if (!currentUser || !activePartner) return [];
    return allMessages.filter(
      (m) =>
        (m.sender_id === currentUser.id && m.receiver_id === activePartner.id) ||
        (m.sender_id === activePartner.id && m.receiver_id === currentUser.id)
    );
  }, [allMessages, currentUser, activePartner]);

  const partnerProducts = useMemo(() => {
    if (!activePartner) return [];
    return allProducts.filter((p) => p.seller_id === activePartner.id);
  }, [allProducts, activePartner]);

  // Pinned product context for the active thread (so buyer & seller ALWAYS know what item is discussed)
  const pinnedProduct = useMemo(() => {
    if (!activePartner) return null;
    if (attachedProduct && attachedProduct.seller_id === activePartner.id) {
      return attachedProduct;
    }
    for (let i = activeThreadMessages.length - 1; i >= 0; i--) {
      const m = activeThreadMessages[i];
      if (m.product) return m.product;
      if (m.product_id) {
        const found = allProducts.find((p) => p.id === m.product_id);
        if (found) return found;
      }
    }
    return null;
  }, [activePartner, attachedProduct, activeThreadMessages, allProducts]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThreadMessages.length, activePartnerId]);

  // Mark active thread messages as read whenever the user views this conversation
  useEffect(() => {
    if (!currentUser || !activePartnerId) return;
    const hasUnreadFromPartner = allMessages.some(
      (m) =>
        m.sender_id === activePartnerId &&
        m.receiver_id === currentUser.id &&
        m.is_read === false
    );
    if (hasUnreadFromPartner) {
      const updated = DataStore.markConversationAsRead(
        currentUser.id,
        activePartnerId
      );
      setAllMessages(updated);
    }
  }, [currentUser, activePartnerId, allMessages]);

  if (!mounted) {
    return (
      <div className="max-w-md mx-auto py-20 text-center text-xs text-loopa-muted font-bold">
        Memuat ruang obrolan LOOPA...
      </div>
    );
  }

  // PRD Section 8 Rule: Guests cannot participate in chat
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-4xl border-2 border-loopa-charcoal p-8 sm:p-10 shadow-playful">
          <div className="w-16 h-16 rounded-full bg-loopa-lavender border-2 border-loopa-charcoal shadow-playful-sm flex items-center justify-center text-loopa-charcoal mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-loopa-charcoal">
            Akses Chat Memerlukan Akun Member
          </h2>
          <p className="text-xs sm:text-sm text-loopa-muted font-medium mt-2 leading-relaxed max-w-md mx-auto">
            Obrolan langsung dengan penjual dilindungi untuk Member &amp; Penjual terdaftar agar transaksi fashion C2C tetap aman dan terpercaya.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-full bg-loopa-charcoal text-white text-xs font-black hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal transition-all shadow-playful text-center"
            >
              Masuk ke Akun Anda
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto px-6 py-3 rounded-full border-2 border-loopa-charcoal bg-white text-loopa-charcoal text-xs font-black hover:bg-loopa-cream transition-all shadow-playful-sm text-center"
            >
              Daftar Akun Baru
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleStartProductChat = (prod: Product) => {
    if (prod.seller_id === currentUser.id) return;
    setActivePartnerId(prod.seller_id);
    setAttachedProduct(prod);
    setSelectedSize(prod.sizes[0] || "Standard");
    setShowProductPicker(false);
    setMobileView("chat");
  };

  const handleSelectConversation = (partnerId: string, threadProd: Product | null) => {
    setActivePartnerId(partnerId);
    setShowProductPicker(false);
    if (currentUser) {
      const updated = DataStore.markConversationAsRead(currentUser.id, partnerId);
      setAllMessages(updated);
    }
    // Never auto-reattach product cards when opening an existing conversation;
    // the pinned bar at the top already displays the product context.
    if (attachedProduct && attachedProduct.seller_id !== partnerId) {
      setAttachedProduct(null);
    }
    if (threadProd) {
      setSelectedSize(threadProd.sizes[0] || "Standard");
    }
    setMobileView("chat");
  };

  const sendMessageContent = (customText?: string) => {
    if (!activePartner) return;
    const text = (customText ?? inputContent).trim();

    // Only attach a product card when explicitly attached (1st message from a product page or via "Pilih Produk")
    const explicitAttachment =
      attachedProduct && attachedProduct.seller_id === activePartner.id
        ? attachedProduct
        : null;
    const productContext = explicitAttachment || pinnedProduct;

    if (!text && !explicitAttachment) return;

    // Check BEFORE sending if this is the VERY FIRST message in this conversation
    const existingThread = allMessages.filter(
      (m) =>
        (m.sender_id === currentUser.id && m.receiver_id === activePartner.id) ||
        (m.sender_id === activePartner.id && m.receiver_id === currentUser.id)
    );
    const isFirstMessageEver = existingThread.length === 0;

    const sizeUsed = selectedSize || productContext?.sizes[0] || "Standard";

    const newMsg = DataStore.sendMessage({
      senderId: currentUser.id,
      receiverId: activePartner.id,
      content:
        text ||
        `Halo ${activePartner.full_name}, saya tertarik dengan ${explicitAttachment?.name} (Size: ${sizeUsed}). Masih available?`,
      productId: explicitAttachment ? explicitAttachment.id : null,
      metadata: explicitAttachment
        ? {
            is_product_attachment: true,
            order_draft: {
              product_id: explicitAttachment.id,
              product_name: explicitAttachment.name,
              price: explicitAttachment.price,
              quantity: 1,
              selected_size: sizeUsed,
              image_url: explicitAttachment.images[0] || "",
            },
          }
        : undefined,
    });

    setAllMessages((prev) => [...prev, newMsg]);
    if (!customText) setInputContent("");
    // Clear attachment after sending so follow-up messages are clean text bubbles
    setAttachedProduct(null);

    // FIRST-MESSAGE-ONLY Auto-Reply (no duplicate product card on auto-reply)
    if (
      currentUser.role === "member" &&
      activePartner.role === "seller" &&
      isFirstMessageEver
    ) {
      const targetPartner = activePartner;
      const buyerFirstName = currentUser.full_name.split(" ")[0];
      setTimeout(() => {
        const replyText = productContext
          ? `Halo kak ${buyerFirstName}! Terima kasih sudah menghubungi ${targetPartner.full_name}. Pesan Anda terkait ${productContext.name} (Size ${sizeUsed}) sudah masuk ke inbox kami dan akan segera dibalas langsung oleh penjual.`
          : `Halo kak ${buyerFirstName}! Terima kasih sudah menghubungi ${targetPartner.full_name}. Pesan Anda sudah masuk dan akan segera kami balas.`;

        const sellerAutoReply = DataStore.sendMessage({
          senderId: targetPartner.id,
          receiverId: currentUser.id,
          content: replyText,
          productId: null,
          isAutoReply: true,
        });
        setAllMessages((prev) => [...prev, sellerAutoReply]);
      }, 900);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessageContent();
  };

  const handleTriggerCheckoutFromChat = (
    targetProductId: string,
    size?: string
  ) => {
    router.push(
      `/checkout?product_id=${targetProductId}&quantity=1&size=${encodeURIComponent(
        size || selectedSize || "Standard"
      )}`
    );
  };

  const isSellerAccount = currentUser.role === "seller";
  const isSuperadminAccount = currentUser.role === "superadmin";

  // Superadmin does not participate in buyer/seller commerce chat
  if (isSuperadminAccount) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-4xl border-2 border-loopa-charcoal p-8 sm:p-10 shadow-playful space-y-4">
          <div className="w-16 h-16 rounded-full bg-loopa-coral border-2 border-loopa-charcoal shadow-playful-sm flex items-center justify-center text-white mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-loopa-charcoal">
            Chat Khusus Pembeli &amp; Penjual
          </h2>
          <p className="text-xs sm:text-sm text-loopa-muted font-medium leading-relaxed">
            Sebagai Superadmin, pengelolaan pengguna, moderasi produk, dan resolusi sengketa dilakukan melalui Superadmin Console.
          </p>
          <div className="pt-2">
            <Link
              href="/admin"
              className="inline-block px-6 py-3 rounded-full bg-loopa-charcoal text-white text-xs font-black hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal transition-all shadow-playful-sm"
            >
              Kembali ke Superadmin Console
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Empty State when no active conversations exist
  if (conversations.length === 0 && !activePartner) {
    if (isSellerAccount) {
      return (
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <div className="bg-white rounded-4xl border-2 border-loopa-charcoal p-8 sm:p-10 shadow-playful space-y-5">
            <div className="w-16 h-16 rounded-full bg-loopa-lime border-2 border-loopa-charcoal shadow-playful-sm flex items-center justify-center text-loopa-charcoal mx-auto">
              <MessageSquare className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-loopa-lavender text-[10px] font-black uppercase tracking-wider border border-loopa-charcoal">
                Inbox Penjual
              </span>
              <h1 className="font-display font-black text-2xl text-loopa-charcoal">
                Belum Ada Pesan Masuk dari Pembeli
              </h1>
              <p className="text-xs sm:text-sm text-loopa-muted font-medium leading-relaxed">
                Saat ada pembeli yang menanyakan ukuran, stok, atau menawar pakaian dari studio Anda, percakapan beserta kartu produknya akan otomatis muncul di sini.
              </p>
            </div>
            <div className="pt-2">
              <Link
                href="/dashboard"
                className="inline-block px-6 py-3 rounded-full bg-loopa-charcoal text-white text-xs font-black hover:bg-loopa-lime hover:text-loopa-charcoal border-2 border-loopa-charcoal transition-all shadow-playful-sm"
              >
                Kembali ke Seller Studio
              </Link>
            </div>
          </div>
        </div>
      );
    }

    const pickableProducts = allProducts
      .filter((p) => p.seller_id !== currentUser.id)
      .slice(0, 6);

    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <div className="bg-white rounded-4xl border-2 border-loopa-charcoal p-7 sm:p-10 shadow-playful text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-loopa-lime border-2 border-loopa-charcoal shadow-playful-sm flex items-center justify-center text-loopa-charcoal mx-auto">
            <MessageSquare className="w-8 h-8" />
          </div>
          <div className="space-y-2 max-w-lg mx-auto">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-loopa-lavender text-[10px] font-black uppercase tracking-wider border border-loopa-charcoal">
              Chat-First Commerce
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-loopa-charcoal">
              Pilih Produk Dulu untuk Mulai Chat Penjual
            </h1>
            <p className="text-xs sm:text-sm text-loopa-muted font-medium leading-relaxed">
              Di LOOPA, obrolan selalu dimulai dari barang yang Anda minati agar penjual langsung tahu produk, ukuran, dan harga mana yang sedang ditanyakan.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-loopa-charcoal hover:bg-loopa-lime hover:text-loopa-charcoal text-white text-xs font-black border-2 border-loopa-charcoal transition-all shadow-playful-sm"
            >
              <Compass className="w-4 h-4" />
              <span>Jelajahi Katalog Lengkap</span>
            </Link>
          </div>
        </div>

        {/* Quick Pick Products to Start Product-Linked Chat Immediately */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display font-black text-lg text-loopa-charcoal">
                Atau Langsung Pilih Pakaian &amp; Tanya Penjualnya
              </h2>
              <p className="text-xs text-loopa-muted font-medium">
                Klik tombol &ldquo;Tanya Penjual&rdquo; pada produk di bawah untuk langsung membuka obrolan dengan lampiran barang otomatis.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pickableProducts.map((prod) => (
              <div
                key={prod.id}
                className="bg-white rounded-3xl border-2 border-loopa-charcoal p-4 shadow-playful-sm flex flex-col justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={prod.images[0] || ""}
                    alt={prod.name}
                    className="w-16 h-20 rounded-2xl object-cover border-2 border-loopa-charcoal shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-black uppercase text-loopa-coral block">
                      {prod.seller?.full_name || "Stylist"}
                    </span>
                    <h3 className="font-display font-black text-xs text-loopa-charcoal line-clamp-2 mt-0.5">
                      {prod.name}
                    </h3>
                    <p className="text-xs font-black text-loopa-charcoal mt-1">
                      {formatCurrency(prod.price)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleStartProductChat(prod)}
                  className="w-full py-2.5 px-3 rounded-full bg-loopa-lime hover:bg-loopa-charcoal hover:text-white text-loopa-charcoal text-xs font-black border-2 border-loopa-charcoal transition-colors flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Tanya Penjual Produk Ini</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 h-[calc(100vh-11.5rem)] md:h-[calc(100vh-8.5rem)] min-h-[540px]">
        {/* =================================================================
            LEFT COLUMN: ACTIVE PRODUCT CONVERSATIONS
            ================================================================= */}
        <aside
          className={`md:col-span-4 lg:col-span-4 bg-white border-2 border-loopa-charcoal rounded-4xl shadow-playful flex-col overflow-hidden ${
            mobileView === "chat" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Inbox Header */}
          <div className="p-4 border-b-2 border-loopa-border space-y-3 shrink-0">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-2 rounded-2xl bg-loopa-lime border border-loopa-charcoal shrink-0">
                  <MessageSquare className="w-4 h-4 text-loopa-charcoal" />
                </div>
                <div className="min-w-0">
                  <h1 className="font-display font-black text-base text-loopa-charcoal leading-tight truncate">
                    Obrolan Produk
                  </h1>
                  <p className="text-[11px] text-loopa-muted font-semibold">
                    {conversations.length} percakapan aktif
                  </p>
                </div>
              </div>

              {isSellerAccount ? (
                <Link
                  href="/dashboard"
                  className="px-2.5 py-1.5 rounded-full bg-loopa-lime hover:bg-loopa-charcoal hover:text-white border border-loopa-charcoal text-[10px] font-black text-loopa-charcoal shrink-0"
                >
                  ← Studio
                </Link>
              ) : (
                <Link
                  href="/explore"
                  title="Cari barang lain untuk ditanyakan"
                  className="px-2.5 py-1.5 rounded-full bg-loopa-cream hover:bg-loopa-lime border border-loopa-charcoal text-[10px] font-black text-loopa-charcoal shrink-0"
                >
                  + Cari Barang
                </Link>
              )}
            </div>

            {/* Search Conversations */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-loopa-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  isSellerAccount
                    ? "Cari nama pembeli atau produk..."
                    : "Cari penjual atau nama produk..."
                }
                className="w-full pl-9 pr-3 py-2 text-xs font-semibold rounded-full border-2 border-loopa-charcoal bg-loopa-cream focus:bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
              />
            </div>

            {/* Seller-only Read / Responded Status Filter Tabs */}
            {isSellerAccount && (
              <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-loopa-cream border border-loopa-charcoal">
                {(
                  [
                    { key: "all", label: "Semua" },
                    { key: "needs_reply", label: "Perlu Respon" },
                    { key: "replied", label: "Direspon" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setInboxFilter(tab.key)}
                    className={`py-1.5 px-1.5 rounded-xl text-[10px] font-black transition-colors text-center ${
                      inboxFilter === tab.key
                        ? "bg-loopa-charcoal text-white"
                        : "text-loopa-charcoal hover:bg-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Conversation Items List (Seller: CRM Respon Status | Member: Clean WhatsApp-Style) */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {conversations.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <p className="text-xs font-black text-loopa-charcoal">
                  Tidak ada obrolan ditemukan
                </p>
                <p className="text-[11px] text-loopa-muted mt-1">
                  {isSellerAccount
                    ? 'Pilih tab "Semua" untuk melihat seluruh percakapan.'
                    : "Coba kata kunci pencarian lain."}
                </p>
              </div>
            ) : (
              conversations.map(
                ({
                  partner,
                  lastMessage,
                  unreadCount,
                  needsReply,
                  isReplied,
                  threadProduct,
                }) => {
                  const isSelected = partner.id === activePartnerId;
                  const isUnread = unreadCount > 0;
                  const lastIsMe = lastMessage?.sender_id === currentUser.id;

                  return (
                    <button
                      key={partner.id}
                      type="button"
                      onClick={() =>
                        handleSelectConversation(partner.id, threadProduct)
                      }
                      className={`w-full text-left p-3 rounded-3xl border-2 transition-all space-y-2 ${
                        isSelected
                          ? "bg-loopa-lime border-loopa-charcoal shadow-playful-sm"
                          : isSellerAccount && isUnread
                          ? "bg-loopa-coral/15 border-loopa-coral shadow-playful-sm"
                          : "bg-white border-transparent hover:border-loopa-charcoal hover:bg-loopa-cream"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          {partner.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={partner.avatar_url}
                              alt={partner.full_name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-loopa-charcoal"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-loopa-lavender text-loopa-charcoal font-black flex items-center justify-center text-sm border-2 border-loopa-charcoal">
                              {partner.full_name.charAt(0)}
                            </div>
                          )}
                          <span
                            className={`w-2.5 h-2.5 rounded-full border-2 border-white absolute bottom-0 right-0 ${
                              partner.is_online ? "bg-emerald-500" : "bg-stone-400"
                            }`}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h3 className="font-display font-black text-xs text-loopa-charcoal truncate flex items-center gap-1.5">
                              {isSellerAccount && isUnread && (
                                <span className="w-2 h-2 rounded-full bg-loopa-coral shrink-0 animate-pulse" />
                              )}
                              <span className="truncate">{partner.full_name}</span>
                            </h3>
                            {lastMessage && (
                              <span
                                className={`text-[10px] shrink-0 ${
                                  !isSellerAccount && isUnread
                                    ? "font-black text-emerald-600"
                                    : "font-bold text-loopa-charcoal/70"
                                }`}
                              >
                                {formatRelativeTime(lastMessage.created_at)}
                              </span>
                            )}
                          </div>

                          {/* Preview Row: WhatsApp-style double tick / unread green circle for Member */}
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <div className="flex items-center gap-1 min-w-0 flex-1">
                              {!isSellerAccount && lastIsMe && lastMessage && (
                                <CheckCheck
                                  className={`w-3.5 h-3.5 shrink-0 ${
                                    lastMessage.is_read
                                      ? "text-sky-600"
                                      : "text-loopa-muted"
                                  }`}
                                />
                              )}
                              <p
                                className={`text-[11px] truncate ${
                                  isUnread
                                    ? "font-black text-loopa-charcoal"
                                    : "font-medium text-loopa-charcoal/80"
                                }`}
                              >
                                {lastMessage
                                  ? lastMessage.content
                                  : "Siap menanyakan produk terpilih"}
                              </p>
                            </div>

                            {!isSellerAccount && isUnread && (
                              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Seller-Only CRM Read / Responded Status Pill Row */}
                      {isSellerAccount && (
                        <div className="flex items-center justify-between gap-2">
                          {isUnread ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-loopa-coral text-white text-[10px] font-black border border-loopa-charcoal">
                              <span>{unreadCount} Belum Dibaca</span>
                            </span>
                          ) : needsReply ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-loopa-lavender text-loopa-charcoal text-[10px] font-black border border-loopa-charcoal">
                              <span>Sudah Dibaca • Belum Direspon</span>
                            </span>
                          ) : isReplied ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black border border-emerald-400">
                              <CheckCheck className="w-3 h-3" />
                              <span>Sudah Direspon</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-loopa-muted">
                              Obrolan baru
                            </span>
                          )}
                        </div>
                      )}

                      {/* Product Context Pill inside Conversation Row */}
                      {threadProduct && (
                        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/90 border border-loopa-charcoal/30">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={threadProduct.images[0] || ""}
                            alt={threadProduct.name}
                            className="w-7 h-7 rounded-lg object-cover border border-loopa-charcoal shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-black text-loopa-charcoal truncate">
                              {threadProduct.name}
                            </p>
                            <p className="text-[10px] font-bold text-loopa-muted">
                              {formatCurrency(threadProduct.price)}
                            </p>
                          </div>
                        </div>
                      )}
                    </button>
                  );
                }
              )
            )}
          </div>
        </aside>

        {/* =================================================================
            RIGHT COLUMN: ACTIVE PRODUCT-CONTEXT CHAT ROOM
            ================================================================= */}
        <section
          className={`md:col-span-8 lg:col-span-8 flex-col min-h-0 min-w-0 ${
            mobileView === "list" ? "hidden md:flex" : "flex"
          }`}
        >
          {activePartner ? (
            <>
              {/* Seller Header Card */}
              <div className="bg-white border-2 border-loopa-charcoal rounded-3xl p-3.5 sm:p-4 flex items-center justify-between gap-2 shadow-playful-sm mb-2.5 shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileView("list")}
                    className="md:hidden p-2 rounded-full hover:bg-loopa-cream text-loopa-charcoal transition-colors border border-loopa-charcoal shrink-0"
                    aria-label="Kembali ke daftar chat"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <div className="relative shrink-0">
                    {activePartner.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={activePartner.avatar_url}
                        alt={activePartner.full_name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-loopa-charcoal"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-loopa-lavender text-loopa-charcoal font-black flex items-center justify-center text-sm border-2 border-loopa-charcoal">
                        {activePartner.full_name.charAt(0)}
                      </div>
                    )}
                    <SellerBadge
                      isOnline={activePartner.is_online}
                      lastSeen={activePartner.last_seen}
                      compact
                      className="absolute -bottom-0.5 -right-0.5"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h2 className="font-display font-black text-sm text-loopa-charcoal leading-tight truncate">
                        {activePartner.full_name}
                      </h2>
                      <span className="text-[10px] bg-loopa-lime text-loopa-charcoal px-2 py-0.5 rounded-full font-black border border-loopa-charcoal shrink-0">
                        {activePartner.role === "seller" ? "Penjual" : "Pembeli"}
                      </span>
                    </div>
                    <SellerBadge
                      isOnline={activePartner.is_online}
                      lastSeen={activePartner.last_seen}
                      className="mt-0.5"
                    />
                  </div>
                </div>

                {/* Switch/Attach Another Product from This Seller */}
                {partnerProducts.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowProductPicker(!showProductPicker)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-black border-2 border-loopa-charcoal transition-all shadow-playful-sm shrink-0 ${
                      showProductPicker
                        ? "bg-loopa-lavender text-loopa-charcoal"
                        : "bg-white text-loopa-charcoal hover:bg-loopa-cream"
                    }`}
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Ganti / Pilih Produk</span>
                    <span className="sm:hidden">Produk</span>
                  </button>
                )}
              </div>

              {/* PINNED PRODUCT CONTEXT BAR — Always shows WHICH product & seller! */}
              {pinnedProduct && (
                <div className="bg-loopa-cream border-2 border-loopa-charcoal rounded-3xl p-3 mb-2.5 shadow-playful-sm flex items-center justify-between gap-3 shrink-0">
                  <Link
                    href={`/products/${pinnedProduct.id}`}
                    className="flex items-center gap-3 min-w-0 flex-1 group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pinnedProduct.images[0] || ""}
                      alt={pinnedProduct.name}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-loopa-charcoal shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3 h-3 text-loopa-coral shrink-0" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-loopa-coral">
                          Produk yang Ditanyakan
                        </span>
                      </div>
                      <h4 className="font-display font-black text-xs text-loopa-charcoal truncate group-hover:underline">
                        {pinnedProduct.name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-loopa-charcoal">
                        <span>{formatCurrency(pinnedProduct.price)}</span>
                        <span className="px-2 py-0.2 rounded-full bg-white border border-loopa-charcoal text-[10px]">
                          Size: {selectedSize || pinnedProduct.sizes[0]}
                        </span>
                        <span className="text-loopa-muted font-semibold">
                          Stok: {pinnedProduct.stock}
                        </span>
                      </div>
                    </div>
                  </Link>

                  {!isSellerAccount && (
                    <button
                      type="button"
                      onClick={() =>
                        handleTriggerCheckoutFromChat(
                          pinnedProduct.id,
                          selectedSize || pinnedProduct.sizes[0]
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-loopa-charcoal hover:bg-loopa-lime hover:text-loopa-charcoal text-white text-xs font-black border-2 border-loopa-charcoal transition-all shadow-playful-sm shrink-0"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Checkout</span>
                    </button>
                  )}
                </div>
              )}

              {/* Seller Catalog Picker Drawer */}
              {showProductPicker && partnerProducts.length > 0 && (
                <div className="bg-white border-2 border-loopa-charcoal rounded-3xl p-3 mb-2.5 shadow-playful-sm shrink-0">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[11px] font-black text-loopa-charcoal uppercase tracking-wider">
                      Pilih Produk dari {activePartner.full_name}:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowProductPicker(false)}
                      className="p-1 rounded-full hover:bg-loopa-cream text-loopa-charcoal"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {partnerProducts.map((prod) => (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => {
                          setAttachedProduct(prod);
                          setSelectedSize(prod.sizes[0] || "Standard");
                          setShowProductPicker(false);
                        }}
                        className="flex items-center gap-2.5 p-2 rounded-2xl bg-loopa-cream border border-loopa-charcoal hover:bg-loopa-lime text-left transition-colors"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={prod.images[0] || ""}
                          alt={prod.name}
                          className="w-10 h-10 rounded-xl object-cover border border-loopa-charcoal shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-loopa-charcoal truncate">
                            {prod.name}
                          </p>
                          <p className="text-[11px] font-black text-loopa-charcoal">
                            {formatCurrency(prod.price)} • Stok {prod.stock}
                          </p>
                        </div>
                        <PlusCircle className="w-4 h-4 text-loopa-charcoal shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto bg-white border-2 border-loopa-charcoal rounded-4xl p-4 sm:p-5 space-y-4 shadow-playful min-h-0">
                <div className="max-w-md mx-auto text-center py-2 px-4 rounded-full bg-loopa-cream border border-loopa-charcoal text-[11px] text-loopa-charcoal font-bold flex items-center justify-center gap-1.5 shadow-playful-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-loopa-coral shrink-0" />
                  <span>
                    Obrolan aman dengan {activePartner.full_name} • Dilindungi verifikasi manual 24 jam.
                  </span>
                </div>

                {activeThreadMessages.length === 0 ? (
                  <div className="py-6 text-center max-w-md mx-auto space-y-4">
                    <div className="p-4 rounded-3xl bg-loopa-cream border-2 border-dashed border-loopa-charcoal space-y-1.5">
                      <h3 className="font-display font-black text-sm text-loopa-charcoal">
                        Tanyakan Detail {pinnedProduct ? `"${pinnedProduct.name}"` : "Produk"}
                      </h3>
                      <p className="text-xs text-loopa-muted font-medium leading-relaxed">
                        Kirim pertanyaan pertama ke <strong>{activePartner.full_name}</strong>. Kartu produk otomatis terlampir di pesan Anda.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {[
                        pinnedProduct
                          ? `Halo kak, ${pinnedProduct.name} size ${selectedSize || pinnedProduct.sizes[0]} masih ready?`
                          : "Halo kak, produk ini masih ready?",
                        "Bisa info detail ukuran & kondisi barangnya?",
                        "Apakah pengiriman bisa hari ini?",
                      ].map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => sendMessageContent(prompt)}
                          className="px-3 py-1.5 rounded-full bg-white hover:bg-loopa-lime border border-loopa-charcoal text-[11px] font-bold text-loopa-charcoal transition-colors shadow-playful-sm"
                        >
                          &ldquo;{prompt}&rdquo;
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  activeThreadMessages.map((msg) => {
                    const isMe = msg.sender_id === currentUser.id;
                    const orderDraft = msg.metadata?.order_draft;
                    const attachedProd = msg.product;
                    const shouldShowAttachmentCard = Boolean(
                      msg.metadata?.is_product_attachment || orderDraft
                    );

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                      >
                        {shouldShowAttachmentCard && (orderDraft || attachedProd) && (
                          <div className="mb-2 p-3.5 rounded-3xl border-2 border-loopa-charcoal bg-loopa-cream max-w-sm w-full shadow-playful-sm">
                            <div className="flex items-center gap-3">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={orderDraft?.image_url || attachedProd?.images[0] || ""}
                                alt={orderDraft?.product_name || attachedProd?.name || "Piece"}
                                className="w-16 h-16 rounded-2xl object-cover shrink-0 border border-loopa-charcoal"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-[10px] text-loopa-coral font-black uppercase tracking-wider block">
                                  Lampiran Pakaian
                                </span>
                                <h4 className="font-display font-bold text-xs text-loopa-charcoal truncate">
                                  {orderDraft?.product_name || attachedProd?.name}
                                </h4>
                                <p className="text-xs font-black text-loopa-charcoal mt-0.5">
                                  {formatCurrency(orderDraft?.price || attachedProd?.price || 0)}
                                </p>
                                {orderDraft?.selected_size && (
                                  <span className="text-[10px] font-bold text-loopa-muted">
                                    Size: {orderDraft.selected_size}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="mt-3 pt-2.5 border-t border-loopa-border flex items-center justify-between gap-2">
                              <span className="text-[10px] text-loopa-muted font-bold">
                                Stok siap kirim
                              </span>
                              {!isSellerAccount && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleTriggerCheckoutFromChat(
                                      orderDraft?.product_id || attachedProd?.id || "",
                                      orderDraft?.selected_size || selectedSize
                                    )
                                  }
                                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-loopa-lime hover:bg-loopa-charcoal hover:text-white text-loopa-charcoal text-[11px] font-black border border-loopa-charcoal transition-all shadow-playful-sm"
                                >
                                  <ShoppingBag className="w-3 h-3" />
                                  <span>Buat Order Pre-filled</span>
                                </button>
                              )}
                            </div>
                          </div>
                        )}

                        <div
                          className={`max-w-[85%] sm:max-w-md px-4 py-3 rounded-3xl text-xs sm:text-sm font-medium leading-relaxed border-2 border-loopa-charcoal shadow-playful-sm break-words ${
                            msg.is_auto_reply
                              ? "bg-loopa-cream text-loopa-charcoal rounded-bl-sm border-dashed"
                              : isMe
                              ? "bg-loopa-lime text-loopa-charcoal rounded-br-sm"
                              : "bg-white text-loopa-charcoal rounded-bl-sm"
                          }`}
                        >
                          {msg.is_auto_reply && (
                            <span className="inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-loopa-lavender text-loopa-charcoal border border-loopa-charcoal mb-1.5">
                              Balasan Otomatis Studio
                            </span>
                          )}
                          <p>{msg.content}</p>
                          <div
                            className={`mt-1 flex items-center justify-end gap-1 text-[10px] font-bold ${
                              isMe ? "text-loopa-charcoal/70" : "text-loopa-muted"
                            }`}
                          >
                            <span>{formatRelativeTime(msg.created_at)}</span>
                            {isMe && !msg.is_auto_reply && (
                              <span
                                className="inline-flex items-center gap-0.5"
                                title={msg.is_read ? "Sudah dibaca" : "Terkirim"}
                              >
                                <CheckCheck
                                  className={`w-3.5 h-3.5 ${
                                    msg.is_read
                                      ? "text-sky-600"
                                      : "text-loopa-charcoal/45"
                                  }`}
                                />
                                {isSellerAccount && (
                                  <span className="text-[9px]">
                                    {msg.is_read ? "Dibaca" : "Terkirim"}
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Message Form */}
              <form
                onSubmit={handleSendMessage}
                className="bg-white border-2 border-loopa-charcoal rounded-full p-2 flex items-center gap-2 shadow-playful mt-2.5 shrink-0"
              >
                <input
                  type="text"
                  placeholder={
                    pinnedProduct
                      ? `Tanya ${activePartner.full_name} soal ${pinnedProduct.name}...`
                      : `Kirim pesan ke ${activePartner.full_name}...`
                  }
                  value={inputContent}
                  onChange={(e) => setInputContent(e.target.value)}
                  className="flex-1 min-w-0 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-full focus:outline-none text-loopa-charcoal placeholder-loopa-muted"
                />

                <button
                  type="submit"
                  disabled={!inputContent.trim() && !attachedProduct}
                  className="p-3 rounded-full bg-loopa-charcoal hover:bg-loopa-lime text-white hover:text-loopa-charcoal border-2 border-loopa-charcoal transition-all disabled:opacity-40 shadow-playful-sm shrink-0"
                  aria-label="Kirim pesan"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 bg-white border-2 border-loopa-charcoal rounded-4xl shadow-playful flex flex-col items-center justify-center p-8 text-center">
              <MessageSquare className="w-10 h-10 text-loopa-muted mb-3" />
              <h3 className="font-display font-black text-base text-loopa-charcoal">
                Pilih Percakapan di Sebelah Kiri
              </h3>
              <p className="text-xs text-loopa-muted mt-1 max-w-xs">
                Atau pilih produk di katalog Explore untuk memulai obrolan baru bersama penjualnya.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-20 text-center text-xs text-loopa-muted font-bold">
          Loading LOOPA chat session...
        </div>
      }
    >
      <ChatInner />
    </Suspense>
  );
}

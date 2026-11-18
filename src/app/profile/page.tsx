"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DataStore } from "@/lib/storage";
import { startAuthTransition } from "@/lib/auth-transition";
import { Profile, ShippingAddress } from "@/types";
import {
  User,
  MapPin,
  Store,
  CreditCard,
  Save,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Package,
  LogOut,
  KeyRound,
  AlertTriangle,
  Camera,
  UploadCloud,
  Trash2,
} from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "address" | "bank" | "security">("profile");
  const [avatarError, setAvatarError] = useState("");

  // Password Change fields
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passMsg, setPassMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Profile fields
  const [fullName, setFullName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [city, setCity] = useState("");

  // Default Shipping Address fields (for buyer)
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [addressCity, setAddressCity] = useState("Jakarta Selatan");
  const [postalCode, setPostalCode] = useState("12190");
  const [notes, setNotes] = useState("");

  // Bank & Studio Details (for seller)
  const [bankName, setBankName] = useState("BCA");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    DataStore.init();
    const user = DataStore.getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }

    setCurrentUser(user);
    setFullName(user.full_name || "");
    setHandle(user.handle || "");
    setEmail(user.email || "");
    setPhone(user.phone || "");
    setBio(user.bio || "");
    setAvatarUrl(user.avatar_url || "");
    setCity(user.city || "");

    if (user.default_shipping_address) {
      setRecipientName(user.default_shipping_address.recipient_name || user.full_name);
      setRecipientPhone(user.default_shipping_address.phone || user.phone || "");
      setStreetAddress(user.default_shipping_address.street_address || "");
      setAddressCity(user.default_shipping_address.city || "Jakarta Selatan");
      setPostalCode(user.default_shipping_address.postal_code || "12190");
      setNotes(user.default_shipping_address.notes || "");
    } else {
      setRecipientName(user.full_name || "");
      setRecipientPhone(user.phone || "");
      setStreetAddress("Jl. Senopati No. 42, RT 02 / RW 04");
    }

    if (user.bank_name) setBankName(user.bank_name);
    if (user.bank_account_number) setBankAccountNumber(user.bank_account_number);
    if (user.bank_account_holder) setBankAccountHolder(user.bank_account_holder);
  }, [router]);

  if (!currentUser) return null;

  const isSeller = currentUser.role === "seller";

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setAvatarError("Format foto harus JPG, PNG, atau WEBP dari galeri Anda.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Ukuran foto maksimal 5 MB.");
      return;
    }

    setAvatarError("");
    const reader = new FileReader();
    reader.onload = () => {
      const rawDataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        // Center-crop & compress to crisp 256x256 JPEG so localStorage stays fast
        const size = 256;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;
          ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);
          const compressedUrl = canvas.toDataURL("image/jpeg", 0.85);
          setAvatarUrl(compressedUrl);
        } else {
          setAvatarUrl(rawDataUrl);
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    const shippingAddress: ShippingAddress = {
      recipient_name: recipientName.trim() || fullName,
      phone: recipientPhone.trim() || phone,
      street_address: streetAddress.trim(),
      city: addressCity.trim(),
      postal_code: postalCode.trim(),
      notes: notes.trim() || undefined,
    };

    const updated = DataStore.updateProfile(currentUser.id, {
      full_name: fullName.trim(),
      phone: phone.trim(),
      bio: bio.trim(),
      city: city.trim(),
      avatar_url: avatarUrl.trim() || undefined,
      default_shipping_address: shippingAddress,
      bank_name: isSeller ? bankName : currentUser.bank_name,
      bank_account_number: isSeller ? bankAccountNumber.trim() : currentUser.bank_account_number,
      bank_account_holder: isSeller ? bankAccountHolder.trim() : currentUser.bank_account_holder,
    });

    if (updated) {
      setCurrentUser(updated);
      setSavedSuccess(true);
      window.dispatchEvent(new Event("user_role_changed"));
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  const handleLogout = () => {
    startAuthTransition({ mode: "logout" }, () => {
      DataStore.logoutUser();
      window.dispatchEvent(new Event("user_role_changed"));
      router.push("/");
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between pb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-loopa-muted hover:text-loopa-charcoal"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>

        {isSeller && (
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-loopa-lime border-2 border-loopa-charcoal text-loopa-charcoal text-xs font-black shadow-playful-sm hover:scale-102 transition-all"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Buka Seller Studio</span>
          </Link>
        )}
      </div>

      {/* Hidden Gallery Input for Avatar Upload */}
      <input
        ref={avatarFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleAvatarFileChange}
        className="hidden"
      />

      {/* Profile Header Card */}
      <div className="bg-white rounded-4xl border-2 border-loopa-charcoal p-6 sm:p-8 shadow-playful mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <div className="relative shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={currentUser.full_name}
                className="w-20 h-20 rounded-full object-cover border-2 border-loopa-charcoal shadow-playful-sm"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-loopa-lavender text-loopa-charcoal font-black flex items-center justify-center text-2xl border-2 border-loopa-charcoal shadow-playful-sm">
                {currentUser.full_name.charAt(0)}
              </div>
            )}
            <button
              type="button"
              onClick={() => avatarFileInputRef.current?.click()}
              title="Ganti foto profil dari galeri"
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-loopa-lime hover:bg-loopa-charcoal hover:text-white text-loopa-charcoal border-2 border-loopa-charcoal shadow-playful-sm flex items-center justify-center transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="font-display font-black text-2xl text-loopa-charcoal">
                  {currentUser.full_name}
                </h1>
                <p className="text-xs font-semibold text-loopa-muted">
                  @{currentUser.handle} • {currentUser.email}
                </p>
              </div>

              <div className="flex items-center gap-2 justify-center sm:justify-end">
                <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-loopa-lime text-loopa-charcoal border border-loopa-charcoal shadow-playful-sm">
                  {isSeller ? "Stylist / Penjual" : "Member / Pembeli"}
                </span>
                <button
                  onClick={handleLogout}
                  title="Keluar dari akun ini"
                  className="p-2 rounded-full border border-loopa-charcoal hover:bg-rose-50 text-rose-600 transition-colors shadow-playful-sm"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {currentUser.bio && (
              <p className="text-xs text-loopa-charcoal/90 font-medium mt-3 leading-relaxed">
                {currentUser.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 pb-6">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`px-5 py-2.5 rounded-full text-xs font-black border-2 border-loopa-charcoal transition-all ${activeTab === "profile"
            ? "bg-loopa-charcoal text-white shadow-playful-sm"
            : "bg-white text-loopa-charcoal hover:bg-loopa-cream"
            }`}
        >
          <User className="w-3.5 h-3.5 inline mr-1.5" />
          Data Diri &amp; Profil
        </button>

        {currentUser.role === "member" && (
          <button
            type="button"
            onClick={() => setActiveTab("address")}
            className={`px-5 py-2.5 rounded-full text-xs font-black border-2 border-loopa-charcoal transition-all ${activeTab === "address"
              ? "bg-loopa-charcoal text-white shadow-playful-sm"
              : "bg-white text-loopa-charcoal hover:bg-loopa-cream"
              }`}
          >
            <MapPin className="w-3.5 h-3.5 inline mr-1.5" />
            Alamat Pengiriman Utama
          </button>
        )}

        {isSeller && (
          <button
            type="button"
            onClick={() => setActiveTab("bank")}
            className={`px-5 py-2.5 rounded-full text-xs font-black border-2 border-loopa-charcoal transition-all ${activeTab === "bank"
              ? "bg-loopa-charcoal text-white shadow-playful-sm"
              : "bg-white text-loopa-charcoal hover:bg-loopa-cream"
              }`}
          >
            <CreditCard className="w-3.5 h-3.5 inline mr-1.5" />
            Rekening Bank Penjual
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`px-5 py-2.5 rounded-full text-xs font-black border-2 border-loopa-charcoal transition-all ${activeTab === "security"
            ? "bg-loopa-charcoal text-white shadow-playful-sm"
            : currentUser.must_change_password
              ? "bg-loopa-coral text-white"
              : "bg-white text-loopa-charcoal hover:bg-loopa-cream"
            }`}
        >
          <KeyRound className="w-3.5 h-3.5 inline mr-1.5" />
          Keamanan &amp; Kata Sandi
        </button>
      </div>

      {/* Forced Password Change Banner if reset by Superadmin */}
      {currentUser.must_change_password && (
        <div className="mb-6 p-4 rounded-3xl bg-loopa-coral text-white border-2 border-loopa-charcoal shadow-playful-sm flex items-center justify-between gap-3 text-xs font-bold">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Kata sandi Anda baru saja di-reset sementara oleh Superadmin. Segera ganti dengan kata sandi pribadi baru Anda.
            </span>
          </div>
          {activeTab !== "security" && (
            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className="px-3.5 py-1.5 rounded-full bg-white text-loopa-charcoal font-black shrink-0 border border-loopa-charcoal"
            >
              Ganti Sekarang
            </button>
          )}
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* TAB 1: PROFILE INFO */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-4xl border-2 border-loopa-charcoal p-6 sm:p-8 shadow-playful space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2 pb-3 border-b-2 border-loopa-border">
              <User className="w-4 h-4 text-loopa-coral" />
              <h3 className="font-display font-black text-sm text-loopa-charcoal">
                Informasi Personal Akun
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                  {isSeller ? "Nama Studio / Toko *" : "Nama Lengkap *"}
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                  Nomor WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
              <div>
                <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                  Kota Domisili / Studio
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Contoh: Jakarta Selatan"
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-loopa-charcoal mb-1.5">
                  Foto Profil (Dari Galeri)
                </label>
                <div className="p-3 rounded-2xl border-2 border-dashed border-loopa-charcoal bg-loopa-cream/60 flex items-center gap-3">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt="Pratinjau Foto Profil"
                      className="w-11 h-11 rounded-full object-cover border-2 border-loopa-charcoal shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-loopa-lavender text-loopa-charcoal font-black flex items-center justify-center text-sm border-2 border-loopa-charcoal shrink-0">
                      {fullName ? fullName.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}

                  <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => avatarFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-loopa-charcoal hover:bg-loopa-lime hover:text-loopa-charcoal text-white text-[11px] font-black border border-loopa-charcoal transition-colors"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Pilih dari Galeri</span>
                    </button>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarUrl("");
                          if (avatarFileInputRef.current) {
                            avatarFileInputRef.current.value = "";
                          }
                        }}
                        className="p-1.5 rounded-full bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-300 transition-colors"
                        title="Hapus foto profil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span className="text-[10px] text-loopa-muted font-semibold w-full">
                      JPG, PNG, WEBP • Maks 5 MB
                    </span>
                  </div>
                </div>
                {avatarError && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1">
                    {avatarError}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                Bio / Deskripsi Singkat
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ceritakan gaya fashion atau kurasi pakaian favoritmu..."
                className="w-full px-4 py-2.5 text-xs font-medium rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
              />
            </div>
          </div>
        )}

        {/* TAB 2: DEFAULT SHIPPING ADDRESS */}
        {activeTab === "address" && (
          <div className="bg-white rounded-4xl border-2 border-loopa-charcoal p-6 sm:p-8 shadow-playful space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2 pb-3 border-b-2 border-loopa-border">
              <MapPin className="w-4 h-4 text-loopa-coral" />
              <h3 className="font-display font-black text-sm text-loopa-charcoal">
                Alamat Pengiriman Utama (Auto-Fill Saat Checkout)
              </h3>
            </div>
            <p className="text-xs text-loopa-muted font-medium">
              Alamat ini akan terisi otomatis saat Anda melakukan checkout pakaian di LOOPA.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                  Nama Penerima Paket *
                </label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                  Nomor HP Penerima *
                </label>
                <input
                  type="tel"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                Alamat Lengkap / Jalan & Nomor Rumah *
              </label>
              <textarea
                rows={2}
                required
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                placeholder="Jl. Senopati No. 42, RT 01 / RW 04, Kebayoran Baru"
                className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                  Kota / Kabupaten *
                </label>
                <input
                  type="text"
                  required
                  value={addressCity}
                  onChange={(e) => setAddressCity(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                  Kode Pos
                </label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                Catatan Pengiriman untuk Kurir
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Titipkan di resepsionis / pos satpam..."
                className="w-full px-4 py-2.5 text-xs font-medium rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* TAB 3: SELLER BANK DETAILS */}
        {activeTab === "bank" && isSeller && (
          <div className="bg-white rounded-4xl border-2 border-loopa-charcoal p-6 sm:p-8 shadow-playful space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2 pb-3 border-b-2 border-loopa-border">
              <CreditCard className="w-4 h-4 text-loopa-coral" />
              <h3 className="font-display font-black text-sm text-loopa-charcoal">
                Pengaturan Rekening Transfer Penjual
              </h3>
            </div>
            <p className="text-xs text-loopa-muted font-medium">
              Data rekening ini akan langsung terlihat oleh pembeli saat menyelesaikan langkah ke-3 checkout manual transfer.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                  Nama Bank *
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-4 py-2.5 text-xs font-bold rounded-2xl border-2 border-loopa-charcoal bg-white"
                >
                  <option value="BCA">BCA (Bank Central Asia)</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="BNI">BNI</option>
                  <option value="BRI">BRI</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                  Nomor Rekening *
                </label>
                <input
                  type="text"
                  required
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  placeholder="Contoh: 7721-0988-12"
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                Atas Nama Pemilik Rekening *
              </label>
              <input
                type="text"
                required
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value)}
                placeholder="STUDIO RASA APPAREL"
                className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Save Button Bar (hidden on security tab which has its own submit) */}
        {activeTab !== "security" && (
          <div className="flex items-center justify-between pt-2">
            {savedSuccess ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-loopa-lime text-loopa-charcoal font-black text-xs border border-loopa-charcoal shadow-playful-sm animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                Perubahan Berhasil Disimpan!
              </span>
            ) : (
              <span className="text-xs text-loopa-muted font-medium">
                Data tersimpan otomatis di perangkat Anda.
              </span>
            )}

            <button
              type="submit"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-loopa-charcoal hover:bg-loopa-lime hover:text-loopa-charcoal text-white text-xs font-black border-2 border-loopa-charcoal transition-all shadow-playful"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        )}
      </form>

      {/* TAB 4: SECURITY & PASSWORD CHANGE */}
      {activeTab === "security" && (
        <div className="bg-white rounded-4xl border-2 border-loopa-charcoal p-6 sm:p-8 shadow-playful space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b-2 border-loopa-border">
            <KeyRound className="w-4 h-4 text-loopa-coral" />
            <h3 className="font-display font-black text-sm text-loopa-charcoal">
              Ganti Kata Sandi Akun
            </h3>
          </div>

          {passMsg && (
            <div
              className={`p-3.5 rounded-2xl border-2 text-xs font-bold ${passMsg.type === "ok"
                ? "bg-loopa-lime border-loopa-charcoal text-loopa-charcoal"
                : "bg-rose-50 border-rose-300 text-rose-800"
                }`}
            >
              {passMsg.text}
            </div>
          )}

          <div className="space-y-3 max-w-md">
            <div>
              <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                Kata Sandi Saat Ini (atau Kata Sandi Sementara) *
              </label>
              <input
                type="password"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="Masukkan kata sandi saat ini"
                className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                Kata Sandi Baru (min. 6 karakter) *
              </label>
              <input
                type="password"
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                Konfirmasi Kata Sandi Baru *
              </label>
              <input
                type="password"
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Ulangi kata sandi baru"
                className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setPassMsg(null);
                if (newPass !== confirmPass) {
                  setPassMsg({
                    type: "err",
                    text: "Konfirmasi kata sandi baru tidak cocok.",
                  });
                  return;
                }
                const res = DataStore.changeOwnPassword(
                  currentUser.id,
                  currentPass,
                  newPass
                );
                if (!res.success) {
                  setPassMsg({
                    type: "err",
                    text: res.error || "Gagal mengganti kata sandi.",
                  });
                  return;
                }
                setCurrentPass("");
                setNewPass("");
                setConfirmPass("");
                setCurrentUser(DataStore.getCurrentUser());
                setPassMsg({
                  type: "ok",
                  text: "✓ Kata sandi berhasil diperbarui dengan aman!",
                });
              }}
              className="mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-loopa-charcoal hover:bg-loopa-lime hover:text-loopa-charcoal text-white text-xs font-black border-2 border-loopa-charcoal transition-all shadow-playful-sm"
            >
              <KeyRound className="w-4 h-4" />
              <span>Simpan Kata Sandi Baru</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

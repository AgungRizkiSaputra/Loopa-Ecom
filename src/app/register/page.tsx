"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DataStore } from "@/lib/storage";
import { Profile, UserRole } from "@/types";
import {
  Sparkles,
  Store,
  User,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  PartyPopper,
} from "lucide-react";

export default function RegisterPage() {
  // Basic Info
  const [role, setRole] = useState<UserRole>("member");
  const [fullName, setFullName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Extra Seller Fields
  const [city, setCity] = useState("Jakarta");
  const [bio, setBio] = useState("");
  const [bankName, setBankName] = useState("BCA");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<Profile | null>(null);

  const handleSelectRole = (nextRole: UserRole) => {
    setRole(nextRole);
    setErrorMsg("");
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!fullName.trim() || !handle.trim() || !email.trim() || !phone.trim() || !password) {
      setErrorMsg("Mohon lengkapi seluruh kolom formulir yang bertanda *.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Kata sandi minimal 6 karakter.");
      return;
    }

    if (role === "seller" && !bankAccountNumber.trim()) {
      setErrorMsg("Penjual wajib mencantumkan nomor rekening untuk menerima pembayaran pembeli.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      DataStore.init();
      const result = DataStore.registerUser({
        fullName: fullName.trim(),
        handle: handle.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        role,
        city: city.trim(),
        bio: bio.trim(),
        bankName,
        bankAccountNumber: bankAccountNumber.trim() || undefined,
        bankAccountHolder: bankAccountHolder.trim() || fullName.trim().toUpperCase(),
        autoLogin: false,
      });

      setLoading(false);

      if (!result.success || !result.user) {
        setErrorMsg(result.error || "Gagal mendaftar akun baru.");
        return;
      }

      setRegisteredUser(result.user);
    }, 300);
  };

  // Success State Notification Card after Registration
  if (registeredUser) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full bg-white rounded-4xl border-2 border-loopa-charcoal p-7 sm:p-9 shadow-playful text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-loopa-lime border-2 border-loopa-charcoal shadow-playful-sm flex items-center justify-center text-loopa-charcoal mx-auto">
            <PartyPopper className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-loopa-lime text-[10px] font-black uppercase tracking-wider border border-loopa-charcoal">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Pendaftaran Berhasil!</span>
            </span>
            <h1 className="font-display font-black text-2xl sm:text-3xl text-loopa-charcoal">
              Akun LOOPA Anda Siap Digunakan
            </h1>
            <p className="text-xs sm:text-sm text-loopa-muted font-medium leading-relaxed">
              Selamat bergabung, <strong className="text-loopa-charcoal">{registeredUser.full_name}</strong>! Akun Anda telah berhasil didaftarkan. Silakan masuk menggunakan email/username dan kata sandi yang baru Anda buat.
            </p>
          </div>

          {/* Account Summary Pill Box */}
          <div className="p-4 rounded-3xl bg-loopa-cream border-2 border-loopa-charcoal text-left space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-loopa-muted font-bold">Tipe Akun:</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-black border border-loopa-charcoal ${
                  registeredUser.role === "seller"
                    ? "bg-loopa-lime text-loopa-charcoal"
                    : "bg-loopa-lavender text-loopa-charcoal"
                }`}
              >
                {registeredUser.role === "seller"
                  ? "Penjual (Stylist Studio)"
                  : "Pembeli (Member)"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-loopa-muted font-bold">Email:</span>
              <span className="font-black text-loopa-charcoal">{registeredUser.email}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-loopa-muted font-bold">Username:</span>
              <span className="font-black text-loopa-charcoal">@{registeredUser.handle}</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <Link
              href={`/login?registered=1&email=${encodeURIComponent(
                registeredUser.email || ""
              )}`}
              className="w-full py-3.5 px-5 rounded-full bg-loopa-charcoal hover:bg-loopa-lime hover:text-loopa-charcoal text-white text-xs font-black border-2 border-loopa-charcoal transition-all shadow-playful flex items-center justify-center gap-2"
            >
              <span>Lanjut ke Halaman Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={() => {
                setRegisteredUser(null);
                setFullName("");
                setHandle("");
                setEmail("");
                setPhone("");
                setPassword("");
                setBankAccountNumber("");
                setBankAccountHolder("");
              }}
              className="w-full py-2.5 px-4 rounded-full bg-white hover:bg-loopa-cream text-loopa-charcoal text-xs font-bold border border-loopa-charcoal transition-colors"
            >
              Daftar Akun Lainnya
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
      <div className="max-w-xl w-full bg-white rounded-4xl border-2 border-loopa-charcoal p-7 sm:p-9 shadow-playful space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-loopa-lime text-[10px] font-black uppercase tracking-wider border border-loopa-charcoal shadow-playful-sm">
            <Sparkles className="w-3 h-3" />
            <span>Join the LOOPA Community</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-loopa-charcoal">
            Daftar Akun Baru
          </h1>
          <p className="text-xs text-loopa-muted font-medium">
            Pilih tipe akun di bawah ini untuk mulai belanja atau membuka toko penjualan Anda.
          </p>
        </div>

        {/* Role Choice Cards (Placed clearly at top) */}
        <div className="space-y-2">
          <span className="block text-xs font-extrabold text-loopa-charcoal uppercase tracking-wider">
            1. Pilih Tipe Akun Anda:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Member / Buyer */}
            <button
              type="button"
              onClick={() => handleSelectRole("member")}
              aria-pressed={role === "member"}
              className={`cursor-pointer p-4 rounded-3xl border-2 text-left transition-all flex flex-col justify-between ${
                role === "member"
                  ? "border-loopa-charcoal bg-loopa-lavender shadow-playful-sm ring-2 ring-loopa-charcoal/20"
                  : "border-loopa-border bg-loopa-cream hover:border-loopa-charcoal hover:bg-white"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-white border border-loopa-charcoal">
                    <User className="w-4 h-4 text-loopa-charcoal" />
                  </div>
                  {role === "member" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-loopa-charcoal text-white text-[10px] font-black">
                      <CheckCircle2 className="w-3 h-3 text-loopa-lime" />
                      Dipilih
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-loopa-muted">Klik untuk pilih</span>
                  )}
                </div>
                <h3 className="font-display font-black text-sm text-loopa-charcoal">
                  Pembeli (Member)
                </h3>
                <p className="text-[11px] text-loopa-charcoal/80 font-medium mt-1 leading-snug">
                  Cari pakaian vintage, chat langsung dengan banyak penjual, dan pantau pesanan.
                </p>
              </div>
            </button>

            {/* Seller / Stylist */}
            <button
              type="button"
              onClick={() => handleSelectRole("seller")}
              aria-pressed={role === "seller"}
              className={`cursor-pointer p-4 rounded-3xl border-2 text-left transition-all flex flex-col justify-between ${
                role === "seller"
                  ? "border-loopa-charcoal bg-loopa-lime shadow-playful-sm ring-2 ring-loopa-charcoal/20"
                  : "border-loopa-border bg-loopa-cream hover:border-loopa-charcoal hover:bg-white"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-xl bg-white border border-loopa-charcoal">
                    <Store className="w-4 h-4 text-loopa-charcoal" />
                  </div>
                  {role === "seller" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-loopa-charcoal text-white text-[10px] font-black">
                      <CheckCircle2 className="w-3 h-3 text-loopa-lime" />
                      Dipilih
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-loopa-muted">Klik untuk pilih</span>
                  )}
                </div>
                <h3 className="font-display font-black text-sm text-loopa-charcoal">
                  Penjual (Stylist Studio)
                </h3>
                <p className="text-[11px] text-loopa-charcoal/80 font-medium mt-1 leading-snug">
                  Buka etalase toko, drop pakaian baru, verifikasi transfer manual, &amp; lihat grafik omzet.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-xs font-bold text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <span className="block text-xs font-extrabold text-loopa-charcoal uppercase tracking-wider">
            2. Lengkapi Data {role === "seller" ? "Studio Penjual" : "Diri Pembeli"}:
          </span>

          {/* Basic Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                {role === "seller" ? "Nama Studio / Toko *" : "Nama Lengkap *"}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={
                  role === "seller"
                    ? "Contoh: Vintage Thrift Collective"
                    : "Contoh: Budi Pratama"
                }
                className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                  Username (@handle) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-loopa-muted">
                    @
                  </span>
                  <input
                    type="text"
                    required
                    value={handle}
                    onChange={(e) => setHandle(e.target.value)}
                    placeholder="namapengguna"
                    className="w-full pl-8 pr-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
                  />
                </div>
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
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                  Email Akun *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@domain.com"
                  className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-loopa-charcoal mb-1">
                  Kata Sandi (min. 6 karakter) *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full px-4 py-2.5 pr-10 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-loopa-muted hover:text-loopa-charcoal"
                    aria-label="Tampilkan kata sandi"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Conditional Seller Fields (Bank & Studio Details) */}
          {role === "seller" && (
            <div className="p-4 sm:p-5 rounded-3xl bg-loopa-cream border-2 border-loopa-charcoal space-y-3">
              <div className="flex items-center gap-1.5 pb-2 border-b border-loopa-border">
                <Store className="w-4 h-4 text-loopa-coral" />
                <h4 className="font-display font-black text-xs text-loopa-charcoal">
                  Informasi Rekening Bank Studio Penjual
                </h4>
              </div>
              <p className="text-[11px] text-loopa-muted font-medium">
                Rekening ini ditampilkan kepada pembeli pada langkah pembayaran manual saat checkout.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-loopa-charcoal mb-1">
                    Nama Bank *
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold rounded-2xl border-2 border-loopa-charcoal bg-white"
                  >
                    <option value="BCA">BCA (Bank Central Asia)</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BNI">BNI</option>
                    <option value="BRI">BRI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-loopa-charcoal mb-1">
                    Nomor Rekening *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="Contoh: 8831-2918-00"
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-loopa-charcoal mb-1">
                    Atas Nama Pemilik Rekening *
                  </label>
                  <input
                    type="text"
                    value={bankAccountHolder}
                    onChange={(e) => setBankAccountHolder(e.target.value)}
                    placeholder="Sesuai buku tabungan"
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-loopa-charcoal mb-1">
                    Kota Lokasi Studio
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Contoh: Jakarta Selatan"
                    className="w-full px-3.5 py-2 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-loopa-charcoal mb-1">
                  Bio Singkat Studio (Opsional)
                </label>
                <input
                  type="text"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Contoh: Kurasi vintage workwear & streetwear pilihan"
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-full bg-loopa-charcoal hover:bg-loopa-lime hover:text-loopa-charcoal text-white text-xs font-black border-2 border-loopa-charcoal transition-all shadow-playful disabled:opacity-50"
          >
            {loading
              ? "Mendaftarkan Akun..."
              : `Daftar Sekarang sebagai ${role === "seller" ? "Penjual" : "Pembeli"}`}
          </button>
        </form>

        {/* Login Link */}
        <div className="text-center pt-2 border-t-2 border-loopa-border">
          <p className="text-xs text-loopa-muted font-medium">
            Sudah memiliki akun?{" "}
            <Link
              href="/login"
              className="font-black text-loopa-charcoal hover:text-loopa-coral underline"
            >
              Masuk di Sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

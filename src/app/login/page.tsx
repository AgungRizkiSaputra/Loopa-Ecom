"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DataStore } from "@/lib/storage";
import { startAuthTransition } from "@/lib/auth-transition";
import {
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
} from "lucide-react";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const justRegistered = searchParams.get("registered") === "1";
  const prefillEmail = searchParams.get("email") || "";

  const [identifier, setIdentifier] = useState(prefillEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (prefillEmail) {
      setIdentifier(prefillEmail);
    }
  }, [prefillEmail]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!identifier.trim() || !password) {
      setErrorMsg("Email/username dan kata sandi wajib diisi.");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      DataStore.init();
      const result = DataStore.loginUser(identifier, password);
      if (!result.success || !result.user) {
        setErrorMsg(
          result.error ||
            "Email/username atau kata sandi salah. Silakan daftar akun terlebih dahulu."
        );
        setLoading(false);
        return;
      }

      const loggedUser = result.user;
      const roleLabel =
        loggedUser.role === "superadmin"
          ? "Superadmin Console"
          : loggedUser.role === "seller"
          ? "Seller Studio"
          : "Belanja Member";

      setSuccessMsg(`Berhasil masuk sebagai ${loggedUser.full_name}!`);
      window.dispatchEvent(new Event("user_role_changed"));

      startAuthTransition(
        {
          mode: "login",
          name: loggedUser.full_name,
          roleLabel,
        },
        () => {
          if (loggedUser.role === "superadmin") {
            router.push("/admin");
          } else if (loggedUser.role === "seller") {
            router.push("/dashboard");
          } else {
            router.push("/");
          }
        },
        950
      );
    }, 300);
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-4xl border-2 border-loopa-charcoal p-7 sm:p-9 shadow-playful space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-loopa-lime text-[10px] font-black uppercase tracking-wider border border-loopa-charcoal shadow-playful-sm">
            <Sparkles className="w-3 h-3" />
            <span>Welcome Back to LOOPA</span>
          </div>
          <h1 className="font-display font-black text-2xl sm:text-3xl text-loopa-charcoal">
            Masuk ke Akun Anda
          </h1>
          <p className="text-xs text-loopa-muted font-medium leading-relaxed">
            Silakan masuk menggunakan akun yang telah Anda daftarkan untuk mengakses chat penjual, pesanan, atau Seller Studio.
          </p>
        </div>

        {/* Registration Success Banner */}
        {justRegistered && !errorMsg && !successMsg && (
          <div className="p-3.5 rounded-2xl bg-loopa-lime border-2 border-loopa-charcoal text-xs font-bold text-loopa-charcoal flex items-start gap-2 shadow-playful-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-loopa-charcoal mt-0.5" />
            <span>
              Pendaftaran berhasil! Silakan masukkan kata sandi Anda untuk masuk ke akun LOOPA.
            </span>
          </div>
        )}

        {/* Login Success Banner */}
        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-loopa-lime border-2 border-loopa-charcoal text-xs font-black text-loopa-charcoal flex items-center gap-2 shadow-playful-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-loopa-charcoal" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-xs font-bold text-rose-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-loopa-charcoal mb-1.5">
              Email atau Username (@handle)
            </label>
            <input
              type="text"
              required
              autoComplete="username"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="nama@email.com atau username"
              className="w-full px-4 py-2.5 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-loopa-charcoal mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi Anda"
                className="w-full px-4 py-2.5 pr-11 text-xs font-semibold rounded-2xl border-2 border-loopa-charcoal bg-white focus:outline-none focus:ring-2 focus:ring-loopa-lime"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-loopa-muted hover:text-loopa-charcoal"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-full bg-loopa-charcoal hover:bg-loopa-lime hover:text-loopa-charcoal text-white text-xs font-black border-2 border-loopa-charcoal transition-all shadow-playful disabled:opacity-50"
          >
            {loading ? "Memverifikasi..." : "Masuk ke Akun"}
          </button>
        </form>

        {/* Security Note */}
        <div className="p-3.5 rounded-2xl bg-loopa-cream border border-loopa-border flex items-start gap-2.5 text-[11px] text-loopa-muted font-medium">
          <Lock className="w-4 h-4 text-loopa-charcoal shrink-0 mt-0.5" />
          <span>
            Belum terdaftar? Buat akun baru terlebih dahulu dan pilih peran <strong className="text-loopa-charcoal">Pembeli</strong> atau <strong className="text-loopa-charcoal">Penjual</strong>.
          </span>
        </div>

        {/* Register Link */}
        <div className="text-center pt-2 border-t-2 border-loopa-border">
          <p className="text-xs text-loopa-muted font-medium">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-black text-loopa-charcoal hover:text-loopa-coral underline"
            >
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto py-20 text-center text-xs text-loopa-muted font-bold">
          Memuat halaman masuk...
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}

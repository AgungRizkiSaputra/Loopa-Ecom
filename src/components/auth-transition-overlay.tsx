"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogIn, LogOut, Sparkles } from "lucide-react";

interface TransitionState {
  active: boolean;
  mode: "login" | "logout";
  name?: string;
  roleLabel?: string;
}

export function AuthTransitionOverlay() {
  const [state, setState] = useState<TransitionState>({
    active: false,
    mode: "login",
  });

  useEffect(() => {
    const handleEvent = (e: Event) => {
      const custom = e as CustomEvent<Partial<TransitionState>>;
      if (custom.detail?.active) {
        setState({
          active: true,
          mode: custom.detail.mode || "login",
          name: custom.detail.name,
          roleLabel: custom.detail.roleLabel,
        });
      } else {
        setState((prev) => ({ ...prev, active: false }));
      }
    };

    window.addEventListener("loopa_auth_transition", handleEvent);
    return () => window.removeEventListener("loopa_auth_transition", handleEvent);
  }, []);

  const isLogin = state.mode === "login";

  return (
    <AnimatePresence>
      {state.active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] bg-loopa-cream/95 backdrop-blur-md flex items-center justify-center p-6"
          role="status"
          aria-live="polite"
        >
          <motion.div
            initial={{ scale: 0.92, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: -8, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="max-w-sm w-full bg-white rounded-4xl border-2 border-loopa-charcoal p-8 shadow-playful text-center space-y-5"
          >
            {/* Animated Brand Spinner Medallion */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
                className="absolute inset-0 rounded-full border-4 border-loopa-cream border-t-loopa-charcoal border-r-loopa-lime"
              />
              <div
                className={`w-14 h-14 rounded-full border-2 border-loopa-charcoal flex items-center justify-center shadow-playful-sm ${
                  isLogin ? "bg-loopa-lime text-loopa-charcoal" : "bg-loopa-coral text-white"
                }`}
              >
                {isLogin ? (
                  <LogIn className="w-6 h-6" />
                ) : (
                  <LogOut className="w-6 h-6" />
                )}
              </div>
            </div>

            {/* Wordmark + Status Text */}
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-loopa-cream border border-loopa-charcoal text-[10px] font-black uppercase tracking-wider text-loopa-charcoal">
                <Sparkles className="w-3 h-3 text-loopa-coral" />
                <span>loopa auth</span>
              </div>

              <h2 className="font-display font-black text-xl text-loopa-charcoal">
                {isLogin
                  ? state.name
                    ? `Selamat Datang, ${state.name.split(" ")[0]}!`
                    : "Memverifikasi Akun..."
                  : "Sedang Keluar..."}
              </h2>

              <p className="text-xs text-loopa-muted font-semibold leading-relaxed">
                {isLogin
                  ? state.roleLabel
                    ? `Menyiapkan ruang ${state.roleLabel} Anda...`
                    : "Menyiapkan halaman LOOPA Anda..."
                  : "Menyimpan sesi dan mengamankan akun Anda..."}
              </p>
            </div>

            {/* Smooth Animated Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-loopa-cream border border-loopa-charcoal overflow-hidden">
              <motion.div
                initial={{ width: "8%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.05, ease: "easeInOut" }}
                className={`h-full rounded-full ${
                  isLogin ? "bg-loopa-lime" : "bg-loopa-coral"
                }`}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

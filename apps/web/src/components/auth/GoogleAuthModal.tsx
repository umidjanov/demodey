"use client";

import React, { useState } from "react";
import { X, Sparkles, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/src/context/LanguageContext";

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: { email: string; first_name: string; last_name: string }) => Promise<void>;
}

export function GoogleAuthModal({ isOpen, onClose, onSuccess }: GoogleAuthModalProps) {
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError(
        language === "uz"
          ? "Haqiqiy Google emailingizni kiriting (masalan: foydalanuvchi@gmail.com)"
          : "Please enter a valid Google email address."
      );
      return;
    }

    if (!firstName.trim()) {
      setError(language === "uz" ? "Ismingizni kiriting" : "Please enter your first name");
      return;
    }

    setLoading(true);
    try {
      await onSuccess({
        email: cleanEmail,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || (language === "uz" ? "Google orqali kirishda xatolik yuz berdi." : "Google sign in failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#E8EDF2] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Google Brand Banner */}
        <div className="p-6 bg-gradient-to-b from-[#F7F9FC] to-white border-b border-[#E8EDF2] relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-[#7B8794] hover:text-[#182536] hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#E8EDF2] shadow-sm flex items-center justify-center">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-[#182536]">
                {language === "uz"
                  ? "Google Hisobi Bilan Ulanish"
                  : language === "ru"
                  ? "Вход через Google Аккаунт"
                  : "Sign in with Google Account"}
              </h3>
              <p className="text-xs text-[#7B8794]">
                {language === "uz"
                  ? "Shaxsiy Google emailingizni kiriting"
                  : "Use your genuine Google account"}
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#E05252] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[#182536] mb-1.5">
              {language === "uz" ? "Google Email" : "Google Email Address"}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={language === "uz" ? "masalan: user@gmail.com" : "e.g. user@gmail.com"}
              className="w-full bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl px-4 py-2.5 text-sm text-[#182536] placeholder-[#7B8794] focus:outline-none focus:border-[#07858B] focus:bg-white transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#182536] mb-1.5">
                {language === "uz" ? "Ismingiz" : "First Name"}
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={language === "uz" ? "Ismingizni kiriting" : "Your first name"}
                className="w-full bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl px-4 py-2.5 text-sm text-[#182536] placeholder-[#7B8794] focus:outline-none focus:border-[#07858B] focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#182536] mb-1.5">
                {language === "uz" ? "Familiyangiz" : "Last Name"}
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={language === "uz" ? "Familiyangizni kiriting" : "Your last name"}
                className="w-full bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl px-4 py-2.5 text-sm text-[#182536] placeholder-[#7B8794] focus:outline-none focus:border-[#07858B] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#07858B] hover:bg-[#066D73] text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-[#07858B]/20 transition-all flex items-center justify-center gap-2"
            >
              <span>
                {loading
                  ? language === "uz"
                    ? "Ulanmoqda..."
                    : "Connecting..."
                  : language === "uz"
                  ? "Google orqali davom etish"
                  : "Continue with Google"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

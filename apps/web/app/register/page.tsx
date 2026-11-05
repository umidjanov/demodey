"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";
import { Sparkles, User, Mail, Lock, Phone, ArrowRight, AlertCircle } from "lucide-react";
import { GoogleAuthModal } from "@/src/components/auth/GoogleAuthModal";

export default function RegisterPage() {
  const router = useRouter();
  const { register, googleLogin } = useAuth();
  const { t, language, setLanguage, languages } = useLanguage();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
    password: "",
    confirm_password: "",
    terms_agreed: false,
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirm_password) {
      setError(language === "uz" ? "Parollar mos kelmadi." : language === "ru" ? "Пароли не совпадают." : "Passwords do not match.");
      return;
    }

    if (!formData.terms_agreed) {
      setError(language === "uz" ? "Foydalanish shartlariga rozilik bildiring." : "You must agree to the Terms of Service.");
      return;
    }

    setLoading(true);
    try {
      await register(formData);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || (language === "uz" ? "Ro'yxatdan o'tishda xatolik yuz berdi." : "Registration failed."));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = () => {
    setShowGoogleModal(true);
  };

  const handleGoogleSuccess = async (data: { email: string; first_name: string; last_name: string }) => {
    setLoading(true);
    try {
      await googleLogin(data);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Google registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col justify-center py-12 px-6 sm:px-12 font-sans relative">
      {/* Language Switcher in top right */}
      <div className="absolute top-6 right-6 flex items-center bg-white p-1 rounded-xl border border-[#E8EDF2] shadow-xs">
        {languages.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => setLanguage(item.code)}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
              language === item.code
                ? "bg-[#07858B] text-white shadow-xs"
                : "text-[#7B8794] hover:text-[#182536]"
            }`}
          >
            <span className="mr-1">{item.flag}</span>
            <span className="uppercase">{item.code}</span>
          </button>
        ))}
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center space-y-3">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#066D73] to-[#07858B] flex items-center justify-center text-white shadow-md shadow-[#07858B]/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-[#182536]">QUIZORA</span>
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-[#182536]">{t.auth.registerTitle}</h2>
        <p className="text-xs text-[#7B8794]">{t.auth.registerSubtitle}</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl border border-[#E8EDF2] shadow-sm space-y-6">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-[#E05252] flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#182536] mb-1.5">
                  {language === "uz" ? "Ism" : language === "ru" ? "Имя" : "First Name"}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#7B8794] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder={language === "uz" ? "Ismingizni kiriting" : language === "ru" ? "Введите имя" : "Enter your first name"}
                    className="w-full bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#182536] placeholder-[#7B8794] focus:outline-none focus:border-[#07858B] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#182536] mb-1.5">
                  {language === "uz" ? "Familiya" : language === "ru" ? "Фамилия" : "Last Name"}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#7B8794] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder={language === "uz" ? "Familiyangizni kiriting" : language === "ru" ? "Введите фамилию" : "Enter your last name"}
                    className="w-full bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#182536] placeholder-[#7B8794] focus:outline-none focus:border-[#07858B] focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#182536] mb-1.5">{t.auth.email}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#7B8794] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="learner@example.com"
                  className="w-full bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#182536] placeholder-[#7B8794] focus:outline-none focus:border-[#07858B] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-[#182536] mb-1.5">
                {language === "uz" ? "Telefon Raqam (Ixtiyoriy)" : language === "ru" ? "Номер Телефона (Опционально)" : "Phone Number (Optional)"}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#7B8794] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+998 90 123 45 67"
                  className="w-full bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#182536] placeholder-[#7B8794] focus:outline-none focus:border-[#07858B] focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#182536] mb-1.5">{t.auth.password}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7B8794] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#182536] placeholder-[#7B8794] focus:outline-none focus:border-[#07858B] focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#182536] mb-1.5">
                  {language === "uz" ? "Parolni Tasdiqlang" : language === "ru" ? "Подтвердите Пароль" : "Confirm Password"}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#7B8794] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#182536] placeholder-[#7B8794] focus:outline-none focus:border-[#07858B] focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="terms"
                type="checkbox"
                required
                checked={formData.terms_agreed}
                onChange={(e) => setFormData({ ...formData, terms_agreed: e.target.checked })}
                className="mt-0.5 w-4 h-4 text-[#07858B] rounded border-[#E8EDF2] focus:ring-[#07858B]"
              />
              <label htmlFor="terms" className="text-xs text-[#7B8794] leading-relaxed">
                {language === "uz"
                  ? "Men foydalanish shartlari va maxfiylik siyosatiga roziman."
                  : language === "ru"
                  ? "Я согласен с условиями использования и политикой конфиденциальности."
                  : "I agree to the Terms of Service and Privacy Policy."}
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#07858B] hover:bg-[#066D73] text-white py-3 rounded-xl font-bold text-sm shadow-md shadow-[#07858B]/20 transition-all flex items-center justify-center gap-2"
            >
              <span>{loading ? t.auth.registering : t.auth.registerBtn}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E8EDF2]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-[#7B8794] font-semibold">
                {language === "uz" ? "Yoki Google orqali" : language === "ru" ? "Или через Google" : "Or register with"}
              </span>
            </div>
          </div>

          {/* Google Sign Up */}
          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full bg-white hover:bg-[#F7F9FC] border border-[#E8EDF2] py-2.5 rounded-xl font-semibold text-xs text-[#182536] flex items-center justify-center gap-3 transition-colors shadow-xs"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
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
            <span>{t.auth.googleLogin}</span>
          </button>

          <p className="text-center text-xs text-[#7B8794]">
            {t.auth.hasAccount}{" "}
            <Link href="/login" className="font-bold text-[#07858B] hover:underline">
              {t.auth.loginBtn}
            </Link>
          </p>
        </div>
      </div>

      <GoogleAuthModal
        isOpen={showGoogleModal}
        onClose={() => setShowGoogleModal(false)}
        onSuccess={handleGoogleSuccess}
      />
    </div>
  );
}

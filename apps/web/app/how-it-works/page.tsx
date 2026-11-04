"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/src/context/LanguageContext";
import {
  BookOpen,
  Video,
  Clock,
  Award,
  ArrowRight,
  ShieldCheck,
  Coins,
  BrainCircuit,
  Trophy,
  Sparkles,
} from "lucide-react";

export default function HowItWorksPage() {
  const { t, language, setLanguage, languages } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#182536] font-sans">
      {/* Header */}
      <header className="h-16 bg-white border-b border-[#E8EDF2] px-6 sm:px-12 flex items-center justify-between sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#07858B] flex items-center justify-center text-white font-bold">
            Q
          </div>
          <span className="font-extrabold text-base tracking-tight text-[#182536]">QUIZORA</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#F7F9FC] p-1 rounded-xl border border-[#E8EDF2]">
            {languages.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setLanguage(item.code)}
                className={`px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
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

          <Link href="/dashboard" className="text-xs font-semibold text-[#7B8794] hover:text-[#182536]">
            {t.nav.dashboard}
          </Link>
          <Link
            href="/quizzes"
            className="bg-[#07858B] hover:bg-[#066D73] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
          >
            {t.quizzes.launchBtn}
          </Link>
        </div>
      </header>

      {/* Main Guide Content */}
      <main className="max-w-4xl mx-auto py-16 px-6 space-y-16">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F5F5] text-[#07858B] text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{language === "uz" ? "Ta'lim Metodologiyasi va Qo'llanma" : language === "ru" ? "Методология и Руководство" : "Platform Methodology & Architecture Guide"}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#182536]">
            {t.landing.howTitle}
          </h1>
          <p className="text-sm sm:text-base text-[#7B8794] max-w-xl mx-auto">
            {t.landing.howDesc}
          </p>
        </div>

        {/* 4 Stages Detailed */}
        <div className="space-y-8">
          {/* Stage 1 */}
          <div className="bg-white rounded-3xl p-8 border border-[#E8EDF2] shadow-xs flex flex-col md:flex-row gap-6 items-start">
            <div className="w-12 h-12 rounded-2xl bg-[#E7F5F5] text-[#07858B] flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#07858B]">
                {language === "uz" ? "1-Bosqich" : language === "ru" ? "Этап 1" : "Stage 1"}
              </span>
              <h3 className="text-xl font-bold text-[#182536]">{t.stage.stage1Title}</h3>
              <p className="text-xs sm:text-sm text-[#7B8794] leading-relaxed">
                {language === "uz"
                  ? "Test savollarini dastlabki ko'rib chiqish. To'g'ri javoblar ko'rsatilmaydi, lekin talaba savol mazmuniga miyasini tayyorlaydi."
                  : language === "ru"
                  ? "Предварительное ознакомление с вопросами без отображения правильных ответов для подготовки мышления."
                  : "Preview the question stems and essential learning notes before starting the timer. Correct answers remain strictly hidden."}
              </p>
            </div>
          </div>

          {/* Stage 2 */}
          <div className="bg-white rounded-3xl p-8 border border-[#E8EDF2] shadow-xs flex flex-col md:flex-row gap-6 items-start">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#5877D9] flex items-center justify-center shrink-0">
              <Video className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#5877D9]">
                {language === "uz" ? "2-Bosqich" : language === "ru" ? "Этап 2" : "Stage 2"}
              </span>
              <h3 className="text-xl font-bold text-[#182536]">{t.stage.stage2Title}</h3>
              <p className="text-xs sm:text-sm text-[#7B8794] leading-relaxed">
                {language === "uz"
                  ? "Mavzuga oid 5 daqiqagacha bo'lgan darslik orqali xotirani mustahkamlash va asosiy bilimlarni takrorlash."
                  : language === "ru"
                  ? "Короткий видео-праймер до 5 минут для активации долговременной памяти."
                  : "Watch a high-yield curated educational video primer under 5 minutes to reinforce mental retention."}
              </p>
            </div>
          </div>

          {/* Stage 3 */}
          <div className="bg-white rounded-3xl p-8 border border-[#E8EDF2] shadow-xs flex flex-col md:flex-row gap-6 items-start">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#FF9B45] flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF9B45]">
                {language === "uz" ? "3-Bosqich" : language === "ru" ? "Этап 3" : "Stage 3"}
              </span>
              <h3 className="text-xl font-bold text-[#182536]">{t.stage.stage3Title}</h3>
              <p className="text-xs sm:text-sm text-[#7B8794] leading-relaxed">
                {language === "uz"
                  ? "Vaqtga qarshi haqiqiy test sinovi. Server tomonidan tekshiriladigan taymer va har bir javobni saqlash tizimi."
                  : language === "ru"
                  ? "Тестирование на время с серверным таймером и автосохранением каждого ответа."
                  : "Answer calibrated questions with server-authoritative countdown timer and real-time autosave."}
              </p>
            </div>
          </div>

          {/* Stage 4 */}
          <div className="bg-white rounded-3xl p-8 border border-[#E8EDF2] shadow-xs flex flex-col md:flex-row gap-6 items-start">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#22A06B] flex items-center justify-center shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#22A06B]">
                {language === "uz" ? "4-Bosqich" : language === "ru" ? "Этап 4" : "Stage 4"}
              </span>
              <h3 className="text-xl font-bold text-[#182536]">{t.stage.stage4Title}</h3>
              <p className="text-xs sm:text-sm text-[#7B8794] leading-relaxed">
                {language === "uz"
                  ? "Xatolar tahlili, har bir savolga ilmiy tushuntirish va AI yordamchisidan xatolarni so'rash imkoniyati."
                  : language === "ru"
                  ? "Разбор ошибок, подробные объяснения к каждому вопросу и возможность консультации с AI."
                  : "Granular post-mortem, correct vs incorrect breakdown, and one-click 'Ask AI About Mistakes'."}
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center pt-8">
          <Link
            href="/quizzes"
            className="inline-flex items-center gap-2 bg-[#07858B] hover:bg-[#066D73] text-white px-8 py-4 rounded-2xl font-bold text-sm shadow-md shadow-[#07858B]/20 transition-all hover:scale-105"
          >
            <span>{t.quizzes.launchBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}

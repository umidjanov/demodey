"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";
import { Play, HelpCircle, Sparkles, Award } from "lucide-react";

export function WelcomeBanner() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const firstName = user?.first_name || "Alex";

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#066D73] via-[#07858B] to-[#0A9EA5] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-[#07858B]/15">
      {/* Subtle Background Pattern */}
      <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute right-32 -top-10 w-48 h-48 bg-[#F5B83D]/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white/90 border border-white/20">
            <Sparkles className="w-3.5 h-3.5 text-[#F5B83D]" />
            <span>{t.dashboard.level} {profile?.level || 1} · {profile?.level_title || "Explorer"}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t.dashboard.welcome}, {firstName}! 👋
          </h1>

          <p className="text-sm sm:text-base text-white/80 leading-relaxed font-normal">
            "{t.dashboard.dailyMotivation}"
          </p>
        </div>

        {/* The TWO Prominent Main Buttons */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/quizzes"
            className="flex items-center gap-2.5 bg-white text-[#066D73] hover:bg-[#E7F5F5] font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Play className="w-4 h-4 fill-[#066D73] text-[#066D73]" />
            <span>{t.dashboard.startQuizBtn}</span>
          </Link>

          <Link
            href="/how-it-works"
            className="flex items-center gap-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/30 font-semibold text-sm px-5 py-3.5 rounded-2xl backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{t.dashboard.howItWorksBtn}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

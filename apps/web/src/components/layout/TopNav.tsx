"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/src/context/AuthContext";
import { useLanguage, Language } from "@/src/context/LanguageContext";
import { Search, Flame, Bell, Plus, Menu, X, Coins, Globe, ChevronDown } from "lucide-react";

export function TopNav({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { user, profile } = useAuth();
  const { language, setLanguage, t, languages } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const currentLangObj = languages.find((l) => l.code === language) || languages[0];

  return (
    <header className="h-16 bg-white border-b border-[#E8EDF2] px-4 md:px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-[#7B8794] hover:text-[#182536] hover:bg-[#F7F9FC] rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative w-full">
          <Search className="w-4 h-4 text-[#7B8794] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t.nav.searchPlaceholder}
            className="w-full bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl pl-10 pr-4 py-2 text-sm text-[#182536] placeholder-[#7B8794] focus:outline-none focus:border-[#07858B] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right: Language Selector, Badges, Coins, Notifications & Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Language Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#E8EDF2] hover:border-[#07858B]/50 hover:bg-[#F7F9FC] text-xs font-bold text-[#182536] transition-all"
            title="Tilni o'zgartirish / Сменить язык / Change Language"
          >
            <span className="text-base leading-none">{currentLangObj.flag}</span>
            <span className="hidden sm:inline uppercase text-[11px] tracking-wider">{currentLangObj.code}</span>
            <ChevronDown className="w-3 h-3 text-[#7B8794]" />
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-[#E8EDF2] rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              {languages.map((item) => (
                <button
                  key={item.code}
                  onClick={() => {
                    setLanguage(item.code);
                    setShowLangMenu(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    language === item.code
                      ? "bg-[#E7F5F5] text-[#07858B] font-bold"
                      : "text-[#182536] hover:bg-[#F7F9FC]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-base">{item.flag}</span>
                    <span>{item.name}</span>
                  </span>
                  {language === item.code && <span className="w-1.5 h-1.5 rounded-full bg-[#07858B]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Streak Pill */}
        <div className="hidden sm:flex items-center gap-1.5 bg-orange-50 border border-orange-200/60 px-3 py-1.5 rounded-full text-xs font-bold text-[#FF9B45] shadow-xs">
          <Flame className="w-4 h-4 fill-[#FF9B45] text-[#FF9B45] animate-pulse" />
          <span>{profile?.current_streak || 1} {t.nav.streakDays}</span>
        </div>

        {/* Ranking Coins Pill */}
        <Link
          href="/leaderboard"
          className="flex items-center gap-1.5 bg-amber-50 border border-amber-200/70 px-3 py-1.5 rounded-full text-xs font-bold text-amber-700 shadow-xs hover:bg-amber-100 transition-colors"
          title="Ranking Coins ($RC)"
        >
          <Coins className="w-4 h-4 text-[#F5B83D] fill-[#F5B83D]" />
          <span>{profile?.ranking_coins || 0} {t.nav.coins}</span>
        </Link>

        {/* Start Quiz Quick Action */}
        <Link
          href="/quizzes"
          className="hidden md:flex items-center gap-1.5 bg-[#07858B] hover:bg-[#066D73] text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition-all hover:shadow-[#07858B]/20 hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>{t.nav.newQuiz}</span>
        </Link>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-[#7B8794] hover:text-[#182536] hover:bg-[#F7F9FC] rounded-xl relative transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="w-2 h-2 rounded-full bg-[#ED4B9B] absolute top-1.5 right-1.5 ring-2 ring-white animate-ping" />
            <span className="w-2 h-2 rounded-full bg-[#ED4B9B] absolute top-1.5 right-1.5 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E8EDF2] rounded-2xl shadow-xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-[#E8EDF2]">
                <h4 className="font-semibold text-sm text-[#182536]">{t.nav.notifications}</h4>
                <span className="text-[11px] font-semibold text-[#07858B] cursor-pointer">{t.nav.markAllRead}</span>
              </div>
              <div className="py-2 space-y-2">
                <div className="p-2.5 rounded-xl bg-[#E7F5F5]/50 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#07858B] mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-[#182536]">Daily Quests are ready!</p>
                    <p className="text-[11px] text-[#7B8794]">Complete 2 quizzes today to earn +50 XP and +5 Coins.</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl hover:bg-[#F7F9FC] flex items-start gap-3 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-[#182536]">
                      {language === "uz" ? "Jonli bellashuvlar ochiq" : "Multiplayer Arena is live"}
                    </p>
                    <p className="text-[11px] text-[#7B8794]">
                      {language === "uz" ? "Do'stlaringiz bilan birgalikda test yeching va reytingingizni oshiring." : "Challenge fellow learners in the arena to earn ranking coins."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar with Online Dot */}
        <Link href="/profile" className="relative group">
          <img
            src={user?.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=learner"}
            alt="User avatar"
            className="w-9 h-9 rounded-full border-2 border-white shadow-xs group-hover:ring-2 group-hover:ring-[#07858B] transition-all bg-white"
          />
          <span className="w-2.5 h-2.5 rounded-full bg-[#22A06B] border-2 border-white absolute bottom-0 right-0" />
        </Link>
      </div>
    </header>
  );
}

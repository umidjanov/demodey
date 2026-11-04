"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/src/context/LanguageContext";
import { api } from "@/src/lib/api";
import { Trophy, Crown, Medal, ArrowRight, Coins } from "lucide-react";

export function LeaderboardWidget() {
  const { t, language } = useLanguage();
  const [podium, setPodium] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getLeaderboard("all_time")
      .then((res) => {
        if (res && Array.isArray(res.podium)) {
          setPodium(res.podium);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-3xl p-6 border border-[#E8EDF2] shadow-xs space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#182536] flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#F5B83D]" />
            {t.leaderboardWidget.title}
          </h3>
          <p className="text-xs text-[#7B8794]">
            {language === "uz" ? "Jonli reyting peshqadamlari" : language === "ru" ? "Лидеры живого рейтинга" : "Live ranking scholars"}
          </p>
        </div>
        <Link
          href="/leaderboard"
          className="text-xs font-semibold text-[#07858B] hover:underline flex items-center gap-1"
        >
          {t.leaderboardWidget.viewAll} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Podium Cards or Empty State */}
      {podium.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#F7F9FC] border border-[#E8EDF2] text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-[#F5B83D] flex items-center justify-center mx-auto border border-amber-200">
            <Trophy className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold text-[#182536]">
            {loading ? "Reyting ma'lumotlari yuklanmoqda..." : "Hozircha reyting yetakchilari yo'q"}
          </p>
          <p className="text-xs text-[#7B8794] max-w-sm mx-auto">
            Testlarni birinchi bo'lib yeching, $RC reyting tangalarini jamg'aring va peshqadamlar shohsupasini egallang!
          </p>
          <Link
            href="/quizzes"
            className="inline-flex items-center gap-2 bg-[#07858B] hover:bg-[#066D73] text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            <span>{t.dashboard.startQuizBtn}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {podium.map((p, idx) => {
            const isFirst = p.rank === 1;
            const isSecond = p.rank === 2;
            const isThird = p.rank === 3;

            const rankBadgeColor = isFirst
              ? "bg-[#F5B83D] text-white"
              : isSecond
              ? "bg-slate-400 text-white"
              : "bg-[#FF9B45] text-white";

            return (
              <div
                key={p.username || idx}
                className={`rounded-2xl p-4 border transition-all text-center relative flex flex-col items-center justify-between ${
                  isFirst
                    ? "bg-gradient-to-b from-amber-50/70 via-white to-amber-50/30 border-amber-200/80 shadow-md shadow-amber-500/5 sm:-translate-y-1"
                    : p.is_current_user
                    ? "bg-teal-50/40 border-[#07858B]/40 ring-2 ring-[#07858B]/20"
                    : "bg-white border-[#E8EDF2]"
                }`}
              >
                {isFirst && (
                  <div className="absolute -top-3.5 px-3 py-0.5 rounded-full bg-[#F5B83D] text-white text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1 shadow-sm">
                    <Crown className="w-3 h-3 fill-white" /> 1-o'rin
                  </div>
                )}

                <div className="pt-2 relative">
                  <img
                    src={p.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.username}`}
                    alt={p.username}
                    className="w-16 h-16 rounded-full border-2 border-white shadow-sm bg-[#F7F9FC]"
                  />
                  <span
                    className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full text-xs font-extrabold flex items-center justify-center border-2 border-white ${rankBadgeColor}`}
                  >
                    {p.rank}
                  </span>
                </div>

                <div className="mt-3 space-y-0.5">
                  <p className="font-bold text-sm text-[#182536] truncate max-w-[140px]">
                    {p.first_name ? `${p.first_name} ${p.last_name}` : p.username}
                  </p>
                  <p className="text-[11px] text-[#7B8794]">
                    {t.dashboard.level} {p.level} · {p.accuracy_percentage}% {t.stats.accuracy}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-[#E8EDF2]/60 w-full flex items-center justify-center gap-1 text-xs font-bold text-amber-700">
                  <Coins className="w-3.5 h-3.5 text-[#F5B83D] fill-[#F5B83D]" />
                  <span>{p.ranking_coins} $RC</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

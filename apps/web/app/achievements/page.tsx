"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { useLanguage } from "@/src/context/LanguageContext";
import { api } from "@/src/lib/api";
import { Award, Trophy, Lock, CheckCircle2, Star, Zap, Crown, Flame, Rocket } from "lucide-react";

const ICON_COMPONENTS: Record<string, any> = {
  Rocket,
  Trophy,
  CheckCircle2,
  Flame,
  Star,
  Crown,
  Award,
};

export default function AchievementsPage() {
  const { t, language } = useLanguage();
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getAchievements()
      .then((data) => setAchievements(Array.isArray(data) ? data : []))
      .catch(() => setAchievements([]))
      .finally(() => setLoading(false));
  }, []);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Header with Stats */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8EDF2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold">
              <Award className="w-3.5 h-3.5 text-[#F5B83D]" />
              <span>
                {language === "uz" ? "Yutuqlar va Badjlar Vitrinasi" : language === "ru" ? "Витрина Достижений" : "Badge Trophy Cabinet"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#182536] tracking-tight">
              {t.nav.achievements}
            </h1>
            <p className="text-xs sm:text-sm text-[#7B8794]">
              {language === "uz"
                ? "Fanlarni o'zlashtirish, intizom zanjirini saqlash va 100% natijalarga erishish orqali unvonlarni qo'lga kiriting."
                : language === "ru"
                ? "Зарабатывайте эксклюзивные награды, поддерживая режим и решая тесты на 100%."
                : "Earn exclusive honors by mastering disciplines, sustaining learning streaks, and conquering tournament podiums."}
            </p>
          </div>

          <div className="p-4 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF2] flex items-center gap-4 text-center shrink-0">
            <div>
              <span className="text-2xl font-black text-[#07858B]">{unlockedCount}</span>
              <span className="block text-[10px] font-bold text-[#7B8794] uppercase tracking-wider">
                {language === "uz" ? "Ochilgan" : language === "ru" ? "Открыто" : "Unlocked"}
              </span>
            </div>
            <div className="w-px h-8 bg-[#E8EDF2]" />
            <div>
              <span className="text-2xl font-black text-[#182536]">{achievements.length}</span>
              <span className="block text-[10px] font-bold text-[#7B8794] uppercase tracking-wider">
                {language === "uz" ? "Jami" : language === "ru" ? "Всего" : "Total"}
              </span>
            </div>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {achievements.map((ach) => {
            const Icon = ICON_COMPONENTS[ach.icon] || Award;
            const isUnlocked = ach.unlocked;

            return (
              <div
                key={ach.id}
                className={`rounded-3xl p-6 border transition-all duration-200 flex flex-col justify-between space-y-4 ${
                  isUnlocked
                    ? "bg-white border-[#E8EDF2] shadow-sm hover:shadow-md hover:-translate-y-0.5"
                    : "bg-[#F7F9FC]/60 border-[#E8EDF2] opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-xs ${
                      isUnlocked
                        ? "bg-gradient-to-tr from-[#07858B] to-teal-400 text-white"
                        : "bg-[#E8EDF2] text-[#7B8794]"
                    }`}
                  >
                    <Icon className="w-7 h-7" />
                  </div>

                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isUnlocked
                        ? "bg-emerald-50 text-[#22A06B] border border-emerald-200"
                        : "bg-slate-100 text-[#7B8794]"
                    }`}
                  >
                    {isUnlocked
                      ? (language === "uz" ? "Ochilgan" : language === "ru" ? "Открыто" : "Unlocked")
                      : (language === "uz" ? "Qulflangan" : language === "ru" ? "Закрыто" : "Locked")}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-[#182536]">{ach.name}</h3>
                  <p className="text-xs text-[#7B8794] leading-relaxed">{ach.description}</p>
                </div>

                <div className="pt-3 border-t border-[#F7F9FC] flex items-center justify-between text-xs font-semibold">
                  <span className="text-[#07858B] flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-[#F5B83D]" /> +{ach.xp_reward} XP
                  </span>
                  {ach.coin_reward > 0 && (
                    <span className="text-amber-700 font-bold">
                      +{ach.coin_reward} {t.dashboard.rankingCoins}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";
import { api } from "@/src/lib/api";
import { Calendar, Award, Zap, Compass, CheckCircle } from "lucide-react";

export function LifetimeProgressCard() {
  const { profile } = useAuth();
  const { t } = useLanguage();
  const [lifetimeData, setLifetimeData] = useState({
    registration_date: "November 2, 2026",
    weekly_accuracy_gain: "+4.2%",
  });

  useEffect(() => {
    api
      .getLifetimeProgress()
      .then((data) => setLifetimeData(data))
      .catch(() => {});
  }, []);

  return (
    <div className="bg-white rounded-3xl p-6 border border-[#E8EDF2] shadow-xs space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#182536]">{t.lifetime.title}</h3>
          <p className="text-xs text-[#7B8794]">{t.lifetime.subtitle}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#7B8794] bg-[#F7F9FC] px-3 py-1.5 rounded-xl border border-[#E8EDF2]">
          <Calendar className="w-3.5 h-3.5 text-[#07858B]" />
          <span>{t.lifetime.memberSince} {lifetimeData.registration_date}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-[#E8EDF2]/60">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7B8794] pb-1">
            <Zap className="w-4 h-4 text-[#F5B83D]" />
            <span>{t.lifetime.totalXp}</span>
          </div>
          <p className="text-xl font-extrabold text-[#182536]">{profile?.total_xp || 0}</p>
          <span className="text-[11px] text-[#22A06B] font-semibold">+320 {t.lifetime.thisWeekGain}</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-[#E8EDF2]/60">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7B8794] pb-1">
            <Award className="w-4 h-4 text-[#FF9B45]" />
            <span>{t.lifetime.rankingCoins}</span>
          </div>
          <p className="text-xl font-extrabold text-[#182536]">{profile?.ranking_coins || 0} $RC</p>
          <span className="text-[11px] text-[#7B8794] font-medium">{t.lifetime.coinsRule}</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-[#E8EDF2]/60">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7B8794] pb-1">
            <CheckCircle className="w-4 h-4 text-[#07858B]" />
            <span>{t.lifetime.quizzesSolved}</span>
          </div>
          <p className="text-xl font-extrabold text-[#182536]">{profile?.completed_quizzes_count || 0}</p>
          <span className="text-[11px] text-[#07858B] font-semibold">{t.lifetime.verified}</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-[#E8EDF2]/60">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7B8794] pb-1">
            <Compass className="w-4 h-4 text-[#5877D9]" />
            <span>{t.lifetime.averageAccuracy}</span>
          </div>
          <p className="text-xl font-extrabold text-[#182536]">
            {profile?.average_score ? profile.average_score.toFixed(1) : "95.0"}%
          </p>
          <span className="text-[11px] text-[#22A06B] font-semibold">{lifetimeData.weekly_accuracy_gain} {t.lifetime.monthlyGain}</span>
        </div>
      </div>
    </div>
  );
}

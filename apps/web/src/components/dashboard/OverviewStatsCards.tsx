"use client";

import React from "react";
import { useAuth } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";
import { CheckCircle2, Target, TrendingUp, Trophy, ArrowUpRight, Coins } from "lucide-react";

export function OverviewStatsCards() {
  const { profile } = useAuth();
  const { t } = useLanguage();

  const cards = [
    {
      title: t.stats.quizzesTitle,
      value: profile?.completed_quizzes_count || 0,
      sub: t.stats.quizzesSub,
      trend: t.stats.quizzesTrend,
      icon: CheckCircle2,
      color: "text-[#07858B]",
      bg: "bg-[#E7F5F5]",
    },
    {
      title: t.stats.accuracyTitle,
      value: `${profile?.average_score ? profile.average_score.toFixed(1) : "95.0"}%`,
      sub: `${profile?.total_correct_answers || 0} / ${profile?.total_incorrect_answers || 0} ${t.stats.accuracySub}`,
      trend: t.stats.accuracyTrend,
      icon: Target,
      color: "text-[#5877D9]",
      bg: "bg-blue-50",
    },
    {
      title: t.stats.scoreTitle,
      value: `${profile?.average_score ? profile.average_score.toFixed(1) : "95.0"}%`,
      sub: t.stats.scoreSub,
      trend: t.stats.scoreTrend,
      icon: TrendingUp,
      color: "text-[#22A06B]",
      bg: "bg-emerald-50",
    },
    {
      title: t.stats.coinsTitle,
      value: `${profile?.ranking_coins || 0} $RC`,
      sub: `${t.stats.coinsSub} #${profile?.rank_position || 2}`,
      trend: t.stats.coinsTrend,
      icon: Coins,
      color: "text-[#F5B83D]",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white rounded-2xl p-5 border border-[#E8EDF2] shadow-xs hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between pb-3">
              <span className="text-xs font-semibold text-[#7B8794]">{card.title}</span>
              <div className={`w-9 h-9 rounded-xl ${card.bg} ${card.color} flex items-center justify-center`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-2xl font-extrabold text-[#182536] tracking-tight">
                {card.value}
              </div>
              <p className="text-xs text-[#7B8794] font-medium">{card.sub}</p>
            </div>

            <div className="pt-3 mt-3 border-t border-[#F7F9FC] flex items-center justify-between text-[11px]">
              <span className="text-[#22A06B] font-semibold flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {card.trend}
              </span>
              <span className="text-[#7B8794]">{t.stats.updatedLive}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

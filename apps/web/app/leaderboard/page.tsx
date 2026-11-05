"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { useLanguage } from "@/src/context/LanguageContext";
import { api, getAllPlatformLearners } from "@/src/lib/api";
import { useAuth } from "@/src/context/AuthContext";
import { UserProfileModal } from "@/src/components/profile/UserProfileModal";
import {
  Trophy,
  Crown,
  Coins,
  Zap,
  Users,
  Calendar,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function LeaderboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [period, setPeriod] = useState<string>("all_time");
  const [leaderboardData, setLeaderboardData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    loadLeaderboard();

    const handleDeleted = () => {
      loadLeaderboard();
    };

    window.addEventListener("quizora_user_deleted", handleDeleted);
    window.addEventListener("storage", handleDeleted);

    return () => {
      window.removeEventListener("quizora_user_deleted", handleDeleted);
      window.removeEventListener("storage", handleDeleted);
    };
  }, [period]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const [data, scholars] = await Promise.all([
        api.getLeaderboard(period).catch(() => null),
        getAllPlatformLearners().catch(() => []),
      ]);

      let all: any[] = [];
      if (Array.isArray(scholars) && scholars.length > 0) {
        all = [...scholars];
      } else if (data) {
        const pod = data.podium || [];
        const rank = data.rankings || [];
        all = [...pod, ...rank];
      }

      all.sort((a, b) => (b.total_xp || b.ranking_coins || 0) - (a.total_xp || a.ranking_coins || 0));

      const updatedPodium = all.slice(0, 3).map((u, i) => ({ ...u, rank: i + 1 }));
      const updatedRankings = all.map((u, i) => ({ ...u, rank: i + 1 }));

      setLeaderboardData({
        podium: updatedPodium,
        rankings: updatedRankings,
      });
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const podium = leaderboardData?.podium || [];
  const rankings = leaderboardData?.rankings || [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header with Period Switcher */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8EDF2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
              <Trophy className="w-3.5 h-3.5 text-[#F5B83D]" />
              <span>
                {language === "uz" ? "Mavsum Shon-Sharaf Zali" : language === "ru" ? "Зал Славы Сезона" : "Official Season Hall of Fame"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#182536] tracking-tight">
              {t.nav.leaderboard}
            </h1>
            <p className="text-xs sm:text-sm text-[#7B8794]">
              {language === "uz"
                ? "Reyting tangalari ($RC), to'plangan XP va aniqlik darajasi bo'yicha jonli peshqadamlar ro'yxati."
                : language === "ru"
                ? "Рейтинг учеников на основе монет ($RC), объема XP и точности прохождения тестов."
                : "Real-time rankings based on verified ranking coins ($RC), XP volume, and quiz accuracy."}
            </p>
          </div>

          {/* Period Filter Tabs */}
          <div className="inline-flex bg-[#F7F9FC] p-1.5 rounded-2xl border border-[#E8EDF2] self-start md:self-auto">
            {[
              { id: "all_time", label: language === "uz" ? "Barcha Vaqt" : language === "ru" ? "За всё время" : "All-Time" },
              { id: "monthly", label: language === "uz" ? "Oylik Mavsum" : language === "ru" ? "Этот месяц" : "Monthly Season" },
              { id: "weekly", label: language === "uz" ? "Haftalik" : language === "ru" ? "Эта неделя" : "Weekly" },
              { id: "friends", label: language === "uz" ? "Do'stlar" : language === "ru" ? "Друзья" : "Friends" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setPeriod(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  period === tab.id
                    ? "bg-white text-[#07858B] shadow-xs"
                    : "text-[#7B8794] hover:text-[#182536]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Podium Distinctive Cards */}
        {podium.length > 0 && (
          <div className={`grid grid-cols-1 ${podium.length === 1 ? "sm:grid-cols-1 max-w-sm mx-auto" : podium.length === 2 ? "sm:grid-cols-2 max-w-2xl mx-auto" : "sm:grid-cols-3"} gap-6 pt-4`}>
            {/* 2nd Place */}
            {podium.length >= 2 && (
              <div
                onClick={() => setSelectedUser(podium[1])}
                className="order-2 sm:order-1 bg-white rounded-3xl p-6 border border-[#E8EDF2] shadow-xs text-center flex flex-col items-center justify-between space-y-4 cursor-pointer hover:shadow-md transition-shadow group"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-extrabold text-xs flex items-center justify-center">
                  2
                </div>
                <img
                  src={podium[1]?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${podium[1]?.username}`}
                  alt={podium[1]?.username}
                  className="w-20 h-20 rounded-full border-4 border-slate-100 shadow-md bg-[#F7F9FC] group-hover:scale-105 transition-transform"
                />
                <div>
                  <h3 className="font-bold text-base text-[#182536] group-hover:text-[#07858B] transition-colors">
                    {podium[1]?.first_name} {podium[1]?.last_name}
                  </h3>
                  <p className="text-xs text-[#7B8794]">@{podium[1]?.username} · {t.dashboard.level} {podium[1]?.level}</p>
                </div>
                <div className="w-full pt-3 border-t border-[#E8EDF2] flex items-center justify-around text-xs">
                  <div>
                    <span className="text-[10px] text-[#7B8794] block">{t.stats.accuracy}</span>
                    <span className="font-bold text-[#182536]">{podium[1]?.accuracy_percentage || podium[1]?.average_score || 85}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7B8794] block">{t.dashboard.rankingCoins}</span>
                    <span className="font-bold text-amber-700">{podium[1]?.ranking_coins || podium[1]?.coins || 0} $RC</span>
                  </div>
                </div>
              </div>
            )}

            {/* 1st Place Champion */}
            {podium.length >= 1 && (
              <div
                onClick={() => setSelectedUser(podium[0])}
                className="order-1 sm:order-2 bg-gradient-to-b from-amber-50 via-white to-amber-50/40 rounded-3xl p-6 sm:p-8 border-2 border-amber-300 shadow-lg shadow-amber-500/10 text-center flex flex-col items-center justify-between space-y-4 sm:-translate-y-3 relative cursor-pointer hover:shadow-xl transition-all group"
              >
                <div className="absolute -top-3.5 px-4 py-1 rounded-full bg-[#F5B83D] text-white text-[11px] font-extrabold uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                  <Crown className="w-3.5 h-3.5 fill-white" />
                  <span>{language === "uz" ? "Oylik Chempion" : language === "ru" ? "Чемпион Месяца" : "Monthly Champion"}</span>
                </div>

                <div className="pt-2">
                  <img
                    src={podium[0]?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${podium[0]?.username}`}
                    alt={podium[0]?.username}
                    className="w-24 h-24 rounded-full border-4 border-amber-200 shadow-lg bg-[#F7F9FC] group-hover:scale-105 transition-transform"
                  />
                </div>

                <div>
                  <h3 className="font-extrabold text-lg text-[#182536] group-hover:text-[#07858B] transition-colors">
                    {podium[0]?.first_name} {podium[0]?.last_name}
                  </h3>
                  <p className="text-xs text-[#7B8794]">@{podium[0]?.username} · {t.dashboard.level} {podium[0]?.level}</p>
                </div>

                <div className="w-full pt-3 border-t border-amber-200/60 flex items-center justify-around text-xs">
                  <div>
                    <span className="text-[10px] text-[#7B8794] block">{t.stats.accuracy}</span>
                    <span className="font-extrabold text-[#182536]">{podium[0]?.accuracy_percentage || podium[0]?.average_score || 85}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7B8794] block">{t.dashboard.rankingCoins}</span>
                    <span className="font-extrabold text-amber-700 text-sm">{podium[0]?.ranking_coins || podium[0]?.coins || 0} $RC</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {podium.length >= 3 && (
              <div
                onClick={() => setSelectedUser(podium[2])}
                className="order-3 bg-white rounded-3xl p-6 border border-[#E8EDF2] shadow-xs text-center flex flex-col items-center justify-between space-y-4 cursor-pointer hover:shadow-md transition-shadow group"
              >
                <div className="w-8 h-8 rounded-full bg-orange-200 text-orange-800 font-extrabold text-xs flex items-center justify-center">
                  3
                </div>
                <img
                  src={podium[2]?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${podium[2]?.username}`}
                  alt={podium[2]?.username}
                  className="w-20 h-20 rounded-full border-4 border-orange-100 shadow-md bg-[#F7F9FC] group-hover:scale-105 transition-transform"
                />
                <div>
                  <h3 className="font-bold text-base text-[#182536] group-hover:text-[#07858B] transition-colors">
                    {podium[2]?.first_name} {podium[2]?.last_name}
                  </h3>
                  <p className="text-xs text-[#7B8794]">@{podium[2]?.username} · {t.dashboard.level} {podium[2]?.level}</p>
                </div>
                <div className="w-full pt-3 border-t border-[#E8EDF2] flex items-center justify-around text-xs">
                  <div>
                    <span className="text-[10px] text-[#7B8794] block">{t.stats.accuracy}</span>
                    <span className="font-bold text-[#182536]">{podium[2]?.accuracy_percentage || podium[2]?.average_score || 85}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#7B8794] block">{t.dashboard.rankingCoins}</span>
                    <span className="font-bold text-amber-700">{podium[2]?.ranking_coins || podium[2]?.coins || 0} $RC</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detailed Full Ranking Table */}
        <div className="bg-white rounded-3xl border border-[#E8EDF2] shadow-xs overflow-hidden">
          <div className="p-5 border-b border-[#E8EDF2] flex items-center justify-between">
            <h3 className="font-bold text-sm text-[#182536]">
              {language === "uz" ? "Barcha Ishtirokchilar Reytingi" : language === "ru" ? "Полная Таблица Участников" : "Full Competitor Standings"}
            </h3>
            <span className="text-xs text-[#7B8794] font-medium">
              {language === "uz" ? "Tangalar va XP bo'yicha saralangan" : language === "ru" ? "Сортировка по Монетам и XP" : "Ranked by Coins & XP"}
            </span>
          </div>

          <div className="overflow-x-auto">
            {rankings.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Trophy className="w-10 h-10 text-[#F5B83D] mx-auto opacity-70" />
                <p className="text-sm font-bold text-[#182536]">
                  {language === "uz"
                    ? "Hozircha reyting ishtirokchilari mavjud emas"
                    : language === "ru"
                    ? "Участников рейтинга пока нет"
                    : "No leaderboard participants yet"}
                </p>
                <p className="text-xs text-[#7B8794] max-w-sm mx-auto">
                  {language === "uz"
                    ? "Birinchi bo'lib testlarni yeching va reytingda 1-o'ringa chiqing!"
                    : "Solve tests and become #1 on the leaderboard!"}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-[#F7F9FC] text-[#7B8794] text-xs font-semibold uppercase tracking-wider border-b border-[#E8EDF2]">
                  <tr>
                    <th className="py-3.5 px-6">{t.leaderboardWidget.rank}</th>
                    <th className="py-3.5 px-6">{t.leaderboardWidget.user}</th>
                    <th className="py-3.5 px-6">{t.dashboard.level}</th>
                    <th className="py-3.5 px-6">{t.dashboard.rankingCoins}</th>
                    <th className="py-3.5 px-6">Total XP</th>
                    <th className="py-3.5 px-6">{t.chart.quizzesSolved}</th>
                    <th className="py-3.5 px-6">{t.stats.accuracy}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8EDF2]">
                  {rankings.map((entry: any) => {
                    const isCurrent = entry.is_current_user || entry.username === user?.username;

                    return (
                      <tr
                        key={entry.user_id || entry.rank}
                        onClick={() => setSelectedUser(entry)}
                        className={`hover:bg-[#F7F9FC] transition-colors cursor-pointer group ${
                          isCurrent ? "bg-[#E7F5F5]/40 font-bold" : ""
                        }`}
                      >
                        <td className="py-4 px-6">
                          <span className="w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center bg-[#F7F9FC] border border-[#E8EDF2]">
                            {entry.rank}
                          </span>
                        </td>
                        <td className="py-4 px-6 flex items-center gap-3">
                          <img
                            src={entry.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${entry.username}`}
                            alt={entry.username}
                            className="w-8 h-8 rounded-full border border-[#E8EDF2] group-hover:scale-105 transition-transform"
                          />
                          <div>
                            <p className="font-bold text-[#182536] group-hover:text-[#07858B] transition-colors">
                              {entry.first_name} {entry.last_name}
                            </p>
                            <p className="text-[11px] text-[#7B8794]">@{entry.username}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-semibold text-[#182536]">
                          {t.dashboard.level} {entry.level}
                        </td>
                        <td className="py-4 px-6 font-extrabold text-amber-700">
                          {entry.ranking_coins} $RC
                        </td>
                        <td className="py-4 px-6 font-bold text-[#07858B]">
                          {entry.total_xp} XP
                        </td>
                        <td className="py-4 px-6 text-[#7B8794]">
                          {entry.completed_quizzes || entry.quizzes_completed || 0}
                        </td>
                        <td className="py-4 px-6 font-bold text-[#22A06B]">
                          {entry.accuracy_percentage}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* User Profile Details Modal */}
        <UserProfileModal
          user={selectedUser}
          isOpen={Boolean(selectedUser)}
          onClose={() => setSelectedUser(null)}
          onMessage={(u) => router.push(`/messages?user=${encodeURIComponent(u.username || u.id)}`)}
          onChallenge={(u) => router.push(`/rooms?opponent=${encodeURIComponent(u.username || u.id)}`)}
        />
      </div>
    </DashboardLayout>
  );
}

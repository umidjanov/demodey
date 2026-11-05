"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { useLanguage } from "@/src/context/LanguageContext";
import { api, getAllPlatformLearners } from "@/src/lib/api";
import { UserProfileModal } from "@/src/components/profile/UserProfileModal";
import {
  CheckSquare,
  Filter,
  ArrowRight,
  Clock,
  Award,
  Zap,
  ChevronRight,
  Trophy,
  Users,
  Search,
  Eye,
  Coins,
  Flame,
  MessageSquare,
  Swords,
} from "lucide-react";

export default function MyResultsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<"scholars" | "my_history">("scholars");
  const [results, setResults] = useState<any[]>([]);
  const [learners, setLearners] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState("");

  // Selected User Modal
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    loadAllData();

    const handleDeleted = () => {
      loadAllData();
    };

    window.addEventListener("quizora_user_deleted", handleDeleted);
    window.addEventListener("storage", handleDeleted);

    return () => {
      window.removeEventListener("quizora_user_deleted", handleDeleted);
      window.removeEventListener("storage", handleDeleted);
    };
  }, [difficultyFilter]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const query = difficultyFilter ? `difficulty=${difficultyFilter}` : "";
      const [resData, scholars] = await Promise.all([
        api.getResults(query).catch(() => []),
        getAllPlatformLearners().catch(() => []),
      ]);

      if (Array.isArray(resData)) {
        setResults(resData);
      } else if (resData && Array.isArray((resData as any).results)) {
        setResults((resData as any).results);
      } else {
        setResults([]);
      }

      setLearners(Array.isArray(scholars) ? scholars : []);
    } catch {
      setResults([]);
      setLearners([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredLearners = learners.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.username?.toLowerCase().includes(q) ||
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-16">
        {/* Header with Title and Search/Filter */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8EDF2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F5F5] text-[#07858B] text-xs font-bold">
              <Trophy className="w-3.5 h-3.5" />
              <span>O'quvchilar Natijalari va Umumiy Reyting</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#182536] tracking-tight">
              {language === "uz" ? "Natijalar va O'quvchilar Reytingi" : "Results & Scholar Leaderboard"}
            </h1>
            <p className="text-xs sm:text-sm text-[#7B8794] max-w-2xl">
              Platformadagi barcha o'quvchilarning test natijalari, ballari va yutuqlari. Har qanday o'quvchi ustiga bosib, uning barcha natijalarini ko'rishingiz mumkin.
            </p>
          </div>

          {activeTab === "scholars" ? (
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-[#7B8794] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === "uz" ? "O'quvchini qidirish..." : "Search scholar..."}
                className="w-full bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl pl-9 pr-3 py-2 text-xs text-[#182536] focus:outline-none focus:border-[#07858B]"
              />
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl px-3 py-2">
              <Filter className="w-4 h-4 text-[#7B8794]" />
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#182536] focus:outline-none"
              >
                <option value="">{language === "uz" ? "Barcha Qiyinliklar" : "All Difficulties"}</option>
                <option value="very_easy">{t.quizzes.diffVeryEasy}</option>
                <option value="easy">{t.quizzes.diffEasy}</option>
                <option value="medium">{t.quizzes.diffMedium}</option>
                <option value="hard">{t.quizzes.diffHard}</option>
                <option value="very_hard">{t.quizzes.diffVeryHard}</option>
              </select>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-[#E8EDF2] pb-3 text-xs font-bold">
          <button
            onClick={() => setActiveTab("scholars")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "scholars"
                ? "bg-[#07858B] text-white shadow-xs"
                : "bg-white text-[#7B8794] hover:text-[#182536] border border-[#E8EDF2]"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>O'quvchilar Natijalari va Reytingi ({learners.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("my_history")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "my_history"
                ? "bg-[#07858B] text-white shadow-xs"
                : "bg-white text-[#7B8794] hover:text-[#182536] border border-[#E8EDF2]"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>Mening Test Natijalarim ({results.length})</span>
          </button>
        </div>

        {/* Tab 1: All Scholars Quiz Results Ranking */}
        {activeTab === "scholars" && (
          <div className="space-y-3">
            {loading ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#E8EDF2] space-y-3">
                <div className="w-8 h-8 border-3 border-[#07858B] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-[#7B8794]">O'quvchilar natijalari yuklanmoqda...</p>
              </div>
            ) : filteredLearners.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#E8EDF2] space-y-2">
                <Users className="w-10 h-10 text-[#7B8794]/40 mx-auto" />
                <h3 className="font-bold text-base text-[#182536]">O'quvchilar topilmadi</h3>
                <p className="text-xs text-[#7B8794]">Qidiruv so'zini tekshirib ko'ring.</p>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-[#E8EDF2] overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F7F9FC] text-[#7B8794] font-bold uppercase tracking-wider border-b border-[#E8EDF2]">
                      <tr>
                        <th className="py-3.5 px-4 text-center">O'rin</th>
                        <th className="py-3.5 px-4">O'quvchi</th>
                        <th className="py-3.5 px-4">Daraja & XP</th>
                        <th className="py-3.5 px-4">Tangalar ($RC)</th>
                        <th className="py-3.5 px-4">Yechilgan Testlar</th>
                        <th className="py-3.5 px-4">Aniqlik</th>
                        <th className="py-3.5 px-4">Zanjir</th>
                        <th className="py-3.5 px-4 text-center">Amallar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8EDF2]">
                      {filteredLearners.map((u) => {
                        const isChampion = u.rank === 1;
                        const isSilver = u.rank === 2;
                        const isBronze = u.rank === 3;
                        const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username;

                        return (
                          <tr
                            key={u.id}
                            onClick={() => setSelectedUser(u)}
                            className="hover:bg-[#F7F9FC]/80 transition-colors cursor-pointer group"
                          >
                            {/* 1. Rank */}
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-xs ${
                                  isChampion
                                    ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-xs"
                                    : isSilver
                                    ? "bg-slate-200 text-slate-800 border border-slate-300"
                                    : isBronze
                                    ? "bg-orange-100 text-orange-900 border border-orange-300"
                                    : "bg-[#F7F9FC] text-[#7B8794] border border-[#E8EDF2]"
                                }`}
                              >
                                {isChampion ? <Trophy className="w-4 h-4 fill-amber-700 text-amber-700" /> : `#${u.rank}`}
                              </span>
                            </td>

                            {/* 2. Scholar */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <img
                                  src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                                  alt=""
                                  className="w-10 h-10 rounded-full bg-[#F7F9FC] border border-[#E8EDF2] group-hover:scale-105 transition-transform"
                                />
                                <div>
                                  <p className="font-extrabold text-[#182536] group-hover:text-[#07858B] transition-colors">
                                    {fullName}
                                  </p>
                                  <p className="text-[11px] text-[#7B8794]">@{u.username}</p>
                                </div>
                              </div>
                            </td>

                            {/* 3. Level & XP */}
                            <td className="py-3.5 px-4">
                              <div>
                                <span className="font-bold text-[#182536] bg-[#F7F9FC] px-2 py-0.5 rounded-md border border-[#E8EDF2]">
                                  Lvl {u.level || 1}
                                </span>
                                <span className="block text-[11px] text-[#07858B] font-bold mt-0.5">
                                  {u.total_xp || 0} XP
                                </span>
                              </div>
                            </td>

                            {/* 4. Coins */}
                            <td className="py-3.5 px-4">
                              <span className="font-extrabold text-amber-700 flex items-center gap-1">
                                <Coins className="w-3.5 h-3.5 text-[#F5B83D] fill-[#F5B83D]" />
                                {u.ranking_coins || u.coins || 0} $RC
                              </span>
                            </td>

                            {/* 5. Completed Quizzes */}
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-[#182536]">
                                {u.completed_quizzes_count || 0} ta test
                              </span>
                              <span className="block text-[11px] text-[#7B8794]">
                                {u.total_questions_answered || 0} ta savol
                              </span>
                            </td>

                            {/* 6. Accuracy */}
                            <td className="py-3.5 px-4">
                              <span className="font-extrabold text-[#22A06B] text-sm">
                                {u.average_score || u.accuracy_percentage || 0}%
                              </span>
                              <span className="block text-[10px] text-[#7B8794]">aniqlik</span>
                            </td>

                            {/* 7. Streak */}
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-[#FF9B45] flex items-center gap-1">
                                <Flame className="w-3.5 h-3.5 fill-[#FF9B45]" />
                                {u.current_streak || 1} kun
                              </span>
                            </td>

                            {/* 8. Actions */}
                            <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setSelectedUser(u)}
                                  className="p-1.5 text-[#7B8794] hover:text-[#07858B] hover:bg-[#E7F5F5] rounded-lg transition-colors"
                                  title="To'liq ma'lumotlarni ko'rish"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => router.push(`/messages?user=${encodeURIComponent(u.username || u.id)}`)}
                                  className="p-1.5 text-[#7B8794] hover:text-[#07858B] hover:bg-[#E7F5F5] rounded-lg transition-colors"
                                  title="Xabar yozish"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => router.push(`/rooms?opponent=${encodeURIComponent(u.username || u.id)}`)}
                                  className="p-1.5 text-[#7B8794] hover:text-[#07858B] hover:bg-[#E7F5F5] rounded-lg transition-colors"
                                  title="Test bellashuviga chorlash"
                                >
                                  <Swords className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: My Quiz Attempts History */}
        {activeTab === "my_history" && (
          <div className="space-y-4">
            {loading ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#E8EDF2] space-y-3">
                <div className="w-8 h-8 border-3 border-[#07858B] border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs font-semibold text-[#7B8794]">Natijalar yuklanmoqda...</p>
              </div>
            ) : !Array.isArray(results) || results.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-[#E8EDF2] space-y-3">
                <CheckSquare className="w-12 h-12 text-[#7B8794]/40 mx-auto" />
                <h3 className="font-bold text-base text-[#182536]">
                  {language === "uz" ? "Hozircha natijalar yo'q" : "No quiz attempts found"}
                </h3>
                <p className="text-xs text-[#7B8794]">
                  {language === "uz" ? "Birinchi testni yechib, o'zlashtirishni boshlang." : "Start a quiz to begin logging your performance results."}
                </p>
                <Link
                  href="/quizzes"
                  className="inline-flex items-center gap-2 bg-[#07858B] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs hover:bg-[#066D73] transition-colors"
                >
                  {t.dashboard.solveQuizBtn}
                </Link>
              </div>
            ) : (
              results.map((res) => (
                <div
                  key={res.id}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-[#E8EDF2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-bold text-[#07858B] bg-[#E7F5F5] px-2.5 py-0.5 rounded-full capitalize">
                        {res.difficulty}
                      </span>
                      <span className="text-[#7B8794]">· {res.category_name}</span>
                    </div>
                    <h3 className="text-base font-bold text-[#182536]">{res.quiz_title}</h3>
                    <div className="flex items-center gap-4 text-xs text-[#7B8794] pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {res.duration_formatted}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-[#07858B]">
                        <Zap className="w-3.5 h-3.5 text-[#F5B83D]" /> +{res.earned_xp} XP
                      </span>
                      {res.earned_coins > 0 && (
                        <span className="flex items-center gap-1 font-bold text-amber-700">
                          +{res.earned_coins} {t.dashboard.rankingCoins}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 pt-3 sm:pt-0">
                    <div className="text-right">
                      <span
                        className={`text-2xl font-extrabold ${
                          res.score_percentage >= 80 ? "text-[#07858B]" : "text-[#FF9B45]"
                        }`}
                      >
                        {Math.round(res.score_percentage)}%
                      </span>
                      <span className="block text-[11px] text-[#7B8794]">
                        {res.correct_count} {t.stage.correctMetric?.toLowerCase()}
                      </span>
                    </div>

                    <Link
                      href={`/quiz/${res.id}/result`}
                      className="p-2.5 rounded-xl bg-[#F7F9FC] hover:bg-[#E7F5F5] text-[#07858B] transition-colors"
                      title={language === "uz" ? "Natijani ko'rish" : "View Results"}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* User Profile Modal */}
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

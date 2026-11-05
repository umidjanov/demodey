"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { useLanguage } from "@/src/context/LanguageContext";
import { api } from "@/src/lib/api";
import { CheckSquare, Filter, ArrowRight, Clock, Award, Zap, ChevronRight } from "lucide-react";

export default function MyResultsPage() {
  const { t, language } = useLanguage();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState("");

  useEffect(() => {
    loadResults();
  }, [difficultyFilter]);

  const loadResults = async () => {
    setLoading(true);
    try {
      const query = difficultyFilter ? `difficulty=${difficultyFilter}` : "";
      const data = await api.getResults(query);
      if (Array.isArray(data)) {
        setResults(data);
      } else if (data && Array.isArray((data as any).results)) {
        setResults((data as any).results);
      } else {
        setResults([]);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Filters */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8EDF2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#182536] tracking-tight">
              {language === "uz" ? "Mening Natijalarim Tarixi" : language === "ru" ? "История Моих Результатов" : "My Quiz Results History"}
            </h1>
            <p className="text-xs sm:text-sm text-[#7B8794]">
              {language === "uz"
                ? "Oldin ishlangan testlar natijalarini ko'ring, tahlil qiling va mukofotlarni tekshiring."
                : language === "ru"
                ? "Просматривайте историю пройденных тестов, разборы вопросов и заработанные награды."
                : "Review past quiz performance, review question explanations, and inspect earned rewards."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl px-3 py-2">
              <Filter className="w-4 h-4 text-[#7B8794]" />
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-[#182536] focus:outline-none"
              >
                <option value="">{language === "uz" ? "Barcha Qiyinliklar" : language === "ru" ? "Все Сложности" : "All Difficulties"}</option>
                <option value="very_easy">{t.quizzes.diffVeryEasy}</option>
                <option value="easy">{t.quizzes.diffEasy}</option>
                <option value="medium">{t.quizzes.diffMedium}</option>
                <option value="hard">{t.quizzes.diffHard}</option>
                <option value="very_hard">{t.quizzes.diffVeryHard}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E8EDF2] flex flex-col justify-center items-center gap-3">
              <div className="w-8 h-8 border-3 border-[#07858B] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-[#7B8794]">
                {language === "uz" ? "Natijalar yuklanmoqda..." : language === "ru" ? "Загрузка результатов..." : "Loading results..."}
              </span>
            </div>
          ) : !Array.isArray(results) || results.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#E8EDF2] space-y-3">
              <CheckSquare className="w-12 h-12 text-[#7B8794]/40 mx-auto" />
              <h3 className="font-bold text-base text-[#182536]">
                {language === "uz" ? "Hozircha natijalar yo'q" : language === "ru" ? "Нет результатов" : "No quiz attempts found"}
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
      </div>
    </DashboardLayout>
  );
}

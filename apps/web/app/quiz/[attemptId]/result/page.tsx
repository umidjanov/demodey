"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { useLanguage } from "@/src/context/LanguageContext";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/lib/api";
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Clock,
  Coins,
  Zap,
  ArrowRight,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Home,
  AlertCircle,
  Check,
  Lock,
} from "lucide-react";
import confetti from "canvas-confetti";

export default function Stage4ResultPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const resolvedParams = use(params);
  const attemptId = resolvedParams.attemptId;
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();

  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    api
      .getStage4Results(attemptId)
      .then((data) => {
        setResult(data);
        if (data.score_percentage === 100) {
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [attemptId, user, authLoading]);

  if (authLoading || (loading && user)) {
    return (
      <DashboardLayout showRightSidebar={false}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
          <div className="w-10 h-10 border-4 border-[#07858B] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-[#7B8794]">{t.stage.loadingResult}</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout showRightSidebar={false}>
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#182536]">
            {language === "uz" ? "Hisobga kirish talab qilinadi" : "Sign in to view results"}
          </h2>
          <p className="text-xs text-[#7B8794]">
            {language === "uz"
              ? "Natijalarni ko'rish va saqlash uchun avval ro'yxatdan o'ting yoki hisobingizga kiring."
              : "Please register or log in to view quiz results."}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="px-5 py-2.5 rounded-xl border border-[#E8EDF2] text-xs font-bold text-[#182536] hover:bg-[#F7F9FC]"
            >
              {language === "uz" ? "Kirish" : "Log In"}
            </Link>
            <Link
              href="/register"
              className="px-5 py-2.5 rounded-xl bg-[#07858B] hover:bg-[#066D73] text-white text-xs font-bold shadow-xs"
            >
              {language === "uz" ? "Ro'yxatdan o'tish" : "Register"}
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!result) {
    return (
      <DashboardLayout showRightSidebar={false}>
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-[#FF9B45] mx-auto" />
          <h2 className="text-xl font-bold text-[#182536]">
            {language === "uz" ? "Natija topilmadi" : "Result not found"}
          </h2>
          <Link
            href="/results"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#07858B] text-white text-xs font-bold"
          >
            {language === "uz" ? "Natijalar ro'yxatiga qaytish" : "Back to Results"}
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const isPerfect = result.score_percentage === 100;
  const questions = result.questions || [];

  return (
    <DashboardLayout showRightSidebar={false}>
      <div className="max-w-4xl mx-auto space-y-8 pb-16">
        {/* Results Hero Header */}
        <div
          className={`rounded-3xl p-6 sm:p-10 border text-center space-y-5 relative overflow-hidden shadow-sm ${
            isPerfect
              ? "bg-gradient-to-br from-amber-500/10 via-teal-50/50 to-white border-amber-300"
              : "bg-white border-[#E8EDF2]"
          }`}
        >
          {isPerfect && (
            <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-[#F5B83D] text-white text-xs font-extrabold uppercase tracking-widest shadow-xs">
              <Trophy className="w-4 h-4 fill-white" /> {t.stage.perfectBadge}
            </div>
          )}

          <div className="space-y-1">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#182536] tracking-tight">
              {result.quiz_title}
            </h1>
            <p className="text-xs sm:text-sm text-[#7B8794]">
              {result.category_name} · {t.stage.difficultyLabel} <span className="capitalize font-semibold text-[#07858B]">{result.difficulty}</span>
            </p>
          </div>

          {/* Big Score Display */}
          <div className="flex items-baseline justify-center gap-1">
            <span
              className={`text-6xl sm:text-7xl font-extrabold tracking-tight ${
                result.score_percentage >= 80 ? "text-[#07858B]" : "text-[#FF9B45]"
              }`}
            >
              {Math.round(result.score_percentage)}%
            </span>
            <span className="text-lg font-bold text-[#7B8794]">{t.stage.scoreLabel}</span>
          </div>

          {/* 4 Outcome Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto pt-3">
            <div className="p-3.5 rounded-2xl bg-[#F7F9FC] border border-[#E8EDF2]">
              <div className="text-xs text-[#7B8794] font-semibold flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#22A06B]" /> {t.stage.correctMetric}
              </div>
              <p className="text-xl font-extrabold text-[#182536] mt-1">{result.correct_count}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F7F9FC] border border-[#E8EDF2]">
              <div className="text-xs text-[#7B8794] font-semibold flex items-center justify-center gap-1">
                <XCircle className="w-3.5 h-3.5 text-[#E05252]" /> {t.stage.incorrectMetric}
              </div>
              <p className="text-xl font-extrabold text-[#182536] mt-1">{result.incorrect_count}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F7F9FC] border border-[#E8EDF2]">
              <div className="text-xs text-[#7B8794] font-semibold flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#5877D9]" /> {t.stage.timeSpentMetric}
              </div>
              <p className="text-xl font-extrabold text-[#182536] mt-1">{result.duration_formatted}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#F7F9FC] border border-[#E8EDF2]">
              <div className="text-xs text-[#7B8794] font-semibold flex items-center justify-center gap-1">
                <Zap className="w-3.5 h-3.5 text-[#F5B83D]" /> {t.stage.earnedXpMetric}
              </div>
              <p className="text-xl font-extrabold text-[#182536] mt-1">+{result.earned_xp} XP</p>
            </div>
          </div>

          {/* Ranking Coins Reward Alert */}
          {result.coins_awarded ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 flex items-center justify-center gap-2 shadow-xs">
              <Coins className="w-5 h-5 text-[#F5B83D] fill-[#F5B83D]" />
              <span>{t.stage.coinsAwardedAlert}</span>
            </div>
          ) : (
            <p className="text-xs text-[#7B8794]">
              {t.stage.coinsNotice}
            </p>
          )}

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <Link
              href="/quizzes"
              className="flex items-center gap-2 bg-[#07858B] hover:bg-[#066D73] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-transform hover:scale-105"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t.stage.startAnother}</span>
            </Link>

            <Link
              href={`/ai-assistant?topic=${encodeURIComponent(result.topic_name)}`}
              className="flex items-center gap-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-5 py-2.5 rounded-xl text-xs font-bold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.stage.askAiMistakes}</span>
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-white hover:bg-[#F7F9FC] text-[#7B8794] border border-[#E8EDF2] px-5 py-2.5 rounded-xl text-xs font-bold transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>{t.stage.returnDashboard}</span>
            </Link>
          </div>
        </div>

        {/* Detailed Question-by-Question Post-Mortem */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-[#182536] flex items-center gap-2">
            <span>{t.stage.postMortemTitle}</span>
            <span className="text-xs font-normal text-[#7B8794]">({questions.length} {t.stage.questionsReviewed})</span>
          </h3>

          <div className="space-y-5">
            {questions.map((q: any, idx: number) => {
              const isCorrect = q.is_correct;

              return (
                <div
                  key={q.question_id || idx}
                  className={`bg-white rounded-3xl p-6 sm:p-8 border shadow-xs space-y-5 transition-all ${
                    isCorrect ? "border-[#22A06B]/30" : "border-[#E05252]/40 bg-red-50/10"
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-[#F7F9FC]">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#F7F9FC] text-[#182536] text-xs font-bold flex items-center justify-center border border-[#E8EDF2]">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-[#7B8794]">{t.stage.stemLabel}</span>
                    </div>

                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${
                        isCorrect
                          ? "bg-emerald-50 text-[#22A06B] border border-emerald-200"
                          : "bg-red-50 text-[#E05252] border border-red-200"
                      }`}
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> {t.stage.correctMetric}
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" /> {t.stage.incorrectMetric}
                        </>
                      )}
                    </span>
                  </div>

                  {/* Question Stem */}
                  <h4 className="text-base sm:text-lg font-bold text-[#182536]">{q.stem}</h4>

                  {/* Comparison: User Answer vs Correct Answer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      className={`p-4 rounded-2xl border ${
                        isCorrect
                          ? "bg-[#E7F5F5] border-[#07858B]/30 text-[#066D73]"
                          : "bg-red-50 border-red-200 text-[#E05252]"
                      }`}
                    >
                      <p className="text-[11px] font-bold uppercase tracking-wider mb-1">
                        {t.stage.yourAnswer}
                      </p>
                      <p className="text-sm font-semibold">{q.user_answer || t.stage.notAnswered}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#22A06B]">
                      <p className="text-[11px] font-bold uppercase tracking-wider mb-1">
                        {t.stage.correctAnswer}
                      </p>
                      <p className="text-sm font-semibold">{q.correct_answer}</p>
                    </div>
                  </div>

                  {/* Detailed Explanation */}
                  <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-[#E8EDF2] space-y-1">
                    <p className="text-xs font-bold text-[#182536] flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-[#07858B]" />
                      <span>{t.stage.explanationLabel}</span>
                    </p>
                    <p className="text-xs sm:text-sm text-[#7B8794] leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>

                  {/* AI Evaluation */}
                  {q.ai_evaluation && (
                    <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-1">
                      <p className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                        <span>{t.stage.aiEvaluationLabel}</span>
                      </p>
                      <p className="text-xs sm:text-sm text-purple-800 leading-relaxed">
                        {q.ai_evaluation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

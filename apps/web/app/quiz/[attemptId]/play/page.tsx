"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { useLanguage } from "@/src/context/LanguageContext";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/lib/api";
import {
  Clock,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  Send,
  Sparkles,
  Lock,
} from "lucide-react";

export default function Stage3PlayPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const resolvedParams = use(params);
  const attemptId = resolvedParams.attemptId;
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();

  const [quizData, setQuizData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15 * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    api
      .beginStage3Play(attemptId)
      .then((data) => {
        setQuizData(data);
        if (data.saved_answers) setAnswers(data.saved_answers);
        if (data.remaining_seconds) setSecondsRemaining(data.remaining_seconds);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [attemptId, user, authLoading]);

  // Server-synchronized countdown timer
  useEffect(() => {
    if (secondsRemaining <= 0) {
      handleFinalSubmit();
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsRemaining]);

  const questions = quizData?.questions || [];
  const currentQ = questions[currentIndex];

  const handleSelectAnswer = async (answerValue: string) => {
    if (!currentQ) return;
    const newAnswers = { ...answers, [currentQ.id]: answerValue };
    setAnswers(newAnswers);

    // Autosave in real-time
    try {
      await api.saveAnswer(attemptId, currentQ.id, answerValue);
    } catch (e) {
      console.warn("Autosave sync failed, cached locally:", e);
    }
  };

  const toggleFlag = (qId: string) => {
    setFlagged((prev) => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setShowConfirmModal(false);

    const submissionDeck = questions.map((q: any) => ({
      question_id: q.id,
      answer: answers[q.id] || "",
    }));

    try {
      await api.submitQuiz(attemptId, submissionDeck);
      router.push(`/quiz/${attemptId}/result`);
    } catch (err: any) {
      alert(`Submission error: ${err.message || "Could not submit quiz."}`);
      setIsSubmitting(false);
    }
  };

  if (authLoading || (loading && user)) {
    return (
      <DashboardLayout showRightSidebar={false}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
          <div className="w-10 h-10 border-4 border-[#07858B] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-[#7B8794]">{t.stage.loadingPlay}</p>
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
            {language === "uz" ? "Test ishlash uchun hisobga kiring" : "Sign in to take quizzes"}
          </h2>
          <p className="text-xs text-[#7B8794]">
            {language === "uz"
              ? "Ushbu testni boshlash uchun avval ro'yxatdan o'tishingiz yoki hisobingizga kirishingiz shart."
              : "Please register or log in to access and take quizzes."}
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

  if (!currentQ) {
    return (
      <DashboardLayout showRightSidebar={false}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
          <div className="w-10 h-10 border-4 border-[#07858B] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-[#7B8794]">{t.stage.loadingPlay}</p>
        </div>
      </DashboardLayout>
    );
  }

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).filter((k) => answers[k] && answers[k].trim() !== "").length;
  const progressPct = Math.round((answeredCount / questions.length) * 100);

  return (
    <DashboardLayout showRightSidebar={false}>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Top Control Bar: Stage indicator, Timer & Submit */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E8EDF2] flex flex-wrap items-center justify-between gap-4 shadow-xs sticky top-20 z-10">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#FF9B45] text-white font-extrabold text-sm flex items-center justify-center">
              3
            </span>
            <div>
              <h4 className="text-sm font-bold text-[#182536]">{quizData.topic_name}</h4>
              <p className="text-xs text-[#7B8794]">
                {t.stage.questionOf} {currentIndex + 1} {t.stage.of} {questions.length} · {answeredCount} {t.stage.answered}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer Badge */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-extrabold border transition-colors ${
                secondsRemaining < 120
                  ? "bg-red-50 text-[#E05252] border-red-200 animate-pulse"
                  : "bg-amber-50 text-amber-800 border-amber-200"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime(secondsRemaining)}</span>
            </div>

            {/* Submit Quiz Trigger */}
            <button
              onClick={() => setShowConfirmModal(true)}
              className="bg-[#07858B] hover:bg-[#066D73] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{t.stage.submitQuiz}</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-[#E8EDF2] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#07858B] to-[#22A06B] rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Question Navigation Deck Grid */}
        <div className="bg-white rounded-2xl p-4 border border-[#E8EDF2] flex items-center gap-2 overflow-x-auto shadow-xs">
          {questions.map((q: any, idx: number) => {
            const isAnswered = answers[q.id] && answers[q.id].trim() !== "";
            const isFlagged = flagged[q.id];
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`w-9 h-9 rounded-xl text-xs font-bold shrink-0 transition-all relative ${
                  isCurrent
                    ? "bg-[#07858B] text-white ring-2 ring-[#07858B]/30 shadow-xs"
                    : isAnswered
                    ? "bg-[#E7F5F5] text-[#07858B] border border-[#07858B]/30"
                    : "bg-[#F7F9FC] text-[#7B8794] border border-[#E8EDF2] hover:bg-slate-100"
                }`}
              >
                {idx + 1}
                {isFlagged && (
                  <span className="w-2 h-2 rounded-full bg-[#FF9B45] absolute -top-0.5 -right-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Active Question Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8EDF2] shadow-sm space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-[#F7F9FC]">
            <span className="text-xs font-bold text-[#7B8794] uppercase tracking-wider">
              {t.stage.questionOf} {currentIndex + 1} {t.stage.of} {questions.length} · {currentQ.type?.replace("_", " ")}
            </span>
            <button
              onClick={() => toggleFlag(currentQ.id)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors ${
                flagged[currentQ.id]
                  ? "bg-amber-50 text-[#FF9B45] border-amber-200"
                  : "text-[#7B8794] border-[#E8EDF2] hover:bg-[#F7F9FC]"
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{flagged[currentQ.id] ? t.stage.markedForReview : t.stage.markForReview}</span>
            </button>
          </div>

          {/* Stem */}
          <h2 className="text-lg sm:text-2xl font-bold text-[#182536] leading-relaxed">
            {currentQ.stem}
          </h2>

          {/* Diagram if available */}
          {currentQ.media_url && (
            <div className="rounded-2xl overflow-hidden border border-[#E8EDF2] max-w-md">
              <img src={currentQ.media_url} alt="Question Diagram" className="w-full object-cover" />
            </div>
          )}

          {/* Answer Options */}
          {currentQ.options && currentQ.options.length > 0 ? (
            <div className="space-y-3">
              {currentQ.options.map((opt: any) => {
                const isSelected = answers[currentQ.id] === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectAnswer(opt.id)}
                    className={`w-full p-4 sm:p-5 rounded-2xl border text-left transition-all flex items-center justify-between group ${
                      isSelected
                        ? "bg-[#E7F5F5] border-[#07858B] ring-2 ring-[#07858B]/20 shadow-xs text-[#066D73]"
                        : "bg-[#F7F9FC] border-[#E8EDF2] hover:border-[#07858B]/40 hover:bg-white text-[#182536]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 border transition-colors ${
                          isSelected
                            ? "bg-[#07858B] text-white border-[#07858B]"
                            : "bg-white text-[#7B8794] border-[#E8EDF2] group-hover:border-[#07858B]/40"
                        }`}
                      >
                        {opt.id}
                      </span>
                      <span className="text-sm sm:text-base font-semibold">{opt.text}</span>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected ? "border-[#07858B] bg-[#07858B]" : "border-[#CBD5E1]"
                      }`}
                    >
                      {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            /* Written Short Answer Input */
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#182536]">{t.stage.writtenLabel}</label>
              <textarea
                rows={4}
                value={answers[currentQ.id] || ""}
                onChange={(e) => handleSelectAnswer(e.target.value)}
                placeholder={t.stage.writtenPlaceholder}
                className="w-full bg-[#F7F9FC] border border-[#E8EDF2] rounded-2xl p-4 text-sm text-[#182536] placeholder-[#7B8794] focus:outline-none focus:border-[#07858B] focus:bg-white transition-all"
              />
              <p className="text-[11px] text-[#7B8794]">
                {t.stage.aiGradingNote}
              </p>
            </div>
          )}

          {/* Bottom Next / Prev Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-[#F7F9FC]">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                currentIndex === 0
                  ? "opacity-40 cursor-not-allowed text-[#7B8794]"
                  : "bg-white border border-[#E8EDF2] text-[#182536] hover:bg-[#F7F9FC]"
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t.stage.prevBtn}</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="flex items-center gap-2 bg-[#07858B] hover:bg-[#066D73] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-105"
              >
                <span>{t.stage.nextBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmModal(true)}
                className="flex items-center gap-2 bg-[#22A06B] hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-all hover:scale-105"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t.stage.reviewSubmitBtn}</span>
              </button>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#E8EDF2] space-y-6">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#182536]">{t.stage.modalTitle}</h3>
                <p className="text-xs text-[#7B8794] leading-relaxed">
                  {t.stage.modalDesc}
                </p>
              </div>

              {answeredCount < questions.length && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{t.stage.unansweredWarning}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3 rounded-xl border border-[#E8EDF2] text-xs font-bold text-[#7B8794] hover:bg-[#F7F9FC] transition-colors"
                >
                  {t.stage.returnToQuiz}
                </button>
                <button
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-3 rounded-xl bg-[#07858B] hover:bg-[#066D73] text-white text-xs font-bold shadow-md shadow-[#07858B]/20 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? t.stage.gradingStatus : t.stage.confirmGradeBtn}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

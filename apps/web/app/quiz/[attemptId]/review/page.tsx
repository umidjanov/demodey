"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { useLanguage } from "@/src/context/LanguageContext";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/lib/api";
import { BookOpen, ArrowRight, Sparkles, AlertCircle, FileText, CheckCircle, Lock } from "lucide-react";

export default function Stage1ReviewPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const resolvedParams = use(params);
  const attemptId = resolvedParams.attemptId;
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();

  const [reviewData, setReviewData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    api
      .getStage1Review(attemptId)
      .then((data) => setReviewData(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [attemptId, user, authLoading]);

  if (authLoading || (loading && user)) {
    return (
      <DashboardLayout showRightSidebar={false}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
          <div className="w-10 h-10 border-4 border-[#07858B] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-[#7B8794]">{t.stage.loadingReview}</p>
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

  const questions = reviewData?.questions || [];

  return (
    <DashboardLayout showRightSidebar={false}>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Stage Progress Tracker */}
        <div className="bg-white rounded-2xl p-4 border border-[#E8EDF2] flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#07858B] text-white font-extrabold text-sm flex items-center justify-center">
              1
            </span>
            <div>
              <h4 className="text-sm font-bold text-[#182536]">{t.stage.stage1Title}</h4>
              <p className="text-xs text-[#7B8794]">{t.stage.stage1Sub}</p>
            </div>
          </div>

          <Link
            href={`/quiz/${attemptId}/video`}
            className="flex items-center gap-2 bg-[#07858B] hover:bg-[#066D73] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-[#07858B]/20 transition-all hover:scale-105"
          >
            <span>{t.stage.continueToVideo}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Banner Alert */}
        <div className="p-4 rounded-2xl bg-[#E7F5F5] border border-[#07858B]/25 flex items-start gap-3 text-xs text-[#066D73]">
          <Sparkles className="w-4 h-4 shrink-0 text-[#07858B] mt-0.5" />
          <div>
            <strong className="font-bold">{t.stage.pedagogicalTitle}</strong> {t.stage.pedagogicalText}
          </div>
        </div>

        {/* Questions Deck */}
        <div className="space-y-5">
          {questions.map((q: any, idx: number) => (
            <div
              key={q.id || idx}
              className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8EDF2] shadow-xs space-y-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#F7F9FC]">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-[#F7F9FC] text-[#07858B] text-xs font-bold flex items-center justify-center border border-[#E8EDF2]">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-[#7B8794] uppercase tracking-wider">
                    {q.type?.replace("_", " ")}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-[#07858B] bg-[#E7F5F5] px-2.5 py-0.5 rounded-full capitalize">
                  {q.difficulty}
                </span>
              </div>

              {/* Question Stem */}
              <h3 className="text-base sm:text-lg font-bold text-[#182536] leading-snug">
                {q.stem}
              </h3>

              {/* Diagram / Media Screenshot if available */}
              {q.media_url && (
                <div className="rounded-xl overflow-hidden border border-[#E8EDF2] max-w-md">
                  <img src={q.media_url} alt="Question diagram" className="w-full object-cover" />
                </div>
              )}

              {/* Important Learning Notes */}
              <div className="p-3.5 rounded-xl bg-[#F7F9FC] border border-[#E8EDF2] flex items-start gap-2.5 text-xs text-[#7B8794]">
                <FileText className="w-4 h-4 text-[#07858B] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#182536] font-semibold">{t.stage.reviewFocus}</strong> {q.learning_notes}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Next Action Button */}
        <div className="flex items-center justify-between pt-6 border-t border-[#E8EDF2]">
          <p className="text-xs text-[#7B8794]">
            {t.stage.finishedReviewPrompt} ({questions.length})
          </p>
          <Link
            href={`/quiz/${attemptId}/video`}
            className="flex items-center gap-2.5 bg-[#07858B] hover:bg-[#066D73] text-white px-8 py-3.5 rounded-2xl text-sm font-bold shadow-md shadow-[#07858B]/20 transition-all hover:scale-105"
          >
            <span>{t.stage.proceedStage2}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

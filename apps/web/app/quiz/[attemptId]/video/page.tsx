"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { useLanguage } from "@/src/context/LanguageContext";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/lib/api";
import { Video, ArrowRight, Clock, UserCheck, Sparkles, BookOpen, Lock } from "lucide-react";

export default function Stage2VideoPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const resolvedParams = use(params);
  const attemptId = resolvedParams.attemptId;
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user, isLoading: authLoading } = useAuth();

  const [videoData, setVideoData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    api
      .getStage2Video(attemptId)
      .then((data) => setVideoData(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [attemptId, user, authLoading]);

  if (authLoading || (loading && user)) {
    return (
      <DashboardLayout showRightSidebar={false}>
        <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
          <div className="w-10 h-10 border-4 border-[#07858B] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-[#7B8794]">{t.stage.loadingVideo}</p>
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
            {language === "uz" ? "Hisobga kirish talab qilinadi" : "Sign in to access quiz"}
          </h2>
          <p className="text-xs text-[#7B8794]">
            {language === "uz"
              ? "Ushbu test materiallarini ko'rish uchun avval ro'yxatdan o'tishingiz yoki hisobingizga kirishingiz lozim."
              : "Please register or log in to view quiz educational material."}
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

  const video = videoData?.video;

  return (
    <DashboardLayout showRightSidebar={false}>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Stage Progress Header */}
        <div className="bg-white rounded-2xl p-4 border border-[#E8EDF2] flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#5877D9] text-white font-extrabold text-sm flex items-center justify-center">
              2
            </span>
            <div>
              <h4 className="text-sm font-bold text-[#182536]">{t.stage.stage2Title}</h4>
              <p className="text-xs text-[#7B8794]">{t.stage.stage2Sub} ({videoData?.topic_name})</p>
            </div>
          </div>

          <Link
            href={`/quiz/${attemptId}/play`}
            className="flex items-center gap-2 bg-[#07858B] hover:bg-[#066D73] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-[#07858B]/20 transition-all hover:scale-105"
          >
            <span>{t.stage.proceedStage3}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Video Player Card */}
        <div className="bg-white rounded-3xl overflow-hidden border border-[#E8EDF2] shadow-sm space-y-6 p-6 sm:p-8">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
              <span className="text-xs font-bold text-[#07858B] uppercase tracking-wider flex items-center gap-1.5">
                <Video className="w-4 h-4" /> {t.stage.streamLabel}
              </span>
              <div className="flex items-center gap-3 text-xs text-[#7B8794] font-semibold">
                <span className="flex items-center gap-1 bg-[#F7F9FC] px-2.5 py-1 rounded-full border border-[#E8EDF2]">
                  <Clock className="w-3.5 h-3.5 text-[#FF9B45]" />
                  {t.stage.durationLabel} {video?.duration_formatted || "04:30"}
                </span>
                <span className="flex items-center gap-1 bg-[#F7F9FC] px-2.5 py-1 rounded-full border border-[#E8EDF2]">
                  <UserCheck className="w-3.5 h-3.5 text-[#22A06B]" />
                  {t.stage.channelLabel}
                </span>
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-[#182536] tracking-tight">
              {video?.title || "Mastering Core Concepts"}
            </h2>
          </div>

          {/* Official YouTube Embed Player */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-inner border border-[#E8EDF2]">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube-nocookie.com/embed/${video?.youtube_id || "kJQP7kiw5Fk"}?rel=0&modestbranding=1`}
              title={video?.title || "Educational Video"}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Video Overview & Educational Key Takeaways */}
          <div className="p-5 rounded-2xl bg-[#F7F9FC] border border-[#E8EDF2] space-y-2">
            <h4 className="font-bold text-sm text-[#182536] flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#07858B]" />
              {t.stage.conceptTitle}
            </h4>
            <p className="text-xs sm:text-sm text-[#7B8794] leading-relaxed">
              {video?.description || t.stage.conceptDefaultDesc}
            </p>
          </div>
        </div>

        {/* Next Stage Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E8EDF2]">
          <Link
            href={`/quiz/${attemptId}/review`}
            className="text-xs font-semibold text-[#7B8794] hover:text-[#182536]"
          >
            {t.stage.backToReview}
          </Link>

          <Link
            href={`/quiz/${attemptId}/play`}
            className="flex items-center gap-2.5 bg-[#07858B] hover:bg-[#066D73] text-white px-8 py-3.5 rounded-2xl text-sm font-bold shadow-md shadow-[#07858B]/25 hover:scale-105 active:scale-95 transition-all"
          >
            <span>{t.stage.proceedStage3}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

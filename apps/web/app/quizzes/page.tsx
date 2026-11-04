"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { useLanguage } from "@/src/context/LanguageContext";
import { useAuth } from "@/src/context/AuthContext";
import { api } from "@/src/lib/api";
import {
  Code,
  Languages,
  Calculator,
  Palette,
  Globe,
  ArrowRight,
  Layers,
  Sparkles,
  ChevronRight,
  Clock,
  Sliders,
  Check,
  BookOpen,
  Landmark,
  Zap,
  Radio,
  Wifi,
  Lock,
  X,
  ShieldAlert,
} from "lucide-react";

const ICON_MAP: Record<string, any> = {
  Code,
  Languages,
  Calculator,
  Palette,
  Globe,
  BookOpen,
  Landmark,
  Layers,
};

export default function QuizzesCatalogPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user } = useAuth();

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);

  // Synchronized strictly with the active platform language
  const [activeLangFilter, setActiveLangFilter] = useState<string>(language || "uz");

  // Setup options
  const [difficulty, setDifficulty] = useState<string>("adaptive");
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [selectionMode, setSelectionMode] = useState<"random" | "manual">("random");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(15);
  const [useRapidApi, setUseRapidApi] = useState<boolean>(false);
  const [starting, setStarting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Synchronize language filter automatically whenever the user changes the site language
  useEffect(() => {
    if (language) {
      setActiveLangFilter(language);
    }
  }, [language]);

  useEffect(() => {
    loadCategories(activeLangFilter);
  }, [activeLangFilter]);

  const loadCategories = async (lang: string) => {
    try {
      const data = await api.getCategories(lang);
      setCategories(data);
      if (data && data.length > 0) {
        setSelectedCategory(data[0]);
        loadTopics(data[0].id);
      } else {
        setSelectedCategory(null);
        setTopics([]);
      }
    } catch {
      // Fallback
    }
  };

  const loadTopics = async (catId: string) => {
    try {
      const topData = await api.getTopics(catId);
      setTopics(topData);
      if (topData && topData.length > 0) {
        setSelectedTopic(topData[0]);
      } else {
        setSelectedTopic(null);
      }
    } catch {
      setTopics([]);
    }
  };

  const handleSelectCategory = (cat: any) => {
    setSelectedCategory(cat);
    loadTopics(cat.id);
  };

  const handleStartQuiz = async () => {
    if (!selectedCategory || !selectedTopic) return;
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setStarting(true);
    try {
      const res = await api.startQuiz({
        category_id: selectedCategory.id,
        topic_id: selectedTopic.id,
        difficulty,
        question_count: questionCount,
        selection_mode: selectionMode,
        time_limit_minutes: timeLimitMinutes,
        language: activeLangFilter,
        use_rapidapi: useRapidApi,
      });

      // Redirect immediately to Stage 1 Review
      router.push(`/quiz/${res.attempt_id}/review`);
    } catch (err: any) {
      alert(`${t.quizzes.errorStart} ${err.message || "Unknown error"}`);
    } finally {
      setStarting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8EDF2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F5F5] text-[#07858B] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-[#F5B83D]" />
              <span>{t.quizzes.engineBadge}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#182536] tracking-tight">
              {t.quizzes.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#7B8794] max-w-xl">
              {t.quizzes.subtitle}
            </p>
          </div>

          {/* RapidAPI Live Provider Badge / Switch */}
          <div className="bg-[#F7F9FC] border border-[#E8EDF2] rounded-2xl p-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${useRapidApi ? "bg-[#07858B] text-white" : "bg-white text-[#7B8794]"}`}>
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#182536]">{t.quizzes.rapidApiTitle}</p>
                <p className="text-[11px] text-[#7B8794]">{t.quizzes.rapidApiDesc}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUseRapidApi(!useRapidApi)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                useRapidApi ? "bg-[#07858B]" : "bg-gray-300"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  useRapidApi ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Unauthenticated Alert Banner */}
        {!user && (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-300 shadow-xs">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-[#182536]">
                  {language === "uz"
                    ? "Test ishlash uchun ro'yxatdan o'tish talab qilinadi"
                    : language === "ru"
                    ? "Для прохождения тестов требуется регистрация"
                    : "Registration required to take quizzes"}
                </h3>
                <p className="text-xs text-[#7B8794] max-w-xl">
                  {language === "uz"
                    ? "QUIZORA platformasida testlarni yechish, ballar to'plash va natijalarni saqlash uchun avval hisob yarating yoki tizimga kiring."
                    : "Create an account or log in to take quizzes, earn XP and track your progress."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-xl border border-[#E8EDF2] bg-white text-xs font-bold text-[#182536] hover:bg-[#F7F9FC] transition-colors"
              >
                {language === "uz" ? "Kirish" : language === "ru" ? "Войти" : "Log In"}
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 rounded-xl bg-[#07858B] hover:bg-[#066D73] text-white text-xs font-bold shadow-xs transition-colors"
              >
                {language === "uz" ? "Ro'yxatdan o'tish" : language === "ru" ? "Регистрация" : "Register"}
              </Link>
            </div>
          </div>
        )}

        {/* Language Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-[#7B8794] uppercase tracking-wider mr-2 shrink-0">
            {t.quizzes.filterByLang}
          </span>
          {[
            { id: "all", label: t.quizzes.langFilterAll, flag: "🌐" },
            { id: "uz", label: t.quizzes.langFilterUz, flag: "🇺🇿" },
            { id: "ru", label: t.quizzes.langFilterRu, flag: "🇷🇺" },
            { id: "en", label: t.quizzes.langFilterEn, flag: "🇬🇧" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveLangFilter(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                activeLangFilter === tab.id
                  ? "bg-[#07858B] text-white shadow-md shadow-[#07858B]/20 scale-102"
                  : "bg-white border border-[#E8EDF2] text-[#7B8794] hover:bg-[#F7F9FC] hover:text-[#182536]"
              }`}
            >
              <span className="text-sm">{tab.flag}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Step 1: Select Category */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-[#182536] uppercase tracking-wider flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#07858B] text-white text-xs flex items-center justify-center font-bold">
              1
            </span>
            {t.quizzes.step1}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const isSelected = selectedCategory?.id === cat.id;
              const Icon = ICON_MAP[cat.icon] || Layers;

              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat)}
                  className={`p-5 rounded-2xl border text-left transition-all duration-200 relative ${
                    isSelected
                      ? "bg-[#E7F5F5]/70 border-[#07858B] shadow-md ring-2 ring-[#07858B]/20"
                      : "bg-white border-[#E8EDF2] hover:border-[#07858B]/40 hover:bg-[#F7F9FC]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isSelected ? "bg-[#07858B] text-white" : "bg-[#F7F9FC] text-[#07858B]"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    {cat.language && cat.language !== "all" && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F7F9FC] text-[#7B8794] border border-[#E8EDF2]">
                        {cat.language === "uz" ? "🇺🇿 UZ" : cat.language === "ru" ? "🇷🇺 RU" : "🇬🇧 EN"}
                      </span>
                    )}
                  </div>
                  <h3 className="font-bold text-sm text-[#182536]">{cat.name}</h3>
                  <p className="text-[11px] text-[#7B8794] mt-1 line-clamp-2">{cat.description}</p>
                  <div className="mt-3 pt-2 border-t border-[#E8EDF2]/60 flex items-center justify-between text-[11px] font-semibold text-[#07858B]">
                    <span>{cat.topic_count || 1} {t.quizzes.topicsCount}</span>
                    <span>{cat.total_questions || 5} {t.quizzes.questionsCount}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: Select Topic */}
        {selectedCategory && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-[#182536] uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#07858B] text-white text-xs flex items-center justify-center font-bold">
                2
              </span>
              {t.quizzes.step2} {selectedCategory.name}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topics.map((top) => {
                const isSelected = selectedTopic?.id === top.id;
                return (
                  <button
                    key={top.id}
                    onClick={() => setSelectedTopic(top)}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "bg-[#E7F5F5]/60 border-[#07858B] ring-2 ring-[#07858B]/20 shadow-xs"
                        : "bg-white border-[#E8EDF2] hover:bg-[#F7F9FC]"
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2">
                      <h4 className="font-bold text-sm text-[#182536]">{top.name}</h4>
                      {isSelected && <Check className="w-4 h-4 text-[#07858B]" />}
                    </div>
                    <p className="text-xs text-[#7B8794] line-clamp-2">{top.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Configure Settings & Calibrate */}
        {selectedTopic && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8EDF2] shadow-xs space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-sm font-bold text-[#182536] uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#07858B] text-white text-xs flex items-center justify-center font-bold">
                  3
                </span>
                {t.quizzes.step3}
              </h2>

              {/* Informative adaptive badge */}
              <div className="flex items-center gap-2 text-xs font-semibold text-[#07858B] bg-[#E7F5F5] px-3.5 py-1.5 rounded-full">
                <Zap className="w-3.5 h-3.5 text-[#F5B83D]" />
                <span>{t.quizzes.adaptiveBadgeDesc}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
              {/* Difficulty */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#182536] flex items-center gap-1.5">
                  <span>{t.quizzes.difficulty}</span>
                  <span className="text-[10px] text-[#07858B] font-semibold">(1 - 5)</span>
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl px-3.5 py-2.5 text-sm text-[#182536] font-semibold focus:outline-none focus:border-[#07858B]"
                >
                  <option value="adaptive">{t.quizzes.diffAdaptive}</option>
                  <option value="very_easy">{t.quizzes.diffVeryEasy}</option>
                  <option value="easy">{t.quizzes.diffEasy}</option>
                  <option value="medium">{t.quizzes.diffMedium}</option>
                  <option value="hard">{t.quizzes.diffHard}</option>
                  <option value="very_hard">{t.quizzes.diffVeryHard}</option>
                </select>
                <p className="text-[11px] text-[#7B8794]">
                  {difficulty === "adaptive"
                    ? t.quizzes.adaptiveDiffDesc
                    : t.quizzes.fixedDiffDesc}
                </p>
              </div>

              {/* Question Count (10 to 14) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#182536]">{t.quizzes.questionCount}</label>
                <div className="flex items-center gap-1.5">
                  {[10, 11, 12, 13, 14].map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => setQuestionCount(count)}
                      className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                        questionCount === count
                          ? "bg-[#07858B] text-white border-[#07858B] shadow-xs"
                          : "bg-[#F7F9FC] text-[#7B8794] border-[#E8EDF2] hover:bg-white"
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selection Mode */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#182536]">{t.quizzes.selectionMode}</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectionMode("random")}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      selectionMode === "random"
                        ? "bg-[#E7F5F5] text-[#07858B] border-[#07858B]"
                        : "bg-[#F7F9FC] text-[#7B8794] border-[#E8EDF2]"
                    }`}
                  >
                    {t.quizzes.randomPool}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectionMode("manual")}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                      selectionMode === "manual"
                        ? "bg-[#E7F5F5] text-[#07858B] border-[#07858B]"
                        : "bg-[#F7F9FC] text-[#7B8794] border-[#E8EDF2]"
                    }`}
                  >
                    {t.quizzes.manualSelect}
                  </button>
                </div>
              </div>

              {/* Timer Limit (1 to 30 min) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#182536]">
                  {t.quizzes.timer}: {timeLimitMinutes} {t.quizzes.timerMinutes}
                </label>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  className="w-full accent-[#07858B]"
                />
                <div className="flex justify-between text-[10px] text-[#7B8794]">
                  <span>{t.quizzes.minMinutes}</span>
                  <span>{t.quizzes.defaultMinutes}</span>
                  <span>{t.quizzes.maxMinutes}</span>
                </div>
              </div>
            </div>

            {/* Launch CTA */}
            <div className="pt-4 border-t border-[#E8EDF2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-[#7B8794]">
                {!user
                  ? (language === "uz"
                      ? "⚠️ Diqqat: Testni boshlash uchun avval ro'yxatdan o'ting yoki tizimga kiring."
                      : "⚠️ Please sign up or log in to launch this quiz.")
                  : t.quizzes.stage1Notice}
              </div>
              <button
                onClick={handleStartQuiz}
                disabled={starting}
                className="bg-[#07858B] hover:bg-[#066D73] text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-md shadow-[#07858B]/25 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shrink-0"
              >
                {!user ? (
                  <>
                    <Lock className="w-4 h-4 text-amber-300" />
                    <span>{language === "uz" ? "Ro'yxatdan o'tish & Boshlash" : "Register & Start"}</span>
                  </>
                ) : (
                  <>
                    <span>{starting ? t.quizzes.initializing : t.quizzes.launchBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Modal: Authentication Required */}
        {showAuthModal && (
          <div className="fixed inset-0 z-50 bg-[#182536]/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-[#E8EDF2] animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-start justify-between">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                  <Lock className="w-7 h-7" />
                </div>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="text-[#7B8794] hover:text-[#182536] p-1.5 rounded-xl hover:bg-[#F7F9FC] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-[#182536]">
                  {language === "uz"
                    ? "Test ishlash uchun hisobingizga kiring"
                    : language === "ru"
                    ? "Войдите в аккаунт для прохождения теста"
                    : "Sign in to take quizzes"}
                </h3>
                <p className="text-xs text-[#7B8794] leading-relaxed">
                  {language === "uz"
                    ? "Saytda testlarni ro'yxatdan o'tmasdan bajarish imkoni mavjud emas. Natijalaringiz saqlanib borishi va reyting tangalarini yutib olish uchun avval ro'yxatdan o'ting yoki tizimga kiring."
                    : "Taking quizzes without an account is disabled. Please create an account or log in to track your progress and compete on the leaderboard."}
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  href="/register"
                  className="w-full bg-[#07858B] hover:bg-[#066D73] text-white py-3.5 rounded-2xl font-bold text-xs shadow-md shadow-[#07858B]/20 flex items-center justify-center gap-2 transition-all"
                >
                  <span>{language === "uz" ? "Yangi hisob yaratish (Ro'yxatdan o'tish)" : "Create Account (Register)"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/login"
                  className="w-full bg-white hover:bg-[#F7F9FC] text-[#182536] border border-[#E8EDF2] py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
                >
                  <span>{language === "uz" ? "Hisobga kirish (Login)" : "Sign In (Login)"}</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

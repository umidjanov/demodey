"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/src/context/LanguageContext";
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Video,
  Clock,
  Award,
  CheckCircle2,
  Users,
  Gamepad2,
  Trophy,
  ShieldCheck,
  BrainCircuit,
  Flame,
  ChevronRight,
  HelpCircle,
  Play,
  Coins,
  Globe,
} from "lucide-react";

export default function LandingPage() {
  const { t, language, setLanguage, languages } = useLanguage();

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#182536] flex flex-col font-sans">
      {/* 1. Navigation Bar */}
      <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#E8EDF2] sticky top-0 z-50 px-6 sm:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#066D73] to-[#07858B] flex items-center justify-center text-white shadow-md shadow-[#07858B]/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-[#182536]">QUIZORA</span>
            <span className="block text-[10px] font-bold tracking-wider text-[#07858B] uppercase">
              {language === "uz" ? "O'rgan · Bellash" : language === "ru" ? "Учись · Побеждай" : "Learn · Compete"}
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-[#7B8794]">
          <Link href="#features" className="hover:text-[#07858B] transition-colors">
            {t.landing.navFeatures}
          </Link>
          <Link href="#how-it-works" className="hover:text-[#07858B] transition-colors">
            {t.landing.navHow}
          </Link>
          <Link href="#gamification" className="hover:text-[#07858B] transition-colors">
            {t.landing.navGamification}
          </Link>
          <Link href="#faq" className="hover:text-[#07858B] transition-colors">
            {t.landing.navFaq}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {/* Language Switcher Dropdown / Pills */}
          <div className="flex items-center bg-[#F7F9FC] p-1 rounded-xl border border-[#E8EDF2]">
            {languages.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setLanguage(item.code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                  language === item.code
                    ? "bg-[#07858B] text-white shadow-xs"
                    : "text-[#7B8794] hover:text-[#182536]"
                }`}
              >
                <span className="mr-1">{item.flag}</span>
                <span className="hidden sm:inline uppercase">{item.code}</span>
              </button>
            ))}
          </div>

          <Link
            href="/login"
            className="text-sm font-semibold text-[#182536] hover:text-[#07858B] px-4 py-2 transition-colors"
          >
            {t.landing.login}
          </Link>
          <Link
            href="/register"
            className="bg-[#07858B] hover:bg-[#066D73] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-[#07858B]/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {t.landing.startLearning}
          </Link>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 px-6 sm:px-12 max-w-6xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#E7F5F5] border border-[#07858B]/20 text-[#07858B] text-xs font-bold tracking-wide shadow-xs animate-bounce">
          <Sparkles className="w-4 h-4 text-[#F5B83D]" />
          <span>{t.landing.heroBadge}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#182536] leading-tight">
          {language === "uz" ? (
            <>
              Ko'proq o'rganing. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#07858B] via-[#066D73] to-[#5877D9]">
                O'zingizni sinang.
              </span>{" "}
              Mukammallikka erishing.
            </>
          ) : language === "ru" ? (
            <>
              Узнавай больше. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#07858B] via-[#066D73] to-[#5877D9]">
                Проверяй себя.
              </span>{" "}
              Достигай вершин.
            </>
          ) : (
            <>
              Learn More. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#07858B] via-[#066D73] to-[#5877D9]">
                Test Yourself.
              </span>{" "}
              Become Better.
            </>
          )}
        </h1>

        <p className="max-w-2xl mx-auto text-base sm:text-lg text-[#7B8794] leading-relaxed">
          {t.landing.heroSubtitle}
        </p>

        {/* Hero CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link
            href="/register"
            className="flex items-center gap-2.5 bg-[#07858B] hover:bg-[#066D73] text-white px-8 py-4 rounded-2xl text-base font-bold shadow-lg shadow-[#07858B]/25 hover:scale-105 active:scale-95 transition-all"
          >
            <span>{t.landing.startLearning}</span>
            <ArrowRight className="w-5 h-5" />
          </Link>

          <Link
            href="/quizzes"
            className="flex items-center gap-2.5 bg-white hover:bg-[#F7F9FC] text-[#182536] border border-[#E8EDF2] px-7 py-4 rounded-2xl text-base font-bold shadow-xs hover:scale-105 active:scale-95 transition-all"
          >
            <BookOpen className="w-5 h-5 text-[#07858B]" />
            <span>{t.landing.exploreCatalog}</span>
          </Link>
        </div>

        {/* Floating Metrics Preview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-4xl mx-auto">
          <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs">
            <p className="text-3xl font-extrabold text-[#07858B]">10,000+</p>
            <p className="text-xs font-semibold text-[#7B8794] mt-1">
              {language === "uz" ? "Tanlangan Test Savollari" : language === "ru" ? "Отобранных Вопросов" : "Curated Questions"}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs">
            <p className="text-3xl font-extrabold text-[#F5B83D]">4</p>
            <p className="text-xs font-semibold text-[#7B8794] mt-1">
              {language === "uz" ? "Bosqichli Ta'lim Tizimi" : language === "ru" ? "Этапа Методики" : "Pedagogical Flow"}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs">
            <p className="text-3xl font-extrabold text-[#22A06B]">100%</p>
            <p className="text-xs font-semibold text-[#7B8794] mt-1">
              {language === "uz" ? "Server Antichit Himoyasi" : language === "ru" ? "Серверный Античит" : "Server Anti-Cheat"}
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs">
            <p className="text-3xl font-extrabold text-[#FF9B45]">7+</p>
            <p className="text-xs font-semibold text-[#7B8794] mt-1">
              {language === "uz" ? "Ta'limiy Mini O'yinlar" : language === "ru" ? "Мини-Игр для Мозга" : "Cognitive Drills"}
            </p>
          </div>
        </div>
      </section>

      {/* 3. The 4-Stage Quiz Experience Section */}
      <section id="how-it-works" className="py-20 bg-white border-y border-[#E8EDF2] px-6 sm:px-12">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-bold text-[#07858B] uppercase tracking-widest">
              {language === "uz" ? "Ilmiy Ta'lim Metodologiyasi" : language === "ru" ? "Научный Подход" : "Scientific Learning"}
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-[#182536] tracking-tight">
              {t.landing.howTitle}
            </p>
            <p className="text-sm text-[#7B8794]">
              {t.landing.howDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl bg-[#F7F9FC] border border-[#E8EDF2] space-y-4 relative">
              <span className="w-8 h-8 rounded-full bg-[#07858B] text-white text-xs font-extrabold flex items-center justify-center">
                1
              </span>
              <BookOpen className="w-8 h-8 text-[#07858B]" />
              <h3 className="font-bold text-lg text-[#182536]">
                {language === "uz" ? "1. Savollarni Ko'rib Chiqish" : language === "ru" ? "1. Обзор Вопросов" : "1. Review Questions"}
              </h3>
              <p className="text-xs text-[#7B8794] leading-relaxed">
                {language === "uz"
                  ? "Vaqtli test boshlanishidan oldin savol matnlari va asosiy konspektlar bilan tanishing. Javoblar bu bosqichda yopiq qoladi."
                  : language === "ru"
                  ? "Ознакомьтесь с формулировками вопросов и ключевыми понятиями до включения таймера. Правильные ответы скрыты."
                  : "Preview question stems and essential learning notes before the timer begins. Correct answers remain strictly hidden."}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#F7F9FC] border border-[#E8EDF2] space-y-4 relative">
              <span className="w-8 h-8 rounded-full bg-[#07858B] text-white text-xs font-extrabold flex items-center justify-center">
                2
              </span>
              <Video className="w-8 h-8 text-[#5877D9]" />
              <h3 className="font-bold text-lg text-[#182536]">
                {language === "uz" ? "2. Qisqa Video Dars" : language === "ru" ? "2. Обучающее Видео" : "2. Educational Video"}
              </h3>
              <p className="text-xs text-[#7B8794] leading-relaxed">
                {language === "uz"
                  ? "Mavzuga doir 5 daqiqagacha bo'lgan ta'limiy videoni tomosha qilib, eslab qolish qobiliyatini oshiring."
                  : language === "ru"
                  ? "Посмотрите до 5 минут полезного видеоматериала через YouTube embed для активации памяти."
                  : "Watch a high-yield curated educational video (under 5 minutes) via YouTube embed to refresh key mental models."}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#F7F9FC] border border-[#E8EDF2] space-y-4 relative">
              <span className="w-8 h-8 rounded-full bg-[#07858B] text-white text-xs font-extrabold flex items-center justify-center">
                3
              </span>
              <Clock className="w-8 h-8 text-[#FF9B45]" />
              <h3 className="font-bold text-lg text-[#182536]">
                {language === "uz" ? "3. Haqiqiy Test Sinovi" : language === "ru" ? "3. Тестирование на Время" : "3. Take the Quiz"}
              </h3>
              <p className="text-xs text-[#7B8794] leading-relaxed">
                {language === "uz"
                  ? "Server taymeri va avtosaqlash nazorati ostida 10 dan 14 tagacha savolga diqqat bilan javob bering."
                  : language === "ru"
                  ? "Отвечайте на вопросы с серверным синхронизированным таймером и моментальным автосохранением."
                  : "Answer 10 to 14 questions with server-authoritative synchronized countdown timer and instantaneous autosave."}
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-[#F7F9FC] border border-[#E8EDF2] space-y-4 relative">
              <span className="w-8 h-8 rounded-full bg-[#07858B] text-white text-xs font-extrabold flex items-center justify-center">
                4
              </span>
              <Award className="w-8 h-8 text-[#22A06B]" />
              <h3 className="font-bold text-lg text-[#182536]">
                {language === "uz" ? "4. Natijalar va AI Tahlili" : language === "ru" ? "4. Результаты и AI Разбор" : "4. Results & Analysis"}
              </h3>
              <p className="text-xs text-[#7B8794] leading-relaxed">
                {language === "uz"
                  ? "Har bir savol bo'yicha to'liq tushuntirishlarni oling va AI yordamchisidan xatolaringiz sababini so'rang."
                  : language === "ru"
                  ? "Получите подробные разъяснения по каждому вопросу и используйте AI-ассистента для работы над ошибками."
                  : "Receive comprehensive feedback: why answers are correct, detailed rationales, and one-click 'Ask AI About Mistakes'."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Five Difficulty Levels */}
      <section className="py-20 px-6 sm:px-12 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-xs font-bold text-[#07858B] uppercase tracking-widest">
            {language === "uz" ? "Bosqichma-bosqich O'sish" : language === "ru" ? "Постепенный Рост" : "Progressive Mastery"}
          </h2>
          <p className="text-3xl sm:text-4xl font-extrabold text-[#182536] tracking-tight">
            {language === "uz" ? "5 Xil Qiyinlik Darajasi" : language === "ru" ? "5 Уровней Сложности" : "5 Distinct Difficulty Tiers"}
          </p>
          <p className="text-sm text-[#7B8794]">
            {language === "uz"
              ? "Boshlang'ich o'quvchilardan tortib to murakkab fan olimlarigacha moslashtirilgan savollar tizimi."
              : language === "ru"
              ? "От базовых понятий для новичков до сложнейших синтетических задач для экспертов."
              : "Every subject has granular calibration so beginners start without friction and veterans test deep nuances."}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          {[
            {
              name: language === "uz" ? "Juda Oson" : language === "ru" ? "Очень Легкий" : "Very Easy",
              desc: language === "uz" ? "Asosiy qoidalar va tushunchalar" : language === "ru" ? "Базовые термины и определения" : "Fundamental definitions & flash terms",
              color: "border-emerald-300 bg-emerald-50 text-emerald-800",
            },
            {
              name: language === "uz" ? "Oson" : language === "ru" ? "Легкий" : "Easy",
              desc: language === "uz" ? "Standart masalalar va faktlar" : language === "ru" ? "Стандартные понятия и правила" : "Standard concepts & basic rules",
              color: "border-teal-300 bg-teal-50 text-teal-800",
            },
            {
              name: language === "uz" ? "O'rtacha" : language === "ru" ? "Средний" : "Medium",
              desc: language === "uz" ? "Mantiqiy va ko'p bosqichli masalalar" : language === "ru" ? "Прикладная логика и задачи" : "Applied logic & multi-step problems",
              color: "border-blue-300 bg-blue-50 text-blue-800",
            },
            {
              name: language === "uz" ? "Qiyin" : language === "ru" ? "Сложный" : "Hard",
              desc: language === "uz" ? "Murakkab testlar va chalg'ituvchi savollar" : language === "ru" ? "Нестандартные случаи и ловушки" : "Edge cases & subtle traps",
              color: "border-orange-300 bg-orange-50 text-orange-800",
            },
            {
              name: language === "uz" ? "Juda Qiyin" : language === "ru" ? "Очень Сложный" : "Very Hard",
              desc: language === "uz" ? "Oliy daraja va chuqur tahlil" : language === "ru" ? "Экспертный уровень и синтез" : "Expert deep dives & synthesis",
              color: "border-purple-300 bg-purple-50 text-purple-800",
            },
          ].map((lvl, idx) => (
            <div key={lvl.name} className={`p-5 rounded-2xl border text-center space-y-2 ${lvl.color}`}>
              <span className="text-xs font-extrabold opacity-60">
                {language === "uz" ? `${idx + 1}-Daraja` : language === "ru" ? `Уровень ${idx + 1}` : `Level ${idx + 1}`}
              </span>
              <h4 className="font-bold text-base">{lvl.name}</h4>
              <p className="text-xs opacity-80">{lvl.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Gamification & Tokenomics */}
      <section id="gamification" className="py-20 bg-gradient-to-br from-[#066D73] to-[#07858B] text-white px-6 sm:px-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest text-[#F5B83D]">
              {language === "uz" ? "Shaffof Iqtisodiyot" : language === "ru" ? "Прозрачная Токеномика" : "Transparent Tokenomics"}
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
              {language === "uz"
                ? "Reyting Tangalarini Yuting va Shon-Sharaf Zallarida Yetakchi Bo'ling"
                : language === "ru"
                ? "Зарабатывайте Рейтинговые Монеты и Возглавляйте Зал Славы"
                : "Earn Ranking Coins & Dominate the Hall of Fame"}
            </h2>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed">
              {language === "uz"
                ? "100% natija bilan yakunlangan har bir rasmiy test uchun roppa-rosa +10 Reyting Tangalari taqdim etiladi."
                : language === "ru"
                ? "За 100% идеальное прохождение теста начисляется ровно +10 Рейтинговых Монет."
                : "Achieving 100% on a verified quiz awards exactly +10 Ranking Coins. All transactions strictly tracked."}
            </p>

            <ul className="space-y-3 text-sm text-white/90">
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#22A06B]" />
                {language === "uz"
                  ? "Faqat 100% natija ko'rsatganlarga qat'iy +10 tanga beriladi."
                  : language === "ru"
                  ? "Строго +10 монет только за 100% результат."
                  : "Strict +10 coins rule only for 100% perfect quiz scores."}
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#22A06B]" />
                {language === "uz"
                  ? "XP to'plash orqali Boshlang'ichdan Grand Master darajasigacha ko'tariling."
                  : language === "ru"
                  ? "Повышайте уровень через XP от Новичка до Грандмастера."
                  : "Level up through XP from Beginner to Grand Master."}
              </li>
              <li className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#22A06B]" />
                {language === "uz"
                  ? "Oylik 1-o'rin sohibiga 5-yulduzli 'Dono' badji va +900 bonus tangalar beriladi!"
                  : language === "ru"
                  ? "Чемпион месяца получает 5-звездное достижение 'Мудрец' и +900 монет!"
                  : "Monthly 1st place champion receives the 5-star 'Clever' achievement + 900 bonus coins!"}
              </li>
            </ul>

            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-[#F5B83D] hover:bg-amber-400 text-[#182536] px-6 py-3.5 rounded-2xl font-bold text-sm shadow-lg transition-transform hover:scale-105"
            >
              <Coins className="w-4 h-4 fill-[#182536]" />
              <span>{language === "uz" ? "Yetakchilar Safiga Qo'shiling" : language === "ru" ? "Вступить в Битву" : "Join the Leaderboard"}</span>
            </Link>
          </div>

          <div className="bg-white text-[#182536] rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/20 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8EDF2]">
              <span className="font-bold text-sm text-[#182536] flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#F5B83D]" /> {language === "uz" ? "Mavsum Yetakchilari" : language === "ru" ? "Лидеры Сезона" : "Current Season Leaders"}
              </span>
              <span className="text-xs font-bold text-[#07858B] bg-[#E7F5F5] px-2.5 py-1 rounded-full">
                {language === "uz" ? "Jonli Reyting" : language === "ru" ? "В Реальном Времени" : "Live Podium"}
              </span>
            </div>

            <div className="space-y-3">
              {[
                { rank: 1, name: "Azizbek Rahimov", coins: "1,820 $RC", badge: "🥇 1-O'rin", bg: "bg-amber-50 border-amber-200" },
                { rank: 2, name: "Dilnoza Karimova", coins: "1,410 $RC", badge: "🥈 2-O'rin", bg: "bg-slate-50 border-slate-200" },
                { rank: 3, name: "Javohir Aliyev", coins: "890 $RC", badge: "🥉 3-O'rin", bg: "bg-orange-50 border-orange-200" },
              ].map((leader) => (
                <div
                  key={leader.rank}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between ${leader.bg}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-extrabold">{leader.badge}</span>
                    <span className="text-sm font-bold text-[#182536]">{leader.name}</span>
                  </div>
                  <span className="text-xs font-extrabold text-amber-700">{leader.coins}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section */}
      <section id="faq" className="py-20 px-6 sm:px-12 max-w-4xl mx-auto space-y-10">
        <div className="text-center space-y-3">
          <h2 className="text-xs font-bold text-[#07858B] uppercase tracking-widest">
            {language === "uz" ? "Savollaringiz bormi?" : language === "ru" ? "Есть вопросы?" : "Have Questions?"}
          </h2>
          <p className="text-3xl font-extrabold text-[#182536]">
            {language === "uz" ? "Ko'p Beriladigan Savollar" : language === "ru" ? "Часто Задаваемые Вопросы" : "Frequently Asked Questions"}
          </p>
        </div>

        <div className="space-y-4">
          {[
            {
              q: language === "uz" ? "Reyting tangalari qanday beriladi?" : language === "ru" ? "Как начисляются монеты?" : "How are Ranking Coins awarded?",
              a: language === "uz"
                ? "Siz har safar testni 100% to'g'ri ishlaganingizda roppa-rosa 10 ta Reyting Tangasi ($RC) olasiz. Chala yoki xatoli testlarga tanga berilmaydi."
                : language === "ru"
                ? "Вы получаете ровно 10 монет ($RC) при 100% идеальном результате. За частичные ответы монеты не выдаются."
                : "You receive exactly 10 Ranking Coins ($RC) whenever you complete a quiz with a 100% perfect score.",
            },
            {
              q: language === "uz" ? "AI yordamchi qanday baholaydi?" : language === "ru" ? "Как AI проверяет ответы?" : "How does the AI Assistant evaluate written answers?",
              a: language === "uz"
                ? "Yozma savollarda bizning semantik AI dvigatelimiz matnning ma'nosi va mavzu talablarini chuqur tekshirib, xolis baho beradi."
                : language === "ru"
                ? "Для открытых ответов ИИ сравнивает смысл вашего объяснения с критериями вопроса, оценивая суть, а не точные совпадения слов."
                : "Our semantic AI engine compares your written response against the topic rubric and expected concepts.",
            },
            {
              q: language === "uz" ? "Do'stlar bilan bellashsa bo'ladimi?" : language === "ru" ? "Можно ли соревноваться с друзьями?" : "Can I take quizzes with friends in real-time?",
              a: language === "uz"
                ? "Ha! Jang maydoni orqali xona ochib (masalan, QZ-8821), do'stlaringizni taklif qilib, birgalikda jonli bellashing."
                : language === "ru"
                ? "Да! Создайте комнату с 6-значным кодом (например, QZ-8821), пригласите друзей и соревнуйтесь в реальном времени."
                : "Yes! Use Multiplayer Rooms to create a lobby with a 6-character room code and compete on the live leaderboard.",
            },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-[#E8EDF2] shadow-xs space-y-2">
              <h4 className="font-bold text-sm sm:text-base text-[#182536]">{item.q}</h4>
              <p className="text-xs sm:text-sm text-[#7B8794] leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 7. Footer */}
      <footer className="mt-auto bg-white border-t border-[#E8EDF2] py-12 px-6 sm:px-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#7B8794]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#07858B] flex items-center justify-center text-white font-bold">
              Q
            </div>
            <span className="font-bold text-sm text-[#182536]">QUIZORA</span>
            <span>© 2026 QUIZORA Inc. {language === "uz" ? "Barcha huquqlar himoyalangan." : language === "ru" ? "Все права защищены." : "All rights reserved."}</span>
          </div>

          <div className="flex items-center gap-6 font-semibold">
            <Link href="/how-it-works" className="hover:text-[#07858B] transition-colors">
              {t.nav.howItWorks}
            </Link>
            <Link href="/quizzes" className="hover:text-[#07858B] transition-colors">
              {t.nav.quizzes}
            </Link>
            <Link href="/mini-games" className="hover:text-[#07858B] transition-colors">
              {t.nav.games}
            </Link>
            <Link href="/leaderboard" className="hover:text-[#07858B] transition-colors">
              {t.nav.leaderboard}
            </Link>
            <Link href="/login" className="hover:text-[#07858B] transition-colors">
              {t.landing.login}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

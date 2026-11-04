"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { useLanguage } from "@/src/context/LanguageContext";
import { api } from "@/src/lib/api";
import {
  Gamepad2,
  Trophy,
  ArrowRight,
  Sparkles,
  ArrowLeft,
  Flame,
  Grid,
  Zap,
  CheckCircle2,
  Cpu,
  Type,
  Calculator,
  Compass,
} from "lucide-react";

// Import all 15 mini-games
import { DinoGame } from "@/src/components/games/DinoGame";
import { SnakeGame } from "@/src/components/games/SnakeGame";
import { Game2048 } from "@/src/components/games/Game2048";
import { TicTacToeGame } from "@/src/components/games/TicTacToeGame";
import { MemoryCardGame } from "@/src/components/games/MemoryCardGame";
import { FlappyBirdGame } from "@/src/components/games/FlappyBirdGame";
import { BrickBreakerGame } from "@/src/components/games/BrickBreakerGame";
import { CarRacingGame } from "@/src/components/games/CarRacingGame";
import { WhackAMoleGame } from "@/src/components/games/WhackAMoleGame";
import { RockPaperScissorsGame } from "@/src/components/games/RockPaperScissorsGame";
import { MathChallengeGame } from "@/src/components/games/MathChallengeGame";
import { WordPuzzleGame } from "@/src/components/games/WordPuzzleGame";
import { TrueFalseGame } from "@/src/components/games/TrueFalseGame";
import { ColorMatchGame } from "@/src/components/games/ColorMatchGame";
import { TypingSpeedGame } from "@/src/components/games/TypingSpeedGame";

export interface GameMeta {
  id: string;
  slug: string;
  nameKey: keyof typeof nameMap;
  descKey: keyof typeof descMap;
  icon: string;
  category: "arcade" | "classic" | "brain";
  difficulty: "easy" | "medium" | "hard";
  gradient: string;
}

const nameMap = {
  dinoRun: "Dino Run",
  snakeGame: "Snake Game",
  game2048: "2048",
  ticTacToe: "Tic Tac Toe",
  memoryCard: "Memory Card",
  flappyBird: "Flappy Bird",
  brickBreaker: "Brick Breaker",
  carRacing: "Car Racing",
  whackAMole: "Whack-a-Mole",
  rockPaperScissors: "Rock Paper Scissors",
  mathChallenge: "Math Challenge",
  wordPuzzle: "Word Puzzle",
  trueFalse: "True or False",
  colorMatch: "Color Match",
  typingSpeed: "Typing Speed",
};

const descMap = {
  dinoRunDesc: "",
  snakeGameDesc: "",
  game2048Desc: "",
  ticTacToeDesc: "",
  memoryCardDesc: "",
  flappyBirdDesc: "",
  brickBreakerDesc: "",
  carRacingDesc: "",
  whackAMoleDesc: "",
  rockPaperScissorsDesc: "",
  mathChallengeDesc: "",
  wordPuzzleDesc: "",
  trueFalseDesc: "",
  colorMatchDesc: "",
  typingSpeedDesc: "",
};

const GAMES_LIST: GameMeta[] = [
  {
    id: "1",
    slug: "dino-run",
    nameKey: "dinoRun",
    descKey: "dinoRunDesc",
    icon: "🦖",
    category: "arcade",
    difficulty: "easy",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: "2",
    slug: "snake",
    nameKey: "snakeGame",
    descKey: "snakeGameDesc",
    icon: "🐍",
    category: "classic",
    difficulty: "easy",
    gradient: "from-green-500 to-emerald-700",
  },
  {
    id: "3",
    slug: "2048",
    nameKey: "game2048",
    descKey: "game2048Desc",
    icon: "🔢",
    category: "classic",
    difficulty: "easy",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    id: "4",
    slug: "tic-tac-toe",
    nameKey: "ticTacToe",
    descKey: "ticTacToeDesc",
    icon: "⭕",
    category: "classic",
    difficulty: "easy",
    gradient: "from-cyan-500 to-blue-600",
  },
  {
    id: "5",
    slug: "memory-card",
    nameKey: "memoryCard",
    descKey: "memoryCardDesc",
    icon: "🧠",
    category: "brain",
    difficulty: "easy",
    gradient: "from-purple-500 to-indigo-600",
  },
  {
    id: "6",
    slug: "flappy-bird",
    nameKey: "flappyBird",
    descKey: "flappyBirdDesc",
    icon: "🐦",
    category: "arcade",
    difficulty: "medium",
    gradient: "from-sky-400 to-teal-500",
  },
  {
    id: "7",
    slug: "brick-breaker",
    nameKey: "brickBreaker",
    descKey: "brickBreakerDesc",
    icon: "🧱",
    category: "arcade",
    difficulty: "medium",
    gradient: "from-rose-500 to-pink-600",
  },
  {
    id: "8",
    slug: "car-racing",
    nameKey: "carRacing",
    descKey: "carRacingDesc",
    icon: "🏎️",
    category: "arcade",
    difficulty: "medium",
    gradient: "from-red-500 to-amber-600",
  },
  {
    id: "9",
    slug: "whack-a-mole",
    nameKey: "whackAMole",
    descKey: "whackAMoleDesc",
    icon: "🔨",
    category: "arcade",
    difficulty: "easy",
    gradient: "from-amber-600 to-yellow-600",
  },
  {
    id: "10",
    slug: "rock-paper-scissors",
    nameKey: "rockPaperScissors",
    descKey: "rockPaperScissorsDesc",
    icon: "✌️",
    category: "classic",
    difficulty: "easy",
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    id: "11",
    slug: "math-challenge",
    nameKey: "mathChallenge",
    descKey: "mathChallengeDesc",
    icon: "📐",
    category: "brain",
    difficulty: "medium",
    gradient: "from-pink-500 to-rose-600",
  },
  {
    id: "12",
    slug: "word-puzzle",
    nameKey: "wordPuzzle",
    descKey: "wordPuzzleDesc",
    icon: "📝",
    category: "brain",
    difficulty: "medium",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    id: "13",
    slug: "true-or-false",
    nameKey: "trueFalse",
    descKey: "trueFalseDesc",
    icon: "✅",
    category: "brain",
    difficulty: "easy",
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    id: "14",
    slug: "color-match",
    nameKey: "colorMatch",
    descKey: "colorMatchDesc",
    icon: "🎨",
    category: "brain",
    difficulty: "medium",
    gradient: "from-violet-500 to-fuchsia-600",
  },
  {
    id: "15",
    slug: "typing-speed",
    nameKey: "typingSpeed",
    descKey: "typingSpeedDesc",
    icon: "⌨️",
    category: "brain",
    difficulty: "hard",
    gradient: "from-teal-500 to-emerald-600",
  },
];

function MiniGamesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawParam = searchParams.get("game");
  const { t, language } = useLanguage();

  // Normalize aliases (e.g. memory-cards -> memory-card)
  const normalizedSlug = rawParam === "memory-cards" ? "memory-card" : rawParam;

  const [activeSlug, setActiveSlug] = useState<string | null>(normalizedSlug || null);
  const [activeTab, setActiveTab] = useState<"all" | "arcade" | "classic" | "brain">("all");

  useEffect(() => {
    if (normalizedSlug) {
      setActiveSlug(normalizedSlug);
    }
  }, [normalizedSlug]);

  const selectGame = (slug: string) => {
    setActiveSlug(slug);
    router.push(`/mini-games?game=${slug}`, { scroll: false });
  };

  const backToCatalog = () => {
    setActiveSlug(null);
    router.push("/mini-games", { scroll: false });
  };

  const handleGameOver = async (score: number) => {
    if (activeSlug && score > 0) {
      try {
        await api.submitGameScore({
          game_slug: activeSlug,
          score,
          duration_seconds: 30,
        });
      } catch {}
    }
  };

  const filteredGames =
    activeTab === "all"
      ? GAMES_LIST
      : GAMES_LIST.filter((g) => g.category === activeTab);

  const activeGameMeta = GAMES_LIST.find((g) => g.slug === activeSlug);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8EDF2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 border border-pink-200 text-[#ED4B9B] text-xs font-bold">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>15 {t.games.title}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#182536] tracking-tight">
            {t.games.title}
          </h1>
          <p className="text-xs sm:text-sm text-[#7B8794]">
            {t.games.subtitle}
          </p>
        </div>

        {activeSlug && (
          <button
            onClick={backToCatalog}
            className="self-start sm:self-auto bg-[#F7F9FC] hover:bg-[#E7F5F5] text-[#07858B] border border-[#E8EDF2] px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-2xs hover:scale-102"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.games.backToCatalog}</span>
          </button>
        )}
      </div>

      {/* If a game is active, show the Active Arena */}
      {activeSlug && (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#E8EDF2] shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#F7F9FC]">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{activeGameMeta?.icon}</span>
              <div>
                <h2 className="text-xl font-extrabold text-[#182536]">
                  {activeGameMeta ? t.games[activeGameMeta.nameKey] : "Game"}
                </h2>
                <p className="text-xs text-[#7B8794]">
                  {activeGameMeta ? t.games[activeGameMeta.descKey] : ""}
                </p>
              </div>
            </div>

            <button
              onClick={backToCatalog}
              className="text-xs font-bold text-[#7B8794] hover:text-[#07858B] hover:underline"
            >
              {t.games.backToCatalog}
            </button>
          </div>

          {/* Game Component Render */}
          <div className="py-2">
            {activeSlug === "dino-run" && (
              <DinoGame onGameOver={handleGameOver} lang={language} />
            )}
            {activeSlug === "snake" && (
              <SnakeGame onGameOver={handleGameOver} lang={language} />
            )}
            {activeSlug === "2048" && (
              <Game2048 onGameOver={handleGameOver} lang={language} />
            )}
            {activeSlug === "tic-tac-toe" && (
              <TicTacToeGame onGameOver={handleGameOver} lang={language} />
            )}
            {activeSlug === "memory-card" && (
              <MemoryCardGame onGameOver={handleGameOver} lang={language} />
            )}
            {activeSlug === "flappy-bird" && (
              <FlappyBirdGame onGameOver={handleGameOver} lang={language} />
            )}
            {activeSlug === "brick-breaker" && (
              <BrickBreakerGame onGameOver={handleGameOver} lang={language} />
            )}
            {activeSlug === "car-racing" && (
              <CarRacingGame onGameOver={handleGameOver} lang={language} />
            )}
            {activeSlug === "whack-a-mole" && (
              <WhackAMoleGame onGameOver={handleGameOver} lang={language} />
            )}
            {activeSlug === "rock-paper-scissors" && (
              <RockPaperScissorsGame onGameOver={handleGameOver} lang={language} />
            )}
            {activeSlug === "math-challenge" && (
              <MathChallengeGame onGameOver={handleGameOver} lang={language} />
            )}
            {activeSlug === "word-puzzle" && (
              <WordPuzzleGame onGameOver={handleGameOver} lang={language} />
            )}
            {activeSlug === "true-or-false" && (
              <TrueFalseGame onGameOver={handleGameOver} lang={language} />
            )}
            {activeSlug === "color-match" && (
              <ColorMatchGame onGameOver={handleGameOver} lang={language} />
            )}
            {activeSlug === "typing-speed" && (
              <TypingSpeedGame onGameOver={handleGameOver} lang={language} />
            )}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: "all", name: t.games.categoriesAll, count: 15 },
              { id: "arcade", name: t.games.categoriesArcade, count: 5 },
              { id: "classic", name: t.games.categoriesClassic || t.games.categoriesPuzzle, count: 4 },
              { id: "brain", name: t.games.categoriesBrain, count: 6 },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all border shrink-0 ${
                    isActive
                      ? "bg-[#07858B] text-white border-[#07858B] shadow-xs"
                      : "bg-white text-[#7B8794] border-[#E8EDF2] hover:bg-[#F7F9FC]"
                  }`}
                >
                  <span>{tab.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      isActive ? "bg-white/20 text-white" : "bg-gray-100 text-[#7B8794]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <span className="text-xs font-semibold text-[#7B8794]">
            {filteredGames.length} {t.games.title.toLowerCase()}
          </span>
        </div>

        {/* 15 Games Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGames.map((game, idx) => {
            const isSelected = activeSlug === game.slug;
            const title = t.games[game.nameKey];
            const desc = t.games[game.descKey];

            return (
              <div
                key={game.slug}
                onClick={() => selectGame(game.slug)}
                className={`group relative overflow-hidden rounded-3xl p-6 bg-white border-2 cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col justify-between min-h-[190px] ${
                  isSelected
                    ? "border-[#07858B] shadow-md ring-2 ring-[#07858B]/20"
                    : "border-[#E8EDF2]"
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${game.gradient} text-white flex items-center justify-center text-2xl shadow-sm group-hover:scale-105 transition-transform`}
                  >
                    {game.icon}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-[#F7F9FC] text-[#7B8794] border border-[#E8EDF2]">
                      #{idx + 1}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                        game.difficulty === "easy"
                          ? "bg-emerald-50 text-[#22A06B]"
                          : game.difficulty === "medium"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-rose-50 text-[#E05252]"
                      }`}
                    >
                      {game.difficulty === "easy"
                        ? t.games.diffEasy
                        : game.difficulty === "medium"
                        ? t.games.diffMedium
                        : t.games.diffHard}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-1.5 my-3">
                  <h3 className="font-extrabold text-base text-[#182536] group-hover:text-[#07858B] transition-colors flex items-center justify-between">
                    <span>{title}</span>
                  </h3>
                  <p className="text-xs text-[#7B8794] line-clamp-2 leading-relaxed">
                    {desc}
                  </p>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-[#F7F9FC] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#07858B] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    {isSelected
                      ? language === "uz"
                        ? "O'ynalmoqda"
                        : "Playing"
                      : t.games.startBtn}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function MiniGamesPage() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8 text-center text-[#7B8794]">Yuklanmoqda...</div>}>
        <MiniGamesContent />
      </Suspense>
    </DashboardLayout>
  );
}

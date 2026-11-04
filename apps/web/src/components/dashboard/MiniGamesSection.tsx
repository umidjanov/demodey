"use client";

import React from "react";
import Link from "next/link";
import {
  Gamepad2,
  ArrowRight,
  Type,
  BookMarked,
  Grid,
  Calculator,
  CheckCircle2,
  Languages,
  Cpu,
} from "lucide-react";

const GAMES = [
  {
    slug: "word-puzzle",
    title: "Word Puzzle",
    subtitle: "Unscramble Letters",
    gradient: "from-amber-400 via-orange-500 to-amber-600",
    icon: Type,
    plays: "1.4k plays",
  },
  {
    slug: "math-challenge",
    title: "Math Challenge",
    subtitle: "Speed Arithmetic",
    gradient: "from-pink-500 via-rose-500 to-red-500",
    icon: Calculator,
    plays: "1.8k plays",
  },
  {
    slug: "memory-cards",
    title: "Memory Cards",
    subtitle: "Code & Concepts",
    gradient: "from-purple-500 via-indigo-600 to-blue-600",
    icon: Grid,
    plays: "3.4k plays",
  },
  {
    slug: "true-or-false",
    title: "True or False",
    subtitle: "Lightning Trivia",
    gradient: "from-cyan-500 via-teal-500 to-emerald-600",
    icon: CheckCircle2,
    plays: "4.2k plays",
  },
];

import { useLanguage } from "@/src/context/LanguageContext";

export function MiniGamesSection() {
  const { t } = useLanguage();

  const games = [
    {
      slug: "dino-run",
      title: t.games.dinoRun,
      subtitle: t.games.dinoRunDesc,
      gradient: "from-emerald-500 via-teal-600 to-cyan-600",
      icon: "🦖",
      plays: `5.2k ${t.miniGames.playsCount}`,
    },
    {
      slug: "snake",
      title: t.games.snakeGame,
      subtitle: t.games.snakeGameDesc,
      gradient: "from-green-500 via-emerald-600 to-teal-700",
      icon: "🐍",
      plays: `6.4k ${t.miniGames.playsCount}`,
    },
    {
      slug: "2048",
      title: t.games.game2048,
      subtitle: t.games.game2048Desc,
      gradient: "from-amber-400 via-orange-500 to-amber-600",
      icon: "🔢",
      plays: `8.9k ${t.miniGames.playsCount}`,
    },
    {
      slug: "tic-tac-toe",
      title: t.games.ticTacToe,
      subtitle: t.games.ticTacToeDesc,
      gradient: "from-cyan-500 via-blue-600 to-indigo-600",
      icon: "⭕",
      plays: `4.8k ${t.miniGames.playsCount}`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-[#182536] flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-[#07858B]" />
            <span>{t.miniGames.title}</span>
            <span className="text-[11px] font-bold text-[#07858B] bg-[#E7F5F5] px-2 py-0.5 rounded-full">
              15 {t.games.title.toLowerCase()}
            </span>
          </h3>
          <p className="text-xs text-[#7B8794]">{t.miniGames.subtitle}</p>
        </div>
        <Link
          href="/mini-games"
          className="text-xs font-semibold text-[#07858B] hover:underline flex items-center gap-1"
        >
          {t.miniGames.viewAll} (15) <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {games.map((game) => {
          return (
            <Link
              key={game.slug}
              href={`/mini-games?game=${game.slug}`}
              className="group relative overflow-hidden rounded-2xl p-5 text-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient}`} />
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />

              <div className="relative z-10 flex flex-col justify-between h-32">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-xs text-xl">
                    {game.icon}
                  </div>
                  <span className="text-[10px] font-bold bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-full uppercase tracking-wider">
                    {game.plays}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-base tracking-tight">{game.title}</h4>
                  <p className="text-xs text-white/80 font-medium line-clamp-1">{game.subtitle}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

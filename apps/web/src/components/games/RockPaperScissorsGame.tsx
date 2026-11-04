"use client";

import React, { useState } from "react";
import { RotateCcw, Trophy, Sparkles, Flame } from "lucide-react";
import confetti from "canvas-confetti";

interface RPSProps {
  onGameOver?: (score: number) => void;
  lang: string;
}

type Choice = "rock" | "paper" | "scissors";

const CHOICES: { id: Choice; emoji: string; uz: string; ru: string; en: string }[] = [
  { id: "rock", emoji: "🪨", uz: "Tosh", ru: "Камень", en: "Rock" },
  { id: "paper", emoji: "📄", uz: "Qog'oz", ru: "Бумага", en: "Paper" },
  { id: "scissors", emoji: "✂️", uz: "Qaychi", ru: "Ножницы", en: "Scissors" },
];

export function RockPaperScissorsGame({ onGameOver, lang }: RPSProps) {
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [aiChoice, setAiChoice] = useState<Choice | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<"win" | "lose" | "draw" | null>(null);
  const [stats, setStats] = useState({ wins: 0, losses: 0, draws: 0, streak: 0 });

  const playRound = (choice: Choice) => {
    if (isRolling) return;
    setPlayerChoice(choice);
    setIsRolling(true);
    setResult(null);

    // Roll animation
    let rollCount = 0;
    const interval = setInterval(() => {
      setAiChoice(CHOICES[Math.floor(Math.random() * CHOICES.length)].id);
      rollCount++;
      if (rollCount > 8) {
        clearInterval(interval);
        // Final AI pick
        const finalAi = CHOICES[Math.floor(Math.random() * CHOICES.length)].id;
        setAiChoice(finalAi);
        setIsRolling(false);
        determineOutcome(choice, finalAi);
      }
    }, 100);
  };

  const determineOutcome = (p: Choice, ai: Choice) => {
    if (p === ai) {
      setResult("draw");
      setStats((s) => ({ ...s, draws: s.draws + 1, streak: 0 }));
    } else if (
      (p === "rock" && ai === "scissors") ||
      (p === "scissors" && ai === "paper") ||
      (p === "paper" && ai === "rock")
    ) {
      setResult("win");
      setStats((s) => {
        const nextStreak = s.streak + 1;
        if (nextStreak % 3 === 0) confetti({ particleCount: 70, spread: 60 });
        if (onGameOver) onGameOver((s.wins + 1) * 20);
        return { ...s, wins: s.wins + 1, streak: nextStreak };
      });
    } else {
      setResult("lose");
      setStats((s) => ({ ...s, losses: s.losses + 1, streak: 0 }));
    }
  };

  const resetAll = () => {
    setPlayerChoice(null);
    setAiChoice(null);
    setResult(null);
    setIsRolling(false);
    setStats({ wins: 0, losses: 0, draws: 0, streak: 0 });
  };

  const getChoiceLabel = (c: Choice | null) => {
    if (!c) return "—";
    const item = CHOICES.find((x) => x.id === c);
    return lang === "uz" ? item?.uz : lang === "ru" ? item?.ru : item?.en;
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-5 select-none">
      {/* Top Bar Info */}
      <div className="flex items-center justify-between w-full max-w-[360px] px-4 py-2.5 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF2] text-xs font-bold text-[#182536]">
        <div className="flex items-center gap-1.5 text-amber-600">
          <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
          <span>{lang === "uz" ? "Ketma-ket g'alaba" : "Streak"}: {stats.streak}</span>
        </div>
        <button
          onClick={resetAll}
          className="p-1.5 rounded-xl bg-white border border-[#E8EDF2] hover:bg-gray-100 shadow-2xs"
          title={lang === "uz" ? "Qayta boshlash" : "Reset"}
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#7B8794]" />
        </button>
      </div>

      {/* Duel Arena Card */}
      <div className="p-6 bg-white border-2 border-[#E8EDF2] rounded-3xl shadow-lg w-[360px] space-y-6 text-center">
        {/* Opponents showdown */}
        <div className="flex items-center justify-around py-3">
          {/* Player Choice */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#7B8794] uppercase tracking-wider block">
              {lang === "uz" ? "Siz" : "You"}
            </span>
            <div className="w-20 h-20 rounded-2xl bg-[#E7F5F5] border-2 border-[#07858B] flex items-center justify-center text-4xl shadow-sm">
              {playerChoice ? CHOICES.find((c) => c.id === playerChoice)?.emoji : "❓"}
            </div>
            <span className="text-xs font-extrabold text-[#07858B]">{getChoiceLabel(playerChoice)}</span>
          </div>

          <span className="text-xl font-black text-[#7B8794]">VS</span>

          {/* AI Choice */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#7B8794] uppercase tracking-wider block">
              AI Bot
            </span>
            <div className="w-20 h-20 rounded-2xl bg-orange-50 border-2 border-[#FF9B45] flex items-center justify-center text-4xl shadow-sm">
              {aiChoice ? CHOICES.find((c) => c.id === aiChoice)?.emoji : "🤖"}
            </div>
            <span className="text-xs font-extrabold text-[#FF9B45]">
              {isRolling ? "..." : getChoiceLabel(aiChoice)}
            </span>
          </div>
        </div>

        {/* Outcome Result Message */}
        <div className="h-10 flex items-center justify-center">
          {result === "win" && (
            <span className="px-4 py-1.5 rounded-full bg-[#E7F5F5] text-[#22A06B] font-extrabold text-sm border border-[#22A06B]/30 flex items-center gap-1.5 animate-pulse">
              <Sparkles className="w-4 h-4" />
              {lang === "uz" ? "G'ALABA QOZONDINGIZ! 🎉" : "YOU WON! 🎉"}
            </span>
          )}
          {result === "lose" && (
            <span className="px-4 py-1.5 rounded-full bg-rose-50 text-[#E05252] font-extrabold text-sm border border-[#E05252]/30">
              {lang === "uz" ? "AI BOT G'ALABA QOZONDI!" : "AI BOT WON!"}
            </span>
          )}
          {result === "draw" && (
            <span className="px-4 py-1.5 rounded-full bg-gray-100 text-[#7B8794] font-extrabold text-sm border border-gray-200">
              {lang === "uz" ? "DURANG! QAYTADAN TANLANG." : "DRAW! TRY AGAIN."}
            </span>
          )}
          {!result && (
            <span className="text-xs font-semibold text-[#7B8794]">
              {lang === "uz" ? "Quyidagi variantlardan birini tanlang:" : "Choose your weapon:"}
            </span>
          )}
        </div>

        {/* Choice Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          {CHOICES.map((item) => (
            <button
              key={item.id}
              onClick={() => playRound(item.id)}
              disabled={isRolling}
              className="p-3.5 rounded-2xl bg-[#F7F9FC] border border-[#E8EDF2] hover:bg-[#E7F5F5] hover:border-[#07858B] active:scale-95 transition-all flex flex-col items-center gap-1.5 group shadow-xs"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">{item.emoji}</span>
              <span className="text-xs font-extrabold text-[#182536]">
                {lang === "uz" ? item.uz : lang === "ru" ? item.ru : item.en}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Score Summary */}
      <div className="flex items-center gap-3 text-xs font-bold text-[#7B8794]">
        <div className="px-3 py-1.5 rounded-xl bg-white border border-[#E8EDF2]">
          {lang === "uz" ? "G'alaba" : "Wins"}: <strong className="text-[#22A06B]">{stats.wins}</strong>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-white border border-[#E8EDF2]">
          {lang === "uz" ? "Durang" : "Draws"}: <strong className="text-[#182536]">{stats.draws}</strong>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-white border border-[#E8EDF2]">
          {lang === "uz" ? "Mag'lubiyat" : "Losses"}: <strong className="text-[#E05252]">{stats.losses}</strong>
        </div>
      </div>
    </div>
  );
}

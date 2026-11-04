"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Trophy, Clock, Check, X, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface ColorMatchProps {
  onGameOver?: (score: number) => void;
  lang: string;
}

const COLORS = [
  { nameUz: "QIZIL", nameRu: "КРАСНЫЙ", nameEn: "RED", hex: "#E05252" },
  { nameUz: "KO'K", nameRu: "СИНИЙ", nameEn: "BLUE", hex: "#3B82F6" },
  { nameUz: "YASHIL", nameRu: "ЗЕЛЕНЫЙ", nameEn: "GREEN", hex: "#22A06B" },
  { nameUz: "SARIQ", nameRu: "ЖЕЛТЫЙ", nameEn: "YELLOW", hex: "#F59E0B" },
  { nameUz: "BINAFSHA", nameRu: "ФИОЛЕТОВЫЙ", nameEn: "PURPLE", hex: "#8B5CF6" },
];

export function ColorMatchGame({ onGameOver, lang }: ColorMatchProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [highScore, setHighScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [currentColorIdx, setCurrentColorIdx] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("colormatch_highscore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const nextRound = () => {
    const wordIdx = Math.floor(Math.random() * COLORS.length);
    // 50% chance match, 50% mismatch
    const isMatch = Math.random() < 0.5;
    const colorIdx = isMatch ? wordIdx : (wordIdx + 1 + Math.floor(Math.random() * (COLORS.length - 1))) % COLORS.length;

    setCurrentWordIdx(wordIdx);
    setCurrentColorIdx(colorIdx);
  };

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setStreak(0);
    setIsGameOver(false);
    setIsPlaying(true);
    nextRound();
  };

  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setIsGameOver(true);
          setIsPlaying(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isGameOver]);

  useEffect(() => {
    if (isGameOver) {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("colormatch_highscore", score.toString());
        confetti({ particleCount: 70, spread: 60 });
      }
      if (onGameOver) onGameOver(score);
    }
  }, [isGameOver, score, highScore, onGameOver]);

  const handleChoice = (playerThinksMatches: boolean) => {
    if (!isPlaying || isGameOver) return;
    const actuallyMatches = currentWordIdx === currentColorIdx;

    if (playerThinksMatches === actuallyMatches) {
      const bonus = streak >= 4 ? 20 : 10;
      setScore((s) => s + bonus);
      setStreak((st) => st + 1);
    } else {
      setStreak(0);
      setScore((s) => Math.max(0, s - 5));
    }
    nextRound();
  };

  const wordName =
    lang === "uz"
      ? COLORS[currentWordIdx]?.nameUz
      : lang === "ru"
      ? COLORS[currentWordIdx]?.nameRu
      : COLORS[currentWordIdx]?.nameEn;

  const fontColor = COLORS[currentColorIdx]?.hex;

  return (
    <div className="flex flex-col items-center justify-center space-y-4 select-none">
      {/* Top Bar Info */}
      <div className="flex items-center justify-between w-full max-w-[360px] px-4 py-2 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF2] text-xs font-bold text-[#182536]">
        <div className="flex items-center gap-1.5 text-[#FF9B45]">
          <Clock className="w-3.5 h-3.5" />
          <span>{timeLeft}s</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1 text-amber-600">
            <Trophy className="w-3.5 h-3.5" />
            {lang === "uz" ? "Rekord" : "HI"}: {highScore}
          </span>
          <span className="text-sm font-extrabold text-[#07858B]">{score}</span>
        </div>
      </div>

      {/* Main Game Card */}
      <div className="relative p-8 bg-white border-2 border-[#E8EDF2] rounded-3xl shadow-lg w-[360px] min-h-[340px] flex flex-col justify-between items-center text-center">
        {(!isPlaying || isGameOver) && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center gap-3 p-6 z-20">
            {isGameOver ? (
              <>
                <Trophy className="w-12 h-12 text-amber-500" />
                <h3 className="text-2xl font-black text-[#182536]">{lang === "uz" ? "VAQT TUGADI!" : "TIME'S UP!"}</h3>
                <p className="text-sm font-bold text-[#7B8794]">
                  {lang === "uz" ? "To'plangan ball:" : "Final Score:"} <strong className="text-[#07858B] text-lg">{score}</strong>
                </p>
                <button
                  onClick={startGame}
                  className="mt-2 bg-[#07858B] hover:bg-[#066D73] text-white px-6 py-2.5 rounded-2xl font-bold text-xs shadow-md flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  {lang === "uz" ? "Qaytadan O'ynash" : "Play Again"}
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-[#07858B] flex items-center justify-center shadow-lg shadow-[#07858B]/30 text-white">
                  <Play className="w-7 h-7 fill-white ml-0.5" />
                </div>
                <h3 className="text-xl font-extrabold text-[#182536]">Color Match</h3>
                <p className="text-xs text-[#7B8794] max-w-xs text-center font-medium">
                  {lang === "uz"
                    ? "So'zning ma'nosi va uning shrift rangi bir-biriga mos keladimi? Diqqat bilan tez tanlang!"
                    : "Does the word match the font ink color? React as fast as possible!"}
                </p>
                <button
                  onClick={startGame}
                  className="bg-[#07858B] hover:bg-[#066D73] text-white px-6 py-2.5 rounded-2xl font-bold text-xs shadow-md hover:scale-105 transition-all"
                >
                  {lang === "uz" ? "Boshlash" : "Start Game"}
                </button>
              </>
            )}
          </div>
        )}

        <div className="space-y-1">
          <span className="text-[11px] font-bold text-[#7B8794] uppercase tracking-wider block">
            {lang === "uz" ? "Rang va so'z mos keladimi?" : "Does meaning match font color?"}
          </span>
          {streak >= 3 && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" /> {streak}x Streak!
            </span>
          )}
        </div>

        {/* Word with Font Color */}
        <div className="my-6">
          <span
            className="text-4xl sm:text-5xl font-black tracking-wider transition-all duration-150 drop-shadow-xs"
            style={{ color: fontColor }}
          >
            {wordName}
          </span>
        </div>

        {/* Action Buttons: YES / NO */}
        <div className="grid grid-cols-2 gap-4 w-full">
          <button
            onClick={() => handleChoice(true)}
            className="p-4 rounded-2xl bg-[#22A06B] hover:bg-[#1C8256] active:scale-95 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>{lang === "uz" ? "HA (MOS)" : "YES (MATCH)"}</span>
          </button>
          <button
            onClick={() => handleChoice(false)}
            className="p-4 rounded-2xl bg-[#E05252] hover:bg-[#C93B3B] active:scale-95 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <X className="w-5 h-5 stroke-[3]" />
            <span>{lang === "uz" ? "YO'Q (EMAS)" : "NO (DIFF)"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Trophy, Clock, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface WhackAMoleProps {
  onGameOver?: (score: number) => void;
  lang: string;
}

export function WhackAMoleGame({ onGameOver, lang }: WhackAMoleProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [activeMole, setActiveMole] = useState<number | null>(null);
  const [whackedMole, setWhackedMole] = useState<number | null>(null);
  const [highScore, setHighScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const moleTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("mole_highscore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setStreak(0);
    setIsGameOver(false);
    setIsPlaying(true);
    setActiveMole(null);
    setWhackedMole(null);
  };

  // Main countdown timer
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          clearInterval(moleTimerRef.current!);
          setIsGameOver(true);
          setIsPlaying(false);
          setActiveMole(null);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isGameOver]);

  // Handle Game Over
  useEffect(() => {
    if (isGameOver) {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("mole_highscore", score.toString());
        confetti({ particleCount: 70, spread: 60 });
      }
      if (onGameOver) onGameOver(score);
    }
  }, [isGameOver, score, highScore, onGameOver]);

  // Random mole pop up
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const popMole = () => {
      const randomHole = Math.floor(Math.random() * 9);
      setActiveMole(randomHole);
      setWhackedMole(null);

      const stayTime = Math.max(550, 950 - Math.floor(score / 50) * 40);
      moleTimerRef.current = setTimeout(() => {
        setActiveMole(null);
        // Small delay before next mole
        moleTimerRef.current = setTimeout(popMole, 200 + Math.random() * 200);
      }, stayTime);
    };

    popMole();

    return () => {
      if (moleTimerRef.current) clearTimeout(moleTimerRef.current);
    };
  }, [isPlaying, isGameOver, score]);

  const whack = (index: number) => {
    if (index === activeMole && whackedMole !== index) {
      setWhackedMole(index);
      const bonus = streak >= 3 ? 15 : 10;
      const nextScore = score + bonus;
      setScore(nextScore);
      setStreak((s) => s + 1);

      if (nextScore > highScore) {
        setHighScore(nextScore);
        localStorage.setItem("mole_highscore", nextScore.toString());
      }
    }
  };

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

      {/* 3x3 Mole Holes Board */}
      <div className="relative p-4 bg-[#7A583A] border-4 border-[#5C3F24] rounded-3xl shadow-xl w-[360px] h-[360px]">
        <div className="grid grid-cols-3 gap-3 w-full h-full">
          {Array.from({ length: 9 }).map((_, idx) => {
            const isMoleUp = activeMole === idx;
            const isHit = whackedMole === idx;

            return (
              <div
                key={idx}
                onClick={() => whack(idx)}
                className="relative overflow-hidden rounded-2xl bg-[#4A321B] border-2 border-[#362413] shadow-inner flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
              >
                {/* Hole Rim */}
                <div className="absolute inset-x-2 bottom-1 h-8 rounded-full bg-[#362413]/70" />

                {/* Mole Character */}
                {isMoleUp && (
                  <div
                    className={`text-5xl transform transition-all duration-150 select-none ${
                      isHit
                        ? "scale-110 rotate-12 filter brightness-110"
                        : "scale-100 hover:scale-105"
                    }`}
                  >
                    {isHit ? "⭐😵⭐" : "🐹"}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Start / Game Over Overlay */}
        {(!isPlaying || isGameOver) && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center gap-3 text-white z-20">
            {isGameOver ? (
              <>
                <Trophy className="w-10 h-10 text-amber-400" />
                <h3 className="text-2xl font-black text-white drop-shadow-md">
                  {lang === "uz" ? "VAQT TUGADI!" : "TIME'S UP!"}
                </h3>
                <p className="text-sm font-bold text-white/90">
                  {lang === "uz" ? "Sizning ballingiz:" : "Your Score:"} <strong className="text-amber-400 text-lg">{score}</strong>
                </p>
                <button
                  onClick={startGame}
                  className="mt-2 bg-[#07858B] hover:bg-[#066D73] text-white px-6 py-2.5 rounded-2xl font-bold text-xs shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  {lang === "uz" ? "Qaytadan O'ynash" : "Play Again"}
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-[#07858B] flex items-center justify-center shadow-lg shadow-[#07858B]/30">
                  <Play className="w-7 h-7 fill-white text-white ml-0.5" />
                </div>
                <h3 className="text-xl font-extrabold">Whack-a-Mole</h3>
                <p className="text-xs text-white/80 max-w-xs text-center font-medium">
                  {lang === "uz"
                    ? "30 soniya ichida teshiklardan chiqib kelayotgan personajlarni bosing!"
                    : "Tap the moles as quickly as they appear within 30 seconds!"}
                </p>
                <button
                  onClick={startGame}
                  className="bg-white text-[#07858B] hover:bg-[#E7F5F5] px-6 py-2 rounded-2xl font-bold text-xs shadow-md hover:scale-105 transition-all"
                >
                  {lang === "uz" ? "Boshlash" : "Start Game"}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {streak >= 3 && isPlaying && (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-black animate-bounce">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{streak}x COMBO (+15 PTS)!</span>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Trophy, Clock, Check, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface MathChallengeProps {
  onGameOver?: (score: number) => void;
  lang: string;
}

interface Question {
  text: string;
  options: number[];
  correct: number;
}

function generateMathQuestion(): Question {
  const ops = ["+", "-", "×"];
  const op = ops[Math.floor(Math.random() * ops.length)];
  let a = 0;
  let b = 0;
  let correct = 0;

  if (op === "+") {
    a = 10 + Math.floor(Math.random() * 89);
    b = 10 + Math.floor(Math.random() * 89);
    correct = a + b;
  } else if (op === "-") {
    a = 20 + Math.floor(Math.random() * 79);
    b = 10 + Math.floor(Math.random() * (a - 10));
    correct = a - b;
  } else {
    a = 2 + Math.floor(Math.random() * 18);
    b = 3 + Math.floor(Math.random() * 12);
    correct = a * b;
  }

  // Generate 3 unique wrong options
  const options = new Set<number>([correct]);
  while (options.size < 4) {
    const delta = (Math.floor(Math.random() * 9) + 1) * (Math.random() > 0.5 ? 1 : -1);
    const fake = Math.max(1, correct + delta);
    options.add(fake);
  }

  const shuffled = Array.from(options).sort(() => Math.random() - 0.5);
  return {
    text: `${a} ${op} ${b} = ?`,
    options: shuffled,
    correct,
  };
}

export function MathChallengeGame({ onGameOver, lang }: MathChallengeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [highScore, setHighScore] = useState(0);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("math_highscore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setIsGameOver(false);
    setIsPlaying(true);
    setSelectedAns(null);
    setCurrentQ(generateMathQuestion());
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
        localStorage.setItem("math_highscore", score.toString());
        confetti({ particleCount: 70, spread: 60 });
      }
      if (onGameOver) onGameOver(score);
    }
  }, [isGameOver, score, highScore, onGameOver]);

  const handleAnswer = (ans: number) => {
    if (selectedAns !== null || !currentQ) return;
    setSelectedAns(ans);

    const isCorrect = ans === currentQ.correct;
    if (isCorrect) {
      setScore((s) => s + 10);
      setTimeLeft((t) => Math.min(35, t + 1)); // bonus 1s
    }

    setTimeout(() => {
      setSelectedAns(null);
      setCurrentQ(generateMathQuestion());
    }, 280);
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
            {highScore}
          </span>
          <span className="text-sm font-extrabold text-[#07858B]">{score}</span>
        </div>
      </div>

      {/* Main Game Card */}
      <div className="relative p-6 bg-white border-2 border-[#E8EDF2] rounded-3xl shadow-lg w-[360px] min-h-[340px] flex flex-col justify-between items-center text-center">
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
                <h3 className="text-xl font-extrabold text-[#182536]">Math Challenge</h3>
                <p className="text-xs text-[#7B8794] max-w-xs font-medium">
                  {lang === "uz"
                    ? "30 soniya ichida imkon qadar ko'proq arifmetik masalalarni to'g'ri yeching!"
                    : "Solve as many rapid math calculations as possible within 30 seconds!"}
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

        <span className="text-[11px] font-bold text-[#7B8794] uppercase tracking-wider block">
          {lang === "uz" ? "Tezkor arifmetika" : "Mental Arithmetic"}
        </span>

        {/* Formula */}
        <div className="my-6">
          <span className="text-4xl font-black text-[#182536] tracking-tight">
            {currentQ?.text || "..."}
          </span>
        </div>

        {/* 4 Choices */}
        <div className="grid grid-cols-2 gap-3 w-full">
          {currentQ?.options.map((opt) => {
            const isSelected = selectedAns === opt;
            const isCorrect = isSelected && opt === currentQ.correct;
            const isWrong = isSelected && opt !== currentQ.correct;

            return (
              <button
                key={opt}
                onClick={() => handleAnswer(opt)}
                disabled={selectedAns !== null}
                className={`py-4 rounded-2xl font-black text-xl border-2 transition-all ${
                  isCorrect
                    ? "bg-[#22A06B] border-[#22A06B] text-white"
                    : isWrong
                    ? "bg-[#E05252] border-[#E05252] text-white"
                    : "bg-[#F7F9FC] border-[#E8EDF2] text-[#182536] hover:bg-[#E7F5F5] hover:border-[#07858B] active:scale-95"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

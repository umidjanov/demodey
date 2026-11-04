"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Trophy, Clock, CheckCircle2, Zap } from "lucide-react";
import confetti from "canvas-confetti";

interface TypingSpeedProps {
  onGameOver?: (score: number) => void;
  lang: string;
}

const TEXT_POOLS: Record<string, string[]> = {
  uz: [
    "Bilim olish va doimiy o'rganish insonning aqliy salohiyatini oshiradi.",
    "Amir Temur davlat boshqaruvida adolat va qat'iyat tamoyillariga tayangan.",
    "Muntazam intizom va har kungi kichik qadamlar buyuk natijalarga olib keladi.",
    "O'zbekiston boy tarixiy merosga va qadimiy madaniy obidalarga ega yurt.",
  ],
  ru: [
    "Постоянное обучение и практика ведут к настоящему профессионализму.",
    "Чтение хороших книг расширяет кругозор и развивает критическое мышление.",
    "Дисциплина и упорство позволяют достигать самых высоких вершин.",
  ],
  en: [
    "Learning every day through active recall builds deep long-term knowledge.",
    "Consistency and daily discipline are the foundation of any remarkable success.",
    "Typing fast and accurately improves your productivity and mental focus.",
  ],
};

export function TypingSpeedGame({ onGameOver, lang }: TypingSpeedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [targetText, setTargetText] = useState("");
  const [input, setInput] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [highScore, setHighScore] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("typing_highscore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const getRandomText = () => {
    const pool = TEXT_POOLS[lang] || TEXT_POOLS["uz"];
    return pool[Math.floor(Math.random() * pool.length)];
  };

  const startGame = () => {
    const text = getRandomText();
    setTargetText(text);
    setInput("");
    setSeconds(0);
    setWpm(0);
    setAccuracy(100);
    setIsGameOver(false);
    setIsPlaying(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    timerRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isGameOver]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    // Calculate accuracy
    let correctCount = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] === targetText[i]) correctCount++;
    }
    const acc = val.length > 0 ? Math.round((correctCount / val.length) * 100) : 100;
    setAccuracy(acc);

    // Calculate WPM: (correct chars / 5) / (seconds / 60)
    const mins = Math.max(1, seconds) / 60;
    const currentWpm = Math.round(correctCount / 5 / mins);
    setWpm(currentWpm);

    // Check completion
    if (val.length >= targetText.length) {
      clearInterval(timerRef.current!);
      setIsGameOver(true);
      setIsPlaying(false);

      if (currentWpm > highScore) {
        setHighScore(currentWpm);
        localStorage.setItem("typing_highscore", currentWpm.toString());
        confetti({ particleCount: 80, spread: 70 });
      }
      if (onGameOver) onGameOver(currentWpm * 10);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 select-none">
      {/* Top Bar Info */}
      <div className="flex items-center justify-between w-full max-w-[480px] px-4 py-2 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF2] text-xs font-bold text-[#182536]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[#FF9B45]">
            <Clock className="w-3.5 h-3.5" />
            {seconds}s
          </span>
          <span className="text-[#07858B] flex items-center gap-1 font-extrabold">
            <Zap className="w-3.5 h-3.5" />
            {wpm} WPM
          </span>
          <span className="text-emerald-600 font-extrabold">{accuracy}%</span>
        </div>
        <div className="flex items-center gap-1 text-amber-600">
          <Trophy className="w-3.5 h-3.5" />
          <span>{highScore} WPM</span>
        </div>
      </div>

      {/* Main Game Card */}
      <div className="relative p-6 bg-white border-2 border-[#E8EDF2] rounded-3xl shadow-lg w-[480px] max-w-full space-y-6">
        {(!isPlaying || isGameOver) && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center gap-3 p-6 z-20 text-center">
            {isGameOver ? (
              <>
                <Trophy className="w-12 h-12 text-amber-500" />
                <h3 className="text-2xl font-black text-[#182536]">{lang === "uz" ? "YAKUNLANDI!" : "COMPLETED!"}</h3>
                <div className="flex items-center gap-6 my-2">
                  <div className="bg-[#E7F5F5] px-4 py-2 rounded-xl text-center">
                    <span className="text-[10px] text-[#7B8794] font-bold block uppercase">Tezlik</span>
                    <span className="text-xl font-extrabold text-[#07858B]">{wpm} WPM</span>
                  </div>
                  <div className="bg-emerald-50 px-4 py-2 rounded-xl text-center">
                    <span className="text-[10px] text-[#7B8794] font-bold block uppercase">Aniqlik</span>
                    <span className="text-xl font-extrabold text-[#22A06B]">{accuracy}%</span>
                  </div>
                </div>
                <button
                  onClick={startGame}
                  className="bg-[#07858B] hover:bg-[#066D73] text-white px-6 py-2.5 rounded-2xl font-bold text-xs shadow-md flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
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
                <h3 className="text-xl font-extrabold text-[#182536]">Typing Speed Test</h3>
                <p className="text-xs text-[#7B8794] max-w-xs font-medium">
                  {lang === "uz"
                    ? "Berilgan matnni klaviaturada imkon qadar tez va xatosiz tering!"
                    : "Type the target text as quickly and accurately as possible!"}
                </p>
                <button
                  onClick={startGame}
                  className="bg-[#07858B] hover:bg-[#066D73] text-white px-6 py-2.5 rounded-2xl font-bold text-xs shadow-md hover:scale-105 transition-all"
                >
                  {lang === "uz" ? "Boshlash" : "Start Test"}
                </button>
              </>
            )}
          </div>
        )}

        {/* Text Display with Char-by-Char Highlights */}
        <div className="p-5 rounded-2xl bg-[#F7F9FC] border border-[#E8EDF2] font-mono text-base leading-relaxed tracking-wide min-h-[90px]">
          {targetText.split("").map((char, idx) => {
            let color = "text-[#7B8794]";
            let bg = "transparent";

            if (idx < input.length) {
              if (input[idx] === char) {
                color = "text-[#22A06B]";
                bg = "bg-emerald-100/50";
              } else {
                color = "text-[#E05252]";
                bg = "bg-rose-100";
              }
            } else if (idx === input.length) {
              bg = "bg-[#07858B]/20 animate-pulse";
            }

            return (
              <span key={idx} className={`${color} ${bg} rounded-xs px-[1px]`}>
                {char}
              </span>
            );
          })}
        </div>

        {/* Typing Input */}
        <div>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInputChange}
            disabled={!isPlaying || isGameOver}
            placeholder={lang === "uz" ? "Shu yerga yozishni boshlang..." : "Start typing here..."}
            className="w-full px-4 py-3 rounded-2xl border-2 border-[#E8EDF2] focus:border-[#07858B] focus:outline-hidden font-mono text-sm shadow-xs transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

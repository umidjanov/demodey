"use client";

import React, { useState, useEffect } from "react";
import { Play, RotateCcw, Trophy, Sparkles, HelpCircle, Delete } from "lucide-react";
import confetti from "canvas-confetti";

interface WordPuzzleProps {
  onGameOver?: (score: number) => void;
  lang: string;
}

interface PuzzleItem {
  word: string;
  hintUz: string;
  hintRu: string;
  hintEn: string;
}

const PUZZLE_WORDS: PuzzleItem[] = [
  { word: "ALGORITM", hintUz: "Ketma-ket buyruqlar to'plami", hintRu: "Последовательность команд", hintEn: "Step-by-step procedure" },
  { word: "SAMARQAND", hintUz: "Qadimiy sayqali zamin", hintRu: "Древний город Востока", hintEn: "Historic silk road city" },
  { word: "GRAMMATIKA", hintUz: "Til qoidalari tizimi", hintRu: "Система правил языка", hintEn: "Rules of language" },
  { word: "INTEGRAL", hintUz: "Oliy matematika tushunchasi", hintRu: "Понятие высшей математики", hintEn: "Calculus operation" },
  { word: "DISKRET", hintUz: "Uzluksiz bo'lmagan qiymatlar", hintRu: "Прерывистые значения", hintEn: "Distinct separate values" },
  { word: "ALISHER", hintUz: "Buyuk g'azal mulkining sultoni", hintRu: "Великий поэт Навои", hintEn: "Greatest Turkic poet" },
];

export function WordPuzzleGame({ onGameOver, lang }: WordPuzzleProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrambled, setScrambled] = useState<string[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<number[]>([]); // indexes in scrambled
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("word_highscore");
    if (saved) setHighScore(parseInt(saved, 10));
    loadWord(0);
  }, []);

  const loadWord = (index: number) => {
    const item = PUZZLE_WORDS[index % PUZZLE_WORDS.length];
    const letters = item.word.split("");
    // Shuffle
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    setScrambled(letters);
    setSelectedLetters([]);
    setShowHint(false);
    setIsSuccess(false);
  };

  const handleTileClick = (idx: number) => {
    if (selectedLetters.includes(idx) || isSuccess) return;

    const nextSelected = [...selectedLetters, idx];
    setSelectedLetters(nextSelected);

    const targetWord = PUZZLE_WORDS[currentIndex % PUZZLE_WORDS.length].word;
    const currentConstructed = nextSelected.map((i) => scrambled[i]).join("");

    if (currentConstructed.length === targetWord.length) {
      if (currentConstructed === targetWord) {
        // Correct!
        setIsSuccess(true);
        confetti({ particleCount: 70, spread: 60 });
        const nextScore = score + (showHint ? 20 : 35);
        setScore(nextScore);

        if (nextScore > highScore) {
          setHighScore(nextScore);
          localStorage.setItem("word_highscore", nextScore.toString());
        }

        setTimeout(() => {
          const nextIdx = currentIndex + 1;
          setCurrentIndex(nextIdx);
          loadWord(nextIdx);
        }, 1200);
      } else {
        // Wrong full word: reset selected
        setTimeout(() => {
          setSelectedLetters([]);
        }, 600);
      }
    }
  };

  const undoLast = () => {
    setSelectedLetters((prev) => prev.slice(0, -1));
  };

  const clearAll = () => {
    setSelectedLetters([]);
  };

  const currentItem = PUZZLE_WORDS[currentIndex % PUZZLE_WORDS.length];
  const hintText =
    lang === "uz" ? currentItem.hintUz : lang === "ru" ? currentItem.hintRu : currentItem.hintEn;

  return (
    <div className="flex flex-col items-center justify-center space-y-4 select-none">
      {/* Top Bar Info */}
      <div className="flex items-center justify-between w-full max-w-[420px] px-4 py-2 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF2] text-xs font-bold text-[#182536]">
        <div className="flex items-center gap-2 text-[#7B8794]">
          <span>{lang === "uz" ? "Anagramma" : "Word Scramble"}</span>
          <span>• #{currentIndex + 1}</span>
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
      <div className="p-6 bg-white border-2 border-[#E8EDF2] rounded-3xl shadow-lg w-[420px] max-w-full space-y-6 text-center">
        {/* Hint banner */}
        <div className="min-h-[40px] flex items-center justify-center">
          {showHint ? (
            <span className="px-3.5 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
              💡 {hintText}
            </span>
          ) : (
            <button
              onClick={() => setShowHint(true)}
              className="text-xs font-semibold text-[#07858B] hover:underline flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{lang === "uz" ? "Yordam (Izoh) ko'rsatish" : "Show Hint"}</span>
            </button>
          )}
        </div>

        {/* Answer Slots */}
        <div className="flex items-center justify-center gap-2 flex-wrap min-h-[56px] py-2">
          {Array.from({ length: currentItem.word.length }).map((_, idx) => {
            const letterIdx = selectedLetters[idx];
            const letter = letterIdx !== undefined ? scrambled[letterIdx] : "";

            return (
              <div
                key={idx}
                className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center font-black text-xl transition-all ${
                  isSuccess
                    ? "bg-[#22A06B] border-[#22A06B] text-white"
                    : letter
                    ? "bg-[#E7F5F5] border-[#07858B] text-[#07858B]"
                    : "bg-[#F7F9FC] border-[#D0D7DE] border-dashed"
                }`}
              >
                {letter}
              </div>
            );
          })}
        </div>

        {/* Scrambled Letter Tiles */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {scrambled.map((letter, idx) => {
            const isUsed = selectedLetters.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => handleTileClick(idx)}
                disabled={isUsed || isSuccess}
                className={`w-11 h-12 rounded-xl font-black text-xl border shadow-xs transition-all ${
                  isUsed
                    ? "opacity-25 bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed scale-95"
                    : "bg-white border-[#E8EDF2] text-[#182536] hover:bg-[#E7F5F5] hover:border-[#07858B] active:scale-95"
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={undoLast}
            disabled={selectedLetters.length === 0}
            className="px-4 py-2 rounded-xl bg-[#F7F9FC] border border-[#E8EDF2] hover:bg-gray-100 text-xs font-bold text-[#182536] disabled:opacity-40"
          >
            {lang === "uz" ? "Oxirgisini o'chirish" : "Undo"}
          </button>
          <button
            onClick={clearAll}
            disabled={selectedLetters.length === 0}
            className="px-4 py-2 rounded-xl bg-[#F7F9FC] border border-[#E8EDF2] hover:bg-gray-100 text-xs font-bold text-[#E05252] disabled:opacity-40"
          >
            {lang === "uz" ? "Tozalash" : "Clear"}
          </button>
        </div>
      </div>
    </div>
  );
}

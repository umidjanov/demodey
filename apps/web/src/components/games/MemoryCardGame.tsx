"use client";

import React, { useState, useEffect } from "react";
import { RotateCcw, Trophy, Clock, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface MemoryCardProps {
  onGameOver?: (score: number) => void;
  lang: string;
}

const ICONS = ["🧠", "💻", "🚀", "⚡", "📐", "🔬", "🎯", "🌟"];

interface Card {
  id: number;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export function MemoryCardGame({ onGameOver, lang }: MemoryCardProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const initGame = () => {
    const paired = [...ICONS, ...ICONS];
    // Fisher-Yates shuffle
    for (let i = paired.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [paired[i], paired[j]] = [paired[j], paired[i]];
    }

    setCards(
      paired.map((icon, idx) => ({
        id: idx,
        icon,
        isFlipped: false,
        isMatched: false,
      }))
    );
    setFlippedIds([]);
    setMoves(0);
    setSeconds(0);
    setIsWon(false);
    setIsLocked(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  // Timer
  useEffect(() => {
    if (isWon) return;
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isWon]);

  const handleCardClick = (id: number) => {
    if (isLocked) return;
    const card = cards.find((c) => c.id === id);
    if (!card || card.isFlipped || card.isMatched) return;

    // Flip card
    const newCards = cards.map((c) => (c.id === id ? { ...c, isFlipped: true } : c));
    setCards(newCards);

    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      setIsLocked(true);

      const [firstId, secondId] = newFlipped;
      const firstCard = newCards.find((c) => c.id === firstId)!;
      const secondCard = newCards.find((c) => c.id === secondId)!;

      if (firstCard.icon === secondCard.icon) {
        // Match!
        setTimeout(() => {
          const matchedCards = newCards.map((c) =>
            c.id === firstId || c.id === secondId ? { ...c, isMatched: true } : c
          );
          setCards(matchedCards);
          setFlippedIds([]);
          setIsLocked(false);

          // Check win condition
          if (matchedCards.every((c) => c.isMatched)) {
            setIsWon(true);
            confetti({ particleCount: 90, spread: 70 });
            const calculatedScore = Math.max(100, 1000 - moves * 20 - seconds * 5);
            if (onGameOver) onGameOver(calculatedScore);
          }
        }, 350);
      } else {
        // Mismatch: flip back
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c) => (c.id === firstId || c.id === secondId ? { ...c, isFlipped: false } : c))
          );
          setFlippedIds([]);
          setIsLocked(false);
        }, 750);
      }
    }
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 select-none">
      {/* Top Bar Info */}
      <div className="flex items-center justify-between w-full max-w-[360px] px-4 py-2 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF2] text-xs font-bold text-[#182536]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[#7B8794]">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(seconds)}
          </span>
          <span className="text-[#7B8794]">
            {lang === "uz" ? "Harakatlar" : "Moves"}: <strong className="text-[#07858B]">{moves}</strong>
          </span>
        </div>
        <button
          onClick={initGame}
          className="p-1.5 rounded-xl bg-white border border-[#E8EDF2] hover:bg-gray-100 shadow-2xs"
          title={lang === "uz" ? "Qaytadan" : "Restart"}
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#7B8794]" />
        </button>
      </div>

      {/* 4x4 Grid of Cards */}
      <div className="relative p-3 bg-white border-2 border-[#E8EDF2] rounded-3xl shadow-lg w-[360px] h-[360px]">
        <div className="grid grid-cols-4 gap-2.5 w-full h-full">
          {cards.map((card) => {
            const isRevealed = card.isFlipped || card.isMatched;
            return (
              <button
                key={card.id}
                onClick={() => handleCardClick(card.id)}
                className={`rounded-2xl flex items-center justify-center text-3xl font-bold transition-all duration-300 transform ${
                  card.isMatched
                    ? "bg-[#E7F5F5] border-2 border-[#22A06B] scale-95"
                    : isRevealed
                    ? "bg-[#E7F5F5] border-2 border-[#07858B] shadow-sm rotate-0"
                    : "bg-[#F7F9FC] border border-[#E8EDF2] hover:bg-[#E8EDF2] hover:scale-102 active:scale-95"
                }`}
              >
                {isRevealed ? card.icon : "❓"}
              </button>
            );
          })}
        </div>

        {/* Victory Celebration Overlay */}
        {isWon && (
          <div className="absolute inset-0 bg-[#07858B]/90 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center gap-3 text-white z-20">
            <Sparkles className="w-12 h-12 text-[#F5B83D]" />
            <h3 className="text-2xl font-black">{lang === "uz" ? "G'ALABA!" : "YOU WON!"}</h3>
            <p className="text-xs font-medium text-white/90">
              {lang === "uz"
                ? `${moves} ta harakat va ${formatTime(seconds)} ichida yakunladingiz!`
                : `Completed in ${moves} moves and ${formatTime(seconds)}!`}
            </p>
            <button
              onClick={initGame}
              className="mt-2 bg-white text-[#07858B] hover:bg-[#E7F5F5] px-6 py-2.5 rounded-2xl font-bold text-xs shadow-md hover:scale-105 transition-all"
            >
              {lang === "uz" ? "Qaytadan O'ynash" : "Play Again"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

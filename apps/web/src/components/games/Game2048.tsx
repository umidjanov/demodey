"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RotateCcw, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface Game2048Props {
  onGameOver?: (score: number) => void;
  lang: string;
}

type Board = number[][];

const SIZE = 4;

const TILE_COLORS: Record<number, { bg: string; text: string; shadow?: string }> = {
  2: { bg: "#EEE4DA", text: "#776E65" },
  4: { bg: "#EDE0C8", text: "#776E65" },
  8: { bg: "#F2B179", text: "#FFFFFF" },
  16: { bg: "#F59563", text: "#FFFFFF" },
  32: { bg: "#F67C5F", text: "#FFFFFF" },
  64: { bg: "#F65E3B", text: "#FFFFFF" },
  128: { bg: "#EDCF72", text: "#FFFFFF", shadow: "0 0 10px #EDCF72" },
  256: { bg: "#EDCC61", text: "#FFFFFF", shadow: "0 0 15px #EDCC61" },
  512: { bg: "#EDC850", text: "#FFFFFF", shadow: "0 0 20px #EDC850" },
  1024: { bg: "#EDC53F", text: "#FFFFFF", shadow: "0 0 25px #EDC53F" },
  2048: { bg: "#07858B", text: "#FFFFFF", shadow: "0 0 30px #07858B" },
};

function createEmptyBoard(): Board {
  return Array(SIZE).fill(0).map(() => Array(SIZE).fill(0));
}

function spawnTile(board: Board): Board {
  const emptyCoords: [number, number][] = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (board[r][c] === 0) emptyCoords.push([r, c]);
    }
  }
  if (emptyCoords.length === 0) return board;

  const [r, c] = emptyCoords[Math.floor(Math.random() * emptyCoords.length)];
  const val = Math.random() < 0.9 ? 2 : 4;
  const newBoard = board.map((row) => [...row]);
  newBoard[r][c] = val;
  return newBoard;
}

export function Game2048({ onGameOver, lang }: Game2048Props) {
  const [board, setBoard] = useState<Board>(createEmptyBoard);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("2048_highscore");
    if (saved) setHighScore(parseInt(saved, 10));
    initGame();
  }, []);

  const initGame = () => {
    let b = createEmptyBoard();
    b = spawnTile(b);
    b = spawnTile(b);
    setBoard(b);
    setScore(0);
    setIsGameOver(false);
    setHasWon(false);
  };

  const checkGameOver = (b: Board): boolean => {
    // Check if any empty cell
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (b[r][c] === 0) return false;
      }
    }
    // Check horizontal neighbors
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE - 1; c++) {
        if (b[r][c] === b[r][c + 1]) return false;
      }
    }
    // Check vertical neighbors
    for (let r = 0; r < SIZE - 1; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (b[r][c] === b[r + 1][c]) return false;
      }
    }
    return true;
  };

  const slideLeft = (row: number[]): { newRow: number[]; gained: number } => {
    const filtered = row.filter((x) => x !== 0);
    let gained = 0;
    const merged: number[] = [];

    for (let i = 0; i < filtered.length; i++) {
      if (filtered[i] === filtered[i + 1]) {
        const sum = filtered[i] * 2;
        merged.push(sum);
        gained += sum;
        i++;
      } else {
        merged.push(filtered[i]);
      }
    }
    while (merged.length < SIZE) merged.push(0);
    return { newRow: merged, gained };
  };

  const move = useCallback(
    (direction: "left" | "right" | "up" | "down") => {
      if (isGameOver) return;

      let newBoard = board.map((row) => [...row]);
      let totalGained = 0;
      let changed = false;

      if (direction === "left") {
        for (let r = 0; r < SIZE; r++) {
          const { newRow, gained } = slideLeft(newBoard[r]);
          totalGained += gained;
          if (newRow.some((val, idx) => val !== newBoard[r][idx])) changed = true;
          newBoard[r] = newRow;
        }
      } else if (direction === "right") {
        for (let r = 0; r < SIZE; r++) {
          const reversed = [...newBoard[r]].reverse();
          const { newRow, gained } = slideLeft(reversed);
          const rightRow = newRow.reverse();
          totalGained += gained;
          if (rightRow.some((val, idx) => val !== newBoard[r][idx])) changed = true;
          newBoard[r] = rightRow;
        }
      } else if (direction === "up") {
        for (let c = 0; c < SIZE; c++) {
          const col = [newBoard[0][c], newBoard[1][c], newBoard[2][c], newBoard[3][c]];
          const { newRow, gained } = slideLeft(col);
          totalGained += gained;
          for (let r = 0; r < SIZE; r++) {
            if (newBoard[r][c] !== newRow[r]) changed = true;
            newBoard[r][c] = newRow[r];
          }
        }
      } else if (direction === "down") {
        for (let c = 0; c < SIZE; c++) {
          const col = [newBoard[3][c], newBoard[2][c], newBoard[1][c], newBoard[0][c]];
          const { newRow, gained } = slideLeft(col);
          totalGained += gained;
          const downCol = newRow.reverse();
          for (let r = 0; r < SIZE; r++) {
            if (newBoard[r][c] !== downCol[r]) changed = true;
            newBoard[r][c] = downCol[r];
          }
        }
      }

      if (changed) {
        newBoard = spawnTile(newBoard);
        setBoard(newBoard);
        const nextScore = score + totalGained;
        setScore(nextScore);

        if (nextScore > highScore) {
          setHighScore(nextScore);
          localStorage.setItem("2048_highscore", nextScore.toString());
        }

        // Check 2048 reached
        if (!hasWon && newBoard.some((row) => row.includes(2048))) {
          setHasWon(true);
          confetti({ particleCount: 100, spread: 80 });
        }

        // Check if game over
        if (checkGameOver(newBoard)) {
          setIsGameOver(true);
          if (onGameOver) onGameOver(nextScore);
        }
      }
    },
    [board, isGameOver, score, highScore, hasWon, onGameOver]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowLeft", "KeyA"].includes(e.code)) {
        e.preventDefault();
        move("left");
      } else if (["ArrowRight", "KeyD"].includes(e.code)) {
        e.preventDefault();
        move("right");
      } else if (["ArrowUp", "KeyW"].includes(e.code)) {
        e.preventDefault();
        move("up");
      } else if (["ArrowDown", "KeyS"].includes(e.code)) {
        e.preventDefault();
        move("down");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 select-none">
      {/* Top Bar Info */}
      <div className="flex items-center justify-between w-full max-w-[380px] px-4 py-2 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF2] text-xs font-bold text-[#182536]">
        <div className="flex items-center gap-2">
          <span className="text-base font-extrabold text-[#07858B]">2048</span>
          <button
            onClick={initGame}
            className="p-1.5 rounded-xl bg-white border border-[#E8EDF2] hover:bg-gray-100 transition-colors shadow-2xs"
            title={lang === "uz" ? "Qayta boshlash" : "Restart"}
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#7B8794]" />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-white px-3 py-1 rounded-xl border border-[#E8EDF2] text-center">
            <span className="text-[10px] text-[#7B8794] block uppercase font-bold">{lang === "uz" ? "Ball" : "Score"}</span>
            <span className="text-sm font-extrabold text-[#07858B]">{score}</span>
          </div>
          <div className="bg-white px-3 py-1 rounded-xl border border-[#E8EDF2] text-center">
            <span className="text-[10px] text-amber-600 block uppercase font-bold">{lang === "uz" ? "Rekord" : "Best"}</span>
            <span className="text-sm font-extrabold text-amber-600">{highScore}</span>
          </div>
        </div>
      </div>

      {/* 2048 Grid Board */}
      <div className="relative p-3 bg-[#BBADA0] rounded-3xl shadow-xl w-[380px] h-[380px] max-w-full">
        <div className="grid grid-cols-4 gap-3 w-full h-full">
          {board.map((row, r) =>
            row.map((cell, c) => {
              const tile = TILE_COLORS[cell] || { bg: "#3C3A32", text: "#FFFFFF" };
              return (
                <div
                  key={`${r}-${c}`}
                  className="rounded-2xl flex items-center justify-center font-black transition-all duration-150 transform"
                  style={{
                    backgroundColor: cell === 0 ? "#CDC1B4" : tile.bg,
                    color: tile.text,
                    fontSize: cell > 512 ? "20px" : cell > 64 ? "24px" : "28px",
                    boxShadow: cell > 0 ? tile.shadow || "0 2px 5px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {cell !== 0 ? cell : ""}
                </div>
              );
            })
          )}
        </div>

        {/* Win Overlay */}
        {hasWon && !isGameOver && (
          <div className="absolute inset-0 bg-[#EDC22E]/85 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center gap-3 text-white z-20">
            <Sparkles className="w-12 h-12 text-white" />
            <h3 className="text-2xl font-black">{lang === "uz" ? "2048 Ga Yetdingiz!" : "You Reached 2048!"}</h3>
            <p className="text-xs font-semibold">{lang === "uz" ? "O'ynashda davom etishingiz mumkin!" : "You can keep playing!"}</p>
            <button
              onClick={() => setHasWon(false)}
              className="bg-white text-[#182536] px-5 py-2 rounded-2xl font-bold text-xs shadow-md"
            >
              {lang === "uz" ? "Davom ettirish" : "Keep Playing"}
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center gap-3 text-white z-20">
            <Trophy className="w-10 h-10 text-amber-400" />
            <h3 className="text-2xl font-black">{lang === "uz" ? "O'yin Yakunlandi!" : "Game Over!"}</h3>
            <p className="text-xs text-white/90">
              {lang === "uz" ? "Natijangiz:" : "Final Score:"} <strong className="text-amber-400 text-sm">{score}</strong>
            </p>
            <button
              onClick={initGame}
              className="bg-[#07858B] hover:bg-[#066D73] text-white px-6 py-2.5 rounded-2xl font-bold text-xs shadow-lg flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              {lang === "uz" ? "Qaytadan O'ynash" : "Try Again"}
            </button>
          </div>
        )}
      </div>

      {/* Direction Controls (Mobile / Click) */}
      <div className="flex flex-col items-center gap-1.5 pt-2">
        <button
          onClick={() => move("up")}
          className="w-11 h-11 bg-white active:bg-gray-100 border border-[#E8EDF2] rounded-xl flex items-center justify-center shadow-xs"
        >
          <ArrowUp className="w-5 h-5 text-[#182536]" />
        </button>
        <div className="flex items-center gap-4">
          <button
            onClick={() => move("left")}
            className="w-11 h-11 bg-white active:bg-gray-100 border border-[#E8EDF2] rounded-xl flex items-center justify-center shadow-xs"
          >
            <ArrowLeft className="w-5 h-5 text-[#182536]" />
          </button>
          <button
            onClick={() => move("down")}
            className="w-11 h-11 bg-white active:bg-gray-100 border border-[#E8EDF2] rounded-xl flex items-center justify-center shadow-xs"
          >
            <ArrowDown className="w-5 h-5 text-[#182536]" />
          </button>
          <button
            onClick={() => move("right")}
            className="w-11 h-11 bg-white active:bg-gray-100 border border-[#E8EDF2] rounded-xl flex items-center justify-center shadow-xs"
          >
            <ArrowRight className="w-5 h-5 text-[#182536]" />
          </button>
        </div>
      </div>
    </div>
  );
}

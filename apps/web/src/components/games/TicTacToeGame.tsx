"use client";

import React, { useState } from "react";
import { RotateCcw, Bot, Users, Trophy } from "lucide-react";
import confetti from "canvas-confetti";

interface TicTacToeProps {
  onGameOver?: (score: number) => void;
  lang: string;
}

type Player = "X" | "O" | null;

const WINNING_COMBOS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function TicTacToeGame({ onGameOver, lang }: TicTacToeProps) {
  const [board, setBoard] = useState<Player[]>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [vsBot, setVsBot] = useState(true);
  const [winner, setWinner] = useState<Player | "draw" | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);
  const [stats, setStats] = useState({ xWins: 0, oWins: 0, draws: 0 });

  const checkWinner = (squares: Player[]) => {
    for (const combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: combo };
      }
    }
    if (squares.every((sq) => sq !== null)) {
      return { winner: "draw" as const, line: null };
    }
    return null;
  };

  const getBestBotMove = (squares: Player[]): number => {
    // 1. Can bot win?
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        const copy = [...squares];
        copy[i] = "O";
        if (checkWinner(copy)?.winner === "O") return i;
      }
    }
    // 2. Can player win? Block them!
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        const copy = [...squares];
        copy[i] = "X";
        if (checkWinner(copy)?.winner === "X") return i;
      }
    }
    // 3. Take center if free
    if (!squares[4]) return 4;

    // 4. Take corners
    const corners = [0, 2, 6, 8].filter((idx) => !squares[idx]);
    if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];

    // 5. Take any empty
    const available = squares.map((sq, idx) => (sq === null ? idx : null)).filter((idx) => idx !== null) as number[];
    return available[Math.floor(Math.random() * available.length)];
  };

  const handleClick = (index: number) => {
    if (board[index] || winner) return;

    const newBoard = [...board];
    newBoard[index] = isXNext ? "X" : "O";
    setBoard(newBoard);

    const winCheck = checkWinner(newBoard);
    if (winCheck) {
      setWinner(winCheck.winner);
      setWinningLine(winCheck.line);
      updateStats(winCheck.winner);
      return;
    }

    if (vsBot && isXNext) {
      setIsXNext(false);
      setTimeout(() => {
        const botMove = getBestBotMove(newBoard);
        if (botMove !== undefined && botMove !== null) {
          const afterBot = [...newBoard];
          afterBot[botMove] = "O";
          setBoard(afterBot);

          const botWinCheck = checkWinner(afterBot);
          if (botWinCheck) {
            setWinner(botWinCheck.winner);
            setWinningLine(botWinCheck.line);
            updateStats(botWinCheck.winner);
          } else {
            setIsXNext(true);
          }
        }
      }, 350);
    } else {
      setIsXNext(!isXNext);
    }
  };

  const updateStats = (w: Player | "draw") => {
    if (w === "X") {
      setStats((s) => ({ ...s, xWins: s.xWins + 1 }));
      confetti({ particleCount: 70, spread: 60 });
      if (onGameOver) onGameOver(100);
    } else if (w === "O") {
      setStats((s) => ({ ...s, oWins: s.oWins + 1 }));
    } else if (w === "draw") {
      setStats((s) => ({ ...s, draws: s.draws + 1 }));
    }
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinner(null);
    setWinningLine(null);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-5 select-none">
      {/* Mode & Score Bar */}
      <div className="flex items-center justify-between w-full max-w-[340px] px-4 py-2.5 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF2] text-xs font-bold text-[#182536]">
        {/* Toggle Mode */}
        <div className="flex items-center bg-white p-1 rounded-xl border border-[#E8EDF2]">
          <button
            onClick={() => {
              setVsBot(true);
              resetGame();
            }}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
              vsBot ? "bg-[#07858B] text-white shadow-xs" : "text-[#7B8794]"
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Bot</span>
          </button>
          <button
            onClick={() => {
              setVsBot(false);
              resetGame();
            }}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
              !vsBot ? "bg-[#07858B] text-white shadow-xs" : "text-[#7B8794]"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2P</span>
          </button>
        </div>

        {/* Turn Status */}
        <span className="font-extrabold text-xs text-[#07858B]">
          {winner
            ? winner === "draw"
              ? lang === "uz" ? "Durang!" : "Draw!"
              : `${winner} ${lang === "uz" ? "g'alaba qozondi!" : "wins!"}`
            : `${isXNext ? "X" : "O"} ${lang === "uz" ? "navbati" : "'s turn"}`}
        </span>

        {/* Reset */}
        <button
          onClick={resetGame}
          className="p-1.5 rounded-xl bg-white border border-[#E8EDF2] hover:bg-gray-100 shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-[#7B8794]" />
        </button>
      </div>

      {/* 3x3 Board */}
      <div className="p-3 bg-white border-2 border-[#E8EDF2] rounded-3xl shadow-lg w-[340px] h-[340px]">
        <div className="grid grid-cols-3 gap-2.5 w-full h-full">
          {board.map((cell, idx) => {
            const isWinningCell = winningLine?.includes(idx);
            return (
              <button
                key={idx}
                onClick={() => handleClick(idx)}
                className={`rounded-2xl flex items-center justify-center font-black text-4xl transition-all duration-200 ${
                  isWinningCell
                    ? "bg-[#22A06B] text-white shadow-md scale-95"
                    : cell
                    ? "bg-[#F7F9FC]"
                    : "bg-[#F7F9FC] hover:bg-[#E7F5F5] active:scale-95"
                } ${cell === "X" ? "text-[#07858B]" : "text-[#FF9B45]"}`}
              >
                {cell}
              </button>
            );
          })}
        </div>
      </div>

      {/* Score Summary */}
      <div className="flex items-center gap-3 text-xs font-bold text-[#7B8794]">
        <div className="px-3 py-1.5 rounded-xl bg-white border border-[#E8EDF2]">
          X: <span className="text-[#07858B]">{stats.xWins}</span>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-white border border-[#E8EDF2]">
          {lang === "uz" ? "Durang" : "Draws"}: <span className="text-[#182536]">{stats.draws}</span>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-white border border-[#E8EDF2]">
          O: <span className="text-[#FF9B45]">{stats.oWins}</span>
        </div>
      </div>
    </div>
  );
}

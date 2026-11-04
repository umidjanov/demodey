"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Play, RotateCcw, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Pause } from "lucide-react";
import confetti from "canvas-confetti";

interface SnakeGameProps {
  onGameOver?: (score: number) => void;
  lang: string;
}

const GRID_SIZE = 20;
const CANVAS_SIZE = 400;
const TILE_SIZE = CANVAS_SIZE / GRID_SIZE;

export function SnakeGame({ onGameOver, lang }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("snake_highscore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const stateRef = useRef({
    snake: [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ],
    dir: { x: 0, y: -1 },
    nextDir: { x: 0, y: -1 },
    food: { x: 5, y: 5 },
    speed: 120, // ms per tick
  });

  const spawnFood = (snake: { x: number; y: number }[]) => {
    let newFood: { x: number; y: number };
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!snake.some((s) => s.x === newFood.x && s.y === newFood.y)) break;
    }
    return newFood;
  };

  const startGame = () => {
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    stateRef.current = {
      snake: initialSnake,
      dir: { x: 0, y: -1 },
      nextDir: { x: 0, y: -1 },
      food: spawnFood(initialSnake),
      speed: 120,
    };
    setScore(0);
    setIsGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
  };

  const changeDirection = useCallback((dx: number, dy: number) => {
    const { dir } = stateRef.current;
    // Disallow 180-degree immediate reversal
    if (dx !== -dir.x || dy !== -dir.y) {
      stateRef.current.nextDir = { x: dx, y: dy };
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "KeyW"].includes(e.code)) {
        e.preventDefault();
        changeDirection(0, -1);
      } else if (["ArrowDown", "KeyS"].includes(e.code)) {
        e.preventDefault();
        changeDirection(0, 1);
      } else if (["ArrowLeft", "KeyA"].includes(e.code)) {
        e.preventDefault();
        changeDirection(-1, 0);
      } else if (["ArrowRight", "KeyD"].includes(e.code)) {
        e.preventDefault();
        changeDirection(1, 0);
      } else if (e.code === "Space" && isPlaying) {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [changeDirection, isPlaying]);

  useEffect(() => {
    if (!isPlaying || isPaused || isGameOver) return;

    const interval = setInterval(() => {
      const s = stateRef.current;
      s.dir = s.nextDir;

      const head = {
        x: s.snake[0].x + s.dir.x,
        y: s.snake[0].y + s.dir.y,
      };

      // Wall collision check
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setIsGameOver(true);
        setIsPlaying(false);
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem("snake_highscore", score.toString());
          confetti({ particleCount: 70, spread: 60 });
        }
        if (onGameOver) onGameOver(score);
        return;
      }

      // Self collision
      if (s.snake.some((seg) => seg.x === head.x && seg.y === head.y)) {
        setIsGameOver(true);
        setIsPlaying(false);
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem("snake_highscore", score.toString());
          confetti({ particleCount: 70, spread: 60 });
        }
        if (onGameOver) onGameOver(score);
        return;
      }

      const newSnake = [head, ...s.snake];

      // Check food eaten
      if (head.x === s.food.x && head.y === s.food.y) {
        setScore((sc) => {
          const nextScore = sc + 10;
          if (nextScore > highScore) {
            setHighScore(nextScore);
            localStorage.setItem("snake_highscore", nextScore.toString());
          }
          return nextScore;
        });
        s.food = spawnFood(newSnake);
        // Slightly increase speed
        if (s.speed > 60) s.speed -= 2;
      } else {
        newSnake.pop();
      }

      s.snake = newSnake;

      // Draw frame
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background Grid
      ctx.fillStyle = "#182536";
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Subtle checkered pattern
      ctx.fillStyle = "#1E2F43";
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if ((r + c) % 2 === 0) {
            ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          }
        }
      }

      // Draw Food (Apple)
      ctx.fillStyle = "#FF5A5F";
      ctx.beginPath();
      ctx.arc(
        s.food.x * TILE_SIZE + TILE_SIZE / 2,
        s.food.y * TILE_SIZE + TILE_SIZE / 2,
        TILE_SIZE / 2 - 2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Apple leaf
      ctx.fillStyle = "#22A06B";
      ctx.beginPath();
      ctx.ellipse(
        s.food.x * TILE_SIZE + TILE_SIZE / 2 + 2,
        s.food.y * TILE_SIZE + 3,
        4,
        2,
        Math.PI / 4,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Draw Snake
      s.snake.forEach((seg, idx) => {
        const isHead = idx === 0;
        ctx.fillStyle = isHead ? "#07858B" : "#22A06B";

        ctx.beginPath();
        ctx.roundRect(
          seg.x * TILE_SIZE + 1.5,
          seg.y * TILE_SIZE + 1.5,
          TILE_SIZE - 3,
          TILE_SIZE - 3,
          isHead ? 6 : 4
        );
        ctx.fill();

        // Eyes on Head
        if (isHead) {
          ctx.fillStyle = "#FFFFFF";
          const eyeSize = 3;
          let eyeX1 = seg.x * TILE_SIZE + 5;
          let eyeY1 = seg.y * TILE_SIZE + 5;
          let eyeX2 = seg.x * TILE_SIZE + TILE_SIZE - 7;
          let eyeY2 = seg.y * TILE_SIZE + 5;

          if (s.dir.x === 1) {
            eyeX1 = seg.x * TILE_SIZE + TILE_SIZE - 6;
            eyeX2 = eyeX1;
            eyeY1 = seg.y * TILE_SIZE + 5;
            eyeY2 = seg.y * TILE_SIZE + TILE_SIZE - 7;
          } else if (s.dir.x === -1) {
            eyeX1 = seg.x * TILE_SIZE + 5;
            eyeX2 = eyeX1;
            eyeY1 = seg.y * TILE_SIZE + 5;
            eyeY2 = seg.y * TILE_SIZE + TILE_SIZE - 7;
          } else if (s.dir.y === 1) {
            eyeY1 = seg.y * TILE_SIZE + TILE_SIZE - 6;
            eyeY2 = eyeY1;
          }

          ctx.fillRect(eyeX1, eyeY1, eyeSize, eyeSize);
          ctx.fillRect(eyeX2, eyeY2, eyeSize, eyeSize);
        }
      });
    }, stateRef.current.speed);

    return () => clearInterval(interval);
  }, [isPlaying, isPaused, isGameOver, score, highScore, onGameOver]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 select-none">
      {/* Top Bar Info */}
      <div className="flex items-center justify-between w-full max-w-[400px] px-4 py-2 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF2] text-xs font-bold text-[#182536]">
        <div className="flex items-center gap-2 text-[#7B8794]">
          <span>{lang === "uz" ? "Snake (Ilon)" : lang === "ru" ? "Змейка" : "Snake Game"}</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 text-amber-600">
            <Trophy className="w-3.5 h-3.5" />
            {lang === "uz" ? "Rekord" : lang === "ru" ? "Рекорд" : "HI"}: {highScore}
          </span>
          <span className="text-sm font-extrabold text-[#07858B]">{score}</span>
        </div>
      </div>

      {/* Canvas Wrapper */}
      <div
        className="relative overflow-hidden rounded-3xl border-2 border-[#E8EDF2] shadow-lg bg-[#182536]"
        style={{ width: CANVAS_SIZE, maxWidth: "100%", height: CANVAS_SIZE }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="w-full h-full block"
        />

        {/* Start / Game Over / Pause Overlay */}
        {(!isPlaying || isGameOver || isPaused) && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-white z-20">
            {isGameOver ? (
              <>
                <h3 className="text-2xl font-black tracking-tight text-white drop-shadow-md">
                  {lang === "uz" ? "O'YIN YAKUNLANDI" : lang === "ru" ? "ИГРА ОКОНЧЕНА" : "GAME OVER"}
                </h3>
                <p className="text-sm font-bold text-white/90">
                  {lang === "uz" ? "Sizning natijangiz:" : lang === "ru" ? "Ваш результат:" : "Your Score:"} {score}
                </p>
                <button
                  onClick={startGame}
                  className="mt-2 bg-[#07858B] hover:bg-[#066D73] text-white px-6 py-2.5 rounded-2xl font-bold text-xs shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  {lang === "uz" ? "Qaytadan O'ynash" : lang === "ru" ? "Играть Снова" : "Play Again"}
                </button>
              </>
            ) : isPaused ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400 text-amber-400 flex items-center justify-center">
                  <Pause className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold">{lang === "uz" ? "Pauza" : lang === "ru" ? "Пауза" : "Paused"}</h3>
                <button
                  onClick={() => setIsPaused(false)}
                  className="bg-[#07858B] hover:bg-[#066D73] text-white px-6 py-2 rounded-2xl font-bold text-xs shadow-md hover:scale-105 transition-all"
                >
                  {lang === "uz" ? "Davom ettirish" : lang === "ru" ? "Продолжить" : "Resume"}
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-[#07858B] flex items-center justify-center shadow-lg shadow-[#07858B]/30">
                  <Play className="w-7 h-7 fill-white text-white ml-0.5" />
                </div>
                <h3 className="text-xl font-extrabold">
                  {lang === "uz" ? "Klassik Ilon O'yini" : lang === "ru" ? "Классическая Змейка" : "Classic Snake"}
                </h3>
                <p className="text-xs text-white/80 max-w-xs text-center font-medium">
                  {lang === "uz"
                    ? "Tugmalar: Strelkalar yoki WASD. Ovqatlarni yeng va devorlarga urilmang!"
                    : lang === "ru"
                    ? "Управление: Стрелки или WASD. Собирайте яблоки и не врезайтесь в стены!"
                    : "Use Arrow keys or WASD. Eat apples and avoid crashing into walls!"}
                </p>
                <button
                  onClick={startGame}
                  className="bg-white text-[#07858B] hover:bg-[#E7F5F5] px-6 py-2 rounded-2xl font-bold text-xs shadow-md hover:scale-105 transition-all"
                >
                  {lang === "uz" ? "O'yinni Boshlash" : lang === "ru" ? "Начать Игру" : "Start Game"}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile Touch D-Pad */}
      <div className="flex flex-col items-center gap-1.5 pt-2">
        <button
          onClick={() => changeDirection(0, -1)}
          className="w-12 h-12 bg-white active:bg-gray-100 border border-[#E8EDF2] rounded-xl flex items-center justify-center shadow-xs"
        >
          <ArrowUp className="w-5 h-5 text-[#182536]" />
        </button>
        <div className="flex items-center gap-6">
          <button
            onClick={() => changeDirection(-1, 0)}
            className="w-12 h-12 bg-white active:bg-gray-100 border border-[#E8EDF2] rounded-xl flex items-center justify-center shadow-xs"
          >
            <ArrowLeft className="w-5 h-5 text-[#182536]" />
          </button>
          <button
            onClick={() => changeDirection(0, 1)}
            className="w-12 h-12 bg-white active:bg-gray-100 border border-[#E8EDF2] rounded-xl flex items-center justify-center shadow-xs"
          >
            <ArrowDown className="w-5 h-5 text-[#182536]" />
          </button>
          <button
            onClick={() => changeDirection(1, 0)}
            className="w-12 h-12 bg-white active:bg-gray-100 border border-[#E8EDF2] rounded-xl flex items-center justify-center shadow-xs"
          >
            <ArrowRight className="w-5 h-5 text-[#182536]" />
          </button>
        </div>
      </div>
    </div>
  );
}

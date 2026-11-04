"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Play, RotateCcw, Trophy, Heart, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

interface BrickBreakerProps {
  onGameOver?: (score: number) => void;
  lang: string;
}

const WIDTH = 420;
const HEIGHT = 460;
const PADDLE_WIDTH = 84;
const PADDLE_HEIGHT = 12;
const BALL_RADIUS = 6;
const ROWS = 4;
const COLS = 7;
const BRICK_HEIGHT = 18;
const BRICK_GAP = 6;
const BRICK_WIDTH = (WIDTH - (COLS + 1) * BRICK_GAP) / COLS;

const ROW_COLORS = ["#FF5A5F", "#F5B83D", "#22A06B", "#07858B"];
const ROW_POINTS = [40, 30, 20, 10];

interface Brick {
  x: number;
  y: number;
  color: string;
  points: number;
  alive: boolean;
}

export function BrickBreakerGame({ onGameOver, lang }: BrickBreakerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("brick_highscore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const stateRef = useRef({
    paddleX: WIDTH / 2 - PADDLE_WIDTH / 2,
    ballX: WIDTH / 2,
    ballY: HEIGHT - 60,
    ballVX: 3.5,
    ballVY: -3.5,
    bricks: [] as Brick[],
    lives: 3,
    score: 0,
    animFrame: 0,
  });

  const initBricks = (): Brick[] => {
    const bricks: Brick[] = [];
    const startY = 40;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        bricks.push({
          x: BRICK_GAP + c * (BRICK_WIDTH + BRICK_GAP),
          y: startY + r * (BRICK_HEIGHT + BRICK_GAP),
          color: ROW_COLORS[r],
          points: ROW_POINTS[r],
          alive: true,
        });
      }
    }
    return bricks;
  };

  const startGame = () => {
    stateRef.current = {
      paddleX: WIDTH / 2 - PADDLE_WIDTH / 2,
      ballX: WIDTH / 2,
      ballY: HEIGHT - 60,
      ballVX: 3.2 * (Math.random() > 0.5 ? 1 : -1),
      ballVY: -3.5,
      bricks: initBricks(),
      lives: 3,
      score: 0,
      animFrame: 0,
    };
    setScore(0);
    setLives(3);
    setIsGameOver(false);
    setIsWon(false);
    setIsPlaying(true);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const clamped = Math.max(0, Math.min(WIDTH - PADDLE_WIDTH, mouseX - PADDLE_WIDTH / 2));
    stateRef.current.paddleX = clamped;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || e.touches.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const clamped = Math.max(0, Math.min(WIDTH - PADDLE_WIDTH, touchX - PADDLE_WIDTH / 2));
    stateRef.current.paddleX = clamped;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const step = 25;
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        stateRef.current.paddleX = Math.max(0, stateRef.current.paddleX - step);
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        stateRef.current.paddleX = Math.min(WIDTH - PADDLE_WIDTH, stateRef.current.paddleX + step);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!isPlaying || isGameOver || isWon) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    const loop = () => {
      if (!running) return;
      const s = stateRef.current;

      // Move Ball
      s.ballX += s.ballVX;
      s.ballY += s.ballVY;

      // Ball Wall Collisions
      if (s.ballX - BALL_RADIUS <= 0) {
        s.ballX = BALL_RADIUS;
        s.ballVX = Math.abs(s.ballVX);
      } else if (s.ballX + BALL_RADIUS >= WIDTH) {
        s.ballX = WIDTH - BALL_RADIUS;
        s.ballVX = -Math.abs(s.ballVX);
      }

      if (s.ballY - BALL_RADIUS <= 0) {
        s.ballY = BALL_RADIUS;
        s.ballVY = Math.abs(s.ballVY);
      }

      // Paddle Collision
      const paddleY = HEIGHT - 24;
      if (
        s.ballY + BALL_RADIUS >= paddleY &&
        s.ballY - BALL_RADIUS <= paddleY + PADDLE_HEIGHT &&
        s.ballX >= s.paddleX &&
        s.ballX <= s.paddleX + PADDLE_WIDTH
      ) {
        // Reflect angle depending on where it hit paddle
        const hitPoint = (s.ballX - (s.paddleX + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2);
        s.ballVX = hitPoint * 4.5;
        s.ballVY = -Math.abs(s.ballVY);
        s.ballY = paddleY - BALL_RADIUS;
      }

      // Brick Collisions
      for (const b of s.bricks) {
        if (!b.alive) continue;
        if (
          s.ballX + BALL_RADIUS > b.x &&
          s.ballX - BALL_RADIUS < b.x + BRICK_WIDTH &&
          s.ballY + BALL_RADIUS > b.y &&
          s.ballY - BALL_RADIUS < b.y + BRICK_HEIGHT
        ) {
          b.alive = false;
          s.ballVY = -s.ballVY;
          s.score += b.points;
          setScore(s.score);

          if (s.score > highScore) {
            setHighScore(s.score);
            localStorage.setItem("brick_highscore", s.score.toString());
          }

          // Check win
          if (s.bricks.every((brick) => !brick.alive)) {
            running = false;
            setIsWon(true);
            setIsPlaying(false);
            confetti({ particleCount: 100, spread: 80 });
            if (onGameOver) onGameOver(s.score);
            return;
          }
          break;
        }
      }

      // Ball out of bottom
      if (s.ballY > HEIGHT) {
        s.lives -= 1;
        setLives(s.lives);

        if (s.lives <= 0) {
          running = false;
          setIsGameOver(true);
          setIsPlaying(false);
          if (onGameOver) onGameOver(s.score);
          return;
        } else {
          // Reset ball position
          s.ballX = WIDTH / 2;
          s.ballY = HEIGHT - 60;
          s.ballVX = 3.2 * (Math.random() > 0.5 ? 1 : -1);
          s.ballVY = -3.5;
        }
      }

      // Render Frame
      ctx.fillStyle = "#182536";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Draw Bricks
      for (const b of s.bricks) {
        if (!b.alive) continue;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, BRICK_WIDTH, BRICK_HEIGHT, 4);
        ctx.fill();
      }

      // Draw Paddle
      ctx.fillStyle = "#07858B";
      ctx.beginPath();
      ctx.roundRect(s.paddleX, paddleY, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
      ctx.fill();

      // Draw Ball
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(s.ballX, s.ballY, BALL_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      s.animFrame = requestAnimationFrame(loop);
    };

    stateRef.current.animFrame = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(stateRef.current.animFrame);
    };
  }, [isPlaying, isGameOver, isWon, highScore, onGameOver]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 select-none">
      {/* Top Bar Info */}
      <div className="flex items-center justify-between w-full max-w-[420px] px-4 py-2 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF2] text-xs font-bold text-[#182536]">
        <div className="flex items-center gap-1.5 text-rose-500">
          {Array.from({ length: 3 }).map((_, i) => (
            <Heart
              key={i}
              className={`w-4 h-4 ${i < lives ? "fill-rose-500 text-rose-500" : "text-gray-300"}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1 text-amber-600">
            <Trophy className="w-3.5 h-3.5" />
            {highScore}
          </span>
          <span className="text-sm font-extrabold text-[#07858B]">{score}</span>
        </div>
      </div>

      {/* Canvas Wrapper */}
      <div
        className="relative overflow-hidden rounded-3xl border-2 border-[#E8EDF2] shadow-lg bg-[#182536]"
        style={{ width: WIDTH, maxWidth: "100%", height: HEIGHT }}
      >
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          className="w-full h-full block cursor-ew-resize"
        />

        {/* Start / Game Over / Win Overlay */}
        {(!isPlaying || isGameOver || isWon) && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-white z-20">
            {isWon ? (
              <>
                <Sparkles className="w-12 h-12 text-[#F5B83D]" />
                <h3 className="text-2xl font-black">{lang === "uz" ? "BARCHA G'ISHTLAR SINDILDI!" : "YOU CLEARED ALL BRICKS!"}</h3>
                <p className="text-sm font-bold text-white/90">
                  {lang === "uz" ? "Ball:" : "Score:"} {score}
                </p>
                <button
                  onClick={startGame}
                  className="mt-2 bg-[#07858B] hover:bg-[#066D73] text-white px-6 py-2.5 rounded-2xl font-bold text-xs shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  {lang === "uz" ? "Qaytadan O'ynash" : "Play Again"}
                </button>
              </>
            ) : isGameOver ? (
              <>
                <h3 className="text-2xl font-black text-white drop-shadow-md">
                  {lang === "uz" ? "O'YIN YAKUNLANDI" : "GAME OVER"}
                </h3>
                <p className="text-sm font-bold text-white/90">
                  {lang === "uz" ? "To'plangan ball:" : "Score:"} {score}
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
                <h3 className="text-xl font-extrabold">Brick Breaker</h3>
                <p className="text-xs text-white/80 max-w-xs text-center font-medium">
                  {lang === "uz"
                    ? "Sichqoncha yoki strelkalar bilan platformani boshqaring va to'pni qaytaring!"
                    : "Move paddle with mouse, touch or arrow keys to bounce the ball!"}
                </p>
                <button
                  onClick={startGame}
                  className="bg-white text-[#07858B] hover:bg-[#E7F5F5] px-6 py-2 rounded-2xl font-bold text-xs shadow-md hover:scale-105 transition-all"
                >
                  {lang === "uz" ? "O'yinni Boshlash" : "Start Game"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

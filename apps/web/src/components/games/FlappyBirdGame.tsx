"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Play, RotateCcw, Trophy, ArrowUp } from "lucide-react";
import confetti from "canvas-confetti";

interface FlappyBirdProps {
  onGameOver?: (score: number) => void;
  lang: string;
}

const WIDTH = 380;
const HEIGHT = 460;
const GRAVITY = 0.38;
const FLAP = -6.8;
const PIPE_WIDTH = 52;
const PIPE_GAP = 125;
const PIPE_SPEED = 2.4;

export function FlappyBirdGame({ onGameOver, lang }: FlappyBirdProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("flappy_highscore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const stateRef = useRef({
    birdY: HEIGHT / 2,
    birdVY: 0,
    pipes: [] as { x: number; topHeight: number; passed: boolean }[],
    score: 0,
    animFrame: 0,
    lastPipe: 0,
  });

  const flap = useCallback(() => {
    if (!isPlaying || isGameOver) return;
    stateRef.current.birdVY = FLAP;
  }, [isPlaying, isGameOver]);

  const startGame = () => {
    stateRef.current = {
      birdY: HEIGHT / 2,
      birdVY: 0,
      pipes: [
        { x: WIDTH + 80, topHeight: 120, passed: false },
        { x: WIDTH + 240, topHeight: 180, passed: false },
      ],
      score: 0,
      animFrame: 0,
      lastPipe: Date.now(),
    };
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (!isPlaying || isGameOver) startGame();
        else flap();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isGameOver, flap]);

  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let running = true;

    const loop = () => {
      if (!running) return;
      const s = stateRef.current;

      // Bird physics
      s.birdVY += GRAVITY;
      s.birdY += s.birdVY;

      // Ground or ceiling collision
      if (s.birdY > HEIGHT - 30 || s.birdY < 10) {
        running = false;
        setIsGameOver(true);
        if (s.score > highScore) {
          setHighScore(s.score);
          localStorage.setItem("flappy_highscore", s.score.toString());
          confetti({ particleCount: 70, spread: 60 });
        }
        if (onGameOver) onGameOver(s.score * 10);
        return;
      }

      // Move pipes
      for (let i = s.pipes.length - 1; i >= 0; i--) {
        const pipe = s.pipes[i];
        pipe.x -= PIPE_SPEED;

        // Check passed
        if (!pipe.passed && pipe.x + PIPE_WIDTH < 70) {
          pipe.passed = true;
          s.score += 1;
          setScore(s.score);
          if (s.score > highScore) {
            setHighScore(s.score);
            localStorage.setItem("flappy_highscore", s.score.toString());
          }
        }

        // Remove offscreen
        if (pipe.x < -PIPE_WIDTH) {
          s.pipes.splice(i, 1);
        }

        // Pipe collision
        const birdX = 70;
        const birdRadius = 14;
        const inPipeX = birdX + birdRadius > pipe.x && birdX - birdRadius < pipe.x + PIPE_WIDTH;
        const hitTopPipe = s.birdY - birdRadius < pipe.topHeight;
        const hitBottomPipe = s.birdY + birdRadius > pipe.topHeight + PIPE_GAP;

        if (inPipeX && (hitTopPipe || hitBottomPipe)) {
          running = false;
          setIsGameOver(true);
          if (s.score > highScore) {
            setHighScore(s.score);
            localStorage.setItem("flappy_highscore", s.score.toString());
            confetti({ particleCount: 70, spread: 60 });
          }
          if (onGameOver) onGameOver(s.score * 10);
          return;
        }
      }

      // Spawn pipes
      const last = s.pipes[s.pipes.length - 1];
      if (!last || last.x < WIDTH - 150) {
        const minTop = 60;
        const maxTop = HEIGHT - PIPE_GAP - 80;
        const topHeight = minTop + Math.random() * (maxTop - minTop);
        s.pipes.push({ x: WIDTH, topHeight, passed: false });
      }

      // Render Frame
      // Sky Background
      ctx.fillStyle = "#70C5CE";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Clouds
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(80, 70, 25, 0, Math.PI * 2);
      ctx.arc(105, 60, 30, 0, Math.PI * 2);
      ctx.arc(130, 70, 25, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(280, 110, 20, 0, Math.PI * 2);
      ctx.arc(300, 100, 25, 0, Math.PI * 2);
      ctx.arc(320, 110, 20, 0, Math.PI * 2);
      ctx.fill();

      // Pipes
      for (const pipe of s.pipes) {
        // Top Pipe
        ctx.fillStyle = "#73BF2E";
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        ctx.fillStyle = "#558022";
        ctx.fillRect(pipe.x - 3, pipe.topHeight - 20, PIPE_WIDTH + 6, 20);

        // Bottom Pipe
        const bottomY = pipe.topHeight + PIPE_GAP;
        const bottomHeight = HEIGHT - bottomY;
        ctx.fillStyle = "#73BF2E";
        ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, bottomHeight);
        ctx.fillStyle = "#558022";
        ctx.fillRect(pipe.x - 3, bottomY, PIPE_WIDTH + 6, 20);
      }

      // Ground
      ctx.fillStyle = "#DED895";
      ctx.fillRect(0, HEIGHT - 25, WIDTH, 25);
      ctx.fillStyle = "#73BF2E";
      ctx.fillRect(0, HEIGHT - 25, WIDTH, 6);

      // Bird
      const birdX = 70;
      ctx.save();
      ctx.translate(birdX, s.birdY);
      const angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (s.birdVY * 4 * Math.PI) / 180));
      ctx.rotate(angle);

      // Body (Yellow / Amber)
      ctx.fillStyle = "#F5B83D";
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      // Wing
      ctx.fillStyle = "#FF9B45";
      ctx.beginPath();
      ctx.ellipse(-4, 2, 7, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(6, -4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#182536";
      ctx.beginPath();
      ctx.arc(7, -4, 2, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = "#E05252";
      ctx.beginPath();
      ctx.moveTo(11, -1);
      ctx.lineTo(19, 2);
      ctx.lineTo(11, 6);
      ctx.fill();

      ctx.restore();

      s.animFrame = requestAnimationFrame(loop);
    };

    stateRef.current.animFrame = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(stateRef.current.animFrame);
    };
  }, [isPlaying, isGameOver, highScore, onGameOver]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 select-none">
      {/* Top Bar Info */}
      <div className="flex items-center justify-between w-full max-w-[380px] px-4 py-2 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF2] text-xs font-bold text-[#182536]">
        <div className="flex items-center gap-2 text-[#7B8794]">
          <span>Flappy Bird</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 text-amber-600">
            <Trophy className="w-3.5 h-3.5" />
            {lang === "uz" ? "Rekord" : "HI"}: {highScore}
          </span>
          <span className="text-sm font-extrabold text-[#07858B]">{score}</span>
        </div>
      </div>

      {/* Canvas Wrapper */}
      <div
        onClick={() => {
          if (!isPlaying || isGameOver) startGame();
          else flap();
        }}
        className="relative cursor-pointer overflow-hidden rounded-3xl border-2 border-[#E8EDF2] shadow-lg bg-[#70C5CE]"
        style={{ width: WIDTH, maxWidth: "100%", height: HEIGHT }}
      >
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="w-full h-full block" />

        {/* Start / Game Over Overlay */}
        {(!isPlaying || isGameOver) && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-white z-20">
            {isGameOver ? (
              <>
                <h3 className="text-2xl font-black text-white drop-shadow-md">
                  {lang === "uz" ? "O'YIN YAKUNLANDI" : "GAME OVER"}
                </h3>
                <p className="text-sm font-bold text-white/90">
                  {lang === "uz" ? "To'plangan ball:" : "Score:"} {score}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startGame();
                  }}
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
                <h3 className="text-xl font-extrabold">Flappy Bird</h3>
                <p className="text-xs text-white/80 max-w-xs text-center font-medium">
                  {lang === "uz"
                    ? "Sakrash uchun SPACE bosing yoki ekranga teging!"
                    : "Press SPACE or TAP screen to flap upwards!"}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startGame();
                  }}
                  className="bg-white text-[#07858B] hover:bg-[#E7F5F5] px-6 py-2 rounded-2xl font-bold text-xs shadow-md hover:scale-105 transition-all"
                >
                  {lang === "uz" ? "O'yinni Boshlash" : "Start Game"}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile Flap Button */}
      <div className="flex sm:hidden w-full max-w-[380px] justify-center">
        <button
          onClick={flap}
          disabled={!isPlaying || isGameOver}
          className="w-full bg-[#07858B] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-md active:bg-[#066D73]"
        >
          <ArrowUp className="w-5 h-5" />
          <span>{lang === "uz" ? "UCHISH (FLAP)" : "FLAP"}</span>
        </button>
      </div>
    </div>
  );
}

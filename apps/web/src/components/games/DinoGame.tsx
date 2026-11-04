"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Play, RotateCcw, Trophy, ArrowUp } from "lucide-react";
import confetti from "canvas-confetti";

interface DinoGameProps {
  onGameOver?: (score: number) => void;
  lang: string;
}

export function DinoGame({ onGameOver, lang }: DinoGameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Load high score from storage
  useEffect(() => {
    const saved = localStorage.getItem("dino_highscore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const stateRef = useRef({
    dinoY: 0,
    dinoVY: 0,
    isJumping: false,
    obstacles: [] as { x: number; width: number; height: number; type: "cactus" | "bird" }[],
    clouds: [] as { x: number; y: number; speed: number }[],
    speed: 5,
    score: 0,
    groundY: 170,
    animationFrameId: 0,
    lastSpawn: 0,
  });

  const jump = useCallback(() => {
    const s = stateRef.current;
    if (!s.isJumping && isPlaying && !isGameOver) {
      s.dinoVY = -12;
      s.isJumping = true;
    }
  }, [isPlaying, isGameOver]);

  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setScore(0);
    const s = stateRef.current;
    s.dinoY = 0;
    s.dinoVY = 0;
    s.isJumping = false;
    s.obstacles = [];
    s.clouds = [
      { x: 100, y: 30, speed: 1 },
      { x: 300, y: 50, speed: 0.8 },
      { x: 500, y: 25, speed: 1.2 },
    ];
    s.speed = 5.5;
    s.score = 0;
    s.lastSpawn = Date.now();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") {
        e.preventDefault();
        if (!isPlaying || isGameOver) {
          startGame();
        } else {
          jump();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isPlaying, isGameOver, jump]);

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

      // Update score & speed
      s.score += 1;
      setScore(Math.floor(s.score / 5));
      if (s.score % 250 === 0) {
        s.speed += 0.35;
      }

      // Physics: Dino gravity
      s.dinoY += s.dinoVY;
      s.dinoVY += 0.75; // gravity
      if (s.dinoY >= 0) {
        s.dinoY = 0;
        s.dinoVY = 0;
        s.isJumping = false;
      }

      // Spawn obstacles
      const now = Date.now();
      if (now - s.lastSpawn > 1400 - Math.min(600, s.speed * 40)) {
        if (Math.random() > 0.3) {
          const isBird = s.score > 400 && Math.random() > 0.65;
          s.obstacles.push({
            x: canvas.width + 20,
            width: isBird ? 30 : 20 + Math.random() * 15,
            height: isBird ? 22 : 35 + Math.random() * 15,
            type: isBird ? "bird" : "cactus",
          });
          s.lastSpawn = now;
        }
      }

      // Move obstacles
      for (let i = s.obstacles.length - 1; i >= 0; i--) {
        s.obstacles[i].x -= s.speed;
        if (s.obstacles[i].x < -50) {
          s.obstacles.splice(i, 1);
        }
      }

      // Move clouds
      for (const c of s.clouds) {
        c.x -= c.speed;
        if (c.x < -60) c.x = canvas.width + 40;
      }

      // Collision detection
      const dinoBox = {
        x: 50,
        y: s.groundY - 40 + s.dinoY,
        width: 38,
        height: 40,
      };

      for (const obs of s.obstacles) {
        const obsY = obs.type === "bird" ? s.groundY - 65 : s.groundY - obs.height;
        if (
          dinoBox.x + 8 < obs.x + obs.width &&
          dinoBox.x + dinoBox.width - 8 > obs.x &&
          dinoBox.y + 6 < obsY + obs.height &&
          dinoBox.y + dinoBox.height > obsY + 6
        ) {
          // Collision!
          running = false;
          setIsGameOver(true);
          const finalScore = Math.floor(s.score / 5);
          if (finalScore > highScore) {
            setHighScore(finalScore);
            localStorage.setItem("dino_highscore", finalScore.toString());
            confetti({ particleCount: 80, spread: 70 });
          }
          if (onGameOver) onGameOver(finalScore);
          return;
        }
      }

      // Render
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background Sky
      ctx.fillStyle = "#F7F9FC";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Clouds
      ctx.fillStyle = "#D0D7DE";
      for (const c of s.clouds) {
        ctx.beginPath();
        ctx.arc(c.x, c.y, 14, 0, Math.PI * 2);
        ctx.arc(c.x + 12, c.y - 6, 16, 0, Math.PI * 2);
        ctx.arc(c.x + 24, c.y, 14, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ground Line
      ctx.strokeStyle = "#8C9BAE";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, s.groundY);
      ctx.lineTo(canvas.width, s.groundY);
      ctx.stroke();

      // Ground bumps
      ctx.fillStyle = "#7B8794";
      const groundOffset = (s.score * 2) % 40;
      for (let x = -groundOffset; x < canvas.width; x += 35) {
        ctx.fillRect(x, s.groundY + 4, 12, 2);
      }

      // Draw Dino (Teal Stylized T-Rex)
      const dy = s.groundY - 42 + s.dinoY;
      ctx.fillStyle = "#07858B";

      // Body & Head
      ctx.beginPath();
      ctx.roundRect(50, dy, 32, 34, 6);
      ctx.fill();

      // Eye
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(72, dy + 6, 4, 4);

      // Snout
      ctx.fillStyle = "#066D73";
      ctx.fillRect(74, dy + 14, 8, 8);

      // Legs animation
      ctx.fillStyle = "#07858B";
      if (!s.isJumping) {
        const step = Math.floor(s.score / 4) % 2;
        if (step === 0) {
          ctx.fillRect(54, dy + 34, 6, 8);
          ctx.fillRect(68, dy + 34, 6, 4);
        } else {
          ctx.fillRect(54, dy + 34, 6, 4);
          ctx.fillRect(68, dy + 34, 6, 8);
        }
      } else {
        ctx.fillRect(54, dy + 34, 6, 6);
        ctx.fillRect(66, dy + 34, 6, 6);
      }

      // Draw Obstacles
      for (const obs of s.obstacles) {
        if (obs.type === "cactus") {
          const cy = s.groundY - obs.height;
          // Main stem
          ctx.fillStyle = "#22A06B";
          ctx.beginPath();
          ctx.roundRect(obs.x + obs.width / 4, cy, obs.width / 2, obs.height, 4);
          ctx.fill();
          // Arms
          ctx.fillRect(obs.x, cy + obs.height * 0.35, obs.width, 5);
          ctx.fillRect(obs.x, cy + obs.height * 0.2, 5, obs.height * 0.25);
          ctx.fillRect(obs.x + obs.width - 5, cy + obs.height * 0.25, 5, obs.height * 0.25);
        } else {
          // Bird (pterodactyl)
          const by = s.groundY - 65;
          ctx.fillStyle = "#E05252";
          ctx.beginPath();
          ctx.arc(obs.x + 15, by + 10, 8, 0, Math.PI * 2);
          ctx.fill();
          // Wings flapping
          const wingUp = Math.floor(s.score / 5) % 2 === 0;
          ctx.beginPath();
          ctx.moveTo(obs.x + 15, by + 10);
          ctx.lineTo(obs.x + 5, wingUp ? by - 6 : by + 20);
          ctx.lineTo(obs.x + 25, by + 10);
          ctx.fill();
        }
      }

      s.animationFrameId = requestAnimationFrame(loop);
    };

    stateRef.current.animationFrameId = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(stateRef.current.animationFrameId);
    };
  }, [isPlaying, isGameOver, highScore, onGameOver]);

  return (
    <div className="flex flex-col items-center justify-center space-y-4 select-none">
      {/* Top Bar Info */}
      <div className="flex items-center justify-between w-full max-w-xl px-4 py-2 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF2] text-xs font-bold text-[#182536]">
        <div className="flex items-center gap-2 text-[#7B8794]">
          <span>{lang === "uz" ? "Dino Run (Sakrash)" : lang === "ru" ? "Dino Run" : "Dino Runner"}</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 text-amber-600">
            <Trophy className="w-3.5 h-3.5" />
            {lang === "uz" ? "Rekord" : lang === "ru" ? "Рекорд" : "HI"}: {highScore}
          </span>
          <span className="text-sm font-extrabold text-[#07858B]">
            {score.toString().padStart(5, "0")}
          </span>
        </div>
      </div>

      {/* Canvas Wrapper */}
      <div
        onClick={() => {
          if (!isPlaying || isGameOver) startGame();
          else jump();
        }}
        className="relative cursor-pointer overflow-hidden rounded-3xl border-2 border-[#E8EDF2] bg-white shadow-md hover:shadow-lg transition-all"
        style={{ width: 620, maxWidth: "100%", height: 220 }}
      >
        <canvas
          ref={canvasRef}
          width={620}
          height={220}
          className="w-full h-full block"
        />

        {/* Start / Game Over Overlay */}
        {(!isPlaying || isGameOver) && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-white z-20">
            {isGameOver ? (
              <>
                <h3 className="text-2xl font-black tracking-tight text-white drop-shadow-md">
                  {lang === "uz" ? "O'YIN YAKUNLANDI" : lang === "ru" ? "ИГРА ОКОНЧЕНА" : "GAME OVER"}
                </h3>
                <p className="text-sm font-bold text-white/90">
                  {lang === "uz" ? "Sizning natijangiz:" : lang === "ru" ? "Ваш результат:" : "Your Score:"} {score}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startGame();
                  }}
                  className="mt-2 bg-[#07858B] hover:bg-[#066D73] text-white px-6 py-2.5 rounded-2xl font-bold text-xs shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  {lang === "uz" ? "Qaytadan O'ynash" : lang === "ru" ? "Играть Снова" : "Restart"}
                </button>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-[#07858B] flex items-center justify-center shadow-lg shadow-[#07858B]/30">
                  <Play className="w-7 h-7 fill-white text-white ml-0.5" />
                </div>
                <h3 className="text-xl font-extrabold">
                  {lang === "uz" ? "Dino Run O'yini" : lang === "ru" ? "Dino Run" : "Dino Run"}
                </h3>
                <p className="text-xs text-white/80 max-w-xs text-center font-medium">
                  {lang === "uz"
                    ? "Sakrash uchun SPACE bosing yoki ekranga teging!"
                    : lang === "ru"
                    ? "Нажмите ПРОБЕЛ или кликните по экрану для прыжка!"
                    : "Press SPACE or TAP screen to jump over cacti!"}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startGame();
                  }}
                  className="bg-white text-[#07858B] hover:bg-[#E7F5F5] px-6 py-2 rounded-2xl font-bold text-xs shadow-md hover:scale-105 transition-all"
                >
                  {lang === "uz" ? "Boshlash" : lang === "ru" ? "Старт" : "Start Game"}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Touch Jump Button for Mobile */}
      <div className="flex sm:hidden w-full max-w-xl justify-center">
        <button
          onClick={jump}
          disabled={!isPlaying || isGameOver}
          className="w-full bg-[#07858B] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-md active:bg-[#066D73]"
        >
          <ArrowUp className="w-5 h-5" />
          <span>{lang === "uz" ? "SAKRASH" : lang === "ru" ? "ПРЫЖОК" : "JUMP"}</span>
        </button>
      </div>
    </div>
  );
}

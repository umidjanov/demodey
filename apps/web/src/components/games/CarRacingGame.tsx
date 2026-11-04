"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Play, RotateCcw, Trophy, ArrowLeft, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

interface CarRacingProps {
  onGameOver?: (score: number) => void;
  lang: string;
}

const WIDTH = 360;
const HEIGHT = 460;
const LANES = [WIDTH * 0.22, WIDTH * 0.5, WIDTH * 0.78];
const CAR_WIDTH = 42;
const CAR_HEIGHT = 68;

interface EnemyCar {
  x: number;
  y: number;
  color: string;
  speed: number;
}

const ENEMY_COLORS = ["#FF5A5F", "#F5B83D", "#9B51E0", "#22A06B"];

export function CarRacingGame({ onGameOver, lang }: CarRacingProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("car_highscore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const stateRef = useRef({
    currentLane: 1, // 0: left, 1: middle, 2: right
    playerX: LANES[1],
    targetX: LANES[1],
    enemies: [] as EnemyCar[],
    roadOffset: 0,
    speed: 5.5,
    score: 0,
    lastSpawn: 0,
    animFrame: 0,
  });

  const moveLane = useCallback((dir: -1 | 1) => {
    const s = stateRef.current;
    const next = Math.max(0, Math.min(2, s.currentLane + dir));
    s.currentLane = next;
    s.targetX = LANES[next];
  }, []);

  const startGame = () => {
    stateRef.current = {
      currentLane: 1,
      playerX: LANES[1],
      targetX: LANES[1],
      enemies: [],
      roadOffset: 0,
      speed: 5.5,
      score: 0,
      lastSpawn: Date.now(),
      animFrame: 0,
    };
    setScore(0);
    setIsGameOver(false);
    setIsPlaying(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "ArrowLeft" || e.code === "KeyA") {
        e.preventDefault();
        moveLane(-1);
      } else if (e.code === "ArrowRight" || e.code === "KeyD") {
        e.preventDefault();
        moveLane(1);
      } else if (e.code === "Space" && (!isPlaying || isGameOver)) {
        e.preventDefault();
        startGame();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moveLane, isPlaying, isGameOver]);

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

      // Smooth horizontal lerp
      s.playerX += (s.targetX - s.playerX) * 0.25;

      // Road scroll
      s.roadOffset = (s.roadOffset + s.speed) % 40;

      // Score
      s.score += 1;
      setScore(Math.floor(s.score / 6));

      if (s.score % 300 === 0) {
        s.speed += 0.3;
      }

      // Spawn Enemy Cars
      const now = Date.now();
      const spawnInterval = Math.max(700, 1400 - (s.speed - 5.5) * 80);
      if (now - s.lastSpawn > spawnInterval) {
        const laneIdx = Math.floor(Math.random() * 3);
        const color = ENEMY_COLORS[Math.floor(Math.random() * ENEMY_COLORS.length)];
        s.enemies.push({
          x: LANES[laneIdx],
          y: -CAR_HEIGHT - 20,
          color,
          speed: s.speed * (0.6 + Math.random() * 0.3),
        });
        s.lastSpawn = now;
      }

      // Move Enemies
      const playerY = HEIGHT - CAR_HEIGHT - 25;
      for (let i = s.enemies.length - 1; i >= 0; i--) {
        const enemy = s.enemies[i];
        enemy.y += s.speed - 1.5;

        // Collision Check
        const dx = Math.abs(s.playerX - enemy.x);
        const dy = Math.abs(playerY - enemy.y);
        if (dx < CAR_WIDTH * 0.85 && dy < CAR_HEIGHT * 0.85) {
          // Crash!
          running = false;
          setIsGameOver(true);
          const finalScore = Math.floor(s.score / 6);
          if (finalScore > highScore) {
            setHighScore(finalScore);
            localStorage.setItem("car_highscore", finalScore.toString());
            confetti({ particleCount: 70, spread: 60 });
          }
          if (onGameOver) onGameOver(finalScore);
          return;
        }

        if (enemy.y > HEIGHT + 50) {
          s.enemies.splice(i, 1);
        }
      }

      // Render Frame
      // Asphalt Road
      ctx.fillStyle = "#2D3748";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Road Shoulders
      ctx.fillStyle = "#E05252";
      ctx.fillRect(0, 0, 12, HEIGHT);
      ctx.fillRect(WIDTH - 12, 0, 12, HEIGHT);

      // Alternating shoulder stripes
      ctx.fillStyle = "#FFFFFF";
      for (let y = -40 + s.roadOffset; y < HEIGHT; y += 40) {
        ctx.fillRect(0, y, 12, 20);
        ctx.fillRect(WIDTH - 12, y, 12, 20);
      }

      // Dashed Lane Dividers
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 4;
      ctx.setLineDash([20, 20]);
      ctx.lineDashOffset = -s.roadOffset;

      // Divider 1
      ctx.beginPath();
      ctx.moveTo(WIDTH * 0.36, 0);
      ctx.lineTo(WIDTH * 0.36, HEIGHT);
      ctx.stroke();

      // Divider 2
      ctx.beginPath();
      ctx.moveTo(WIDTH * 0.64, 0);
      ctx.lineTo(WIDTH * 0.64, HEIGHT);
      ctx.stroke();

      ctx.setLineDash([]); // reset dash

      // Draw Enemy Cars
      for (const enemy of s.enemies) {
        drawCar(ctx, enemy.x, enemy.y, enemy.color, true);
      }

      // Draw Player Car (Teal)
      drawCar(ctx, s.playerX, playerY, "#07858B", false);

      s.animFrame = requestAnimationFrame(loop);
    };

    stateRef.current.animFrame = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(stateRef.current.animFrame);
    };
  }, [isPlaying, isGameOver, highScore, onGameOver]);

  const drawCar = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    color: string,
    isEnemy: boolean
  ) => {
    ctx.save();
    ctx.translate(x, y);

    // Car Shadow
    ctx.fillStyle = "rgba(0,0,0,0.25)";
    ctx.beginPath();
    ctx.roundRect(-CAR_WIDTH / 2 + 3, 3, CAR_WIDTH, CAR_HEIGHT, 10);
    ctx.fill();

    // Wheels
    ctx.fillStyle = "#182536";
    ctx.fillRect(-CAR_WIDTH / 2 - 2, 8, 4, 14);
    ctx.fillRect(CAR_WIDTH / 2 - 2, 8, 4, 14);
    ctx.fillRect(-CAR_WIDTH / 2 - 2, CAR_HEIGHT - 22, 4, 14);
    ctx.fillRect(CAR_WIDTH / 2 - 2, CAR_HEIGHT - 22, 4, 14);

    // Main Chassis
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-CAR_WIDTH / 2, 0, CAR_WIDTH, CAR_HEIGHT, 10);
    ctx.fill();

    // Windshield & Roof
    ctx.fillStyle = "#182536";
    ctx.beginPath();
    ctx.roundRect(-CAR_WIDTH / 2 + 5, isEnemy ? 22 : 16, CAR_WIDTH - 10, 24, 4);
    ctx.fill();

    // Headlights
    ctx.fillStyle = isEnemy ? "#FF5A5F" : "#F5B83D";
    ctx.fillRect(-CAR_WIDTH / 2 + 4, isEnemy ? CAR_HEIGHT - 5 : 2, 7, 3);
    ctx.fillRect(CAR_WIDTH / 2 - 11, isEnemy ? CAR_HEIGHT - 5 : 2, 7, 3);

    ctx.restore();
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 select-none">
      {/* Top Bar Info */}
      <div className="flex items-center justify-between w-full max-w-[360px] px-4 py-2 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF2] text-xs font-bold text-[#182536]">
        <div className="flex items-center gap-2 text-[#7B8794]">
          <span>Car Racing</span>
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
        className="relative overflow-hidden rounded-3xl border-2 border-[#E8EDF2] shadow-lg bg-[#2D3748]"
        style={{ width: WIDTH, maxWidth: "100%", height: HEIGHT }}
      >
        <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="w-full h-full block" />

        {/* Start / Game Over Overlay */}
        {(!isPlaying || isGameOver) && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-white z-20">
            {isGameOver ? (
              <>
                <h3 className="text-2xl font-black text-white drop-shadow-md">
                  {lang === "uz" ? "AVARIYA! O'YIN YAKUNLANDI" : "CRASH! GAME OVER"}
                </h3>
                <p className="text-sm font-bold text-white/90">
                  {lang === "uz" ? "Bosib o'tilgan masofa:" : "Distance:"} {score}m
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
                <h3 className="text-xl font-extrabold">2D Car Racing</h3>
                <p className="text-xs text-white/80 max-w-xs text-center font-medium">
                  {lang === "uz"
                    ? "Chap va O'ng strelkalar bilan qatorni o'zgartiring va mashinalardan qoching!"
                    : "Use Left & Right arrow keys to change lanes and dodge oncoming cars!"}
                </p>
                <button
                  onClick={startGame}
                  className="bg-white text-[#07858B] hover:bg-[#E7F5F5] px-6 py-2 rounded-2xl font-bold text-xs shadow-md hover:scale-105 transition-all"
                >
                  {lang === "uz" ? "O'yinni Boshlash" : "Start Race"}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile Steering Buttons */}
      <div className="flex items-center justify-center gap-6 w-full max-w-[360px]">
        <button
          onClick={() => moveLane(-1)}
          disabled={!isPlaying || isGameOver}
          className="flex-1 bg-white active:bg-gray-100 border border-[#E8EDF2] py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-xs font-bold text-xs text-[#182536]"
        >
          <ArrowLeft className="w-5 h-5 text-[#07858B]" />
          <span>{lang === "uz" ? "CHAPGA" : "LEFT"}</span>
        </button>
        <button
          onClick={() => moveLane(1)}
          disabled={!isPlaying || isGameOver}
          className="flex-1 bg-white active:bg-gray-100 border border-[#E8EDF2] py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-xs font-bold text-xs text-[#182536]"
        >
          <span>{lang === "uz" ? "O'NGGA" : "RIGHT"}</span>
          <ArrowRight className="w-5 h-5 text-[#07858B]" />
        </button>
      </div>
    </div>
  );
}

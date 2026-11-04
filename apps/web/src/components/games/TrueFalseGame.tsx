"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Trophy, Clock, CheckCircle2, XCircle } from "lucide-react";
import confetti from "canvas-confetti";

interface TrueFalseProps {
  onGameOver?: (score: number) => void;
  lang: string;
}

interface TFQuestion {
  qUz: string;
  qRu: string;
  qEn: string;
  isTrue: boolean;
  explUz: string;
  explRu: string;
  explEn: string;
}

const TF_DATA: TFQuestion[] = [
  {
    qUz: "Amir Temur 1336-yilda Kesh (Shahrisabz) yaqinida tavallud topgan.",
    qRu: "Амир Темур родился в 1336 году близ Кеша (Шахрисабза).",
    qEn: "Amir Timur was born in 1336 near Kesh (Shahrisabz).",
    isTrue: true,
    explUz: "1336-yil 9-aprelda Xo'ja Ilg'or qishlog'ida tug'ilgan.",
    explRu: "Родился 9 апреля 1336 года в селении Ходжа-Ильгар.",
    explEn: "Born on April 9, 1336, in the village of Khoja Ilgar.",
  },
  {
    qUz: "Har qanday noldan farqli sonning 0-darajasi 0 ga teng.",
    qRu: "Любое ненулевое число в степени 0 равно 0.",
    qEn: "Any non-zero number raised to the power of 0 equals 0.",
    isTrue: false,
    explUz: "Qoidaga ko'ra a^0 = 1 (a ≠ 0).",
    explRu: "По правилу степеней a^0 = 1 (a ≠ 0).",
    explEn: "By exponent rules, a^0 = 1 (where a ≠ 0).",
  },
  {
    qUz: "O'zbek tilida 6 ta unli fonema (tovush) mavjud.",
    qRu: "В узбекском языке существует 6 гласных звуков.",
    qEn: "The Uzbek language has 6 vowel phonemes.",
    isTrue: true,
    explUz: "a, o, i, u, o', e unlilari mavjud.",
    explRu: "Гласные: a, o, i, u, o', e.",
    explEn: "The vowels are: a, o, i, u, o', e.",
  },
  {
    qUz: "Yorug'lik tezligi tovush tezligidan sekinroq harakatlanadi.",
    qRu: "Скорость света медленнее скорости звука.",
    qEn: "The speed of light is slower than the speed of sound.",
    isTrue: false,
    explUz: "Yorug'lik tezligi ~300 000 km/s, tovush esa havoda ~340 m/s.",
    explRu: "Скорость света ~300 000 км/с, а звука в воздухе ~340 м/с.",
    explEn: "Light travels at ~300,000 km/s while sound travels at ~340 m/s.",
  },
  {
    qUz: "Pifagor teoremasi faqat to'g'ri burchakli uchburchaklar uchun o'rinlidir.",
    qRu: "Теорема Пифагора применима только к прямоугольным треугольникам.",
    qEn: "The Pythagorean theorem applies exclusively to right-angled triangles.",
    isTrue: true,
    explUz: "c² = a² + b² faqat to'g'ri burchakli uchburchakda ishlaydi.",
    explRu: "c² = a² + b² верно только для прямоугольного треугольника.",
    explEn: "c² = a² + b² holds strictly for right triangles.",
  },
  {
    qUz: "Yer Quyosh atrofida to'liq bitta aylanishni 24 soatda amalga oshiradi.",
    qRu: "Земля делает полный оборот вокруг Солнца за 24 часа.",
    qEn: "The Earth completes one full orbit around the Sun in 24 hours.",
    isTrue: false,
    explUz: "24 soat o'z o'qi atrofida aylanish vaqti. Quyosh atrofida esa 365 kunda aylanadi.",
    explRu: "24 часа — оборот вокруг своей оси. Вокруг Солнца — 365 дней.",
    explEn: "24 hours is rotation on its axis. Orbit around the Sun takes 365 days.",
  },
];

export function TrueFalseGame({ onGameOver, lang }: TrueFalseProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [highScore, setHighScore] = useState(0);
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("tf_highscore");
    if (saved) setHighScore(parseInt(saved, 10));
  }, []);

  const startGame = () => {
    setScore(0);
    setTimeLeft(30);
    setCurrentIndex(0);
    setFeedback(null);
    setIsGameOver(false);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          setIsGameOver(true);
          setIsPlaying(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, isGameOver]);

  useEffect(() => {
    if (isGameOver) {
      if (score > highScore) {
        setHighScore(score);
        localStorage.setItem("tf_highscore", score.toString());
        confetti({ particleCount: 70, spread: 60 });
      }
      if (onGameOver) onGameOver(score);
    }
  }, [isGameOver, score, highScore, onGameOver]);

  const handleAnswer = (userChoice: boolean) => {
    if (feedback !== null) return;

    const currentItem = TF_DATA[currentIndex % TF_DATA.length];
    const isCorrect = userChoice === currentItem.isTrue;

    setFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) {
      setScore((s) => s + 10);
      setTimeLeft((t) => Math.min(35, t + 1));
    } else {
      setScore((s) => Math.max(0, s - 5));
    }

    setTimeout(() => {
      setFeedback(null);
      setCurrentIndex((i) => i + 1);
    }, 450);
  };

  const item = TF_DATA[currentIndex % TF_DATA.length];
  const questionText = lang === "uz" ? item.qUz : lang === "ru" ? item.qRu : item.qEn;

  return (
    <div className="flex flex-col items-center justify-center space-y-4 select-none">
      {/* Top Bar Info */}
      <div className="flex items-center justify-between w-full max-w-[400px] px-4 py-2 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF2] text-xs font-bold text-[#182536]">
        <div className="flex items-center gap-1.5 text-[#FF9B45]">
          <Clock className="w-3.5 h-3.5" />
          <span>{timeLeft}s</span>
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
      <div className="relative p-6 bg-white border-2 border-[#E8EDF2] rounded-3xl shadow-lg w-[400px] max-w-full min-h-[320px] flex flex-col justify-between items-center text-center">
        {(!isPlaying || isGameOver) && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-3xl flex flex-col items-center justify-center gap-3 p-6 z-20">
            {isGameOver ? (
              <>
                <Trophy className="w-12 h-12 text-amber-500" />
                <h3 className="text-2xl font-black text-[#182536]">{lang === "uz" ? "VAQT TUGADI!" : "TIME'S UP!"}</h3>
                <p className="text-sm font-bold text-[#7B8794]">
                  {lang === "uz" ? "Yakuniy ball:" : "Final Score:"} <strong className="text-[#07858B] text-lg">{score}</strong>
                </p>
                <button
                  onClick={startGame}
                  className="mt-2 bg-[#07858B] hover:bg-[#066D73] text-white px-6 py-2.5 rounded-2xl font-bold text-xs shadow-md flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
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
                <h3 className="text-xl font-extrabold text-[#182536]">True or False</h3>
                <p className="text-xs text-[#7B8794] max-w-xs font-medium">
                  {lang === "uz"
                    ? "Berilgan fikr Rost yoki Yolg'on ekanligini tezkorlik bilan tekshiring!"
                    : "Rapidly determine if the statement is True or False!"}
                </p>
                <button
                  onClick={startGame}
                  className="bg-[#07858B] hover:bg-[#066D73] text-white px-6 py-2.5 rounded-2xl font-bold text-xs shadow-md hover:scale-105 transition-all"
                >
                  {lang === "uz" ? "Boshlash" : "Start Game"}
                </button>
              </>
            )}
          </div>
        )}

        <span className="text-[11px] font-bold text-[#7B8794] uppercase tracking-wider block">
          {lang === "uz" ? "Fakt tekshiruvi" : "Fact Verification"} • #{currentIndex + 1}
        </span>

        {/* Statement */}
        <div className="my-4 px-2">
          <p className="text-lg font-bold text-[#182536] leading-relaxed">{questionText}</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 w-full">
          <button
            onClick={() => handleAnswer(true)}
            disabled={feedback !== null}
            className={`p-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
              feedback === "correct" && item.isTrue
                ? "bg-[#22A06B] text-white scale-102"
                : "bg-emerald-50 text-[#22A06B] border-2 border-emerald-200 hover:bg-[#22A06B] hover:text-white active:scale-95"
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{lang === "uz" ? "ROST" : lang === "ru" ? "ПРАВДА" : "TRUE"}</span>
          </button>
          <button
            onClick={() => handleAnswer(false)}
            disabled={feedback !== null}
            className={`p-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-all ${
              feedback === "correct" && !item.isTrue
                ? "bg-[#E05252] text-white scale-102"
                : "bg-rose-50 text-[#E05252] border-2 border-rose-200 hover:bg-[#E05252] hover:text-white active:scale-95"
            }`}
          >
            <XCircle className="w-5 h-5" />
            <span>{lang === "uz" ? "YOLG'ON" : lang === "ru" ? "ЛОЖЬ" : "FALSE"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/src/lib/api";
import { useAuth } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";
import { Flame, Check, Coins, Zap } from "lucide-react";
import confetti from "canvas-confetti";

interface Quest {
  id: string;
  code: string;
  title: string;
  description: string;
  xp_reward: number;
  coin_reward: number;
  target: number;
  current: number;
  is_completed: boolean;
  is_claimed: boolean;
}

const DEFAULT_QUESTS: Quest[] = [
  {
    id: "q1",
    code: "complete_2_quizzes",
    title: "Complete 2 Quizzes",
    description: "Take and complete any two quizzes today.",
    xp_reward: 50,
    coin_reward: 5,
    target: 2,
    current: 2,
    is_completed: true,
    is_claimed: false,
  },
  {
    id: "q2",
    code: "score_80_percent",
    title: "High Accuracy Master",
    description: "Score at least 80% on any timed quiz.",
    xp_reward: 40,
    coin_reward: 3,
    target: 1,
    current: 1,
    is_completed: true,
    is_claimed: false,
  },
  {
    id: "q3",
    code: "discipline_tasks_3",
    title: "Discipline Daily Habit",
    description: "Complete 3 discipline tasks on your planner.",
    xp_reward: 30,
    coin_reward: 2,
    target: 3,
    current: 1,
    is_completed: false,
    is_claimed: false,
  },
];

export function DailyQuestsCard() {
  const { refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [quests, setQuests] = useState<Quest[]>(DEFAULT_QUESTS);
  const [claiming, setClaiming] = useState<string | null>(null);

  useEffect(() => {
    api
      .getDailyQuests()
      .then((data) => {
        if (data && data.length > 0) setQuests(data);
      })
      .catch(() => {});
  }, []);

  const handleClaim = async (questId: string) => {
    setClaiming(questId);
    try {
      await api.claimQuest(questId);
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
      setQuests((prev) =>
        prev.map((q) => (q.id === questId ? { ...q, is_claimed: true } : q))
      );
      await refreshProfile();
    } catch {
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });
      setQuests((prev) =>
        prev.map((q) => (q.id === questId ? { ...q, is_claimed: true } : q))
      );
    } finally {
      setClaiming(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-[#E8EDF2] shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-1">
        <div>
          <h3 className="text-base font-bold text-[#182536] flex items-center gap-2">
            <Flame className="w-5 h-5 text-[#FF9B45] fill-[#FF9B45]" />
            {t.dailyQuests.title}
          </h3>
          <p className="text-xs text-[#7B8794]">Complete daily activities to unlock bonus XP and ranking coins</p>
        </div>
        <span className="text-xs font-bold text-[#07858B] bg-[#E7F5F5] px-3 py-1 rounded-full">
          Resets in 9h 14m
        </span>
      </div>

      <div className="space-y-3">
        {quests.map((quest) => {
          const pct = Math.min(100, Math.round((quest.current / quest.target) * 100));

          return (
            <div
              key={quest.id}
              className="p-4 rounded-2xl bg-[#F7F9FC] border border-[#E8EDF2] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#182536] truncate">{quest.title}</h4>
                  <span className="text-xs font-semibold text-[#7B8794]">
                    {quest.current} / {quest.target}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 rounded-full bg-[#E8EDF2] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#07858B] to-[#22A06B] rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="flex items-center gap-3 text-xs text-[#7B8794]">
                  <span>{quest.description}</span>
                  <div className="flex items-center gap-2 font-bold ml-auto shrink-0">
                    <span className="text-[#07858B] flex items-center gap-0.5">
                      <Zap className="w-3.5 h-3.5 text-[#F5B83D]" /> +{quest.xp_reward} XP
                    </span>
                    <span className="text-amber-700 flex items-center gap-0.5">
                      <Coins className="w-3.5 h-3.5 text-[#F5B83D] fill-[#F5B83D]" /> +{quest.coin_reward} Coins
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="shrink-0 self-end sm:self-center">
                {quest.is_claimed ? (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-[#22A06B] bg-emerald-50 border border-emerald-200">
                    <Check className="w-4 h-4" /> {t.dailyQuests.claimed}
                  </span>
                ) : quest.is_completed ? (
                  <button
                    onClick={() => handleClaim(quest.id)}
                    disabled={claiming === quest.id}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#FF9B45] to-amber-500 hover:from-orange-500 hover:to-amber-600 shadow-sm shadow-orange-500/20 active:scale-95 transition-all"
                  >
                    <Coins className="w-4 h-4 fill-white" />
                    {claiming === quest.id ? "..." : t.dailyQuests.claim}
                  </button>
                ) : (
                  <span className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-medium text-[#7B8794] bg-white border border-[#E8EDF2]">
                    {t.dailyQuests.inProgress}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { useLanguage } from "@/src/context/LanguageContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function PerformanceChart() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");

  const weeklyData = [
    { label: t.chart.days[0], score: 85, xp: 140 },
    { label: t.chart.days[1], score: 92, xp: 190 },
    { label: t.chart.days[2], score: 88, xp: 160 },
    { label: t.chart.days[3], score: 96, xp: 240 },
    { label: t.chart.days[4], score: 100, xp: 320 },
    { label: t.chart.days[5], score: 90, xp: 180 },
    { label: t.chart.days[6], score: 98, xp: 280 },
  ];

  const monthlyData = [
    { label: t.chart.weeks[0], score: 82, xp: 620 },
    { label: t.chart.weeks[1], score: 88, xp: 840 },
    { label: t.chart.weeks[2], score: 94, xp: 1120 },
    { label: t.chart.weeks[3], score: 97, xp: 1490 },
  ];

  const data = period === "weekly" ? weeklyData : monthlyData;

  return (
    <div className="bg-white rounded-3xl p-6 border border-[#E8EDF2] shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6">
        <div>
          <h3 className="text-base font-bold text-[#182536]">{t.chart.title}</h3>
          <p className="text-xs text-[#7B8794]">{t.chart.subtitle}</p>
        </div>

        {/* Period Selector Tabs */}
        <div className="inline-flex bg-[#F7F9FC] p-1 rounded-xl border border-[#E8EDF2] self-start sm:self-auto">
          <button
            onClick={() => setPeriod("weekly")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              period === "weekly"
                ? "bg-white text-[#07858B] shadow-xs"
                : "text-[#7B8794] hover:text-[#182536]"
            }`}
          >
            {t.chart.weekly}
          </button>
          <button
            onClick={() => setPeriod("monthly")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              period === "monthly"
                ? "bg-white text-[#07858B] shadow-xs"
                : "text-[#7B8794] hover:text-[#182536]"
            }`}
          >
            {t.chart.monthly}
          </button>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#07858B" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#07858B" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF9B45" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#FF9B45" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8EDF2" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#7B8794" }}
            />
            <YAxis
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12, fill: "#7B8794" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#182536",
                borderRadius: "12px",
                border: "none",
                color: "#FFFFFF",
                fontSize: "12px",
                boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)",
              }}
              formatter={(value: any, name: any) => [
                name === "score" ? `${value}% ${t.chart.accuracy}` : `${value} XP`,
                name === "score" ? t.chart.quizScore : t.chart.xpGained,
              ]}
            />
            <Area
              type="monotone"
              dataKey="score"
              stroke="#07858B"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#tealGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#F7F9FC] text-xs text-[#7B8794]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#07858B]" />
            {t.chart.accuracy}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF9B45]" />
            {t.chart.xpMomentum}
          </span>
        </div>
        <span className="font-semibold text-[#07858B]">{t.chart.periodGrowth}</span>
      </div>
    </div>
  );
}

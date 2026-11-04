"use client";

import React from "react";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { WelcomeBanner } from "@/src/components/dashboard/WelcomeBanner";
import { OverviewStatsCards } from "@/src/components/dashboard/OverviewStatsCards";
import { PerformanceChart } from "@/src/components/dashboard/PerformanceChart";
import { LifetimeProgressCard } from "@/src/components/dashboard/LifetimeProgressCard";
import { MiniGamesSection } from "@/src/components/dashboard/MiniGamesSection";
import { LeaderboardWidget } from "@/src/components/dashboard/LeaderboardWidget";
import { DailyQuestsCard } from "@/src/components/dashboard/DailyQuestsCard";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* A. Welcome Banner with Start Quiz & How It Works buttons */}
        <WelcomeBanner />

        {/* B. Overview Metric Cards */}
        <OverviewStatsCards />

        {/* C. Performance Chart & Lifetime Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PerformanceChart />
          </div>
          <div>
            <DailyQuestsCard />
          </div>
        </div>

        {/* D. Lifetime Progress Grid */}
        <LifetimeProgressCard />

        {/* E. Mini Games Cards */}
        <MiniGamesSection />

        {/* F. Leaderboard Podium Widget */}
        <LeaderboardWidget />
      </div>
    </DashboardLayout>
  );
}

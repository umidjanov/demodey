"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";
import {
  LayoutDashboard,
  User,
  BookOpen,
  MessageSquare,
  Users,
  CheckSquare,
  Trophy,
  CalendarCheck,
  Sparkles,
  Gamepad2,
  Award,
  Settings,
  HelpCircle,
  LogOut,
  ShieldAlert,
} from "lucide-react";

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user, profile, logout } = useAuth();
  const { t } = useLanguage();

  const navItems = [
    { name: t.nav.dashboard, href: "/dashboard", icon: LayoutDashboard },
    { name: t.nav.profile, href: "/profile", icon: User },
    { name: t.nav.quizzes, href: "/quizzes", icon: BookOpen },
    { name: t.nav.messages, href: "/messages", icon: MessageSquare },
    { name: t.nav.friends, href: "/friends", icon: Users },
    { name: t.nav.results, href: "/results", icon: CheckSquare },
    { name: t.nav.ranking, href: "/leaderboard", icon: Trophy },
    { name: t.nav.discipline, href: "/discipline", icon: CalendarCheck },
    { name: t.nav.aiAssistant, href: "/ai-assistant", icon: Sparkles, badge: "AI" },
    { name: t.nav.miniGames, href: "/mini-games", icon: Gamepad2, badge: "New" },
    { name: t.nav.achievements, href: "/achievements", icon: Award },
    { name: t.nav.admin, href: "/admin", icon: ShieldAlert, adminOnly: true },
    { name: t.nav.settings, href: "/profile", icon: Settings },
    { name: t.nav.help, href: "/how-it-works", icon: HelpCircle },
  ];

  return (
    <aside className="w-64 bg-white border-r border-[#E8EDF2] flex flex-col h-screen sticky top-0 select-none z-30">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#E8EDF2] flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#066D73] to-[#07858B] flex items-center justify-center text-white shadow-md shadow-[#07858B]/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-[#182536] flex items-center gap-1">
              QUIZORA
            </span>
            <span className="block text-[10px] font-semibold tracking-wider text-[#07858B] uppercase">
              Learn · Compete
            </span>
          </div>
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          if (item.adminOnly && user?.role !== "admin") return null;
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-[#E7F5F5] text-[#07858B] font-semibold shadow-sm"
                  : "text-[#7B8794] hover:bg-[#F7F9FC] hover:text-[#182536]"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? "text-[#07858B]" : "text-[#7B8794]"
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    item.badge === "AI"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-[#FF9B45]/15 text-[#FF9B45]"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="p-4 border-t border-[#E8EDF2] bg-[#F7F9FC]/60">
        <div className="flex items-center justify-between">
          <Link href="/profile" className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition-opacity">
            <img
              src={user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=learner`}
              alt="Avatar"
              className="w-10 h-10 rounded-full border border-white shadow-sm bg-white"
            />
            <div className="truncate">
              <p className="text-sm font-semibold text-[#182536] truncate">
                {user?.first_name ? `${user.first_name} ${user.last_name}` : "Alex Learner"}
              </p>
              <p className="text-xs text-[#07858B] font-medium">
                Level {profile?.level || 1} · {profile?.level_title || "Beginner"}
              </p>
            </div>
          </Link>
          <button
            onClick={logout}
            title="Log out"
            className="p-2 text-[#7B8794] hover:text-[#E05252] hover:bg-white rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

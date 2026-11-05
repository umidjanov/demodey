"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  Trophy,
  Zap,
  Coins,
  Flame,
  Award,
  CheckCircle2,
  MessageSquare,
  Swords,
  Copy,
  Check,
  Calendar,
  Mail,
  Phone,
  Shield,
  Activity,
  UserCheck,
} from "lucide-react";

interface UserProfileModalProps {
  user: any | null;
  isOpen: boolean;
  onClose: () => void;
  onChallenge?: (user: any) => void;
  onMessage?: (user: any) => void;
}

export function UserProfileModal({
  user,
  isOpen,
  onClose,
  onChallenge,
  onMessage,
}: UserProfileModalProps) {
  const router = useRouter();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const copyToClipboard = async (text: string, key: string) => {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else if (typeof document !== "undefined") {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const getRankBadge = (rank?: number) => {
    if (!rank) return null;
    if (rank === 1) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 shadow-xs border border-amber-300">
          <Trophy className="w-3.5 h-3.5 fill-amber-950" />
          <span>1-O'rin (Chempion)</span>
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-800 border border-slate-300">
          <Trophy className="w-3.5 h-3.5 fill-slate-700" />
          <span>2-O'rin (Kumush)</span>
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
          <Trophy className="w-3.5 h-3.5 fill-amber-800" />
          <span>3-O'rin (Bronza)</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E7F5F5] text-[#07858B] border border-teal-200">
        <Trophy className="w-3.5 h-3.5" />
        <span>#{rank} Reytingda</span>
      </span>
    );
  };

  const fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.username || "O'quvchi";

  const handleStartChat = () => {
    if (onMessage) {
      onMessage(user);
    } else {
      router.push(`/messages?user=${encodeURIComponent(user.username || user.id)}`);
    }
    onClose();
  };

  const handleStartChallenge = () => {
    if (onChallenge) {
      onChallenge(user);
    } else {
      router.push(`/rooms?opponent=${encodeURIComponent(user.username || user.id)}`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-3xl border border-[#E8EDF2] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header with banner */}
        <div className="relative bg-gradient-to-r from-[#07858B] to-[#066D73] p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.username}`}
                alt={user.username}
                className="w-16 h-16 rounded-full border-3 border-white shadow-md bg-white object-cover"
              />
              <span
                className={`w-4 h-4 rounded-full absolute bottom-0 right-0 border-2 border-white ${
                  user.is_online !== false ? "bg-emerald-400" : "bg-slate-400"
                }`}
                title={user.is_online !== false ? "Onlayn" : "Oflayn"}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-white leading-tight">
                  {fullName}
                </h3>
                <button
                  onClick={() => copyToClipboard(fullName, "name")}
                  className="p-1 hover:bg-white/20 rounded transition-colors text-white/80"
                  title="Ismni nusxalash"
                >
                  {copiedKey === "name" ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-2 text-white/80 text-xs">
                <span>@{user.username}</span>
                <button
                  onClick={() => copyToClipboard(`@${user.username}`, "uname")}
                  className="p-0.5 hover:bg-white/20 rounded transition-colors"
                  title="Usernameni nusxalash"
                >
                  {copiedKey === "uname" ? <Check className="w-3 h-3 text-emerald-300" /> : <Copy className="w-3 h-3" />}
                </button>
                <span>·</span>
                <span className="font-mono text-[11px] opacity-90">ID: {user.id?.slice(0, 8)}...</span>
              </div>

              <div className="pt-1 flex flex-wrap items-center gap-2">
                {getRankBadge(user.rank)}
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 backdrop-blur-xs text-white">
                  {user.role === "admin" ? "Administrator" : "O'quvchi"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[65vh] overflow-y-auto">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF2] text-center">
              <span className="text-[#7B8794] block text-[10px] font-bold uppercase tracking-wider">Daraja</span>
              <p className="font-extrabold text-base text-[#182536] mt-0.5">
                Lvl {user.level || 1}
              </p>
              <span className="text-[10px] text-[#07858B] font-semibold">{user.level_title || "Bilimdon"}</span>
            </div>

            <div className="p-3 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF2] text-center">
              <span className="text-[#7B8794] block text-[10px] font-bold uppercase tracking-wider">Jami XP</span>
              <p className="font-black text-base text-[#07858B] mt-0.5 flex items-center justify-center gap-1">
                <Zap className="w-3.5 h-3.5 text-[#F5B83D] fill-[#F5B83D]" />
                {user.total_xp || 0}
              </p>
              <span className="text-[10px] text-[#7B8794]">Tajriba ballari</span>
            </div>

            <div className="p-3 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF2] text-center">
              <span className="text-[#7B8794] block text-[10px] font-bold uppercase tracking-wider">Tangalar</span>
              <p className="font-black text-base text-amber-700 mt-0.5 flex items-center justify-center gap-1">
                <Coins className="w-3.5 h-3.5 text-[#F5B83D] fill-[#F5B83D]" />
                {user.ranking_coins || user.coins || 0}
              </p>
              <span className="text-[10px] text-amber-600 font-semibold">$RC Reyting</span>
            </div>

            <div className="p-3 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF2] text-center">
              <span className="text-[#7B8794] block text-[10px] font-bold uppercase tracking-wider">Aniqlik</span>
              <p className="font-extrabold text-base text-[#22A06B] mt-0.5">
                {user.average_score || user.accuracy_percentage || 0}%
              </p>
              <span className="text-[10px] text-[#22A06B] font-semibold">O'rtacha natija</span>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E8EDF2] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#7B8794] block">Yechilgan testlar</span>
                <span className="font-bold text-[#182536] text-sm">{user.completed_quizzes_count || 0} ta</span>
              </div>
              <Award className="w-5 h-5 text-[#07858B]/50" />
            </div>

            <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E8EDF2] flex items-center justify-between">
              <div>
                <span className="text-[11px] text-[#7B8794] block">Kunlik zanjir</span>
                <span className="font-bold text-[#FF9B45] text-sm flex items-center gap-1">
                  <Flame className="w-4 h-4 fill-[#FF9B45]" />
                  {user.current_streak || 1} kun
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E8EDF2] flex items-center justify-between col-span-2 sm:col-span-1">
              <div>
                <span className="text-[11px] text-[#7B8794] block">To'g'ri javoblar</span>
                <span className="font-bold text-[#22A06B] text-sm">
                  {user.total_correct_answers || 0} ta
                </span>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-500/50" />
            </div>
          </div>

          {/* Bio / About */}
          <div className="p-4 bg-[#F7F9FC] rounded-2xl border border-[#E8EDF2] space-y-1">
            <span className="text-[11px] font-bold text-[#7B8794] uppercase tracking-wider block">
              Foydalanuvchi Haqida
            </span>
            <p className="text-xs text-[#182536] font-medium leading-relaxed">
              {user.bio || "Quizora platformasida bilim olib, faol test yechmoqda."}
            </p>
          </div>

          {/* Registration Date & Info */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#7B8794] pt-1 border-t border-[#E8EDF2]">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#07858B]" />
              Ro'yxatdan o'tgan: {user.created_at ? user.created_at.split("T")[0] : "Yaqinda"}
            </span>

            {user.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#07858B]" />
                {user.email}
              </span>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 px-6 border-t border-[#E8EDF2] bg-[#F7F9FC] flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => copyToClipboard(
              `--- O'QUVCHI MA'LUMOTI ---
Ism: ${fullName}
Username: @${user.username}
Daraja: Lvl ${user.level || 1} (${user.level_title || 'Bilimdon'})
Reyting o'rni: #${user.rank || '—'}
XP: ${user.total_xp || 0}
Tangalar: ${user.ranking_coins || user.coins || 0} $RC
Aniqlik: ${user.average_score || user.accuracy_percentage || 0}%
Yechilgan testlar: ${user.completed_quizzes_count || 0}
Zanjir: ${user.current_streak || 1} kun`,
              "all_data"
            )}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-[#07858B] hover:bg-[#E7F5F5] transition-colors border border-[#E8EDF2] flex items-center gap-1.5 shadow-xs"
          >
            {copiedKey === "all_data" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === "all_data" ? "Nusxalandi!" : "Ma'lumotlarni nusxalash"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartChat}
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-[#182536] text-xs font-bold transition-colors border border-[#E8EDF2] flex items-center gap-1.5 shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#07858B]" />
              <span>Xabar yozish</span>
            </button>

            <button
              onClick={handleStartChallenge}
              className="px-4 py-2 rounded-xl bg-[#07858B] hover:bg-[#066D73] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Testga chorlash</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

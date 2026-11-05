"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/src/context/LanguageContext";
import { useAuth } from "@/src/context/AuthContext";
import { api, getAllPlatformLearners } from "@/src/lib/api";
import { UserProfileModal } from "@/src/components/profile/UserProfileModal";
import { Users, Check, X, Swords, ArrowRight, UserPlus, Flame, Sparkles, Trophy, Eye } from "lucide-react";

interface UserItem {
  id: string;
  name: string;
  username: string;
  avatar: string;
  level: number;
  isOnline: boolean;
  activity?: string;
  rawUser?: any;
}

export function RightSidebar() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [friends, setFriends] = useState<UserItem[]>([]);
  const [communityUsers, setCommunityUsers] = useState<UserItem[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    loadSidebarData();

    const handleDeleted = () => {
      loadSidebarData();
    };

    window.addEventListener("quizora_user_deleted", handleDeleted);
    window.addEventListener("storage", handleDeleted);

    return () => {
      window.removeEventListener("quizora_user_deleted", handleDeleted);
      window.removeEventListener("storage", handleDeleted);
    };
  }, [user]);

  const loadSidebarData = async () => {
    if (!user) {
      setFriends([]);
      setCommunityUsers([]);
      setLoading(false);
      return;
    }

    try {
      const [friendsRes, learners] = await Promise.all([
        api.getFriends().catch(() => null),
        getAllPlatformLearners().catch(() => []),
      ]);

      if (friendsRes && Array.isArray(friendsRes.friends) && friendsRes.friends.length > 0) {
        setFriends(
          friendsRes.friends.map((f: any) => ({
            id: f.user_id || f.id,
            name: `${f.first_name || ""} ${f.last_name || ""}`.trim() || f.username,
            username: f.username,
            avatar: f.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${f.username}`,
            level: f.level || 1,
            isOnline: f.is_online ?? true,
            activity: f.current_activity || `Lvl ${f.level || 1} · ${f.total_xp || 0} XP`,
            rawUser: f,
          }))
        );
      }

      if (Array.isArray(learners) && learners.length > 0) {
        setCommunityUsers(
          learners
            .filter((u: any) => u.id !== user.id)
            .map((u: any) => ({
              id: u.id,
              name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username,
              username: u.username,
              avatar: u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`,
              level: u.level || 1,
              isOnline: u.is_online ?? true,
              activity: `#${u.rank || 1} · Lvl ${u.level || 1} (${u.total_xp || 0} XP)`,
              rawUser: u,
            }))
        );
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = (invId: string, accept: boolean) => {
    setInvitations((prev) => prev.filter((i) => i.id !== invId));
  };

  const displayUsers = communityUsers.length > 0 ? communityUsers : friends;

  return (
    <aside className="w-80 bg-white border-l border-[#E8EDF2] flex flex-col h-screen sticky top-0 overflow-y-auto p-5 space-y-6 hidden xl:flex select-none z-10">
      {/* 1. Quiz / Multiplayer Invitations (Only real ones) */}
      {invitations.length > 0 && (
        <div className="bg-gradient-to-br from-[#E7F5F5] to-teal-50/40 border border-[#07858B]/20 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-bold text-[#07858B] uppercase tracking-wider flex items-center gap-1.5">
              <Swords className="w-4 h-4 text-[#07858B]" />
              {t.rightSidebar.quizChallenge}
            </span>
            <span className="text-[10px] font-bold bg-[#07858B] text-white px-2 py-0.5 rounded-full">
              {t.rightSidebar.live}
            </span>
          </div>

          {invitations.map((inv) => (
            <div key={inv.id} className="space-y-3">
              <div className="flex items-center gap-3">
                <img src={inv.avatar} alt={inv.sender} className="w-10 h-10 rounded-full bg-white shadow-xs" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#182536] truncate">{inv.sender}</p>
                  <p className="text-xs text-[#7B8794] truncate">{inv.quizTopic}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Link
                  href={`/rooms?code=${inv.roomCode}`}
                  onClick={() => handleRespond(inv.id, true)}
                  className="flex-1 bg-[#07858B] hover:bg-[#066D73] text-white py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> {t.rightSidebar.accept}
                </Link>
                <button
                  onClick={() => handleRespond(inv.id, false)}
                  className="bg-white hover:bg-red-50 text-[#7B8794] hover:text-[#E05252] border border-[#E8EDF2] py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> {t.rightSidebar.decline}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Real Registered Users / Friends Presence */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#182536] flex items-center gap-2">
            <Users className="w-4 h-4 text-[#07858B]" />
            <span>
              {friends.length > 0
                ? `${t.rightSidebar.friends} (${friends.filter((f) => f.isOnline).length})`
                : language === "uz"
                ? "Faol Foydalanuvchilar"
                : language === "ru"
                ? "Активные Пользователи"
                : "Active Scholars"}
            </span>
          </h3>
          <Link
            href="/friends"
            className="text-xs text-[#07858B] hover:underline font-semibold flex items-center gap-0.5"
          >
            {t.miniGames.viewAll} <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {displayUsers.length === 0 ? (
          <div className="p-4 rounded-2xl bg-[#F7F9FC] border border-[#E8EDF2] text-center space-y-2">
            <div className="w-9 h-9 rounded-full bg-[#E7F5F5] text-[#07858B] flex items-center justify-center mx-auto">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-[#182536]">
              {language === "uz"
                ? "Boshqa foydalanuvchilar kutilmoqda"
                : language === "ru"
                ? "Пока нет других участников"
                : "No other learners yet"}
            </p>
            <p className="text-[11px] text-[#7B8794]">
              {language === "uz"
                ? "Yangi do'stlaringizni Quizoraga chorlang va birgalikda bilim oling!"
                : language === "ru"
                ? "Пригласите друзей в Quizora и соревнуйтесь!"
                : "Invite peers to Quizora and learn together!"}
            </p>
            <Link
              href="/friends"
              className="inline-block mt-1 text-[11px] font-bold text-[#07858B] hover:underline"
            >
              + {t.rightSidebar.addFriend}
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {displayUsers.slice(0, 6).map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedUser(item.rawUser || item)}
                className="w-full text-left flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F7F9FC] transition-colors group cursor-pointer border border-transparent hover:border-[#E8EDF2]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={item.avatar}
                      alt={item.name}
                      className="w-9 h-9 rounded-full bg-[#F7F9FC] border border-[#E8EDF2]"
                    />
                    <span
                      className={`w-2.5 h-2.5 rounded-full absolute bottom-0 right-0 border-2 border-white ${
                        item.isOnline ? "bg-[#22A06B]" : "bg-[#7B8794]/40"
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#182536] truncate group-hover:text-[#07858B] transition-colors">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-[#7B8794] truncate">@{item.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[10px] font-bold text-[#07858B] bg-[#E7F5F5] px-2 py-0.5 rounded-full">
                    Lvl {item.level}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. Multiplayer Challenge Arena Banner */}
      <div className="bg-gradient-to-br from-[#182536] to-[#0D1622] rounded-2xl p-4 text-white space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#07858B] flex items-center justify-center text-white">
            <Swords className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold">{t.dashboard.arenaBtn}</h4>
            <p className="text-[10px] text-slate-300">
              {language === "uz" ? "Do'stlar bilan sinxron duel" : "Real-time Quiz Arena"}
            </p>
          </div>
        </div>
        <Link
          href="/rooms"
          className="w-full bg-[#07858B] hover:bg-[#066D73] text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
        >
          <span>{language === "uz" ? "Jang Xonasi Yaratish" : "Create Arena Room"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <UserProfileModal
        user={selectedUser}
        isOpen={Boolean(selectedUser)}
        onClose={() => setSelectedUser(null)}
      />
    </aside>
  );
}

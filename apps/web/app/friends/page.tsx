"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { useLanguage } from "@/src/context/LanguageContext";
import { api } from "@/src/lib/api";
import {
  Users,
  UserPlus,
  MessageSquare,
  Swords,
  Check,
  X,
  Search,
  CheckCircle2,
} from "lucide-react";

export default function FriendsPage() {
  const { t, language } = useLanguage();
  const [friendsData, setFriendsData] = useState<any | null>(null);
  const [communityUsers, setCommunityUsers] = useState<any[]>([]);
  const [searchUsername, setSearchUsername] = useState("");
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFriends();
  }, []);

  const loadFriends = async () => {
    try {
      const data = await api.getFriends().catch(() => null);
      setFriendsData(data);
      const comm = await api.getCommunityUsers().catch(() => []);
      setCommunityUsers(Array.isArray(comm) ? comm : []);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;

    try {
      const res = await api.sendFriendRequest(searchUsername);
      setRequestStatus(res.message);
      setSearchUsername("");
    } catch (err: any) {
      setRequestStatus(err.message || (language === "uz" ? "Taklif yuborib bo'lmadi." : "Failed to send request."));
    }
  };

  const handleRespond = async (reqId: string, accept: boolean) => {
    try {
      await api.respondFriendRequest(reqId, accept);
      await loadFriends();
    } catch (e) {
      console.error(e);
    }
  };

  const friends = friendsData?.friends || [];
  const incoming = friendsData?.incoming_requests || [];

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8 pb-12">
        {/* Header with Search & Add Friend */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8EDF2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#182536] tracking-tight">
              {language === "uz" ? "Do'stlar va Ta'lim Tarmog'i" : language === "ru" ? "Друзья и Сеть Обучения" : "Friends & Study Network"}
            </h1>
            <p className="text-xs sm:text-sm text-[#7B8794]">
              {language === "uz"
                ? "Do'stlar bilan bog'laning, ularning faolligini kuzating va jonli test bellashuvlariga chorlang."
                : language === "ru"
                ? "Общайтесь с единомышленниками, следите за их прогрессом и вызывайте на дуэли."
                : "Connect with fellow students, monitor live status, and challenge them to multiplayer quiz battles."}
            </p>
          </div>

          {/* Add Friend Form */}
          <form onSubmit={handleSendRequest} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-[#7B8794] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                placeholder={language === "uz" ? "Username kiriting..." : language === "ru" ? "Введите логин..." : "Enter username..."}
                className="bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl pl-9 pr-3 py-2 text-xs text-[#182536] focus:outline-none focus:border-[#07858B]"
              />
            </div>
            <button
              type="submit"
              className="bg-[#07858B] hover:bg-[#066D73] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              {t.rightSidebar.addFriend}
            </button>
          </form>
        </div>

        {requestStatus && (
          <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-xs text-[#066D73] font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#07858B]" />
            <span>{requestStatus}</span>
          </div>
        )}

        {/* Incoming Friend Requests */}
        {incoming.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-[#E8EDF2] shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#182536]">
              {language === "uz" ? "Kutilayotgan do'stlik takliflari" : language === "ru" ? "Запросы в друзья" : "Pending Friend Requests"} ({incoming.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {incoming.map((req: any) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-[#F7F9FC] border border-[#E8EDF2] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img src={req.sender.avatar_url} alt="" className="w-10 h-10 rounded-full bg-white shadow-xs" />
                    <div>
                      <p className="text-sm font-bold text-[#182536]">{req.sender.first_name} {req.sender.last_name}</p>
                      <p className="text-xs text-[#7B8794]">@{req.sender.username} · {t.dashboard.level} {req.sender.level}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRespond(req.id, true)}
                      className="p-2 bg-[#07858B] text-white rounded-lg shadow-xs hover:bg-[#066D73]"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRespond(req.id, false)}
                      className="p-2 bg-white text-[#7B8794] hover:text-[#E05252] border border-[#E8EDF2] rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends.length === 0 ? (
            <div className="col-span-full py-12 text-center text-xs text-[#7B8794]">
              {t.rightSidebar.noFriends}
            </div>
          ) : (
            friends.map((f: any) => (
              <div
                key={f.user_id}
                className="bg-white rounded-3xl p-6 border border-[#E8EDF2] shadow-xs flex flex-col justify-between space-y-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="relative">
                      <img
                        src={f.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${f.username}`}
                        alt={f.username}
                        className="w-12 h-12 rounded-full bg-[#F7F9FC] border border-[#E8EDF2]"
                      />
                      <span
                        className={`w-3 h-3 rounded-full absolute bottom-0 right-0 border-2 border-white ${
                          f.is_online ? "bg-[#22A06B]" : "bg-[#7B8794]/40"
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#182536]">{f.first_name} {f.last_name}</h3>
                      <p className="text-xs text-[#7B8794]">@{f.username}</p>
                      <span className="text-[10px] text-[#07858B] font-bold">
                        {t.dashboard.level} {f.level} · {f.accuracy_percentage}% {t.stats.accuracy}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-[#F7F9FC]">
                  <Link
                    href="/messages"
                    className="flex-1 py-2 rounded-xl bg-[#F7F9FC] hover:bg-[#E7F5F5] text-[#07858B] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{language === "uz" ? "Xabar" : language === "ru" ? "Чат" : "Message"}</span>
                  </Link>
                  <Link
                    href="/rooms"
                    className="flex-1 py-2 rounded-xl bg-[#07858B] hover:bg-[#066D73] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>{language === "uz" ? "Chorlov" : language === "ru" ? "Вызов" : "Challenge"}</span>
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Community Learners to Connect With */}
        {communityUsers.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-[#E8EDF2]">
            <h2 className="text-lg font-bold text-[#182536]">
              {language === "uz" ? "Quizora Hamjamiyati Foydalanuvchilari" : "Quizora Community Scholars"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {communityUsers.map((u: any) => (
                <div
                  key={u.id}
                  className="bg-white rounded-3xl p-5 border border-[#E8EDF2] shadow-xs flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                      alt={u.username}
                      className="w-10 h-10 rounded-full bg-[#F7F9FC] border border-[#E8EDF2]"
                    />
                    <div>
                      <p className="font-bold text-xs text-[#182536]">
                        {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}` : u.username}
                      </p>
                      <p className="text-[11px] text-[#7B8794]">@{u.username} · Lvl {u.level || 1}</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const res = await api.sendFriendRequest(u.username);
                        setRequestStatus(res.message);
                      } catch (err: any) {
                        setRequestStatus(err.message);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#E7F5F5] hover:bg-teal-100 text-[#07858B] text-xs font-bold transition-colors"
                  >
                    + Qo'shish
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

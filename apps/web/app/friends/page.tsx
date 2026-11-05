"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { useLanguage } from "@/src/context/LanguageContext";
import { api, getAllPlatformLearners } from "@/src/lib/api";
import { UserProfileModal } from "@/src/components/profile/UserProfileModal";
import {
  Users,
  UserPlus,
  MessageSquare,
  Swords,
  Check,
  X,
  Search,
  CheckCircle2,
  Trophy,
  Zap,
  Coins,
  Flame,
  Eye,
  Sparkles,
} from "lucide-react";

export default function FriendsPage() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [friendsData, setFriendsData] = useState<any | null>(null);
  const [allLearners, setAllLearners] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"ranking" | "friends">("ranking");
  const [searchQuery, setSearchQuery] = useState("");
  const [requestStatus, setRequestStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Selected User Modal for Full Profile
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    loadFriendsAndLearners();
  }, []);

  const loadFriendsAndLearners = async () => {
    setLoading(true);
    try {
      const [friendsRes, learners] = await Promise.all([
        api.getFriends().catch(() => null),
        getAllPlatformLearners().catch(() => []),
      ]);
      setFriendsData(friendsRes);
      setAllLearners(Array.isArray(learners) ? learners : []);
    } catch (err) {
      console.error("Failed to load friends/learners:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      const res = await api.sendFriendRequest(searchQuery);
      setRequestStatus(res.message || "Do'stlik taklifi yuborildi!");
      setSearchQuery("");
      await loadFriendsAndLearners();
    } catch (err: any) {
      setRequestStatus(err.message || (language === "uz" ? "Taklif yuborib bo'lmadi." : "Failed to send request."));
    }
  };

  const handleRespond = async (reqId: string, accept: boolean) => {
    try {
      await api.respondFriendRequest(reqId, accept);
      await loadFriendsAndLearners();
    } catch (e) {
      console.error(e);
    }
  };

  const friends = friendsData?.friends || [];
  const incoming = friendsData?.incoming_requests || [];

  const filteredLearners = allLearners.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      u.username?.toLowerCase().includes(q) ||
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  const filteredFriends = friends.filter((f: any) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      f.username?.toLowerCase().includes(q) ||
      f.first_name?.toLowerCase().includes(q) ||
      f.last_name?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8EDF2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E7F5F5] text-[#07858B] text-xs font-bold">
              <Trophy className="w-3.5 h-3.5" />
              <span>O'quvchilar Reytingi va Do'stlar Tarmog'i</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#182536] tracking-tight">
              {language === "uz" ? "Do'stlar va O'quvchilar Reytingi" : "Friends & Student Leaderboard"}
            </h1>
            <p className="text-xs sm:text-sm text-[#7B8794] max-w-2xl">
              Platformaga ro'yxatdan o'tgan barcha o'quvchilar, ularning reytingi, darajasi va yutuqlari. Har qanday o'quvchi ustiga bosib, uning to'liq profil ma'lumotlarini ko'rishingiz mumkin.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSendRequest} className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-[#7B8794] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === "uz" ? "Ism yoki username..." : "Search user..."}
                className="bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#182536] focus:outline-none focus:border-[#07858B] w-56"
              />
            </div>
            <button
              type="submit"
              className="bg-[#07858B] hover:bg-[#066D73] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              + {t.rightSidebar.addFriend}
            </button>
          </form>
        </div>

        {requestStatus && (
          <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-xs text-[#066D73] font-semibold flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#07858B]" />
              <span>{requestStatus}</span>
            </div>
            <button onClick={() => setRequestStatus(null)} className="text-[#7B8794] hover:text-[#182536]">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Incoming Friend Requests */}
        {incoming.length > 0 && (
          <div className="bg-white rounded-3xl p-6 border border-[#E8EDF2] shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#182536]">
              {language === "uz" ? "Kutilayotgan do'stlik takliflari" : "Pending Friend Requests"} ({incoming.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {incoming.map((req: any) => (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-[#F7F9FC] border border-[#E8EDF2] flex items-center justify-between"
                >
                  <div
                    onClick={() => setSelectedUser(req.sender)}
                    className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <img src={req.sender?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${req.sender?.username}`} alt="" className="w-10 h-10 rounded-full bg-white shadow-xs" />
                    <div>
                      <p className="text-sm font-bold text-[#182536]">{req.sender?.first_name} {req.sender?.last_name}</p>
                      <p className="text-xs text-[#7B8794]">@{req.sender?.username} · Lvl {req.sender?.level || 1}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRespond(req.id, true)}
                      className="p-2 bg-[#07858B] text-white rounded-lg shadow-xs hover:bg-[#066D73]"
                      title="Qabul qilish"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRespond(req.id, false)}
                      className="p-2 bg-white text-[#7B8794] hover:text-[#E05252] border border-[#E8EDF2] rounded-lg"
                      title="Rad etish"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex items-center gap-2 border-b border-[#E8EDF2] pb-3 text-xs font-bold">
          <button
            onClick={() => setActiveTab("ranking")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "ranking"
                ? "bg-[#07858B] text-white shadow-xs"
                : "bg-white text-[#7B8794] hover:text-[#182536] border border-[#E8EDF2]"
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Barcha O'quvchilar Reytingi ({allLearners.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("friends")}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
              activeTab === "friends"
                ? "bg-[#07858B] text-white shadow-xs"
                : "bg-white text-[#7B8794] hover:text-[#182536] border border-[#E8EDF2]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Mening Do'stlarim ({friends.length})</span>
          </button>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#07858B] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-[#7B8794]">O'quvchilar va reyting ma'lumotlari yuklanmoqda...</p>
          </div>
        ) : activeTab === "ranking" ? (
          /* ALL LEARNERS RANKING GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLearners.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-[#E8EDF2] space-y-2">
                <Users className="w-10 h-10 text-[#7B8794]/40 mx-auto" />
                <p className="font-bold text-sm text-[#182536]">O'quvchilar topilmadi</p>
                <p className="text-xs text-[#7B8794]">Qidiruv so'zini o'zgartirib ko'ring.</p>
              </div>
            ) : (
              filteredLearners.map((u) => {
                const isChampion = u.rank === 1;
                const isSilver = u.rank === 2;
                const isBronze = u.rank === 3;

                return (
                  <div
                    key={u.id}
                    className={`bg-white rounded-3xl p-5 border transition-all hover:shadow-md flex flex-col justify-between space-y-4 group cursor-pointer ${
                      isChampion
                        ? "border-amber-300 ring-2 ring-amber-400/20 shadow-xs"
                        : isSilver
                        ? "border-slate-300"
                        : isBronze
                        ? "border-amber-200"
                        : "border-[#E8EDF2]"
                    }`}
                    onClick={() => setSelectedUser(u)}
                  >
                    <div>
                      {/* Top bar with Rank Badge & Online status */}
                      <div className="flex items-center justify-between pb-3 border-b border-[#F7F9FC]">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                            isChampion
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : isSilver
                              ? "bg-slate-100 text-slate-800 border border-slate-300"
                              : isBronze
                              ? "bg-orange-100 text-orange-900 border border-orange-300"
                              : "bg-[#F7F9FC] text-[#07858B] border border-[#E8EDF2]"
                          }`}
                        >
                          <Trophy className="w-3 h-3" />
                          <span>#{u.rank} O'rin</span>
                        </span>

                        <span className="inline-flex items-center gap-1 text-[11px] text-[#22A06B] font-semibold">
                          <span className="w-2 h-2 rounded-full bg-[#22A06B]" />
                          Onlayn
                        </span>
                      </div>

                      {/* User Info */}
                      <div className="flex items-center gap-3.5 pt-3">
                        <div className="relative">
                          <img
                            src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                            alt={u.username}
                            className="w-12 h-12 rounded-full bg-[#F7F9FC] border border-[#E8EDF2] group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-sm text-[#182536] truncate group-hover:text-[#07858B] transition-colors">
                            {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}` : u.username}
                          </h3>
                          <p className="text-xs text-[#7B8794] truncate">@{u.username}</p>
                          <span className="text-[10px] text-[#07858B] font-bold">
                            Lvl {u.level || 1} · {u.level_title || "Bilimdon"}
                          </span>
                        </div>
                      </div>

                      {/* Stats pills */}
                      <div className="grid grid-cols-3 gap-2 pt-3 text-center text-xs">
                        <div className="p-2 bg-[#F7F9FC] rounded-xl border border-[#E8EDF2]">
                          <span className="text-[10px] text-[#7B8794] block">XP</span>
                          <span className="font-extrabold text-[#07858B] flex items-center justify-center gap-0.5">
                            <Zap className="w-3 h-3 text-[#F5B83D] fill-[#F5B83D]" />
                            {u.total_xp || 0}
                          </span>
                        </div>

                        <div className="p-2 bg-[#F7F9FC] rounded-xl border border-[#E8EDF2]">
                          <span className="text-[10px] text-[#7B8794] block">Tangalar</span>
                          <span className="font-extrabold text-amber-700 flex items-center justify-center gap-0.5">
                            <Coins className="w-3 h-3 text-[#F5B83D] fill-[#F5B83D]" />
                            {u.ranking_coins || u.coins || 0}
                          </span>
                        </div>

                        <div className="p-2 bg-[#F7F9FC] rounded-xl border border-[#E8EDF2]">
                          <span className="text-[10px] text-[#7B8794] block">Aniqlik</span>
                          <span className="font-extrabold text-[#22A06B]">
                            {u.average_score || u.accuracy_percentage || 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div
                      className="flex items-center gap-2 pt-2 border-t border-[#F7F9FC]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="flex-1 py-2 rounded-xl bg-[#F7F9FC] hover:bg-[#E7F5F5] text-[#07858B] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Profil</span>
                      </button>

                      <button
                        onClick={() => router.push(`/messages?user=${encodeURIComponent(u.username || u.id)}`)}
                        className="py-2 px-3 rounded-xl bg-[#F7F9FC] hover:bg-[#E7F5F5] text-[#182536] font-bold text-xs flex items-center justify-center transition-colors"
                        title="Xabar yozish"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#07858B]" />
                      </button>

                      <button
                        onClick={() => router.push(`/rooms?opponent=${encodeURIComponent(u.username || u.id)}`)}
                        className="py-2 px-3 rounded-xl bg-[#07858B] hover:bg-[#066D73] text-white font-bold text-xs flex items-center justify-center transition-colors shadow-xs"
                        title="Testga chorlash"
                      >
                        <Swords className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* MY FRIENDS GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFriends.length === 0 ? (
              <div className="col-span-full py-16 text-center bg-white rounded-3xl border border-[#E8EDF2] space-y-3">
                <Users className="w-12 h-12 text-[#7B8794]/40 mx-auto" />
                <h3 className="font-bold text-base text-[#182536]">
                  {language === "uz" ? "Hozircha do'stlar ro'yxati bo'sh" : "No friends yet"}
                </h3>
                <p className="text-xs text-[#7B8794] max-w-sm mx-auto">
                  "Barcha O'quvchilar Reytingi" bo'limidan boshqa o'quvchilar bilan bog'laning yoki yangi foydalanuvchilarni do'stlikka chorlang.
                </p>
                <button
                  onClick={() => setActiveTab("ranking")}
                  className="inline-flex items-center gap-2 bg-[#07858B] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs hover:bg-[#066D73] transition-colors"
                >
                  <Trophy className="w-4 h-4" />
                  <span>O'quvchilar Reytingini Ko'rish</span>
                </button>
              </div>
            ) : (
              filteredFriends.map((f: any) => (
                <div
                  key={f.user_id || f.id}
                  className="bg-white rounded-3xl p-5 border border-[#E8EDF2] shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setSelectedUser(f)}
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={f.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${f.username}`}
                      alt={f.username}
                      className="w-12 h-12 rounded-full bg-[#F7F9FC] border border-[#E8EDF2]"
                    />
                    <div>
                      <h3 className="font-bold text-sm text-[#182536]">{f.first_name} {f.last_name}</h3>
                      <p className="text-xs text-[#7B8794]">@{f.username}</p>
                      <span className="text-[10px] text-[#07858B] font-bold">
                        Lvl {f.level || 1} · {f.accuracy_percentage || 85}% aniqlik
                      </span>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-2 pt-2 border-t border-[#F7F9FC]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => setSelectedUser(f)}
                      className="flex-1 py-2 rounded-xl bg-[#F7F9FC] hover:bg-[#E7F5F5] text-[#07858B] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Profil</span>
                    </button>
                    <Link
                      href={`/messages?user=${encodeURIComponent(f.username || f.id)}`}
                      className="flex-1 py-2 rounded-xl bg-[#F7F9FC] hover:bg-[#E7F5F5] text-[#182536] font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#07858B]" />
                      <span>Xabar</span>
                    </Link>
                    <Link
                      href={`/rooms?opponent=${encodeURIComponent(f.username || f.id)}`}
                      className="flex-1 py-2 rounded-xl bg-[#07858B] hover:bg-[#066D73] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>Chorlov</span>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Universal User Profile Details Modal */}
        <UserProfileModal
          user={selectedUser}
          isOpen={Boolean(selectedUser)}
          onClose={() => setSelectedUser(null)}
          onMessage={(u) => router.push(`/messages?user=${encodeURIComponent(u.username || u.id)}`)}
          onChallenge={(u) => router.push(`/rooms?opponent=${encodeURIComponent(u.username || u.id)}`)}
        />
      </div>
    </DashboardLayout>
  );
}

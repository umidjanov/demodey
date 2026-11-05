"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { useLanguage } from "@/src/context/LanguageContext";
import { api, getAllPlatformLearners } from "@/src/lib/api";
import { UserProfileModal } from "@/src/components/profile/UserProfileModal";
import {
  MessageSquare,
  Send,
  Swords,
  User,
  Sparkles,
  Trophy,
  Zap,
  Coins,
  Search,
  Eye,
  Info,
} from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "me" | "them";
  text: string;
  time: string;
  quizCode?: string;
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const queryUser = searchParams.get("user");

  const { t, language } = useLanguage();
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeFriend, setActiveFriend] = useState<any | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [searchContact, setSearchContact] = useState("");
  const [loading, setLoading] = useState(true);

  // Selected User Modal for Full Profile
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const learners = await getAllPlatformLearners();
      setContacts(learners);

      if (learners.length > 0) {
        // If query user param is specified, select that learner
        let initialUser = learners[0];
        if (queryUser) {
          const found = learners.find(
            (u) =>
              u.username?.toLowerCase() === queryUser.toLowerCase() ||
              u.id === queryUser
          );
          if (found) initialUser = found;
        }

        selectActiveContact(initialUser);
      }
    } catch (err) {
      console.error("Failed to load contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectActiveContact = (learner: any) => {
    setActiveFriend(learner);

    // Load persisted chat or welcome message
    if (typeof window !== "undefined") {
      const key = `quizora_chat_${learner.id || learner.username}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setMessages(JSON.parse(saved));
          return;
        } catch {}
      }
    }

    setMessages([
      {
        id: "1",
        sender: "them",
        text:
          language === "uz"
            ? `Salom! Men Quizora platformasida ${learner.level || 1}-darajadaman. Bilim bellashuviga tayyormisiz? Qaysi fandan test yechamiz?`
            : `Hello! I'm level ${learner.level || 1} on Quizora. Ready for a friendly study quiz challenge?`,
        time: "Hozirgina",
      },
    ]);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeFriend) return;

    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "me",
      text: input,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    setInput("");

    // Persist chat in localStorage
    if (typeof window !== "undefined") {
      const key = `quizora_chat_${activeFriend.id || activeFriend.username}`;
      localStorage.setItem(key, JSON.stringify(updated));
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const q = searchContact.toLowerCase().trim();
    if (!q) return true;
    return (
      c.username?.toLowerCase().includes(q) ||
      c.first_name?.toLowerCase().includes(q) ||
      c.last_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  });

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-16">
        <div className="bg-white rounded-3xl border border-[#E8EDF2] shadow-xs h-[700px] flex overflow-hidden">
          {/* Conversation List Left Column */}
          <div className="w-80 sm:w-96 border-r border-[#E8EDF2] flex flex-col bg-[#F7F9FC]/40 shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-[#E8EDF2] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-extrabold text-base text-[#182536] flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-[#07858B]" />
                    <span>{language === "uz" ? "O'quvchilar va Yozishmalar" : "Learners & Messages"}</span>
                  </h2>
                  <p className="text-[11px] text-[#7B8794]">
                    {language === "uz" ? "Barcha ro'yxatdan o'tgan o'quvchilar" : "All registered learners"} ({contacts.length})
                  </p>
                </div>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#7B8794] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchContact}
                  onChange={(e) => setSearchContact(e.target.value)}
                  placeholder={language === "uz" ? "O'quvchini qidirish..." : "Search scholar..."}
                  className="w-full bg-white border border-[#E8EDF2] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#182536] focus:outline-none focus:border-[#07858B]"
                />
              </div>
            </div>

            {/* Contacts Scrollable List */}
            <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
              {loading ? (
                <div className="py-16 text-center space-y-2">
                  <div className="w-6 h-6 border-2 border-[#07858B] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs text-[#7B8794]">O'quvchilar yuklanmoqda...</p>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2">
                  <p className="text-xs font-semibold text-[#182536]">
                    {language === "uz" ? "O'quvchilar topilmadi" : "No scholars found"}
                  </p>
                  <p className="text-[11px] text-[#7B8794]">
                    {language === "uz" ? "Qidiruv so'zini tekshirib ko'ring" : "Check your search query"}
                  </p>
                </div>
              ) : (
                filteredContacts.map((c) => {
                  const isSelected = activeFriend?.id === c.id;
                  const fullName = `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.username;

                  return (
                    <div
                      key={c.id || c.username}
                      onClick={() => selectActiveContact(c)}
                      className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer group ${
                        isSelected
                          ? "bg-white shadow-xs border border-[#07858B]/30 ring-1 ring-[#07858B]/10"
                          : "hover:bg-white/80 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={c.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${c.username}`}
                            alt=""
                            className="w-11 h-11 rounded-full bg-[#F7F9FC] border border-[#E8EDF2]"
                          />
                          <span className="w-2.5 h-2.5 rounded-full bg-[#22A06B] border-2 border-white absolute bottom-0 right-0" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-xs text-[#182536] truncate">{fullName}</p>
                            {c.rank && (
                              <span
                                className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                                  c.rank === 1
                                    ? "bg-amber-100 text-amber-900 border border-amber-300"
                                    : c.rank === 2
                                    ? "bg-slate-100 text-slate-800 border border-slate-300"
                                    : c.rank === 3
                                    ? "bg-orange-100 text-orange-900 border border-orange-300"
                                    : "bg-[#E7F5F5] text-[#07858B]"
                                }`}
                              >
                                #{c.rank}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#7B8794] truncate">@{c.username}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#07858B] font-semibold">
                            <span>Lvl {c.level || 1}</span>
                            <span>·</span>
                            <span className="flex items-center gap-0.5">
                              <Zap className="w-2.5 h-2.5 text-[#F5B83D] fill-[#F5B83D]" />
                              {c.total_xp || 0} XP
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Info button to open full modal */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedUser(c);
                        }}
                        className="p-1.5 text-[#7B8794] hover:text-[#07858B] hover:bg-[#E7F5F5] rounded-lg transition-colors shrink-0"
                        title="O'quvchi haqida barcha ma'lumotlar"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Chat Main Area */}
          <div className="flex-1 flex flex-col bg-white">
            {activeFriend ? (
              <>
                {/* Chat Header */}
                <div className="p-4 px-6 border-b border-[#E8EDF2] flex items-center justify-between">
                  <div
                    onClick={() => setSelectedUser(activeFriend)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="relative">
                      <img
                        src={activeFriend.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${activeFriend.username}`}
                        alt=""
                        className="w-11 h-11 rounded-full bg-[#F7F9FC] border border-[#E8EDF2] group-hover:scale-105 transition-transform"
                      />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#22A06B] border-2 border-white absolute bottom-0 right-0" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm text-[#182536] group-hover:text-[#07858B] transition-colors">
                          {`${activeFriend.first_name || ""} ${activeFriend.last_name || ""}`.trim() || activeFriend.username}
                        </h3>
                        {activeFriend.rank && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#E7F5F5] text-[#07858B] border border-teal-200">
                            #{activeFriend.rank} Reyting
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-[#7B8794]">
                        <span>@{activeFriend.username}</span>
                        <span>·</span>
                        <span className="text-[#07858B] font-semibold">
                          Lvl {activeFriend.level || 1} ({activeFriend.level_title || "Bilimdon"})
                        </span>
                        <span>·</span>
                        <span className="text-emerald-600 font-bold">Onlayn</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedUser(activeFriend)}
                      className="flex items-center gap-1.5 bg-[#F7F9FC] hover:bg-[#E7F5F5] text-[#07858B] px-3.5 py-2 rounded-xl text-xs font-bold transition-colors border border-[#E8EDF2]"
                      title="O'quvchining to'liq ma'lumotlarini ko'rish"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ma'lumotlar</span>
                    </button>

                    <Link
                      href={`/rooms?opponent=${encodeURIComponent(activeFriend.username || activeFriend.id)}`}
                      className="flex items-center gap-1.5 bg-[#07858B] hover:bg-[#066D73] text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors shadow-xs"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span>{language === "uz" ? "Testga Chorlash" : "Challenge to Quiz"}</span>
                    </Link>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((m) => {
                    const isMe = m.sender === "me";
                    return (
                      <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div
                          className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${
                            isMe ? "bg-[#07858B] text-white shadow-xs" : "bg-[#F7F9FC] text-[#182536] border border-[#E8EDF2]"
                          }`}
                        >
                          <p>{m.text}</p>
                          {m.quizCode && (
                            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-between gap-3 text-white font-bold">
                              <span>{language === "uz" ? "Xona kodi:" : "Room Code:"} {m.quizCode}</span>
                              <Link
                                href={`/rooms?code=${m.quizCode}`}
                                className="bg-white text-[#07858B] px-3 py-1 rounded-lg text-[10px] uppercase tracking-wider"
                              >
                                {language === "uz" ? "Kirish" : "Join"}
                              </Link>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-[#7B8794] mt-1 px-1">{m.time}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Input Bar */}
                <form onSubmit={handleSend} className="p-4 border-t border-[#E8EDF2] flex items-center gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      language === "uz"
                        ? `${activeFriend.first_name || activeFriend.username}ga xabar yoki test chorlovini yozing...`
                        : `Message or challenge ${activeFriend.first_name || activeFriend.username}...`
                    }
                    className="flex-1 bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl px-4 py-2.5 text-xs text-[#182536] focus:outline-none focus:border-[#07858B]"
                  />
                  <button
                    type="submit"
                    className="p-2.5 bg-[#07858B] hover:bg-[#066D73] text-white rounded-xl shadow-xs transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#7B8794] space-y-2">
                <MessageSquare className="w-12 h-12 text-[#07858B]/30" />
                <p className="text-sm font-bold text-[#182536]">
                  {language === "uz" ? "Suhbat tanlanmagan" : "No conversation selected"}
                </p>
                <p className="text-xs max-w-xs">
                  {language === "uz"
                    ? "Xabar yozish yoki testga chorlash uchun chap tarafdan o'quvchini tanlang."
                    : "Select a learner on the left to start chatting or challenge to a quiz."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* User Profile Modal */}
        <UserProfileModal
          user={selectedUser}
          isOpen={Boolean(selectedUser)}
          onClose={() => setSelectedUser(null)}
          onMessage={(u) => selectActiveContact(u)}
          onChallenge={(u) => (window.location.href = `/rooms?opponent=${encodeURIComponent(u.username || u.id)}`)}
        />
      </div>
    </DashboardLayout>
  );
}

export default function MessagesPage() {
  return (
    <React.Suspense
      fallback={
        <DashboardLayout>
          <div className="p-8 text-center text-[#7B8794] text-xs">Yuklanmoqda...</div>
        </DashboardLayout>
      }
    >
      <MessagesContent />
    </React.Suspense>
  );
}

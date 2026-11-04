"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { useLanguage } from "@/src/context/LanguageContext";
import { api } from "@/src/lib/api";
import { MessageSquare, Send, Swords, User, Sparkles } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: "me" | "them";
  text: string;
  time: string;
  quizCode?: string;
}

export default function MessagesPage() {
  const { t, language } = useLanguage();
  const [contacts, setContacts] = useState<any[]>([]);
  const [activeFriend, setActiveFriend] = useState<any | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const friendsRes = await api.getFriends().catch(() => null);
      let list: any[] = [];
      if (friendsRes && Array.isArray(friendsRes.friends) && friendsRes.friends.length > 0) {
        list = friendsRes.friends.map((f: any) => ({
          id: f.user_id,
          name: `${f.first_name || ""} ${f.last_name || ""}`.trim() || f.username,
          username: f.username,
          avatar: f.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${f.username}`,
          level: f.level || 1,
          isOnline: f.is_online ?? true,
          last: "Quizora platformasida faol",
          time: "Yaqinda",
        }));
      } else {
        const commRes = await api.getCommunityUsers().catch(() => []);
        if (Array.isArray(commRes) && commRes.length > 0) {
          list = commRes.map((u: any) => ({
            id: u.id,
            name: `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username,
            username: u.username,
            avatar: u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`,
            level: u.level || 1,
            isOnline: u.is_online ?? true,
            last: "Test yechishga tayyor",
            time: "Yaqinda",
          }));
        }
      }

      setContacts(list);
      if (list.length > 0) {
        setActiveFriend(list[0]);
        setMessages([
          {
            id: "1",
            sender: "them",
            text:
              language === "uz"
                ? `Salom! Bilim bellashuviga tayyormisan? Qaysi fandan test yechamiz?`
                : `Hello! Ready for a friendly quiz challenge?`,
            time: "Hozirgina",
          },
        ]);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeFriend) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: "me",
        text: input,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setInput("");
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        <div className="bg-white rounded-3xl border border-[#E8EDF2] shadow-xs h-[650px] flex overflow-hidden">
          {/* Conversation List Left Column */}
          <div className="w-80 border-r border-[#E8EDF2] flex flex-col bg-[#F7F9FC]/40">
            <div className="p-5 border-b border-[#E8EDF2]">
              <h2 className="font-extrabold text-base text-[#182536]">
                {language === "uz" ? "Yozishmalar" : language === "ru" ? "Сообщения" : "Conversations"}
              </h2>
              <p className="text-xs text-[#7B8794]">
                {language === "uz" ? "Shaxsiy xabarlar va test chorlovlari" : language === "ru" ? "Личные сообщения и вызовы" : "Direct messages & quiz challenges"}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {contacts.length === 0 ? (
                <div className="py-12 px-4 text-center space-y-2">
                  <p className="text-xs font-semibold text-[#182536]">
                    {language === "uz" ? "Hozircha suhbatlar yo'q" : "No conversations yet"}
                  </p>
                  <p className="text-[11px] text-[#7B8794]">
                    {language === "uz"
                      ? "Do'stlar bo'limidan boshqa foydalanuvchilar bilan bog'laning"
                      : "Find and connect with fellow learners in the Friends tab"}
                  </p>
                  <Link
                    href="/friends"
                    className="inline-block mt-2 text-xs font-bold text-[#07858B] hover:underline"
                  >
                    + {t.rightSidebar.addFriend}
                  </Link>
                </div>
              ) : (
                contacts.map((c) => (
                  <button
                    key={c.id || c.username}
                    onClick={() => setActiveFriend(c)}
                    className={`w-full p-3 rounded-2xl flex items-center justify-between text-left transition-colors ${
                      activeFriend?.id === c.id
                        ? "bg-white shadow-xs border border-[#E8EDF2]"
                        : "hover:bg-white/60"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={c.avatar}
                        alt=""
                        className="w-10 h-10 rounded-full bg-[#F7F9FC] border border-[#E8EDF2]"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-[#182536] truncate">{c.name}</p>
                        <p className="text-[11px] text-[#7B8794] truncate">@{c.username}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Active Chat Main Area */}
          <div className="flex-1 flex flex-col bg-white">
            {activeFriend ? (
              <>
                {/* Chat Header */}
                <div className="p-4 px-6 border-b border-[#E8EDF2] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={activeFriend.avatar} alt="" className="w-10 h-10 rounded-full bg-[#F7F9FC]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#22A06B] border-2 border-white absolute bottom-0 right-0" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[#182536]">{activeFriend.name}</h3>
                      <span className="text-[11px] text-[#07858B] font-semibold">
                        {t.dashboard.level} {activeFriend.level} · {t.rightSidebar.online}
                      </span>
                    </div>
                  </div>

                  <Link
                    href="/rooms"
                    className="flex items-center gap-1.5 bg-[#E7F5F5] hover:bg-teal-100 text-[#07858B] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors"
                  >
                    <Swords className="w-3.5 h-3.5" />
                    <span>{language === "uz" ? "Xonaga Taklif Qilish" : language === "ru" ? "Позвать в Комнату" : "Invite to Room"}</span>
                  </Link>
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
                placeholder={language === "uz" ? "Xabar yoki test chorlovini yozing..." : language === "ru" ? "Напишите сообщение..." : "Type a message or quiz challenge..."}
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
                  ? "Xabar yozish yoki testga chorlash uchun chap tarafdan foydalanuvchini tanlang."
                  : "Select a user on the left to start chatting or challenge to a quiz."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  </DashboardLayout>
);
}

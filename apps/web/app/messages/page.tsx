"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { useLanguage } from "@/src/context/LanguageContext";
import { useAuth } from "@/src/context/AuthContext";
import {
  api,
  getAllPlatformLearners,
  getConversationKey,
  getLocalDirectMessages,
  saveLocalDirectMessage,
  markLocalMessagesAsRead,
} from "@/src/lib/api";
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
  ShieldCheck,
  Lock,
  Clock,
  CheckCheck,
  Inbox,
  Users,
  LogIn,
} from "lucide-react";

interface DirectMessage {
  id: string;
  sender_id?: string;
  senderId?: string;
  senderUsername?: string;
  sender_username?: string;
  senderName?: string;
  sender_name?: string;
  senderAvatar?: string;
  sender_avatar?: string;
  recipient_id?: string;
  recipientId?: string;
  recipientUsername?: string;
  recipient_username?: string;
  recipientName?: string;
  recipient_name?: string;
  content?: string;
  text?: string;
  quizCode?: string;
  quiz_invitation_code?: string;
  timestamp?: number;
  created_at?: string;
  time?: string;
  read?: boolean;
  is_read?: boolean;
}

interface ConversationItem {
  partnerId: string;
  partnerUsername: string;
  partnerName: string;
  partnerAvatar: string;
  partnerLevel: number;
  partnerXp: number;
  partnerRank: number;
  isOnline: boolean;
  lastMessage: string;
  lastMessageTime: string;
  lastMessageTimestamp: number;
  unreadCount: number;
  rawUser?: any;
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const queryUser = searchParams.get("user");

  const { language } = useLanguage();
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<"conversations" | "all_learners">("conversations");
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [allLearners, setAllLearners] = useState<any[]>([]);
  const [activeFriend, setActiveFriend] = useState<any | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Profile modal
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial load
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }
    loadData();

    // Listen to real-time events across tabs/windows
    const handleStorageChange = () => {
      refreshData();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("quizora_new_message", handleStorageChange);

    // Periodic sync every 2.5 seconds
    const interval = setInterval(() => {
      refreshData();
    }, 2500);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("quizora_new_message", handleStorageChange);
      clearInterval(interval);
    };
  }, [currentUser?.id, queryUser]);

  // Refresh messages when active partner changes
  useEffect(() => {
    if (currentUser && activeFriend) {
      loadMessagesForPartner(activeFriend);
    }
  }, [activeFriend?.id, currentUser?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      await refreshData();
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    if (!currentUser) return;

    try {
      // 1. Fetch all platform learners
      const learners = await getAllPlatformLearners();
      // Exclude current user from learners list
      const otherLearners = learners.filter(
        (l) => l.id !== currentUser.id && l.username !== currentUser.username
      );
      setAllLearners(otherLearners);

      // 2. Discover all conversations involving currentUser
      // Combine API recent conversations and local direct store
      const cId = String(currentUser.id).toLowerCase();
      const cUser = String(currentUser.username).toLowerCase();

      // Read local store
      let allDirectMsgs: any[] = [];
      try {
        const raw = localStorage.getItem("quizora_all_direct_messages");
        if (raw) allDirectMsgs = JSON.parse(raw);
      } catch {}

      // Filter only messages where currentUser is sender or recipient
      const myMsgs = allDirectMsgs.filter((m: any) => {
        const sId = String(m.senderId || m.sender_id || "").toLowerCase();
        const rId = String(m.recipientId || m.recipient_id || "").toLowerCase();
        const sUser = String(m.senderUsername || m.sender_username || "").toLowerCase();
        const rUser = String(m.recipientUsername || m.recipient_username || "").toLowerCase();
        return sId === cId || sUser === cUser || rId === cId || rUser === cUser;
      });

      // Group by partner
      const convMap: { [partnerKey: string]: ConversationItem } = {};

      myMsgs.forEach((m: any) => {
        const sId = String(m.senderId || m.sender_id || "");
        const sUser = String(m.senderUsername || m.sender_username || "");
        const rId = String(m.recipientId || m.recipient_id || "");
        const rUser = String(m.recipientUsername || m.recipient_username || "");

        const isMeSender = sId.toLowerCase() === cId || sUser.toLowerCase() === cUser;
        const partnerIdentifier = isMeSender ? (rId || rUser) : (sId || sUser);
        const partnerUsername = isMeSender ? rUser : sUser;

        // Find learner details from otherLearners
        const learnerDetails = otherLearners.find(
          (l) =>
            l.id === partnerIdentifier ||
            l.username?.toLowerCase() === partnerUsername.toLowerCase() ||
            l.username?.toLowerCase() === partnerIdentifier.toLowerCase()
        );

        const partnerId = learnerDetails?.id || partnerIdentifier;
        const partnerName =
          learnerDetails?.first_name
            ? `${learnerDetails.first_name} ${learnerDetails.last_name || ""}`.trim()
            : (isMeSender ? (m.recipientName || m.recipient_name) : (m.senderName || m.sender_name)) ||
              partnerUsername ||
              partnerIdentifier;

        const partnerAvatar =
          learnerDetails?.avatar_url ||
          (isMeSender ? m.recipientAvatar : m.senderAvatar) ||
          `https://api.dicebear.com/7.x/bottts/svg?seed=${partnerUsername || partnerId}`;

        const msgTimestamp =
          m.timestamp || (m.created_at ? new Date(m.created_at).getTime() : Date.now());
        const msgTime =
          m.time ||
          (m.created_at
            ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : "Hozir");

        const msgText = m.text || m.content || (m.quizCode ? "Duelga chorlov taklifi" : "Xabar");

        const isUnread =
          !isMeSender && !(m.read || m.is_read) && (rId.toLowerCase() === cId || rUser.toLowerCase() === cUser);

        const key = partnerId.toLowerCase();

        if (!convMap[key]) {
          convMap[key] = {
            partnerId,
            partnerUsername: learnerDetails?.username || partnerUsername || partnerIdentifier,
            partnerName,
            partnerAvatar,
            partnerLevel: learnerDetails?.level || 1,
            partnerXp: learnerDetails?.total_xp || 0,
            partnerRank: learnerDetails?.rank || 99,
            isOnline: learnerDetails?.is_online ?? true,
            lastMessage: msgText,
            lastMessageTime: msgTime,
            lastMessageTimestamp: msgTimestamp,
            unreadCount: isUnread ? 1 : 0,
            rawUser: learnerDetails,
          };
        } else {
          if (msgTimestamp >= convMap[key].lastMessageTimestamp) {
            convMap[key].lastMessage = msgText;
            convMap[key].lastMessageTime = msgTime;
            convMap[key].lastMessageTimestamp = msgTimestamp;
          }
          if (isUnread) {
            convMap[key].unreadCount += 1;
          }
        }
      });

      const convList = Object.values(convMap).sort(
        (a, b) => b.lastMessageTimestamp - a.lastMessageTimestamp
      );
      setConversations(convList);

      // Handle query param ?user=...
      if (queryUser && !activeFriend) {
        const found = otherLearners.find(
          (l) =>
            l.username?.toLowerCase() === queryUser.toLowerCase() ||
            l.id?.toLowerCase() === queryUser.toLowerCase()
        );
        if (found) {
          selectActivePartner(found);
          return;
        }
      }

      // If activeFriend is already selected, re-load its messages
      if (activeFriend) {
        loadMessagesForPartner(activeFriend);
      } else if (convList.length > 0 && !activeFriend) {
        // Automatically select most recent conversation
        const firstPartner = convList[0];
        const learnerObj =
          firstPartner.rawUser ||
          otherLearners.find((l) => l.id === firstPartner.partnerId) || {
            id: firstPartner.partnerId,
            username: firstPartner.partnerUsername,
            first_name: firstPartner.partnerName,
            avatar_url: firstPartner.partnerAvatar,
            level: firstPartner.partnerLevel,
            total_xp: firstPartner.partnerXp,
            rank: firstPartner.partnerRank,
          };
        selectActivePartner(learnerObj);
      }
    } catch (err) {
      console.warn("Refresh direct messages error:", err);
    }
  };

  const selectActivePartner = (partner: any) => {
    setActiveFriend(partner);
    loadMessagesForPartner(partner);
  };

  const loadMessagesForPartner = async (partner: any) => {
    if (!currentUser || !partner) return;

    // 1. Mark incoming messages as read
    markLocalMessagesAsRead(currentUser.id, partner.id);

    // 2. Load strictly pairwise direct messages
    const localMsgs = getLocalDirectMessages(currentUser.id, partner.id);

    // 3. Try to fetch from server API
    let apiMsgs: any[] = [];
    try {
      apiMsgs = await api.getMessages(partner.id);
    } catch {}

    // Deduplicate and filter strictly
    const cId = String(currentUser.id).toLowerCase();
    const cUser = String(currentUser.username).toLowerCase();
    const pId = String(partner.id).toLowerCase();
    const pUser = String(partner.username || "").toLowerCase();

    const mergedMap = new Map<string, DirectMessage>();

    [...localMsgs, ...(Array.isArray(apiMsgs) ? apiMsgs : [])].forEach((m: any) => {
      const sId = String(m.senderId || m.sender_id || "").toLowerCase();
      const rId = String(m.recipientId || m.recipient_id || "").toLowerCase();
      const sUser = String(m.senderUsername || m.sender_username || "").toLowerCase();
      const rUser = String(m.recipientUsername || m.recipient_username || "").toLowerCase();

      // STRICT PRIVACY CHECK:
      const isCurrentSender = sId === cId || sUser === cUser;
      const isPartnerRecipient = rId === pId || rUser === pUser;
      const isPartnerSender = sId === pId || sUser === pUser;
      const isCurrentRecipient = rId === cId || rUser === cUser;

      if ((isCurrentSender && isPartnerRecipient) || (isPartnerSender && isCurrentRecipient)) {
        mergedMap.set(m.id || String(m.timestamp || Math.random()), {
          id: m.id || String(m.timestamp || Math.random()),
          sender_id: m.sender_id || m.senderId,
          senderId: m.sender_id || m.senderId,
          senderUsername: m.sender_username || m.senderUsername,
          sender_username: m.sender_username || m.senderUsername,
          senderName: m.sender_name || m.senderName,
          senderAvatar: m.sender_avatar || m.senderAvatar,
          recipient_id: m.recipient_id || m.recipientId,
          recipientId: m.recipient_id || m.recipientId,
          recipientUsername: m.recipient_username || m.recipientUsername,
          recipientName: m.recipient_name || m.recipientName,
          content: m.content || m.text,
          text: m.text || m.content,
          quizCode: m.quizCode || m.quiz_invitation_code,
          quiz_invitation_code: m.quiz_invitation_code || m.quizCode,
          timestamp: m.timestamp || (m.created_at ? new Date(m.created_at).getTime() : Date.now()),
          created_at: m.created_at || new Date().toISOString(),
          time:
            m.time ||
            (m.created_at
              ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "Hozir"),
          read: m.read || m.is_read || false,
          is_read: m.is_read || m.read || false,
        });
      }
    });

    const sorted = Array.from(mergedMap.values()).sort(
      (a, b) => (a.timestamp || 0) - (b.timestamp || 0)
    );
    setMessages(sorted);
  };

  const handleSend = async (e?: React.FormEvent, customText?: string, quizCode?: string) => {
    if (e) e.preventDefault();
    const textToSend = (customText !== undefined ? customText : input).trim();
    if (!textToSend || !activeFriend || !currentUser) return;

    const now = new Date();
    const newMsg: DirectMessage = {
      id: "msg_" + Date.now().toString() + "_" + Math.random().toString(36).substring(2, 7),
      sender_id: currentUser.id,
      senderId: currentUser.id,
      senderUsername: currentUser.username,
      sender_username: currentUser.username,
      senderName: `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() || currentUser.username,
      sender_name: `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() || currentUser.username,
      senderAvatar: currentUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`,
      sender_avatar: currentUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`,
      recipient_id: activeFriend.id,
      recipientId: activeFriend.id,
      recipientUsername: activeFriend.username,
      recipient_username: activeFriend.username,
      recipientName: `${activeFriend.first_name || ""} ${activeFriend.last_name || ""}`.trim() || activeFriend.username,
      recipient_name: `${activeFriend.first_name || ""} ${activeFriend.last_name || ""}`.trim() || activeFriend.username,
      content: textToSend,
      text: textToSend,
      quizCode: quizCode,
      quiz_invitation_code: quizCode,
      timestamp: Date.now(),
      created_at: now.toISOString(),
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false,
      is_read: false,
    };

    // 1. Immediately update UI
    setMessages((prev) => [...prev, newMsg]);
    if (!customText) setInput("");

    // 2. Save to local direct storage with privacy key
    saveLocalDirectMessage(newMsg);

    // 3. Send to server API
    try {
      await api.sendMessage(activeFriend.id, textToSend, quizCode);
    } catch (err) {
      console.warn("API sendMessage fallback to local sync:", err);
    }

    // Refresh conversation list
    refreshData();
  };

  const sendQuizInvite = () => {
    if (!activeFriend) return;
    const roomCode = `QZ-${Math.floor(1000 + Math.random() * 9000)}`;
    const inviteText =
      language === "uz"
        ? `Sizni Quizora Duel xonasiga chorlayman! Kod: ${roomCode}`
        : `I challenge you to a Quizora Duel! Room code: ${roomCode}`;
    handleSend(undefined, inviteText, roomCode);
  };

  // Filtered lists based on search
  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.partnerName.toLowerCase().includes(q) ||
      c.partnerUsername.toLowerCase().includes(q) ||
      c.lastMessage.toLowerCase().includes(q)
    );
  });

  const filteredAllLearners = allLearners.filter((l) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const fullName = `${l.first_name || ""} ${l.last_name || ""}`.toLowerCase();
    return (
      fullName.includes(q) ||
      l.username?.toLowerCase().includes(q) ||
      l.level_title?.toLowerCase().includes(q)
    );
  });

  // Not logged in view
  if (!currentUser) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-[#E8EDF2] text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-[#E7F5F5] rounded-full flex items-center justify-center mx-auto text-[#07858B]">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-[#182536]">
            {language === "uz" ? "Shaxsiy Xabarlar & Muloqot" : "Private Direct Messages"}
          </h2>
          <p className="text-xs text-[#7B8794] leading-relaxed">
            {language === "uz"
              ? "Boshqa o'quvchilar va admin bilan xavfsiz, 100% faqat sizga ko'rinadigan shaxsiy muloqot qilish uchun tizimga kiring."
              : "Sign in to access secure, end-to-end isolated direct messages with scholars and admins."}
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-[#07858B] hover:bg-[#066D73] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <LogIn className="w-4 h-4" />
            <span>{language === "uz" ? "Tizimga Kirish" : "Sign In"}</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-4 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#182536] flex items-center gap-2">
                <MessageSquare className="w-6 h-6 text-[#07858B]" />
                {language === "uz" ? "Xabarlar & Shaxsiy Muloqot" : "Private Direct Messages"}
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <Lock className="w-3 h-3 text-emerald-600" />
                {language === "uz" ? "100% Shaxsiy & Himoyalangan" : "Private & Encrypted"}
              </span>
            </div>
            <p className="text-xs text-[#7B8794] mt-0.5">
              {language === "uz"
                ? "Siz yozgan xabarlarni faqat siz va siz yozgan foydalanuvchi ko'ra oladi. Boshqa foydalanuvchilar o'qiy olmaydi."
                : "Your messages are private and strictly visible only to you and the recipient."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#07858B] bg-[#E7F5F5] px-3 py-1.5 rounded-full border border-[#07858B]/20">
              {language === "uz" ? "Foydalanuvchi:" : "Account:"}{" "}
              <span className="font-black text-[#182536]">@{currentUser.username}</span>
            </span>
          </div>
        </div>

        {/* Main Chat Interface */}
        <div className="bg-white rounded-3xl border border-[#E8EDF2] overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[660px] shadow-sm">
          {/* Left Column: Tabs & Contacts list */}
          <div className="md:col-span-5 lg:col-span-4 border-r border-[#E8EDF2] flex flex-col bg-[#FBFDFD]">
            {/* Tabs: Muloqotlarim vs Barcha O'quvchilar */}
            <div className="p-3 border-b border-[#E8EDF2] bg-white">
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F7F9FC] rounded-xl border border-[#E8EDF2]">
                <button
                  onClick={() => setActiveTab("conversations")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === "conversations"
                      ? "bg-white text-[#07858B] shadow-xs"
                      : "text-[#7B8794] hover:text-[#182536]"
                  }`}
                >
                  <Inbox className="w-3.5 h-3.5" />
                  <span>{language === "uz" ? "Suhbatlar" : "Chats"}</span>
                  {conversations.some((c) => c.unreadCount > 0) && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("all_learners")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === "all_learners"
                      ? "bg-white text-[#07858B] shadow-xs"
                      : "text-[#7B8794] hover:text-[#182536]"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{language === "uz" ? "O'quvchilar" : "Learners"}</span>
                  <span className="text-[10px] text-[#7B8794]">({allLearners.length})</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mt-2.5">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7B8794]" />
                <input
                  type="text"
                  placeholder={
                    activeTab === "conversations"
                      ? language === "uz"
                        ? "Suhbatlarni qidirish..."
                        : "Search chats..."
                      : language === "uz"
                      ? "O'quvchini qidirish..."
                      : "Search learners..."
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#E8EDF2] bg-[#F7F9FC] focus:bg-white focus:outline-none focus:border-[#07858B] transition-colors"
                />
              </div>
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#E8EDF2]/60">
              {activeTab === "conversations" ? (
                // TAB 1: ACTIVE CONVERSATIONS (Kelgan xabarlar va muloqotlar)
                filteredConversations.length === 0 ? (
                  <div className="p-8 text-center space-y-3 text-[#7B8794]">
                    <div className="w-10 h-10 rounded-full bg-[#E7F5F5] text-[#07858B] flex items-center justify-center mx-auto">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-[#182536]">
                      {language === "uz" ? "Hozircha suhbatlar yo'q" : "No conversations yet"}
                    </p>
                    <p className="text-[11px] leading-relaxed max-w-xs mx-auto">
                      {language === "uz"
                        ? "Sizga hali hech kim xabar yozmagan. 'O'quvchilar' bo'limidan biror do'stingiz yoki adminga birinchi bo'lib xabar yozing!"
                        : "No one has sent you a message yet. Start a chat by browsing the Learners tab!"}
                    </p>
                    <button
                      onClick={() => setActiveTab("all_learners")}
                      className="text-xs font-bold text-[#07858B] hover:underline"
                    >
                      + {language === "uz" ? "O'quvchilarni ko'rish" : "Browse Scholars"}
                    </button>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const isSelected = activeFriend?.id === conv.partnerId;
                    return (
                      <div
                        key={conv.partnerId}
                        onClick={() => {
                          const learnerObj =
                            conv.rawUser ||
                            allLearners.find((l) => l.id === conv.partnerId) || {
                              id: conv.partnerId,
                              username: conv.partnerUsername,
                              first_name: conv.partnerName,
                              avatar_url: conv.partnerAvatar,
                              level: conv.partnerLevel,
                              total_xp: conv.partnerXp,
                              rank: conv.partnerRank,
                            };
                          selectActivePartner(learnerObj);
                        }}
                        className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors group ${
                          isSelected
                            ? "bg-[#E7F5F5] border-l-4 border-l-[#07858B]"
                            : "hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar */}
                          <div
                            className="relative shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              const userToView =
                                conv.rawUser ||
                                allLearners.find((l) => l.id === conv.partnerId) ||
                                conv;
                              setSelectedUser(userToView);
                            }}
                            title={language === "uz" ? "Profilni ko'rish" : "View Profile"}
                          >
                            <img
                              src={conv.partnerAvatar}
                              alt={conv.partnerName}
                              className="w-10 h-10 rounded-full border border-[#E8EDF2] bg-white group-hover:scale-105 transition-transform"
                            />
                            <span
                              className={`w-2.5 h-2.5 rounded-full absolute bottom-0 right-0 border-2 border-white ${
                                conv.isOnline ? "bg-[#22A06B]" : "bg-[#7B8794]/40"
                              }`}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#182536] truncate">
                                {conv.partnerName}
                              </span>
                              <span className="text-[10px] text-[#7B8794] truncate">
                                @{conv.partnerUsername}
                              </span>
                            </div>

                            <p className="text-[11px] text-[#7B8794] truncate mt-0.5">
                              {conv.lastMessage}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                          <span className="text-[9px] text-[#7B8794] font-medium">
                            {conv.lastMessageTime}
                          </span>

                          {conv.unreadCount > 0 ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black shadow-2xs animate-pulse">
                              {conv.unreadCount} yangi
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-[#07858B] bg-[#E7F5F5] px-1.5 py-0.2 rounded-md">
                              #{conv.partnerRank || 1}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                // TAB 2: ALL REGISTERED LEARNERS (Yangi muloqot boshlash)
                filteredAllLearners.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#7B8794]">
                    {language === "uz" ? "O'quvchi topilmadi" : "No learners found"}
                  </div>
                ) : (
                  filteredAllLearners.map((learner) => {
                    const isSelected = activeFriend?.id === learner.id;
                    const isTop3 = (learner.rank || 99) <= 3;
                    const rankBadgeClass =
                      learner.rank === 1
                        ? "bg-amber-100 text-amber-800 border-amber-300"
                        : learner.rank === 2
                        ? "bg-slate-200 text-slate-700 border-slate-300"
                        : learner.rank === 3
                        ? "bg-orange-100 text-orange-800 border-orange-300"
                        : "bg-[#F7F9FC] text-[#7B8794] border-[#E8EDF2]";

                    return (
                      <div
                        key={learner.id}
                        onClick={() => selectActivePartner(learner)}
                        className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors group ${
                          isSelected
                            ? "bg-[#E7F5F5] border-l-4 border-l-[#07858B]"
                            : "hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="relative shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(learner);
                            }}
                            title={language === "uz" ? "Profilni ko'rish" : "View Profile"}
                          >
                            <img
                              src={
                                learner.avatar_url ||
                                `https://api.dicebear.com/7.x/bottts/svg?seed=${learner.username}`
                              }
                              alt={learner.username}
                              className="w-10 h-10 rounded-full border border-[#E8EDF2] bg-white group-hover:scale-105 transition-transform"
                            />
                            <span
                              className={`w-2.5 h-2.5 rounded-full absolute bottom-0 right-0 border-2 border-white ${
                                learner.is_online ? "bg-[#22A06B]" : "bg-[#7B8794]/40"
                              }`}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-[#182536] truncate">
                                {learner.first_name
                                  ? `${learner.first_name} ${learner.last_name || ""}`.trim()
                                  : learner.username}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#7B8794] truncate">
                              @{learner.username}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#07858B] font-semibold">
                              <span>Lvl {learner.level || 1}</span>
                              <span>•</span>
                              <span>{learner.total_xp || 0} XP</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-md border flex items-center gap-0.5 ${rankBadgeClass}`}
                          >
                            {isTop3 && <Trophy className="w-2.5 h-2.5" />}
                            #{learner.rank || 1}
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedUser(learner);
                            }}
                            className="text-[10px] font-semibold text-[#7B8794] hover:text-[#07858B] flex items-center gap-0.5 mt-0.5"
                          >
                            <Info className="w-3 h-3" />
                            <span>{language === "uz" ? "Profil" : "Info"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )
              )}
            </div>
          </div>

          {/* Right Column: Private Chat Room */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col bg-white">
            {activeFriend ? (
              <>
                {/* Active Partner Top Bar */}
                <div className="p-3.5 border-b border-[#E8EDF2] flex items-center justify-between bg-white shadow-2xs">
                  <div
                    className="flex items-center gap-3 cursor-pointer group"
                    onClick={() => setSelectedUser(activeFriend)}
                  >
                    <div className="relative">
                      <img
                        src={
                          activeFriend.avatar_url ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${activeFriend.username}`
                        }
                        alt={activeFriend.username}
                        className="w-10 h-10 rounded-full border border-[#E8EDF2] bg-white group-hover:scale-105 transition-transform"
                      />
                      <span
                        className={`w-2.5 h-2.5 rounded-full absolute bottom-0 right-0 border-2 border-white ${
                          activeFriend.is_online ? "bg-[#22A06B]" : "bg-[#7B8794]/40"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-[#182536] group-hover:text-[#07858B] transition-colors">
                          {activeFriend.first_name
                            ? `${activeFriend.first_name} ${activeFriend.last_name || ""}`.trim()
                            : activeFriend.username}
                        </p>
                        <span className="text-[10px] font-bold text-[#07858B] bg-[#E7F5F5] px-2 py-0.5 rounded-full">
                          #{activeFriend.rank || 1} O'rin
                        </span>
                      </div>
                      <p className="text-[11px] text-[#7B8794]">
                        @{activeFriend.username} · Lvl {activeFriend.level || 1} · {activeFriend.total_xp || 0} XP
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedUser(activeFriend)}
                      className="px-3 py-1.5 text-xs font-bold text-[#182536] bg-[#F7F9FC] hover:bg-[#E8EDF2] rounded-xl flex items-center gap-1.5 transition-colors border border-[#E8EDF2]"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#07858B]" />
                      <span className="hidden sm:inline">
                        {language === "uz" ? "To'liq Profil" : "Profile"}
                      </span>
                    </button>
                    <button
                      onClick={sendQuizInvite}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-[#07858B] hover:bg-[#066D73] rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                    >
                      <Swords className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">
                        {language === "uz" ? "Duelga Chorlash" : "Challenge"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Privacy Guarantee Banner */}
                <div className="bg-[#F7F9FC] border-b border-[#E8EDF2] px-4 py-1.5 text-[10px] text-[#7B8794] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {language === "uz"
                        ? `Ushbu suhbat faqat siz (@${currentUser.username}) va @${activeFriend.username} o'rtasida shaxsiy saqlanadi.`
                        : `This conversation is private strictly between @${currentUser.username} and @${activeFriend.username}.`}
                    </span>
                  </span>
                  <span className="text-[9px] font-bold text-[#07858B] hidden sm:inline">
                    🔒 Maxfiy Chat
                  </span>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-[#FBFDFD]">
                  {messages.length === 0 ? (
                    <div className="py-12 text-center space-y-4 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-[#E7F5F5] text-[#07858B] flex items-center justify-center mx-auto">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#182536]">
                          {language === "uz"
                            ? `Siz hali ${activeFriend.first_name || activeFriend.username} bilan xabar almashmadingiz`
                            : `No messages exchanged yet with ${activeFriend.first_name || activeFriend.username}`}
                        </p>
                        <p className="text-[11px] text-[#7B8794] mt-1">
                          {language === "uz"
                            ? "Birinchi bo'lib salom yo'llang yoki test dueliga chorlang!"
                            : "Say hello or challenge to a friendly quiz duel!"}
                        </p>
                      </div>

                      {/* Quick conversation starters */}
                      <div className="space-y-1.5 pt-2">
                        <button
                          onClick={() =>
                            handleSend(
                              undefined,
                              language === "uz"
                                ? "Assalomu alaykum! Bilim bellashuviga tayyormisiz? 🧠"
                                : "Hello! Ready for a knowledge challenge? 🧠"
                            )
                          }
                          className="w-full text-left text-xs bg-white border border-[#E8EDF2] hover:border-[#07858B] p-2 rounded-xl text-[#182536] transition-colors"
                        >
                          👋 {language === "uz" ? "Assalomu alaykum! Bilim bellashuviga tayyormisiz?" : "Hello! Ready for a challenge?"}
                        </button>
                        <button
                          onClick={() =>
                            handleSend(
                              undefined,
                              language === "uz"
                                ? "Qaysi fandan test yechamiz? Keling birgalikda kuch sinashamiz! 📚"
                                : "Which topic shall we test? Let's practice together! 📚"
                            )
                          }
                          className="w-full text-left text-xs bg-white border border-[#E8EDF2] hover:border-[#07858B] p-2 rounded-xl text-[#182536] transition-colors"
                        >
                          📚 {language === "uz" ? "Qaysi fandan test yechamiz?" : "Which topic shall we test?"}
                        </button>
                        <button
                          onClick={sendQuizInvite}
                          className="w-full text-left text-xs bg-white border border-[#E8EDF2] hover:border-[#07858B] p-2 rounded-xl text-[#07858B] font-semibold transition-colors"
                        >
                          ⚔️ {language === "uz" ? "Duel xonasi yaratish va chorlash" : "Create duel room and challenge"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const sId = String(m.sender_id || m.senderId || "").toLowerCase();
                      const sUser = String(m.senderUsername || m.sender_username || "").toLowerCase();
                      const cId = String(currentUser.id).toLowerCase();
                      const cUser = String(currentUser.username).toLowerCase();

                      const isMe = sId === cId || sUser === cUser;

                      return (
                        <div
                          key={m.id}
                          className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
                        >
                          {!isMe && (
                            <img
                              src={
                                m.senderAvatar ||
                                activeFriend.avatar_url ||
                                `https://api.dicebear.com/7.x/bottts/svg?seed=${activeFriend.username}`
                              }
                              alt={activeFriend.username}
                              className="w-7 h-7 rounded-full border border-[#E8EDF2] bg-white shrink-0 mb-1"
                            />
                          )}

                          <div
                            className={`max-w-[75%] rounded-2xl p-3 text-xs shadow-2xs space-y-1.5 ${
                              isMe
                                ? "bg-[#07858B] text-white rounded-br-none"
                                : "bg-white text-[#182536] border border-[#E8EDF2] rounded-bl-none"
                            }`}
                          >
                            {/* Sender title if partner sent it */}
                            {!isMe && (
                              <p className="text-[10px] font-bold text-[#07858B]">
                                {m.senderName || activeFriend.first_name || activeFriend.username}
                              </p>
                            )}

                            <p className="leading-relaxed whitespace-pre-wrap">{m.content || m.text}</p>

                            {/* Quiz Room Invitation Code */}
                            {(m.quizCode || m.quiz_invitation_code) && (
                              <div className="mt-2 pt-2 border-t border-white/20">
                                <Link
                                  href={`/rooms?code=${m.quizCode || m.quiz_invitation_code}`}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-colors ${
                                    isMe
                                      ? "bg-white text-[#07858B] hover:bg-[#E7F5F5]"
                                      : "bg-[#07858B] text-white hover:bg-[#066D73]"
                                  }`}
                                >
                                  <Swords className="w-3.5 h-3.5" />
                                  <span>
                                    {language === "uz" ? "Duel Xonasiga Kirish" : "Join Duel"} (
                                    {m.quizCode || m.quiz_invitation_code})
                                  </span>
                                </Link>
                              </div>
                            )}

                            <div
                              className={`text-[9px] flex items-center justify-end gap-1 ${
                                isMe ? "text-teal-100" : "text-[#7B8794]"
                              }`}
                            >
                              <span>{m.time}</span>
                              {isMe && <CheckCheck className="w-3 h-3 text-teal-200" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <form
                  onSubmit={handleSend}
                  className="p-3.5 border-t border-[#E8EDF2] bg-white flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={sendQuizInvite}
                    title={language === "uz" ? "Duelga taklif qilish" : "Send duel challenge"}
                    className="p-2.5 rounded-xl bg-[#E7F5F5] hover:bg-[#07858B] text-[#07858B] hover:text-white transition-colors"
                  >
                    <Swords className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      language === "uz"
                        ? `${activeFriend.first_name || activeFriend.username}ga xabar yozing...`
                        : `Type a message to ${activeFriend.first_name || activeFriend.username}...`
                    }
                    className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-[#E8EDF2] focus:outline-none focus:border-[#07858B] transition-colors bg-[#F7F9FC] focus:bg-white"
                  />

                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="p-2.5 rounded-xl bg-[#07858B] hover:bg-[#066D73] disabled:opacity-40 text-white transition-colors shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[#7B8794]">
                <MessageSquare className="w-12 h-12 text-[#E8EDF2] mb-3" />
                <p className="text-sm font-bold text-[#182536]">
                  {language === "uz" ? "Muloqot boshlash" : "Start a Conversation"}
                </p>
                <p className="text-xs text-[#7B8794] mt-1 max-w-sm">
                  {language === "uz"
                    ? "Chap tarafdagi 'Suhbatlar' yoki 'O'quvchilar' ro'yxatidan birini tanlang."
                    : "Select a learner from the list on the left to start a private conversation."}
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
          onMessage={(u) => selectActivePartner(u)}
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

"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { useAuth } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";
import { api } from "@/src/lib/api";
import {
  ShieldAlert,
  Users,
  Database,
  CheckCircle2,
  Calendar,
  Sparkles,
  Trophy,
  Upload,
  Search,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Eye,
  X,
  Phone,
  Mail,
  Award,
  Flame,
  Coins,
  RefreshCw,
  AlertCircle,
  Activity,
  Check,
} from "lucide-react";

export default function AdminPage() {
  const { user, login, isLoading } = useAuth();
  const { language, t } = useLanguage();
  const [stats, setStats] = useState<any | null>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingInAdmin, setLoggingInAdmin] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked">("all");

  // Selected User Modal
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Purge Fake Users State
  const [purging, setPurging] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Bulk Question Ingestion
  const [importJson, setImportJson] = useState("");
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [processingMonthly, setProcessingMonthly] = useState(false);
  const [monthlyMessage, setMonthlyMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role === "admin") {
      loadAdminData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const s = await api.getAdminStats();
      setStats(s);
      const u = await api.getAdminUsers();
      setUsersList(Array.isArray(u) ? u : []);
    } catch (err: any) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurgeFakeUsers = async () => {
    if (!window.confirm(
      language === "uz"
        ? "Haqiqatan ham barcha soxta (mock) foydalanuvchilarni ma'lumotlar bazasidan butunlay o'chirib tashlamoqchimisiz? Faqat haqiqiy ro'yxatdan o'tgan foydalanuvchilar qoladi."
        : "Are you sure you want to purge all fake/mock users from the database? Only genuine registered users will remain."
    )) {
      return;
    }

    setPurging(true);
    setActionMessage(null);
    try {
      const res = await api.purgeFakeUsers();
      setActionMessage({ type: "success", text: res.message || "Soxta userlar butunlay tozalandi!" });
      await loadAdminData();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Tozalashda xatolik yuz berdi." });
    } finally {
      setPurging(false);
    }
  };

  const handleToggleStatus = async (targetUser: any) => {
    const nextStatus = !targetUser.is_active;
    try {
      await api.updateUserStatus(targetUser.id, nextStatus);
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, is_active: nextStatus } : u))
      );
      if (selectedUser?.id === targetUser.id) {
        setSelectedUser({ ...selectedUser, is_active: nextStatus });
      }
      setActionMessage({
        type: "success",
        text: `${targetUser.username} holati ${nextStatus ? "Faol" : "Bloklangan"}ga o'zgartirildi.`,
      });
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Holatni o'zgartirib bo'lmadi." });
    }
  };

  const handleToggleRole = async (targetUser: any) => {
    const nextRole = targetUser.role === "admin" ? "user" : "admin";
    if (!window.confirm(
      `Foydalanuvchi ${targetUser.username} rolini '${nextRole.toUpperCase()}'ga o'zgartirmoqchimisiz?`
    )) {
      return;
    }

    try {
      await api.updateUserRole(targetUser.id, nextRole);
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: nextRole } : u))
      );
      if (selectedUser?.id === targetUser.id) {
        setSelectedUser({ ...selectedUser, role: nextRole });
      }
      setActionMessage({
        type: "success",
        text: `${targetUser.username} roli ${nextRole.toUpperCase()}ga o'zgartirildi.`,
      });
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Rolni o'zgartirib bo'lmadi." });
    }
  };

  const handleDeleteUser = async (targetUser: any) => {
    if (!window.confirm(
      `Diqqat! ${targetUser.username} hisobi va barcha tegishli test natijalari butunlay o'chiriladi. Rozimisiz?`
    )) {
      return;
    }

    try {
      await api.deleteUser(targetUser.id);
      setUsersList((prev) => prev.filter((u) => u.id !== targetUser.id));
      if (selectedUser?.id === targetUser.id) {
        setSelectedUser(null);
      }
      setActionMessage({
        type: "success",
        text: `Foydalanuvchi ${targetUser.username} butunlay o'chirildi.`,
      });
      await loadAdminData();
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Foydalanuvchini o'chirib bo'lmadi." });
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportStatus(null);
    try {
      const parsed = JSON.parse(importJson);
      if (!Array.isArray(parsed)) throw new Error("Kiritilgan ma'lumot JSON massivi bo'lishi kerak.");
      const res = await api.bulkImportQuestions(parsed);
      setImportStatus(`Muvaffaqiyatli! ${res.imported_count} ta savol bazaga kiritildi.`);
      setImportJson("");
      await loadAdminData();
    } catch (err: any) {
      setImportStatus(`Import Xatosi: ${err.message}`);
    }
  };

  const handleProcessMonthly = async () => {
    setProcessingMonthly(true);
    setMonthlyMessage(null);
    try {
      const res = await api.processMonthlyRewards("November 2026");
      setMonthlyMessage(`Oylik mukofotlar muvaffaqiyatli tarqatildi: ${res.record?.first_place_user} (+900 Tanga).`);
    } catch (err: any) {
      setMonthlyMessage(`Xatolik: ${err.message}`);
    } finally {
      setProcessingMonthly(false);
    }
  };

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q) ||
      u.phone_number?.toLowerCase().includes(q);

    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? u.is_active : !u.is_active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Loading check
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="py-24 text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-[#07858B] animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#182536]">Admin panel yuklanmoqda...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Access check: Not logged in
  if (!user) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-16 text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-amber-50 text-[#F5B83D] flex items-center justify-center mx-auto border border-amber-200">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#182536]">
            {language === "uz" ? "Administrator Paneli — Tizimga Kirish Talab Qilinadi" : "Admin Panel — Sign In Required"}
          </h2>
          <p className="text-xs text-[#7B8794] max-w-md mx-auto leading-relaxed">
            {language === "uz"
              ? "Ushbu sahifada ro'yxatdan o'tgan barcha foydalanuvchilar statistikasi, to'liq ma'lumotlar bazasi va tizim monitoringi joylashgan. Kirish uchun admin hisobidan foydalaning."
              : "This page displays all real registered users, metrics, and administration tools. Please sign in with an administrator account."}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={async () => {
                setLoggingInAdmin(true);
                try {
                  await login("admin@quizora.com", "Admin123!");
                } catch (e: any) {
                  alert("Admin kirishida xatolik: " + (e.message || ""));
                } finally {
                  setLoggingInAdmin(false);
                }
              }}
              disabled={loggingInAdmin}
              className="bg-[#07858B] hover:bg-[#066D73] text-white px-6 py-3 rounded-2xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4 text-emerald-300" />
              {loggingInAdmin ? "Kirilmoqda..." : "Tezkor Admin sifatida kirish (admin@quizora.com)"}
            </button>
            <Link
              href="/login"
              className="bg-white border border-[#E8EDF2] text-[#182536] px-5 py-3 rounded-2xl font-semibold text-xs hover:bg-[#F7F9FC] transition-all flex items-center justify-center"
            >
              Login sahifasi
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Access check: Logged in but not admin
  if (user.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto py-16 text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-red-50 text-[#E05252] flex items-center justify-center mx-auto border border-red-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-[#182536]">
            {language === "uz" ? "Administrator Huquqi Talab Qilinadi" : "Administrator Privileges Required"}
          </h2>
          <p className="text-xs text-[#7B8794] max-w-md mx-auto">
            {language === "uz"
              ? `Siz tizimga @${user.username} (oddiy foydalanuvchi) sifatida kirgansiz. Admin panelga kirish uchun administrator hisobiga o'ting.`
              : "This area is restricted to QUIZORA system administrators."}
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
            <button
              onClick={async () => {
                setLoggingInAdmin(true);
                try {
                  await login("admin@quizora.com", "Admin123!");
                } catch (e: any) {
                  alert("Admin kirishida xatolik: " + (e.message || ""));
                } finally {
                  setLoggingInAdmin(false);
                }
              }}
              disabled={loggingInAdmin}
              className="bg-[#07858B] hover:bg-[#066D73] text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4 text-emerald-300" />
              {loggingInAdmin ? "Kirilmoqda..." : "Admin hisobiga o'tish (admin@quizora.com)"}
            </button>
            <Link
              href="/dashboard"
              className="bg-white border border-[#E8EDF2] text-[#182536] px-5 py-2.5 rounded-xl font-semibold text-xs hover:bg-[#F7F9FC]"
            >
              Dashboardga qaytish
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-16">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8EDF2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-[#E05252] text-xs font-bold">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Root Tizim Administratori Paneli</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#182536] tracking-tight">
              QUIZORA Boshqaruv Markazi
            </h1>
            <p className="text-xs sm:text-sm text-[#7B8794] max-w-2xl">
              Foydalanuvchilar observabilligi, ro'yxatdan o'tgan barcha userlar monitoringi, test savollari nazorati va soxta ma'lumotlarni tozalash.
            </p>
          </div>

          {/* Top Actions: Purge Fake Users & Refresh */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handlePurgeFakeUsers}
              disabled={purging}
              className="bg-red-50 hover:bg-red-100 text-[#E05252] border border-red-200 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all hover:scale-[1.02]"
              title="Soxta foydalanuvchilar va ularning natijalarini bazadan to'liq o'chirish"
            >
              <Trash2 className="w-4 h-4" />
              <span>{purging ? "Tozalanmoqda..." : "Soxta userlarni tozalash"}</span>
            </button>

            <button
              onClick={loadAdminData}
              disabled={loading}
              className="bg-[#F7F9FC] hover:bg-[#E8EDF2] text-[#182536] border border-[#E8EDF2] px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#07858B]" : ""}`} />
              <span>Yangilash</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Alert */}
        {actionMessage && (
          <div
            className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between ${
              actionMessage.type === "success"
                ? "bg-teal-50 border-teal-200 text-[#066D73]"
                : "bg-red-50 border-red-200 text-[#E05252]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {actionMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-[#07858B] shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#E05252] shrink-0" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-[#7B8794] hover:text-[#182536]">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* System KPIs (Qancha userlar foydalanayotgani) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs">
            <span className="text-xs font-semibold text-[#7B8794] block">Jami Userlar</span>
            <p className="text-2xl font-black text-[#182536] mt-1">{stats?.kpis?.total_registered_users || usersList.length}</p>
            <span className="text-[10px] text-teal-600 font-bold block mt-1">Ro'yxatdan o'tgan</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs">
            <span className="text-xs font-semibold text-[#7B8794] block">Faol Userlar</span>
            <p className="text-2xl font-black text-[#22A06B] mt-1">
              {stats?.kpis?.active_users_count || usersList.filter((u) => u.is_active).length}
            </p>
            <span className="text-[10px] text-[#22A06B] font-bold block mt-1">● Tizimda faol</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs">
            <span className="text-xs font-semibold text-[#7B8794] block">Adminlar</span>
            <p className="text-2xl font-black text-purple-700 mt-1">
              {stats?.kpis?.admins_count || usersList.filter((u) => u.role === "admin").length}
            </p>
            <span className="text-[10px] text-purple-600 font-bold block mt-1">Boshqaruvchilar</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs">
            <span className="text-xs font-semibold text-[#7B8794] block">Yechilgan Testlar</span>
            <p className="text-2xl font-black text-[#07858B] mt-1">
              {stats?.kpis?.total_quiz_attempts_completed || 0}
            </p>
            <span className="text-[10px] text-[#07858B] font-bold block mt-1">Yakunlangan</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs">
            <span className="text-xs font-semibold text-[#7B8794] block">Savollar Bazasi</span>
            <p className="text-2xl font-black text-amber-700 mt-1">{stats?.kpis?.total_questions_in_pool || 0}</p>
            <span className="text-[10px] text-amber-600 font-bold block mt-1">Barcha fanlar</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-[#E8EDF2] shadow-xs">
            <span className="text-xs font-semibold text-[#7B8794] block">Kategoriyalar</span>
            <p className="text-2xl font-black text-[#182536] mt-1">{stats?.kpis?.total_active_categories || 5}</p>
            <span className="text-[10px] text-teal-600 font-bold block mt-1">O'zbek & Xalqaro</span>
          </div>
        </div>

        {/* SECTION: ALL USERS DIRECTORY ("barcha userlarning barcha malumotlari korinib tursin") */}
        <div className="bg-white rounded-3xl border border-[#E8EDF2] shadow-xs overflow-hidden space-y-4 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8EDF2] pb-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-extrabold text-[#182536] flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#07858B]" />
                  <span>Barcha Foydalanuvchilar Ro'yxati va Nazorati</span>
                </h2>
                <span className="text-xs bg-[#E7F5F5] text-[#07858B] px-3 py-1 rounded-full font-bold">
                  Jami: {usersList.length} ta
                </span>
                <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                  Faol: {usersList.filter((u) => u.is_active).length}
                </span>
                <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2.5 py-0.5 rounded-full font-bold">
                  Admin: {usersList.filter((u) => u.role === "admin").length}
                </span>
                <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-bold">
                  Oddiy userlar: {usersList.filter((u) => u.role === "user").length}
                </span>
              </div>
              <p className="text-xs text-[#7B8794] mt-1">
                Ro'yxatdan o'tgan haqiqiy userlarning to'liq ma'lumotlari: aloqa, daraja, XP, tangalar, test aniqligi, intizom zanjiri va boshqaruv amallari.
              </p>
            </div>

            {/* Live Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[#7B8794] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ism, username, email yoki telefon..."
                className="w-full bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl pl-10 pr-4 py-2 text-xs text-[#182536] placeholder-[#7B8794] focus:outline-none focus:border-[#07858B]"
              />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-1.5 bg-[#F7F9FC] p-1 rounded-xl border border-[#E8EDF2]">
              <span className="text-[11px] font-bold text-[#7B8794] px-2">Rol:</span>
              {[
                { id: "all", label: "Barchasi" },
                { id: "user", label: "Userlar" },
                { id: "admin", label: "Adminlar" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setRoleFilter(tab.id as any)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    roleFilter === tab.id
                      ? "bg-white text-[#07858B] shadow-xs"
                      : "text-[#7B8794] hover:text-[#182536]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 bg-[#F7F9FC] p-1 rounded-xl border border-[#E8EDF2]">
              <span className="text-[11px] font-bold text-[#7B8794] px-2">Holat:</span>
              {[
                { id: "all", label: "Barchasi" },
                { id: "active", label: "Faol" },
                { id: "blocked", label: "Bloklangan" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`px-3 py-1 rounded-lg font-bold transition-all ${
                    statusFilter === tab.id
                      ? "bg-white text-[#07858B] shadow-xs"
                      : "text-[#7B8794] hover:text-[#182536]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-2xl border border-[#E8EDF2]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F9FC] text-[#7B8794] font-bold uppercase tracking-wider border-b border-[#E8EDF2]">
                <tr>
                  <th className="py-3 px-4">Foydalanuvchi</th>
                  <th className="py-3 px-4">Aloqa (Email / Tel)</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Daraja & XP</th>
                  <th className="py-3 px-4">Tangalar ($RC)</th>
                  <th className="py-3 px-4">Testlar / Aniqlik</th>
                  <th className="py-3 px-4">Zanjir</th>
                  <th className="py-3 px-4">Ro'yxatdan o'tgan</th>
                  <th className="py-3 px-4">Holati</th>
                  <th className="py-3 px-4 text-center">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8EDF2]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-[#7B8794]">
                      <Users className="w-8 h-8 mx-auto text-[#7B8794]/40 mb-2" />
                      <p className="font-bold text-sm text-[#182536]">Foydalanuvchilar topilmadi</p>
                      <p className="text-xs">Qidiruv parametrlarini o'zgartirib ko'ring yoki yangi user ro'yxatdan o'tkazing.</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isAdmin = u.role === "admin";
                    const isSelf = user?.id === u.id;

                    return (
                      <tr
                        key={u.id}
                        className={`hover:bg-[#F7F9FC]/80 transition-colors ${
                          !u.is_active ? "opacity-60 bg-red-50/20" : ""
                        }`}
                      >
                        {/* 1. User */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`}
                              alt={u.username}
                              className="w-9 h-9 rounded-full bg-[#F7F9FC] border border-[#E8EDF2]"
                            />
                            <div>
                              <p className="font-bold text-[#182536]">
                                {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}` : u.username}
                              </p>
                              <p className="text-[11px] text-[#7B8794]">@{u.username}</p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Contact */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="font-semibold text-[#182536] flex items-center gap-1.5">
                              <Mail className="w-3 h-3 text-[#7B8794]" />
                              <span>{u.email}</span>
                            </p>
                            {u.phone_number ? (
                              <p className="text-[11px] text-[#7B8794] flex items-center gap-1.5">
                                <Phone className="w-3 h-3 text-[#7B8794]" />
                                <span>{u.phone_number}</span>
                              </p>
                            ) : (
                              <span className="text-[10px] text-slate-400">Tel ko'rsatilmagan</span>
                            )}
                          </div>
                        </td>

                        {/* 3. Role */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              isAdmin
                                ? "bg-purple-100 text-purple-700 border border-purple-200"
                                : "bg-teal-50 text-[#07858B] border border-teal-200"
                            }`}
                          >
                            <Shield className="w-3 h-3" />
                            {isAdmin ? "Admin" : "User"}
                          </span>
                        </td>

                        {/* 4. Level & XP */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-bold text-[#182536] bg-[#F7F9FC] px-2 py-0.5 rounded-md border border-[#E8EDF2]">
                              Lvl {u.level || 1}
                            </span>
                            <span className="block text-[11px] text-[#07858B] font-bold mt-0.5">
                              {u.total_xp || 0} XP
                            </span>
                          </div>
                        </td>

                        {/* 5. Ranking Coins */}
                        <td className="py-3.5 px-4">
                          <span className="font-extrabold text-amber-700 flex items-center gap-1">
                            <Coins className="w-3.5 h-3.5 text-[#F5B83D] fill-[#F5B83D]" />
                            {u.ranking_coins || u.coins || 0} $RC
                          </span>
                        </td>

                        {/* 6. Quizzes & Accuracy */}
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-bold text-[#182536]">
                              {u.completed_quizzes_count || 0} ta test
                            </span>
                            <span className="block text-[11px] text-[#22A06B] font-semibold">
                              {u.average_score || 0}% aniqlik
                            </span>
                          </div>
                        </td>

                        {/* 7. Streak */}
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-[#FF9B45] flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 fill-[#FF9B45]" />
                            {u.current_streak || 0} kun
                          </span>
                        </td>

                        {/* 8. Registration Date */}
                        <td className="py-3.5 px-4 text-[#7B8794]">
                          {u.created_at ? u.created_at.split("T")[0] : "—"}
                        </td>

                        {/* 9. Status */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.is_active
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-red-50 text-[#E05252] border border-red-200"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-red-500"}`} />
                            {u.is_active ? "Faol" : "Bloklangan"}
                          </span>
                        </td>

                        {/* 10. Actions */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* View Detail Modal */}
                            <button
                              onClick={() => setSelectedUser(u)}
                              className="p-1.5 text-[#7B8794] hover:text-[#07858B] hover:bg-[#E7F5F5] rounded-lg transition-colors"
                              title="Barcha ma'lumotlarni ko'rish"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Change Role */}
                            {!isSelf && (
                              <button
                                onClick={() => handleToggleRole(u)}
                                className="p-1.5 text-[#7B8794] hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title={isAdmin ? "Oddiy userga tushirish" : "Adminga ko'tarish"}
                              >
                                <Shield className="w-4 h-4" />
                              </button>
                            )}

                            {/* Toggle Active / Block */}
                            {!isSelf && (
                              <button
                                onClick={() => handleToggleStatus(u)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  u.is_active
                                    ? "text-[#7B8794] hover:text-[#E05252] hover:bg-red-50"
                                    : "text-[#7B8794] hover:text-emerald-600 hover:bg-emerald-50"
                                }`}
                                title={u.is_active ? "Hisobni bloklash" : "Hisobni faollashtirish"}
                              >
                                {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </button>
                            )}

                            {/* Delete Account */}
                            {!isSelf && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 text-[#7B8794] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hisobni butunlay o'chirish"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FULL USER DETAIL MODAL */}
        {selectedUser && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-3xl border border-[#E8EDF2] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="p-6 border-b border-[#E8EDF2] flex items-center justify-between bg-gradient-to-r from-[#F7F9FC] to-white">
                <div className="flex items-center gap-3.5">
                  <img
                    src={selectedUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedUser.username}`}
                    alt={selectedUser.username}
                    className="w-12 h-12 rounded-full border-2 border-white shadow-xs bg-[#F7F9FC]"
                  />
                  <div>
                    <h3 className="font-extrabold text-base text-[#182536]">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </h3>
                    <p className="text-xs text-[#7B8794]">@{selectedUser.username} · ID: {selectedUser.id}</p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-2 text-[#7B8794] hover:text-[#182536] hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body: All Details */}
              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      selectedUser.role === "admin"
                        ? "bg-purple-100 text-purple-700 border border-purple-200"
                        : "bg-teal-50 text-[#07858B] border border-teal-200"
                    }`}
                  >
                    Rol: {selectedUser.role}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      selectedUser.is_active
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-[#E05252] border border-red-200"
                    }`}
                  >
                    Holat: {selectedUser.is_active ? "Faol (Active)" : "Bloklangan (Blocked)"}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    Daraja: {selectedUser.level || 1} ({selectedUser.level_title || "Bilimdon"})
                  </span>
                </div>

                {/* Contact & Personal Information */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#7B8794] uppercase tracking-wider">
                    Aloqa va Shaxsiy Ma'lumotlar
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E8EDF2]">
                      <span className="text-[#7B8794] block">Elektron Pochta</span>
                      <span className="font-bold text-[#182536]">{selectedUser.email}</span>
                    </div>
                    <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E8EDF2]">
                      <span className="text-[#7B8794] block">Telefon Raqami</span>
                      <span className="font-bold text-[#182536]">
                        {selectedUser.phone_number || "Ko'rsatilmagan"}
                      </span>
                    </div>
                    <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E8EDF2]">
                      <span className="text-[#7B8794] block">Ro'yxatdan O'tgan Sana</span>
                      <span className="font-bold text-[#182536]">{selectedUser.created_at || "—"}</span>
                    </div>
                    <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E8EDF2]">
                      <span className="text-[#7B8794] block">Oxirgi Kirish / Faollik</span>
                      <span className="font-bold text-[#182536]">
                        {selectedUser.last_login_at || selectedUser.last_active_date || "—"}
                      </span>
                    </div>
                  </div>
                  {selectedUser.bio && (
                    <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E8EDF2] text-xs">
                      <span className="text-[#7B8794] block">Foydalanuvchi Haqida (Bio)</span>
                      <p className="font-medium text-[#182536] mt-0.5">{selectedUser.bio}</p>
                    </div>
                  )}
                </div>

                {/* Educational & Test Metrics */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-[#7B8794] uppercase tracking-wider">
                    Test Natijalari va O'yin Ko'rsatkichlari
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E8EDF2] text-center">
                      <span className="text-[#7B8794] block text-[10px]">Jami XP</span>
                      <span className="font-extrabold text-[#07858B] text-base">{selectedUser.total_xp || 0}</span>
                    </div>
                    <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E8EDF2] text-center">
                      <span className="text-[#7B8794] block text-[10px]">Reyting Tangalari</span>
                      <span className="font-extrabold text-amber-700 text-base">
                        {selectedUser.ranking_coins || selectedUser.coins || 0} $RC
                      </span>
                    </div>
                    <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E8EDF2] text-center">
                      <span className="text-[#7B8794] block text-[10px]">Yechilgan Testlar</span>
                      <span className="font-extrabold text-[#182536] text-base">
                        {selectedUser.completed_quizzes_count || 0}
                      </span>
                    </div>
                    <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E8EDF2] text-center">
                      <span className="text-[#7B8794] block text-[10px]">O'rtacha Aniqlik</span>
                      <span className="font-extrabold text-[#22A06B] text-base">
                        {selectedUser.average_score || 0}%
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E8EDF2] text-center">
                      <span className="text-[#7B8794] block text-[10px]">Jami Savollar</span>
                      <span className="font-bold text-[#182536]">{selectedUser.total_questions_answered || 0}</span>
                    </div>
                    <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E8EDF2] text-center">
                      <span className="text-[#7B8794] block text-[10px]">To'g'ri Javoblar</span>
                      <span className="font-bold text-[#22A06B]">{selectedUser.total_correct_answers || 0}</span>
                    </div>
                    <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E8EDF2] text-center">
                      <span className="text-[#7B8794] block text-[10px]">Noto'g'ri Javoblar</span>
                      <span className="font-bold text-[#E05252]">{selectedUser.total_incorrect_answers || 0}</span>
                    </div>
                    <div className="p-3 bg-[#F7F9FC] rounded-xl border border-[#E8EDF2] text-center">
                      <span className="text-[#7B8794] block text-[10px]">Kunlik Zanjir</span>
                      <span className="font-bold text-[#FF9B45]">{selectedUser.current_streak || 0} kun</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 px-6 border-t border-[#E8EDF2] flex items-center justify-between bg-[#F7F9FC]">
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#7B8794] hover:text-[#182536] transition-colors"
                >
                  Yopish
                </button>

                {user?.id !== selectedUser.id && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleRole(selectedUser)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors border border-purple-200"
                    >
                      Rolni almashtirish ({selectedUser.role === "admin" ? "User" : "Admin"})
                    </button>
                    <button
                      onClick={() => handleToggleStatus(selectedUser)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors border ${
                        selectedUser.is_active
                          ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
                      }`}
                    >
                      {selectedUser.is_active ? "Bloklash" : "Faollashtirish"}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(selectedUser)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-50 text-[#E05252] hover:bg-red-100 transition-colors border border-red-200"
                    >
                      O'chirish
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Monthly Rewards Trigger */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8EDF2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-[#182536] flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#F5B83D]" />
              Oylik Turnir Mukofotlarini Taqsimlash
            </h3>
            <p className="text-xs text-[#7B8794] max-w-lg">
              Rasmiy mavsum reytingini hisoblaydi, 1-o'rin sohibiga 5 yulduzli "Zukko" nishoni va +900 $RC tangalarini taqdim etadi.
            </p>
            {monthlyMessage && (
              <p className="text-xs font-bold text-[#07858B] pt-1">{monthlyMessage}</p>
            )}
          </div>

          <button
            onClick={handleProcessMonthly}
            disabled={processingMonthly}
            className="bg-[#F5B83D] hover:bg-amber-400 text-[#182536] px-6 py-3 rounded-2xl font-bold text-xs shadow-xs transition-transform hover:scale-105 shrink-0"
          >
            {processingMonthly ? "Tarqatilmoqda..." : "Oylik Mukofotlarni Tarqatish"}
          </button>
        </div>

        {/* Bulk Question Import JSON Area */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8EDF2] shadow-xs space-y-4">
          <h3 className="font-bold text-base text-[#182536] flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#07858B]" />
            Test Savollarini Ommaviy Yuklash (JSON Formatida)
          </h3>
          <p className="text-xs text-[#7B8794]">
            Minglab test savollarini tezkor ravishda QUIZORA savollar bazasiga qo'shish uchun JSON massivini kiriting.
          </p>

          {importStatus && (
            <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-xs font-bold text-[#066D73]">
              {importStatus}
            </div>
          )}

          <form onSubmit={handleBulkImport} className="space-y-3">
            <textarea
              rows={5}
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder={`[
  {
    "category_id": "670e10000000000000000010",
    "topic_id": "670e20000000000000000010",
    "difficulty": "medium",
    "type": "multiple_choice",
    "stem": "O'zbek adabiyotida g'azal janrining asoschisi kim?",
    "options": [
      {"id": "A", "text": "Alisher Navoiy"},
      {"id": "B", "text": "Bobur"},
      {"id": "C", "text": "Lutfiy"},
      {"id": "D", "text": "Atoiy"}
    ],
    "correct_answer": "A",
    "explanation": "Alisher Navoiy o'zbek adabiy tilining asoschisi hisoblanadi.",
    "why_correct": "Navoiy xamsa va o'nlab devonlar yaratgan."
  }
]`}
              className="w-full bg-[#F7F9FC] border border-[#E8EDF2] rounded-2xl p-4 font-mono text-xs text-[#182536] focus:outline-none focus:border-[#07858B]"
            />
            <button
              type="submit"
              className="bg-[#07858B] hover:bg-[#066D73] text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-xs transition-colors"
            >
              Savollarni Bazaga Kiritish
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

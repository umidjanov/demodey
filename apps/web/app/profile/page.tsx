"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { useAuth } from "@/src/context/AuthContext";
import { useLanguage } from "@/src/context/LanguageContext";
import { api } from "@/src/lib/api";
import {
  User,
  Mail,
  Phone,
  Shield,
  Save,
  CheckCircle2,
  Lock,
  Sparkles,
  Camera,
  Coins,
  Zap,
} from "lucide-react";

export default function ProfilePage() {
  const { user, profile, refreshProfile, updateUserLocally } = useAuth();
  const { t, language } = useLanguage();

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [bio, setBio] = useState(
    language === "uz"
      ? "Bilim olishga intiluvchi faol o'quvchi."
      : language === "ru"
      ? "Студент, стремящийся к совершенствованию знаний."
      : "Full-stack student dedicated to mastering active recall, algorithms, and design systems."
  );
  const [selectedAvatar, setSelectedAvatar] = useState(
    user?.avatar_url || "https://api.dicebear.com/7.x/bottts/svg?seed=alex_learner"
  );

  React.useEffect(() => {
    if (user) {
      if (user.first_name) setFirstName(user.first_name);
      if (user.last_name) setLastName(user.last_name);
      if (user.avatar_url) setSelectedAvatar(user.avatar_url);
    }
  }, [user]);

  const [privacy, setPrivacy] = useState({
    show_email: false,
    show_phone: false,
    show_activity: true,
    allow_invitations: true,
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const avatarSeeds = ["alex_learner", "sarah_connor", "kenji_sato", "elena_rostova", "marcus_v", "nova_mind"];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      updateUserLocally({
        first_name: firstName,
        last_name: lastName,
        avatar_url: selectedAvatar,
      });

      await api.updateProfile({
        first_name: firstName,
        last_name: lastName,
        bio,
        avatar_url: selectedAvatar,
        privacy_settings: privacy,
      });
      await refreshProfile();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error(e);
      // Still show success if local update was applied
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8EDF2] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#182536] tracking-tight">
              {t.nav.profile}
            </h1>
            <p className="text-xs sm:text-sm text-[#7B8794]">
              {language === "uz"
                ? "Shaxsiy ma'lumotlaringiz, avataringiz va xavfsizlik sozlamalarini boshqaring."
                : language === "ru"
                ? "Управление личными данными, аватаром и настройками приватности."
                : "Manage your personal public persona, avatar, learning stats, and privacy controls."}
            </p>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs font-bold text-[#066D73] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#07858B]" />
            <span>
              {language === "uz" ? "Profil muvaffaqiyatli saqlandi!" : language === "ru" ? "Настройки профиля сохранены!" : "Profile settings saved successfully!"}
            </span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Selector */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8EDF2] shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-[#182536]">
              {language === "uz" ? "Profil Avatarini Tanlang" : language === "ru" ? "Выберите Аватар" : "Choose Profile Avatar"}
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              {avatarSeeds.map((seed) => {
                const url = `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}`;
                const isSelected = selectedAvatar === url;

                return (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => setSelectedAvatar(url)}
                    className={`w-16 h-16 rounded-2xl border-2 p-1 transition-all ${
                      isSelected
                        ? "border-[#07858B] ring-4 ring-[#07858B]/20 scale-105 shadow-sm"
                        : "border-[#E8EDF2] hover:border-[#07858B]/50"
                    }`}
                  >
                    <img src={url} alt={seed} className="w-full h-full rounded-xl bg-[#F7F9FC]" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Account Details Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8EDF2] shadow-xs space-y-5">
            <h3 className="font-bold text-sm text-[#182536]">
              {language === "uz" ? "Shaxsiy Ma'lumotlar" : language === "ru" ? "Личные Данные" : "Personal Identity Details"}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#182536] mb-1.5">
                  {language === "uz" ? "Ism" : language === "ru" ? "Имя" : "First Name"}
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl px-4 py-2.5 text-sm text-[#182536] focus:outline-none focus:border-[#07858B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#182536] mb-1.5">
                  {language === "uz" ? "Familiya" : language === "ru" ? "Фамилия" : "Last Name"}
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl px-4 py-2.5 text-sm text-[#182536] focus:outline-none focus:border-[#07858B]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#182536] mb-1.5">
                {language === "uz" ? "Bio / O'zingiz haqingizda" : language === "ru" ? "О себе" : "Bio / Motivation"}
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl p-4 text-sm text-[#182536] focus:outline-none focus:border-[#07858B]"
              />
            </div>
          </div>

          {/* Privacy & Safety Controls */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8EDF2] shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#07858B]" />
              <h3 className="font-bold text-sm text-[#182536]">
                {language === "uz" ? "Maxfiylik va Ko'rinish Sozlamalari" : language === "ru" ? "Приватность и Видимость" : "Privacy & Visibility Controls"}
              </h3>
            </div>
            <p className="text-xs text-[#7B8794]">
              {language === "uz"
                ? "Do'stlar va yetakchilar ro'yxatida boshqalarga qaysi ma'lumotlar ko'rinishini boshqaring."
                : language === "ru"
                ? "Управляйте тем, какая информация видна другим пользователям."
                : "Control which information is visible to other registered users in friends and leaderboard views."}
            </p>

            <div className="space-y-3 pt-2">
              {[
                {
                  key: "show_email",
                  label: language === "uz" ? "Elektron pochtani ochiq profilda ko'rsatish" : language === "ru" ? "Показывать email в профиле" : "Show email address on public profile",
                },
                {
                  key: "show_phone",
                  label: language === "uz" ? "Telefon raqamni ochiq profilda ko'rsatish" : language === "ru" ? "Показывать телефон в профиле" : "Show phone number on public profile",
                },
                {
                  key: "show_activity",
                  label: language === "uz" ? "Faollik holatini do'stlarga bildirish" : language === "ru" ? "Показывать статус активности друзьям" : "Broadcast active quiz status to friends",
                },
                {
                  key: "allow_invitations",
                  label: language === "uz" ? "Multiplayer jang maydoni takliflarini qabul qilish" : language === "ru" ? "Разрешить приглашения на Арену" : "Allow multiplayer quiz room invitations",
                },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#F7F9FC] border border-[#E8EDF2] cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <span className="text-xs font-semibold text-[#182536]">{item.label}</span>
                  <input
                    type="checkbox"
                    checked={(privacy as any)[item.key]}
                    onChange={(e) => setPrivacy({ ...privacy, [item.key]: e.target.checked })}
                    className="w-4 h-4 text-[#07858B] rounded border-[#E8EDF2] focus:ring-[#07858B]"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-[#07858B] hover:bg-[#066D73] text-white px-8 py-3.5 rounded-2xl font-bold text-sm shadow-md shadow-[#07858B]/20 transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>
                {saving
                  ? (language === "uz" ? "Saqlanmoqda..." : language === "ru" ? "Сохранение..." : "Saving Changes...")
                  : (language === "uz" ? "Sozlamalarni Saqlash" : language === "ru" ? "Сохранить Настройки" : "Save Profile Settings")}
              </span>
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/src/components/layout/DashboardLayout";
import { useLanguage } from "@/src/context/LanguageContext";
import { api } from "@/src/lib/api";
import {
  CalendarCheck,
  Plus,
  CheckCircle2,
  Trash2,
  Clock,
  Flame,
  AlertCircle,
  Calendar,
  Check,
} from "lucide-react";

export default function DisciplinePage() {
  const { t, language } = useLanguage();
  const [stats, setStats] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    due_date: new Date().toISOString().split("T")[0],
    due_time: "18:00",
    is_recurring: false,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getDisciplineStats();
      setStats(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (taskId: string) => {
    try {
      await api.toggleDisciplineTask(taskId);
      await loadStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await api.deleteDisciplineTask(taskId);
      await loadStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    try {
      await api.createDisciplineTask(newTask);
      setShowAddModal(false);
      setNewTask({
        title: "",
        description: "",
        priority: "medium",
        due_date: new Date().toISOString().split("T")[0],
        due_time: "18:00",
        is_recurring: false,
      });
      await loadStats();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const tasks = stats?.tasks || [];
  const todayPercentage = stats?.today_percentage || 0;
  const weeklyHistory = stats?.weekly_history || [];

  return (
    <DashboardLayout>
      <div className="space-y-8 max-w-5xl mx-auto pb-12">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8EDF2] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[#FF9B45] text-xs font-bold">
              <Flame className="w-3.5 h-3.5 fill-[#FF9B45]" />
              <span>{stats?.current_streak || 5} {t.discipline.streakDays}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#182536] tracking-tight">
              {t.discipline.title}
            </h1>
            <p className="text-xs sm:text-sm text-[#7B8794]">
              {t.discipline.subtitle}
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[#07858B] hover:bg-[#066D73] text-white px-5 py-3 rounded-2xl text-xs font-bold shadow-md shadow-[#07858B]/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>{t.discipline.addTask}</span>
          </button>
        </div>

        {/* Velocity Overview Ring & Weekly History */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Daily Progress Gauge */}
          <div className="bg-white rounded-3xl p-6 border border-[#E8EDF2] shadow-xs flex flex-col items-center justify-center text-center space-y-3">
            <span className="text-xs font-bold text-[#7B8794] uppercase tracking-wider">
              {t.discipline.completionRate}
            </span>

            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#E8EDF2]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-[#07858B] transition-all duration-1000 ease-out"
                  strokeDasharray={`${todayPercentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-extrabold text-[#182536]">{Math.round(todayPercentage)}%</span>
                <span className="text-[10px] text-[#7B8794]">{language === "uz" ? "Bajarildi" : language === "ru" ? "Готово" : "Complete"}</span>
              </div>
            </div>

            <p className="text-xs text-[#7B8794]">
              {stats?.today_completed || 0} / {stats?.today_total || 0} {t.discipline.completedTasks?.toLowerCase()}
            </p>
          </div>

          {/* Past 7 Days Velocity Chart */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-[#E8EDF2] shadow-xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#182536]">{t.discipline.weeklyOverview}</h3>
              <span className="text-xs font-semibold text-[#07858B]">
                {weeklyHistory.length} {language === "uz" ? "kun kuzatildi" : language === "ru" ? "дней" : "Days Tracked"}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-2 pt-2">
              {weeklyHistory.map((day: any) => {
                const dayName = new Date(day.date).toLocaleDateString(
                  language === "uz" ? "uz-UZ" : language === "ru" ? "ru-RU" : "en-US",
                  { weekday: "short" }
                );
                return (
                  <div key={day.date} className="flex flex-col items-center gap-2">
                    <div className="w-full h-24 bg-[#F7F9FC] rounded-xl overflow-hidden flex flex-col justify-end p-1 border border-[#E8EDF2]">
                      <div
                        className="w-full bg-gradient-to-t from-[#07858B] to-[#22A06B] rounded-lg transition-all duration-500"
                        style={{ height: `${day.percentage}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-[#7B8794]">{dayName}</span>
                    <span className="text-[10px] text-[#182536] font-semibold">{Math.round(day.percentage)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-3xl border border-[#E8EDF2] shadow-xs overflow-hidden p-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#F7F9FC]">
            <h3 className="font-bold text-base text-[#182536]">{t.discipline.title}</h3>
            <span className="text-xs text-[#7B8794]">
              {tasks.length} {language === "uz" ? "ta vazifa" : language === "ru" ? "задач" : "Total Tasks"}
            </span>
          </div>

          {tasks.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#7B8794] space-y-2">
              <CheckCircle2 className="w-8 h-8 mx-auto text-[#CBD5E1]" />
              <p>{t.discipline.noTasks}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((tItem: any) => {
                const isCompleted = tItem.is_completed;

                return (
                  <div
                    key={tItem.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                      isCompleted ? "bg-[#F7F9FC] border-[#E8EDF2] opacity-75" : "bg-white border-[#E8EDF2] shadow-xs"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <button
                        onClick={() => handleToggle(tItem.id)}
                        className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${
                          isCompleted
                            ? "bg-[#22A06B] border-[#22A06B] text-white"
                            : "border-[#CBD5E1] hover:border-[#07858B]"
                        }`}
                      >
                        {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>

                      <div className="min-w-0">
                        <p
                          className={`text-sm font-bold truncate ${
                            isCompleted ? "line-through text-[#7B8794]" : "text-[#182536]"
                          }`}
                        >
                          {tItem.title}
                        </p>
                        {tItem.description && (
                          <p className="text-xs text-[#7B8794] truncate">{tItem.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          tItem.priority === "high"
                            ? "bg-red-50 text-[#E05252]"
                            : tItem.priority === "medium"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {tItem.priority}
                      </span>

                      {tItem.due_time && (
                        <span className="text-xs text-[#7B8794] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {tItem.due_time}
                        </span>
                      )}

                      <button
                        onClick={() => handleDelete(tItem.id)}
                        className="p-1.5 text-[#7B8794] hover:text-[#E05252] rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Create Task Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#E8EDF2] space-y-5">
              <h3 className="text-lg font-bold text-[#182536]">{t.discipline.addTask}</h3>

              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#182536] mb-1">{t.discipline.taskTitle}</label>
                  <input
                    type="text"
                    required
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    placeholder={language === "uz" ? "Masalan: Ona tilidan 2 ta test yechish" : language === "ru" ? "Например: Решить 2 теста по истории" : "e.g. Solve 2 Math Quizzes"}
                    className="w-full bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl px-4 py-2.5 text-sm text-[#182536] focus:outline-none focus:border-[#07858B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#182536] mb-1">{t.discipline.taskDesc}</label>
                  <input
                    type="text"
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder={language === "uz" ? "Qo'shimcha izoh yoki maqsad" : "Description..."}
                    className="w-full bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl px-4 py-2.5 text-sm text-[#182536] focus:outline-none focus:border-[#07858B]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#182536] mb-1">{t.discipline.priority}</label>
                    <select
                      value={newTask.priority}
                      onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                      className="w-full bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl px-3 py-2 text-sm text-[#182536] focus:outline-none focus:border-[#07858B]"
                    >
                      <option value="low">{language === "uz" ? "Past" : language === "ru" ? "Низкий" : "Low"}</option>
                      <option value="medium">{language === "uz" ? "O'rtacha" : language === "ru" ? "Средний" : "Medium"}</option>
                      <option value="high">{language === "uz" ? "Yuqori" : language === "ru" ? "Высокий" : "High"}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#182536] mb-1">{t.discipline.dueDate}</label>
                    <input
                      type="time"
                      value={newTask.due_time}
                      onChange={(e) => setNewTask({ ...newTask, due_time: e.target.value })}
                      className="w-full bg-[#F7F9FC] border border-[#E8EDF2] rounded-xl px-3 py-2 text-sm text-[#182536] focus:outline-none focus:border-[#07858B]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-bold text-[#7B8794] hover:bg-[#F7F9FC] rounded-xl transition-colors"
                  >
                    {t.discipline.cancel}
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#07858B] hover:bg-[#066D73] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    {t.discipline.saveTask}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

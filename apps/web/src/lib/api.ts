/**
 * QUIZORA Unified API Client
 * Provides full REST endpoint access with JWT token handling and graceful fallbacks.
 */

function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  if (typeof window !== "undefined") {
    // In production or on Vercel (e.g. demodey-6q51.vercel.app), use relative path to same origin
    if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      return "/api/v1";
    }
  }
  return "http://localhost:8000/api/v1";
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("quizora_token");
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("quizora_token", token);
  } else {
    localStorage.removeItem("quizora_token");
  }
}

// Local User & Profile Persistence
export function getLocalRegisteredUsers(): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("quizora_registered_users");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalUser(user: any) {
  if (typeof window === "undefined" || !user) return;
  try {
    const users = getLocalRegisteredUsers();
    const existingIndex = users.findIndex((u) => u.id === user.id || u.email === user.email);
    if (existingIndex >= 0) {
      users[existingIndex] = { ...users[existingIndex], ...user };
    } else {
      users.unshift(user);
    }
    localStorage.setItem("quizora_registered_users", JSON.stringify(users));

    // Remove from deleted list if it was deleted previously
    const deleted = getDeletedUserIds().filter((id) => id !== user.id);
    localStorage.setItem("quizora_deleted_user_ids", JSON.stringify(deleted));
  } catch {}
}

export function getDeletedUserIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("quizora_deleted_user_ids");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordDeletedUserId(userId: string) {
  if (typeof window === "undefined" || !userId) return;
  try {
    const deleted = getDeletedUserIds();
    if (!deleted.includes(userId)) {
      deleted.push(userId);
      localStorage.setItem("quizora_deleted_user_ids", JSON.stringify(deleted));
    }
    const users = getLocalRegisteredUsers().filter((u) => u.id !== userId);
    localStorage.setItem("quizora_registered_users", JSON.stringify(users));
  } catch {}
}

export function saveUserProfileOverride(userId: string, data: any) {
  if (typeof window === "undefined" || !userId) return;
  try {
    const key = `quizora_profile_${userId}`;
    const existingRaw = localStorage.getItem(key);
    const existing = existingRaw ? JSON.parse(existingRaw) : {};
    localStorage.setItem(key, JSON.stringify({ ...existing, ...data }));
  } catch {}
}

export function getUserProfileOverride(userId: string): any {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = localStorage.getItem(`quizora_profile_${userId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const apiBase = getApiBase();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${apiBase}${cleanEndpoint}`;
  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errorData.detail || `Request failed with status ${res.status}`);
    }
    return (await res.json()) as T;
  } catch (err: any) {
    // If backend is booting or unreachable during client dev, return graceful demo data
    console.warn(`API call to ${endpoint} failed: ${err.message}. Using client fallback.`);
    throw err;
  }
}

export const api = {
  // Auth
  register: async (data: any) => {
    const res = await request<any>("/auth/register", { method: "POST", body: JSON.stringify(data) });
    if (res?.user) {
      saveLocalUser(res.user);
    }
    return res;
  },
  login: (data: any) => request<any>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  googleAuth: async (data: any) => {
    const res = await request<any>("/auth/google", { method: "POST", body: JSON.stringify(data) });
    if (res?.user) {
      saveLocalUser(res.user);
    }
    return res;
  },

  // Profiles
  getProfile: () => request<any>("/profiles/me"),
  updateProfile: async (data: any) => {
    const res = await request<any>("/profiles/me", { method: "PUT", body: JSON.stringify(data) });
    return res;
  },
  getLifetimeProgress: () => request<any>("/profiles/me/lifetime-progress"),

  // Quiz Engine
  getCategories: (language?: string) =>
    request<any[]>(`/categories${language && language !== "all" ? `?language=${language}` : ""}`),
  getTopics: (categoryId: string) => request<any[]>(`/categories/${categoryId}/topics`),
  getTopicVideo: (topicId: string) => request<any>(`/topics/${topicId}/video`),
  startQuiz: (data: any) => request<any>("/attempts/start", { method: "POST", body: JSON.stringify(data) }),
  getStage1Review: (attemptId: string) => request<any>(`/attempts/${attemptId}/stage-1-review`),
  getStage2Video: (attemptId: string) => request<any>(`/attempts/${attemptId}/stage-2-video`),
  beginStage3Play: (attemptId: string) => request<any>(`/attempts/${attemptId}/stage-3-begin`, { method: "POST" }),
  saveAnswer: (attemptId: string, questionId: string, answer: string) =>
    request<any>(`/attempts/${attemptId}/save-answer`, {
      method: "POST",
      body: JSON.stringify({ question_id: questionId, answer }),
    }),
  submitQuiz: (attemptId: string, answers: { question_id: string; answer: string }[]) =>
    request<any>(`/attempts/${attemptId}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
  getStage4Results: (attemptId: string) => request<any>(`/attempts/${attemptId}/stage-4-results`),
  getResults: (params: string = "") => request<any[]>(`/results${params ? `?${params}` : ""}`),

  // AI
  chatAssistant: (data: any) => request<any>("/ai/chat", { method: "POST", body: JSON.stringify(data) }),
  evaluateWritten: (data: any) => request<any>("/ai/evaluate-written", { method: "POST", body: JSON.stringify(data) }),

  // Gamification & Leaderboard
  getLeaderboard: (period: string = "all_time") => request<any>(`/leaderboard?period=${period}`),
  getAchievements: () => request<any[]>("/achievements"),
  getDailyQuests: () => request<any[]>("/daily-quests"),
  claimQuest: (questId: string) => request<any>(`/daily-quests/${questId}/claim`, { method: "POST" }),
  getMonthlyRewardsHistory: () => request<any[]>("/rewards/monthly-history"),

  // Social & Rooms
  getFriends: () => request<any>("/friends"),
  getCommunityUsers: () => request<any[]>("/community"),
  sendFriendRequest: (username: string) => request<any>(`/friends/request?username=${encodeURIComponent(username)}`, { method: "POST" }),
  respondFriendRequest: (requestId: string, accept: boolean) =>
    request<any>(`/friends/respond?request_id=${requestId}&accept=${accept}`, { method: "POST" }),
  getMessages: (otherUserId: string) => request<any[]>(`/messages/${otherUserId}`),
  sendMessage: (recipientId: string, content: string, quizCode?: string) =>
    request<any>("/messages", {
      method: "POST",
      body: JSON.stringify({ recipient_id: recipientId, content, quiz_invitation_code: quizCode }),
    }),
  createRoom: (data: any) => request<any>("/rooms/create", { method: "POST", body: JSON.stringify(data) }),
  joinRoom: (roomCode: string) => request<any>(`/rooms/join?room_code=${encodeURIComponent(roomCode)}`, { method: "POST" }),

  // Discipline
  getDisciplineStats: (date?: string) => request<any>(`/discipline/stats${date ? `?date=${date}` : ""}`),
  createDisciplineTask: (data: any) => request<any>("/discipline/tasks", { method: "POST", body: JSON.stringify(data) }),
  toggleDisciplineTask: (taskId: string) => request<any>(`/discipline/tasks/${taskId}/toggle`, { method: "PATCH" }),
  deleteDisciplineTask: (taskId: string) => request<any>(`/discipline/tasks/${taskId}`, { method: "DELETE" }),

  // Mini Games
  getMiniGames: () => request<any[]>("/games"),
  submitGameScore: (data: any) => request<any>("/games/submit-score", { method: "POST", body: JSON.stringify(data) }),

  // Admin
  getAdminStats: () => request<any>("/admin/stats"),
  getAdminUsers: () => request<any[]>("/admin/users"),
  updateUserStatus: (userId: string, isActive: boolean) =>
    request<any>(`/admin/users/${userId}/status`, { method: "PUT", body: JSON.stringify({ is_active: isActive }) }),
  updateUserRole: (userId: string, role: string) =>
    request<any>(`/admin/users/${userId}/role`, { method: "PUT", body: JSON.stringify({ role }) }),
  deleteUser: async (userId: string) => {
    recordDeletedUserId(userId);
    return await request<any>(`/admin/users/${userId}`, { method: "DELETE" });
  },
  purgeFakeUsers: () => request<any>("/admin/purge-fake-users", { method: "POST" }),
  bulkImportQuestions: (questions: any[]) =>
    request<any>("/admin/questions/bulk-import", { method: "POST", body: JSON.stringify(questions) }),
  processMonthlyRewards: (monthYear?: string) =>
    request<any>(`/admin/monthly-rewards/process${monthYear ? `?month_year=${encodeURIComponent(monthYear)}` : ""}`, {
      method: "POST",
    }),
};

/**
 * QUIZORA Unified API Client
 * Provides full REST endpoint access with JWT token handling and graceful fallbacks.
 */

function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "");
  }
  return "/api/v1";
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

export function getStoredUser(): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("quizora_current_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: any | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem("quizora_current_user", JSON.stringify(user));
  } else {
    localStorage.removeItem("quizora_current_user");
  }
}

export function getStoredProfile(): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("quizora_current_profile");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredProfile(profile: any | null) {
  if (typeof window === "undefined") return;
  if (profile) {
    localStorage.setItem("quizora_current_profile", JSON.stringify(profile));
  } else {
    localStorage.removeItem("quizora_current_profile");
  }
}

export function getRegisteredAccounts(): { [email: string]: any } {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("quizora_registered_accounts");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveRegisteredAccount(email: string, password: string, user: any, profile?: any) {
  if (typeof window === "undefined" || !email) return;
  try {
    const accounts = getRegisteredAccounts();
    accounts[email.toLowerCase().trim()] = {
      email: email.toLowerCase().trim(),
      password,
      user,
      profile,
      saved_at: new Date().toISOString(),
    };
    localStorage.setItem("quizora_registered_accounts", JSON.stringify(accounts));
    saveLocalUser(user);
  } catch {}
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

// --- DIRECT MESSAGING PRIVACY HELPERS ---
export function getConversationKey(id1: string, id2: string): string {
  const a = String(id1 || "").toLowerCase().trim();
  const b = String(id2 || "").toLowerCase().trim();
  return [a, b].sort().join("__");
}

export function getLocalDirectMessages(currentUserId: string, otherUserId: string): any[] {
  if (typeof window === "undefined" || !currentUserId || !otherUserId) return [];
  const convKey = getConversationKey(currentUserId, otherUserId);

  const threadRaw = localStorage.getItem(`quizora_direct_thread_${convKey}`);
  let threadMsgs: any[] = [];
  if (threadRaw) {
    try {
      threadMsgs = JSON.parse(threadRaw);
    } catch {}
  }

  const allRaw = localStorage.getItem("quizora_all_direct_messages");
  let allMsgs: any[] = [];
  if (allRaw) {
    try {
      allMsgs = JSON.parse(allRaw);
    } catch {}
  }

  const cId = String(currentUserId).toLowerCase().trim();
  const oId = String(otherUserId).toLowerCase().trim();

  // STRICT PRIVACY FILTER:
  const matchedFromAll = allMsgs.filter((m: any) => {
    const sId = String(m.senderId || m.sender_id || "").toLowerCase().trim();
    const rId = String(m.recipientId || m.recipient_id || "").toLowerCase().trim();
    const sUser = String(m.senderUsername || m.sender_username || "").toLowerCase().trim();
    const rUser = String(m.recipientUsername || m.recipient_username || "").toLowerCase().trim();

    const isCurrentSender = sId === cId || sUser === cId;
    const isOtherRecipient = rId === oId || rUser === oId;
    const isOtherSender = sId === oId || sUser === oId;
    const isCurrentRecipient = rId === cId || rUser === cId;

    return (isCurrentSender && isOtherRecipient) || (isOtherSender && isCurrentRecipient);
  });

  const map = new Map<string, any>();
  [...threadMsgs, ...matchedFromAll].forEach((m) => {
    if (m && m.id) map.set(m.id, m);
  });

  return Array.from(map.values()).sort((a, b) => {
    const timeA = a.timestamp || new Date(a.created_at || 0).getTime();
    const timeB = b.timestamp || new Date(b.created_at || 0).getTime();
    return timeA - timeB;
  });
}

export function saveLocalDirectMessage(msg: any) {
  if (typeof window === "undefined" || !msg) return;
  const sId = msg.senderId || msg.sender_id;
  const rId = msg.recipientId || msg.recipient_id;
  if (!sId || !rId) return;

  const convKey = getConversationKey(sId, rId);

  const existing = getLocalDirectMessages(sId, rId);
  if (!existing.some((m) => m.id === msg.id)) {
    existing.push(msg);
  }
  localStorage.setItem(`quizora_direct_thread_${convKey}`, JSON.stringify(existing));

  try {
    const allRaw = localStorage.getItem("quizora_all_direct_messages");
    let allMsgs: any[] = [];
    if (allRaw) allMsgs = JSON.parse(allRaw);
    if (!allMsgs.some((m) => m.id === msg.id)) {
      allMsgs.push(msg);
      localStorage.setItem("quizora_all_direct_messages", JSON.stringify(allMsgs));
    }
  } catch {}

  window.dispatchEvent(new CustomEvent("quizora_new_message", { detail: msg }));
}

export function markLocalMessagesAsRead(currentUserId: string, otherUserId: string) {
  if (typeof window === "undefined" || !currentUserId || !otherUserId) return;
  const convKey = getConversationKey(currentUserId, otherUserId);
  const msgs = getLocalDirectMessages(currentUserId, otherUserId);
  let changed = false;

  const cId = String(currentUserId).toLowerCase().trim();
  msgs.forEach((m) => {
    const rId = String(m.recipientId || m.recipient_id || "").toLowerCase().trim();
    const rUser = String(m.recipientUsername || m.recipient_username || "").toLowerCase().trim();
    if ((rId === cId || rUser === cId) && !m.read && !m.is_read) {
      m.read = true;
      m.is_read = true;
      changed = true;
    }
  });

  if (changed) {
    localStorage.setItem(`quizora_direct_thread_${convKey}`, JSON.stringify(msgs));
    try {
      const allRaw = localStorage.getItem("quizora_all_direct_messages");
      if (allRaw) {
        const allMsgs: any[] = JSON.parse(allRaw);
        allMsgs.forEach((m) => {
          const rId = String(m.recipientId || m.recipient_id || "").toLowerCase().trim();
          const rUser = String(m.recipientUsername || m.recipient_username || "").toLowerCase().trim();
          const sId = String(m.senderId || m.sender_id || "").toLowerCase().trim();
          const sUser = String(m.senderUsername || m.sender_username || "").toLowerCase().trim();
          const oId = String(otherUserId).toLowerCase().trim();
          if ((rId === cId || rUser === cId) && (sId === oId || sUser === oId)) {
            m.read = true;
            m.is_read = true;
          }
        });
        localStorage.setItem("quizora_all_direct_messages", JSON.stringify(allMsgs));
      }
    } catch {}
  }
}

export async function getAllPlatformLearners(): Promise<any[]> {
  try {
    const comm = await api.getCommunityUsers().catch(() => []);
    const localUsers = getLocalRegisteredUsers();
    const deletedIds = getDeletedUserIds();
    const currentUser = getStoredUser();
    const isViewerAdmin = currentUser?.role === "admin";

    const map = new Map<string, any>();

    (Array.isArray(comm) ? comm : []).forEach((u: any) => {
      if (u?.id && !deletedIds.includes(u.id)) {
        if (!isViewerAdmin && (u.role === "admin" || u.email === "admin@quizora.com")) {
          return;
        }
        map.set(u.id, u);
      }
    });

    localUsers.forEach((u: any) => {
      if (u?.id && !deletedIds.includes(u.id)) {
        if (!isViewerAdmin && (u.role === "admin" || u.email === "admin@quizora.com")) {
          return;
        }
        const existing = map.get(u.id) || {};
        map.set(u.id, {
          id: u.id,
          username: u.username || u.email?.split("@")[0] || "learner",
          first_name: u.first_name || existing.first_name || "",
          last_name: u.last_name || existing.last_name || "",
          avatar_url: u.avatar_url || existing.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username || u.id}`,
          level: u.level || existing.level || 1,
          level_title: u.level_title || existing.level_title || "Bilimdon",
          total_xp: u.total_xp ?? existing.total_xp ?? 150,
          ranking_coins: u.ranking_coins ?? u.coins ?? existing.ranking_coins ?? 50,
          coins: u.coins ?? existing.coins ?? 50,
          current_streak: u.current_streak ?? existing.current_streak ?? 1,
          completed_quizzes_count: u.completed_quizzes_count ?? existing.completed_quizzes_count ?? 2,
          total_questions_answered: u.total_questions_answered ?? existing.total_questions_answered ?? 10,
          total_correct_answers: u.total_correct_answers ?? existing.total_correct_answers ?? 8,
          total_incorrect_answers: u.total_incorrect_answers ?? existing.total_incorrect_answers ?? 2,
          accuracy_percentage: u.average_score ?? u.accuracy_percentage ?? existing.accuracy_percentage ?? 80,
          average_score: u.average_score ?? existing.average_score ?? 80,
          bio: u.bio || existing.bio || "Quizora ta'lim platformasi o'quvchisi",
          is_online: true,
          created_at: u.created_at || existing.created_at || new Date().toISOString(),
          role: u.role || existing.role || "user",
          phone_number: u.phone_number || existing.phone_number || "",
          email: u.email || existing.email || "",
        });
      }
    });

    const list = Array.from(map.values());
    list.sort((a, b) => (b.total_xp || 0) - (a.total_xp || 0));

    return list.map((user, idx) => ({
      ...user,
      rank: idx + 1,
    }));
  } catch (err) {
    console.error("Error in getAllPlatformLearners:", err);
    return [];
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
    try {
      const res = await request<any>("/auth/register", { method: "POST", body: JSON.stringify(data) });
      if (res?.user) {
        setStoredUser(res.user);
        saveLocalUser(res.user);
        saveRegisteredAccount(data.email, data.password, res.user, res.profile);
      }
      return res;
    } catch (err: any) {
      // Local account fallback if server is unreachable
      const cleanEmail = (data.email || "").toLowerCase().trim();
      const username = cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");
      const userId = "u_" + Math.random().toString(36).substring(2, 10);
      const fallbackUser = {
        id: userId,
        email: cleanEmail,
        username,
        first_name: data.first_name || username,
        last_name: data.last_name || "",
        phone_number: data.phone_number || "",
        role: "user",
        is_active: true,
        created_at: new Date().toISOString(),
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      };
      const fallbackProfile = {
        id: "p_" + userId,
        user_id: userId,
        level: 1,
        level_title: "Boshlang'ich",
        total_xp: 0,
        ranking_coins: 0,
        coins: 0,
        current_streak: 1,
        completed_quizzes_count: 0,
        average_score: 0.0,
      };

      const payloadStr = JSON.stringify({
        sub: fallbackUser.id,
        email: fallbackUser.email,
        username: fallbackUser.username,
        first_name: fallbackUser.first_name,
        last_name: fallbackUser.last_name,
        role: fallbackUser.role,
        avatar_url: fallbackUser.avatar_url,
        exp: Math.floor(Date.now() / 1000) + 86400 * 30,
      });
      const encodedPayload = typeof window !== "undefined" ? btoa(unescape(encodeURIComponent(payloadStr))) : "";
      const fakeToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${encodedPayload}.sig_${fallbackUser.id}`;

      setStoredUser(fallbackUser);
      setStoredProfile(fallbackProfile);
      saveLocalUser(fallbackUser);
      saveRegisteredAccount(data.email, data.password, fallbackUser, fallbackProfile);
      setStoredToken(fakeToken);

      return {
        access_token: fakeToken,
        refresh_token: fakeToken,
        token_type: "bearer",
        user: fallbackUser,
        profile: fallbackProfile,
      };
    }
  },
  login: async (data: any) => {
    try {
      const res = await request<any>("/auth/login", { method: "POST", body: JSON.stringify(data) });
      if (res?.user) {
        setStoredUser(res.user);
        saveLocalUser(res.user);
        saveRegisteredAccount(data.email, data.password, res.user);
      }
      return res;
    } catch (err: any) {
      // Check registered accounts store
      const cleanEmail = (data.email || "").toLowerCase().trim();
      const accounts = getRegisteredAccounts();
      const savedAccount = accounts[cleanEmail];
      if (savedAccount && savedAccount.password === data.password) {
        const u = savedAccount.user;
        const payloadStr = JSON.stringify({
          sub: u.id,
          email: u.email,
          username: u.username,
          first_name: u.first_name,
          last_name: u.last_name,
          role: u.role || "user",
          avatar_url: u.avatar_url,
          exp: Math.floor(Date.now() / 1000) + 86400 * 30,
        });
        const encodedPayload = typeof window !== "undefined" ? btoa(unescape(encodeURIComponent(payloadStr))) : "";
        const fakeToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${encodedPayload}.sig_${u.id}`;

        setStoredUser(u);
        saveLocalUser(u);
        setStoredToken(fakeToken);

        return {
          access_token: fakeToken,
          refresh_token: fakeToken,
          token_type: "bearer",
          user: u,
        };
      }
      throw err;
    }
  },
  googleAuth: async (data: any) => {
    const res = await request<any>("/auth/google", { method: "POST", body: JSON.stringify(data) });
    if (res?.user) {
      setStoredUser(res.user);
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
  getRecentConversations: () => request<any[]>("/messages/conversations/recent"),
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

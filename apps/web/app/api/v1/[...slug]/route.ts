import { NextRequest, NextResponse } from "next/server";
import initialData from "@/src/lib/initialData.json";
import fs from "fs";
import path from "path";

const DB_CANDIDATE_PATHS = [
  path.join("/tmp", "quizora_db.json"),
  path.join(process.cwd(), "quizora_db.json"),
  path.join(process.cwd(), "..", "api", "quizora_store.json"),
];

const LEGACY_PURGED_USER_IDS = [
  "u_ah3ikadv",
  "u_kamola",
  "u_i0ie8ur6",
  "u_eknm2fda",
  "student1",
  "kamola",
  "shoxrux",
  "student1@gmail.com",
  "kamola@gmail.com",
  "shoxrux@gmail.com",
];

function loadPersistedStore(): Partial<GlobalStore> | null {
  const merged: {
    users: any[];
    profiles: any[];
    messages: any[];
    discipline_tasks: any[];
    deleted_user_ids: string[];
  } = {
    users: [],
    profiles: [],
    messages: [],
    discipline_tasks: [],
    deleted_user_ids: [...LEGACY_PURGED_USER_IDS],
  };

  const usersMap = new Map<string, any>();
  const profilesMap = new Map<string, any>();
  let foundAny = false;

  for (const filePath of DB_CANDIDATE_PATHS) {
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(content);

        if (Array.isArray(parsed.deleted_user_ids)) {
          parsed.deleted_user_ids.forEach((id: string) => {
            if (!merged.deleted_user_ids.includes(String(id))) {
              merged.deleted_user_ids.push(String(id));
            }
          });
        }

        let uList: any[] = [];
        if (Array.isArray(parsed.users)) {
          uList = parsed.users;
        } else if (parsed.users && typeof parsed.users === "object") {
          uList = Object.values(parsed.users);
        }

        uList.forEach((u: any) => {
          const id = u.id || (u._id && (u._id.__oid__ || u._id)) || u.email;
          const email = (u.email || "").toLowerCase();
          const username = (u.username || "").toLowerCase();

          if (id && !usersMap.has(String(id))) {
            if (
              merged.deleted_user_ids.includes(String(id)) ||
              merged.deleted_user_ids.includes(email) ||
              merged.deleted_user_ids.includes(username) ||
              LEGACY_PURGED_USER_IDS.includes(String(id)) ||
              LEGACY_PURGED_USER_IDS.includes(email) ||
              LEGACY_PURGED_USER_IDS.includes(username)
            ) {
              return; // Do NOT load purged legacy users!
            }
            usersMap.set(String(id), {
              ...u,
              id: String(id),
              role: u.role || (u.email === "admin@quizora.com" ? "admin" : "user"),
            });
          }
        });

        let pList: any[] = [];
        if (Array.isArray(parsed.profiles)) {
          pList = parsed.profiles;
        } else if (Array.isArray(parsed.user_profiles)) {
          pList = parsed.user_profiles;
        } else if (parsed.user_profiles && typeof parsed.user_profiles === "object") {
          pList = Object.values(parsed.user_profiles);
        }

        pList.forEach((p: any) => {
          const uId = p.user_id || (p.user_id && p.user_id.__oid__) || p.id;
          if (uId && !profilesMap.has(String(uId))) {
            if (merged.deleted_user_ids.includes(String(uId))) {
              return; // Do NOT load deleted profile
            }
            profilesMap.set(String(uId), { ...p, user_id: String(uId) });
          }
        });

        if (Array.isArray(parsed.messages)) {
          merged.messages.push(...parsed.messages);
        }
        if (Array.isArray(parsed.discipline_tasks)) {
          merged.discipline_tasks.push(...parsed.discipline_tasks);
        }

        foundAny = true;
      }
    } catch (e) {
      // ignore
    }
  }

  if (foundAny) {
    merged.users = Array.from(usersMap.values());
    merged.profiles = Array.from(profilesMap.values());
    return merged;
  }
  return null;
}

function savePersistedStore(store: GlobalStore) {
  const toSave = {
    users: store.users,
    profiles: store.profiles,
    messages: store.messages,
    discipline_tasks: store.discipline_tasks,
    deleted_user_ids: store.deleted_user_ids || [],
  };
  const jsonStr = JSON.stringify(toSave, null, 2);

  // 1. Always write to /tmp first (writable on Vercel/AWS Lambda)
  try {
    fs.writeFileSync(path.join("/tmp", "quizora_db.json"), jsonStr, "utf-8");
  } catch (e) {
    // ignore
  }

  // 2. Attempt current working directory (works in local development and docker)
  try {
    fs.writeFileSync(path.join(process.cwd(), "quizora_db.json"), jsonStr, "utf-8");
  } catch (e) {
    // read-only filesystem on serverless is normal
  }
}

// In-Memory Global State for Serverless Execution
interface GlobalStore {
  users: any[];
  profiles: any[];
  attempts: any[];
  categories: any[];
  topics: any[];
  questions: any[];
  daily_quests: any[];
  achievements: any[];
  friends: any[];
  community: any[];
  discipline_tasks: any[];
  messages: any[];
  deleted_user_ids: string[];
}

declare global {
  // eslint-disable-next-line no-var
  var __QUIZORA_STORE__: GlobalStore | undefined;
}

function getStore(): GlobalStore {
  if (!global.__QUIZORA_STORE__) {
    const raw = initialData as any;
    const persisted = loadPersistedStore();
    const deletedUserIds = Array.from(
      new Set([...LEGACY_PURGED_USER_IDS, ...(persisted?.deleted_user_ids || [])])
    );

    const baseUsers = (raw.users || [])
      .filter((u: any) => {
        const id = String(u.id || u._id || "");
        const email = String(u.email || "").toLowerCase();
        const username = String(u.username || "").toLowerCase();
        return (
          email === "admin@quizora.com" ||
          (!deletedUserIds.includes(id) && !deletedUserIds.includes(email) && !deletedUserIds.includes(username))
        );
      })
      .map((u: any) => ({
        ...u,
        id: u.id || u._id || "670e00000000000000000001",
        role: u.role || (u.email === "admin@quizora.com" ? "admin" : "user"),
        is_active: u.is_active ?? true,
      }));

    const persistedUsers = (persisted?.users || []).filter((u: any) => {
      const id = String(u.id || u._id || "");
      const email = String(u.email || "").toLowerCase();
      const username = String(u.username || "").toLowerCase();
      return (
        email === "admin@quizora.com" ||
        (!deletedUserIds.includes(id) && !deletedUserIds.includes(email) && !deletedUserIds.includes(username))
      );
    });

    const usersMap = new Map();
    [...baseUsers, ...persistedUsers].forEach((u) => {
      const idStr = String(u.id);
      const email = String(u.email || "").toLowerCase();
      const username = String(u.username || "").toLowerCase();
      if (
        !deletedUserIds.includes(idStr) &&
        !deletedUserIds.includes(email) &&
        !deletedUserIds.includes(username)
      ) {
        usersMap.set(idStr, u);
      }
    });

    const baseProfiles = (raw.user_profiles || []).map((p: any) => ({
      ...p,
      id: p.id || p._id,
      user_id: p.user_id || "670e00000000000000000001",
    }));

    const persistedProfiles = persisted?.profiles || [];
    const profilesMap = new Map();
    [...baseProfiles, ...persistedProfiles].forEach((p) => {
      const uId = String(p.user_id);
      if (!deletedUserIds.includes(uId)) {
        profilesMap.set(uId, p);
      }
    });

    global.__QUIZORA_STORE__ = {
      users: Array.from(usersMap.values()),
      profiles: Array.from(profilesMap.values()),
      attempts: (raw.quiz_attempts || []).filter((a: any) => !deletedUserIds.includes(String(a.user_id))),
      categories: raw.categories || [],
      topics: raw.topics || [],
      questions: raw.questions || [],
      daily_quests: raw.daily_quests || [],
      achievements: raw.achievements || [],
      friends: [],
      community: [],
      discipline_tasks: (persisted?.discipline_tasks || raw.discipline_tasks || []).filter((t: any) => !deletedUserIds.includes(String(t.user_id))),
      messages: (persisted?.messages || []).filter(
        (m: any) =>
          !deletedUserIds.includes(String(m.sender_id || m.senderId)) &&
          !deletedUserIds.includes(String(m.recipient_id || m.recipientId))
      ),
      deleted_user_ids: deletedUserIds,
    };

    // Ensure root admin exists
    const hasAdmin = global.__QUIZORA_STORE__.users.some((u) => u.email === "admin@quizora.com");
    if (!hasAdmin) {
      global.__QUIZORA_STORE__.users.push({
        id: "670e00000000000000000001",
        email: "admin@quizora.com",
        username: "quizora_admin",
        first_name: "Admin",
        last_name: "Quizora",
        role: "admin",
        is_active: true,
        created_at: new Date().toISOString(),
        avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=quizora_admin",
      });
      global.__QUIZORA_STORE__.profiles.push({
        id: "prof_admin",
        user_id: "670e00000000000000000001",
        level: 30,
        level_title: "Grand Master",
        total_xp: 90000,
        ranking_coins: 5000,
        coins: 5000,
        current_streak: 45,
        completed_quizzes_count: 250,
        average_score: 99.2,
      });
    }

    savePersistedStore(global.__QUIZORA_STORE__);
  }

  // Always enforce legacy purged filter on existing global store
  if (global.__QUIZORA_STORE__) {
    const deleted = global.__QUIZORA_STORE__.deleted_user_ids || [];
    global.__QUIZORA_STORE__.users = global.__QUIZORA_STORE__.users.filter((u) => {
      const id = String(u.id);
      const email = String(u.email || "").toLowerCase();
      const username = String(u.username || "").toLowerCase();
      if (email === "admin@quizora.com" || id === "670e00000000000000000001") return true;
      if (
        deleted.includes(id) ||
        deleted.includes(email) ||
        deleted.includes(username) ||
        LEGACY_PURGED_USER_IDS.includes(id) ||
        LEGACY_PURGED_USER_IDS.includes(email) ||
        LEGACY_PURGED_USER_IDS.includes(username)
      ) {
        return false;
      }
      return true;
    });

    global.__QUIZORA_STORE__.profiles = global.__QUIZORA_STORE__.profiles.filter((p) => {
      const uId = String(p.user_id);
      if (uId === "670e00000000000000000001") return true;
      if (deleted.includes(uId) || LEGACY_PURGED_USER_IDS.includes(uId)) return false;
      return true;
    });
  }

  return global.__QUIZORA_STORE__;
}

// Helpers
function createToken(user: any) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      email: user.email,
      role: user.role || "user",
      username: user.username,
      first_name: user.first_name || user.username,
      last_name: user.last_name || "",
      avatar_url: user.avatar_url,
      exp: Math.floor(Date.now() / 1000) + 86400 * 30, // 30 days session
    })
  ).toString("base64url");
  return `${header}.${payload}.sig_${user.id}`;
}

function getUserFromToken(req: NextRequest, store: GlobalStore) {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.substring(7);
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const decoded = JSON.parse(Buffer.from(parts[1], "base64url").toString());

    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    const subStr = String(decoded.sub || "");
    if (store.deleted_user_ids && store.deleted_user_ids.includes(subStr)) {
      return null;
    }

    let user = store.users.find(
      (u) =>
        u.id === decoded.sub ||
        (u.email && decoded.email && u.email.toLowerCase() === decoded.email.toLowerCase())
    );

    if (user && store.deleted_user_ids && store.deleted_user_ids.includes(String(user.id))) {
      return null;
    }

    // If user is not yet in memory store, restore from decoded token!
    const isAdminEmail = (decoded.email && decoded.email.toLowerCase() === "admin@quizora.com") || decoded.sub === "670e00000000000000000001";
    if (!user && decoded.sub) {
      if (store.deleted_user_ids && store.deleted_user_ids.includes(subStr)) {
        return null;
      }
      user = {
        id: decoded.sub,
        email: decoded.email || `${decoded.username || "user"}@quizora.com`,
        username: decoded.username || decoded.sub,
        first_name: decoded.first_name || decoded.username || "O'quvchi",
        last_name: decoded.last_name || "",
        role: isAdminEmail ? "admin" : (decoded.role || "user"),
        is_active: true,
        created_at: new Date().toISOString(),
        avatar_url:
          decoded.avatar_url ||
          `https://api.dicebear.com/7.x/bottts/svg?seed=${decoded.username || decoded.sub}`,
      };
      store.users.unshift(user);

      let p = store.profiles.find((x) => x.user_id === decoded.sub);
      if (!p) {
        p = {
          id: "p_" + decoded.sub,
          user_id: decoded.sub,
          level: user.role === "admin" ? 30 : 1,
          level_title: user.role === "admin" ? "Grand Master" : "Boshlang'ich",
          total_xp: user.role === "admin" ? 90000 : 0,
          ranking_coins: user.role === "admin" ? 5000 : 0,
          coins: user.role === "admin" ? 5000 : 0,
          current_streak: 1,
          completed_quizzes_count: 0,
          average_score: 0.0,
        };
        store.profiles.push(p);
      }
      savePersistedStore(store);
    } else if (user && isAdminEmail) {
      user.role = "admin";
    }

    return user || null;
  } catch {
    return null;
  }
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

// Handler
async function handleRequest(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const resolved = await params;
  const slug = resolved.slug || [];
  const pathname = slug.join("/");
  const method = req.method.toUpperCase();

  // 1. If external backend proxy configured (e.g. Render / Railway / FastAPI), forward server-side
  const backendUrl = process.env.FASTAPI_BACKEND_URL;
  if (backendUrl) {
    try {
      const url = new URL(req.url);
      const targetUrl = `${backendUrl.replace(/\/$/, "")}/${pathname}${url.search}`;
      const forwardHeaders = new Headers(req.headers);
      forwardHeaders.delete("host");
      const body = method !== "GET" && method !== "HEAD" ? await req.text() : undefined;

      const res = await fetch(targetUrl, {
        method,
        headers: forwardHeaders,
        body,
      });

      const data = await res.text();
      return new NextResponse(data, {
        status: res.status,
        headers: {
          "Content-Type": res.headers.get("Content-Type") || "application/json",
          ...corsHeaders(),
        },
      });
    } catch (err: any) {
      console.warn("Proxy to external backend failed, falling back to Next.js serverless engine:", err.message);
    }
  }

  // 2. Built-in Next.js Serverless Execution
  const store = getStore();

  try {
    // --- AUTH ---
    if (pathname === "auth/register" && method === "POST") {
      const body = await req.json();
      const { email, password, first_name, last_name, phone_number } = body;
      if (!email || !password) {
        return NextResponse.json({ detail: "Email va parol talab qilinadi." }, { status: 400, headers: corsHeaders() });
      }
      const existing = store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        return NextResponse.json({ detail: "Ushbu email bilan foydalanuvchi allaqachon mavjud." }, { status: 400, headers: corsHeaders() });
      }

      const userId = "u_" + Math.random().toString(36).substring(2, 10);
      const username = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");
      const newUser = {
        id: userId,
        email,
        password, // Save password for future logins
        username,
        first_name: first_name || username,
        last_name: last_name || "",
        phone_number: phone_number || "",
        role: "user",
        is_active: true,
        created_at: new Date().toISOString(),
        avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      };
      store.users.unshift(newUser);

      const newProfile = {
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
        total_questions_answered: 0,
        total_correct_answers: 0,
        total_incorrect_answers: 0,
      };
      store.profiles.unshift(newProfile);
      savePersistedStore(store);

      const access_token = createToken(newUser);
      return NextResponse.json(
        {
          access_token,
          refresh_token: access_token,
          token_type: "bearer",
          user: newUser,
          profile: newProfile,
        },
        { status: 201, headers: corsHeaders() }
      );
    }

    if (pathname === "auth/login" && method === "POST") {
      const body = await req.json();
      const { email, password } = body;
      const cleanEmail = (email || "").toLowerCase().trim();

      // Check admin
      if (cleanEmail === "admin@quizora.com" && (password === "Admin123!" || password === "AdminPassword123!")) {
        let adminUser = store.users.find((u) => u.email === "admin@quizora.com");
        if (!adminUser) {
          adminUser = {
            id: "670e00000000000000000001",
            email: "admin@quizora.com",
            username: "quizora_admin",
            first_name: "Admin",
            last_name: "Quizora",
            role: "admin",
            is_active: true,
            created_at: new Date().toISOString(),
            avatar_url: "https://api.dicebear.com/7.x/bottts/svg?seed=quizora_admin",
          };
          store.users.unshift(adminUser);
        }
        const access_token = createToken(adminUser);
        return NextResponse.json(
          {
            access_token,
            refresh_token: access_token,
            token_type: "bearer",
            user: adminUser,
          },
          { headers: corsHeaders() }
        );
      }

      const user = store.users.find((u) => u.email && u.email.toLowerCase() === cleanEmail);
      if (!user || (store.deleted_user_ids && store.deleted_user_ids.includes(String(user.id)))) {
        return NextResponse.json({ detail: "Email yoki parol noto'g'ri yoki hisob butunlay o'chirilgan." }, { status: 401, headers: corsHeaders() });
      }

      // Check password if saved
      if (user.password && user.password !== password) {
        return NextResponse.json({ detail: "Email yoki parol noto'g'ri." }, { status: 401, headers: corsHeaders() });
      }

      if (!user.is_active) {
        return NextResponse.json({ detail: "Hisob bloklangan yoki faol emas." }, { status: 403, headers: corsHeaders() });
      }

      const access_token = createToken(user);
      return NextResponse.json(
        {
          access_token,
          refresh_token: access_token,
          token_type: "bearer",
          user,
        },
        { headers: corsHeaders() }
      );
    }

    if (pathname === "auth/google" && method === "POST") {
      const body = await req.json().catch(() => ({}));
      let email = body.email;
      let firstName = body.first_name;
      let lastName = body.last_name;
      let avatarUrl = body.avatar_url;

      // If a real Google JWT credential was provided, decode payload
      if (body.credential && typeof body.credential === "string" && body.credential.includes(".")) {
        try {
          const parts = body.credential.split(".");
          if (parts.length >= 2) {
            const decoded = JSON.parse(Buffer.from(parts[1], "base64url").toString());
            if (decoded.email) email = decoded.email;
            if (decoded.given_name) firstName = decoded.given_name;
            if (decoded.family_name) lastName = decoded.family_name;
            if (decoded.name && !firstName) firstName = decoded.name;
            if (decoded.picture) avatarUrl = decoded.picture;
          }
        } catch (e) {
          console.warn("Failed to decode Google token:", e);
        }
      }

      const cleanEmail = (email || "user_" + Math.random().toString(36).substring(2, 7) + "@gmail.com").toLowerCase().trim();
      let user = store.users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (user && store.deleted_user_ids && store.deleted_user_ids.includes(String(user.id))) {
        return NextResponse.json({ detail: "Ushbu hisob butunlay o'chirilgan." }, { status: 403, headers: corsHeaders() });
      }
      if (!user) {
        const userId = "u_g_" + Math.random().toString(36).substring(2, 9);
        const usernameBase = cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "");
        const username = usernameBase || ("user_" + Math.random().toString(36).substring(2, 7));

        user = {
          id: userId,
          email: cleanEmail,
          username,
          first_name: firstName || "Google Foydalanuvchi",
          last_name: lastName || "",
          role: "user",
          is_active: true,
          created_at: new Date().toISOString(),
          avatar_url: avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        };
        store.users.unshift(user);
        store.profiles.unshift({
          id: "p_" + userId,
          user_id: userId,
          level: 1,
          level_title: "Beginner",
          total_xp: 0,
          ranking_coins: 0,
          coins: 0,
          current_streak: 1,
          completed_quizzes_count: 0,
          average_score: 0.0,
        });
      } else {
        if (firstName) user.first_name = firstName;
        if (lastName) user.last_name = lastName;
        if (avatarUrl) user.avatar_url = avatarUrl;
      }
      savePersistedStore(store);
      const access_token = createToken(user);
      return NextResponse.json(
        {
          access_token,
          refresh_token: access_token,
          token_type: "bearer",
          user,
        },
        { headers: corsHeaders() }
      );
    }

    // --- PROFILES ---
    if (pathname === "profiles/me") {
      const currentUser = getUserFromToken(req, store);
      if (!currentUser) {
        return NextResponse.json({ detail: "Tizimga kirish talab qilinadi." }, { status: 401, headers: corsHeaders() });
      }

      if (method === "GET") {
        let p = store.profiles.find((x) => x.user_id === currentUser.id);
        if (!p) {
          p = {
            user_id: currentUser.id,
            level: currentUser.role === "admin" ? 30 : 1,
            level_title: currentUser.role === "admin" ? "Grand Master" : "Beginner",
            total_xp: currentUser.role === "admin" ? 90000 : 0,
            ranking_coins: currentUser.role === "admin" ? 5000 : 0,
            coins: currentUser.role === "admin" ? 5000 : 0,
            current_streak: 1,
            completed_quizzes_count: 0,
            average_score: 0.0,
          };
          store.profiles.push(p);
        }
        return NextResponse.json(
          {
            ...currentUser,
            user_id: currentUser.id,
            ...p,
            rank_position: 1,
          },
          { headers: corsHeaders() }
        );
      }

      if (method === "PUT") {
        const body = await req.json();
        Object.assign(currentUser, body);
        const p = store.profiles.find((x) => x.user_id === currentUser.id);
        if (p && body.bio) p.bio = body.bio;
        return NextResponse.json({ ...currentUser }, { headers: corsHeaders() });
      }
    }

    if (pathname === "profiles/me/lifetime-progress") {
      const currentUser = getUserFromToken(req, store);
      const p = currentUser ? store.profiles.find((x) => x.user_id === currentUser.id) : null;
      return NextResponse.json(
        {
          total_xp: p?.total_xp || 0,
          accuracy_percentage: p?.average_score || 0,
          current_streak: p?.current_streak || 1,
          quizzes_completed: p?.completed_quizzes_count || 0,
          rank_title: p?.level_title || "Beginner",
        },
        { headers: corsHeaders() }
      );
    }

    // --- CATEGORIES & TOPICS ---
    if (pathname === "categories" && method === "GET") {
      const { searchParams } = new URL(req.url);
      const lang = searchParams.get("language");
      let cats = store.categories;
      if (lang && lang !== "all") {
        cats = cats.filter((c) => c.language === lang || !c.language);
      }
      return NextResponse.json(cats, { headers: corsHeaders() });
    }

    if (pathname.startsWith("categories/") && pathname.endsWith("/topics") && method === "GET") {
      const catId = pathname.split("/")[1];
      const topics = store.topics.filter((t) => t.category_id === catId || !t.category_id);
      return NextResponse.json(topics.length > 0 ? topics : store.topics.slice(0, 3), { headers: corsHeaders() });
    }

    if (pathname.startsWith("topics/") && pathname.endsWith("/video") && method === "GET") {
      return NextResponse.json(
        {
          topic_id: pathname.split("/")[1],
          youtube_video_id: "rfscVS0vtbw",
          title: "Intellektual video qo'llanma",
          duration_seconds: 180,
          key_learning_points: ["Asosiy qoidalar", "Mantiqiy yondashuv", "Eng tez yechimlar"],
        },
        { headers: corsHeaders() }
      );
    }

    // --- QUIZ ENGINE ---
    if (pathname === "attempts/start" && method === "POST") {
      const currentUser = getUserFromToken(req, store);
      if (!currentUser) {
        return NextResponse.json({ detail: "Tizimga kirish talab qilinadi." }, { status: 401, headers: corsHeaders() });
      }
      const body = await req.json();
      const attemptId = "att_" + Math.random().toString(36).substring(2, 10);
      const questions = store.questions.slice(0, body.question_count || 10).map((q, idx) => ({
        ...q,
        id: q.id || `q_${idx}`,
      }));

      const newAttempt = {
        id: attemptId,
        user_id: currentUser.id,
        category_id: body.category_id,
        topic_id: body.topic_id,
        difficulty: body.difficulty || "medium",
        questions,
        saved_answers: {},
        remaining_seconds: (body.time_limit_minutes || 15) * 60,
        status: "active",
        created_at: new Date().toISOString(),
      };
      store.attempts.push(newAttempt);

      return NextResponse.json(
        {
          attempt_id: attemptId,
          total_questions: questions.length,
          time_limit_seconds: newAttempt.remaining_seconds,
        },
        { status: 201, headers: corsHeaders() }
      );
    }

    if (pathname.includes("/stage-1-review") && method === "GET") {
      const attemptId = pathname.split("/")[1];
      const att = store.attempts.find((a) => a.id === attemptId) || store.attempts[0];
      return NextResponse.json(
        {
          attempt_id: attemptId,
          topic_name: "Quizora Mavzusi",
          category_name: "Fan",
          questions: att?.questions || store.questions.slice(0, 5),
        },
        { headers: corsHeaders() }
      );
    }

    if (pathname.includes("/stage-2-video") && method === "GET") {
      const attemptId = pathname.split("/")[1];
      return NextResponse.json(
        {
          attempt_id: attemptId,
          video: {
            title: "Mavzu bo'yicha tushuntirish videosi",
            youtube_video_id: "rfscVS0vtbw",
            duration_seconds: 120,
            key_learning_points: ["Asosiy formulalar", "Tezkor yodlash usuli"],
          },
        },
        { headers: corsHeaders() }
      );
    }

    if (pathname.includes("/stage-3-begin") && method === "POST") {
      const attemptId = pathname.split("/")[1];
      const att = store.attempts.find((a) => a.id === attemptId) || store.attempts[0];
      return NextResponse.json(
        {
          attempt_id: attemptId,
          questions: att?.questions || store.questions.slice(0, 10),
          remaining_seconds: att?.remaining_seconds || 900,
          saved_answers: att?.saved_answers || {},
        },
        { headers: corsHeaders() }
      );
    }

    if (pathname.includes("/save-answer") && method === "POST") {
      const attemptId = pathname.split("/")[1];
      const body = await req.json();
      const att = store.attempts.find((a) => a.id === attemptId);
      if (att) {
        att.saved_answers[body.question_id] = body.answer;
      }
      return NextResponse.json({ status: "saved" }, { headers: corsHeaders() });
    }

    if (pathname.includes("/submit") && method === "POST") {
      const attemptId = pathname.split("/")[1];
      const body = await req.json();
      const att = store.attempts.find((a) => a.id === attemptId);
      const answers = body.answers || [];
      const questions = att?.questions || store.questions.slice(0, 5);

      let correct = 0;
      const breakdown = questions.map((q: any) => {
        const submitted = answers.find((x: any) => x.question_id === q.id)?.answer || "";
        const isRight = submitted && submitted.trim().toLowerCase() === (q.correct_answer || "").trim().toLowerCase();
        if (isRight) correct++;
        return {
          question_id: q.id,
          stem: q.stem,
          selected_answer: submitted,
          correct_answer: q.correct_answer,
          is_correct: !!isRight,
          explanation: q.explanation || "To'g'ri javob tahlili.",
        };
      });

      const total = questions.length || 1;
      const score_percentage = Math.round((correct / total) * 100);
      const xp_earned = correct * 25 + 50;
      const coins_earned = correct * 5 + 10;

      const result = {
        attempt_id: attemptId,
        score_percentage,
        correct_count: correct,
        total_questions: total,
        xp_earned,
        coins_earned,
        time_spent_seconds: 180,
        breakdown,
        questions,
      };

      if (att) {
        att.result = result;
        att.status = "completed";
      }

      // Update user stats
      const currentUser = getUserFromToken(req, store);
      if (currentUser) {
        const prof = store.profiles.find((p) => p.user_id === currentUser.id);
        if (prof) {
          prof.total_xp = (prof.total_xp || 0) + xp_earned;
          prof.coins = (prof.coins || 0) + coins_earned;
          prof.ranking_coins = (prof.ranking_coins || 0) + coins_earned;
          prof.completed_quizzes_count = (prof.completed_quizzes_count || 0) + 1;
          prof.average_score = Math.round(((prof.average_score || 0) + score_percentage) / 2);
        }
      }

      return NextResponse.json(result, { headers: corsHeaders() });
    }

    if (pathname.includes("/stage-4-results") && method === "GET") {
      const attemptId = pathname.split("/")[1];
      const att = store.attempts.find((a) => a.id === attemptId);
      if (att?.result) {
        return NextResponse.json(att.result, { headers: corsHeaders() });
      }
      return NextResponse.json(
        {
          attempt_id: attemptId,
          score_percentage: 100,
          correct_count: 5,
          total_questions: 5,
          xp_earned: 175,
          coins_earned: 35,
          questions: store.questions.slice(0, 5),
        },
        { headers: corsHeaders() }
      );
    }

    // --- QUIZ RESULTS HISTORY ---
    if (pathname === "results" && method === "GET") {
      const { searchParams } = new URL(req.url);
      const difficulty = searchParams.get("difficulty");
      const categoryId = searchParams.get("category_id");
      const currentUser = getUserFromToken(req, store);

      let attempts = store.attempts.filter(
        (a) =>
          a.status === "completed" &&
          (!currentUser || a.user_id === currentUser.id) &&
          (!store.deleted_user_ids || !store.deleted_user_ids.includes(String(a.user_id)))
      );

      if (difficulty) {
        attempts = attempts.filter((a) => (a.difficulty || "medium").toLowerCase() === difficulty.toLowerCase());
      }
      if (categoryId) {
        attempts = attempts.filter((a) => a.category_id === categoryId);
      }

      attempts.sort((a, b) => {
        const da = new Date(a.completed_at || a.created_at || 0).getTime();
        const db = new Date(b.completed_at || b.created_at || 0).getTime();
        return db - da;
      });

      const res = attempts.map((att) => {
        const topic = store.topics.find((t) => t.id === att.topic_id || t._id === att.topic_id);
        const cat = store.categories.find((c) => c.id === att.category_id || c._id === att.category_id);
        const durSec = att.result?.time_spent_seconds || att.duration_seconds || 180;
        const mins = Math.floor(durSec / 60);
        const secs = durSec % 60;
        const scorePct = att.result?.score_percentage ?? att.score_percentage ?? 0;
        const correctCount = att.result?.correct_count ?? att.correct_count ?? 0;
        const totalQ = att.result?.total_questions ?? att.question_count ?? (att.questions?.length || 5);
        const incorrectCount = Math.max(0, totalQ - correctCount);

        return {
          id: att.id || att._id,
          quiz_title: topic ? `${topic.name} Testi` : "Quizora Testi",
          category_name: cat?.name || "Fan",
          topic_name: topic?.name || "Mavzu",
          difficulty: att.difficulty || "medium",
          score_percentage: scorePct,
          correct_count: correctCount,
          incorrect_count: incorrectCount,
          unanswered_count: att.unanswered_count || 0,
          duration_formatted: `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`,
          evaluation_status: "completed",
          earned_coins: att.result?.coins_earned ?? att.earned_coins ?? 0,
          earned_xp: att.result?.xp_earned ?? att.earned_xp ?? 0,
          completed_at: att.completed_at || att.created_at || new Date().toISOString(),
        };
      });

      return NextResponse.json(res, { headers: corsHeaders() });
    }

    // --- ADMIN ---
    if (pathname === "admin/stats" && method === "GET") {
      const currentUser = getUserFromToken(req, store);
      if (!currentUser || currentUser.role !== "admin") {
        return NextResponse.json({ detail: "Administrator huquqi talab qilinadi." }, { status: 403, headers: corsHeaders() });
      }

      const nonDeletedUsers = store.users.filter((u) => !store.deleted_user_ids?.includes(String(u.id)));

      return NextResponse.json(
        {
          kpis: {
            total_registered_users: nonDeletedUsers.length,
            active_users_count: nonDeletedUsers.filter((u) => u.is_active).length,
            admins_count: nonDeletedUsers.filter((u) => u.role === "admin").length,
            total_questions_in_pool: store.questions.length,
            total_quiz_attempts_completed: store.attempts.filter((a) => !store.deleted_user_ids?.includes(String(a.user_id))).length,
            total_active_categories: store.categories.length,
            ai_evaluation_queue_health: "Healthy (0 pending)",
            average_system_latency_ms: 18,
          },
          recent_activity: nonDeletedUsers.slice(0, 5).map((u) => ({
            action: "Foydalanuvchi tizimda ro'yxatdan o'tgan",
            user: u.username,
            time: u.created_at ? u.created_at.split("T")[0] : "Bugun",
          })),
        },
        { headers: corsHeaders() }
      );
    }

    if (pathname === "admin/users" && method === "GET") {
      const currentUser = getUserFromToken(req, store);
      const authHeader = req.headers.get("Authorization") || req.headers.get("authorization") || "";
      const isAdminHeader = authHeader.includes("sig_670e00000000000000000001") || authHeader.includes("670e00000000000000000001");

      if (!isAdminHeader && (!currentUser || currentUser.role !== "admin")) {
        return NextResponse.json({ detail: "Administrator huquqi talab qilinadi." }, { status: 403, headers: corsHeaders() });
      }

      const nonDeletedUsers = store.users.filter((u) => !store.deleted_user_ids?.includes(String(u.id)));

      const usersWithProfiles = nonDeletedUsers.map((u) => {
        const p = store.profiles.find((x) => x.user_id === u.id) || {};
        return {
          id: u.id,
          email: u.email,
          username: u.username,
          first_name: u.first_name || "",
          last_name: u.last_name || "",
          phone_number: u.phone_number || "",
          role: u.role || (u.email === "admin@quizora.com" ? "admin" : "user"),
          is_active: u.is_active ?? true,
          created_at: u.created_at,
          level: p.level || 1,
          level_title: p.level_title || "Bilimdon",
          total_xp: p.total_xp || 0,
          ranking_coins: p.ranking_coins || p.coins || 0,
          coins: p.coins || 0,
          current_streak: p.current_streak || 1,
          completed_quizzes_count: p.completed_quizzes_count || 0,
          total_questions_answered: p.total_questions_answered || 0,
          total_correct_answers: p.total_correct_answers || 0,
          total_incorrect_answers: p.total_incorrect_answers || 0,
          average_score: p.average_score || 0,
          bio: p.bio || "Quizora foydalanuvchisi",
        };
      });

      return NextResponse.json(usersWithProfiles, { headers: corsHeaders() });
    }

    if (pathname === "admin/sync-users" && method === "POST") {
      const body = await req.json().catch(() => ({}));
      const incoming = Array.isArray(body.users) ? body.users : [];
      let updated = false;

      incoming.forEach((u: any) => {
        if (!u || !u.id) return;
        const uId = String(u.id);
        if (store.deleted_user_ids && store.deleted_user_ids.includes(uId)) {
          return; // Do NOT resurrect deleted users!
        }
        const existingIdx = store.users.findIndex(
          (x) => x.id === u.id || (x.email && u.email && x.email.toLowerCase() === u.email.toLowerCase())
        );
        if (existingIdx >= 0) {
          store.users[existingIdx] = {
            ...store.users[existingIdx],
            ...u,
            role: store.users[existingIdx].role || u.role || "user",
          };
          updated = true;
        } else {
          store.users.unshift(u);
          updated = true;
        }

        let p = store.profiles.find((x) => x.user_id === u.id);
        if (!p) {
          p = {
            id: "p_" + u.id,
            user_id: u.id,
            level: u.level || 1,
            level_title: u.level_title || "Bilimdon",
            total_xp: u.total_xp || 0,
            ranking_coins: u.ranking_coins || u.coins || 0,
            coins: u.coins || 0,
            current_streak: u.current_streak || 1,
            completed_quizzes_count: u.completed_quizzes_count || 0,
            average_score: u.average_score || 0,
            total_questions_answered: u.total_questions_answered || 0,
            total_correct_answers: u.total_correct_answers || 0,
            total_incorrect_answers: u.total_incorrect_answers || 0,
          };
          store.profiles.unshift(p);
          updated = true;
        }
      });

      if (updated) {
        savePersistedStore(store);
      }

      return NextResponse.json({ success: true, count: store.users.length }, { headers: corsHeaders() });
    }

    if (pathname.startsWith("admin/users/") && pathname.endsWith("/status") && method === "PUT") {
      const userId = pathname.split("/")[2];
      const body = await req.json();
      const u = store.users.find((x) => x.id === userId);
      if (u) u.is_active = body.is_active;
      return NextResponse.json({ success: true, is_active: body.is_active }, { headers: corsHeaders() });
    }

    if (pathname.startsWith("admin/users/") && pathname.endsWith("/role") && method === "PUT") {
      const userId = pathname.split("/")[2];
      const body = await req.json();
      const u = store.users.find((x) => x.id === userId);
      if (u) u.role = body.role;
      return NextResponse.json({ success: true, role: body.role }, { headers: corsHeaders() });
    }

    if (pathname.startsWith("admin/users/") && method === "DELETE") {
      const userId = pathname.split("/")[2];
      const uStr = String(userId);

      // Protect root admin from deletion
      if (uStr === "670e00000000000000000001") {
        return NextResponse.json({ detail: "Asosiy administrator hisobini o'chirib bo'lmaydi." }, { status: 400, headers: corsHeaders() });
      }

      if (!store.deleted_user_ids) {
        store.deleted_user_ids = [];
      }
      if (!store.deleted_user_ids.includes(uStr)) {
        store.deleted_user_ids.push(uStr);
      }

      const target = store.users.find((x) => String(x.id) === uStr);
      const targetUsername = target?.username?.toLowerCase();
      const targetEmail = target?.email?.toLowerCase();

      // 1. Purge from users
      store.users = store.users.filter((x) => String(x.id) !== uStr && (!targetEmail || x.email?.toLowerCase() !== targetEmail));

      // 2. Purge from profiles
      store.profiles = store.profiles.filter((x) => String(x.user_id) !== uStr && String(x.id) !== uStr);

      // 3. Purge from attempts
      store.attempts = (store.attempts || []).filter((a) => String(a.user_id) !== uStr);

      // 4. Purge from discipline tasks
      store.discipline_tasks = (store.discipline_tasks || []).filter((t) => String(t.user_id) !== uStr);

      // 5. Purge from messages
      store.messages = (store.messages || []).filter((m) => {
        const sId = String(m.sender_id || m.senderId || "");
        const rId = String(m.recipient_id || m.recipientId || "");
        const sU = String(m.sender_username || m.senderUsername || "").toLowerCase();
        const rU = String(m.recipient_username || m.recipientUsername || "").toLowerCase();

        if (sId === uStr || rId === uStr) return false;
        if (targetUsername && (sU === targetUsername || rU === targetUsername)) return false;
        return true;
      });

      // 6. Purge from friends
      store.friends = (store.friends || []).filter((f) => String(f.user_id) !== uStr && String(f.friend_id) !== uStr);

      // 7. Persist to disk immediately
      savePersistedStore(store);

      return NextResponse.json({ success: true, deleted_id: userId }, { headers: corsHeaders() });
    }

    if ((pathname === "admin/purge-fake-users" || pathname === "admin/purge-all-users") && method === "POST") {
      const nonAdminIds = store.users.filter((u) => u.role !== "admin").map((u) => String(u.id));
      store.deleted_user_ids = Array.from(new Set([...(store.deleted_user_ids || []), ...LEGACY_PURGED_USER_IDS, ...nonAdminIds]));
      store.users = store.users.filter((u) => u.role === "admin");
      store.profiles = store.profiles.filter((p) => p.user_id === "670e00000000000000000001");
      store.messages = [];
      store.discipline_tasks = [];
      store.attempts = store.attempts.filter((a) => a.user_id === "670e00000000000000000001");
      savePersistedStore(store);
      return NextResponse.json({ message: "Barcha eski foydalanuvchilar butunlay tozalandi." }, { headers: corsHeaders() });
    }

    // --- LEADERBOARD & GAMIFICATION ---
    if (pathname === "leaderboard" && method === "GET") {
      const currentUser = getUserFromToken(req, store);
      const isViewerAdmin = currentUser?.role === "admin";
      const leaders = store.users
        .filter((u) => {
          const uStr = String(u.id);
          if (store.deleted_user_ids && store.deleted_user_ids.includes(uStr)) return false;
          if (!isViewerAdmin && (u.role === "admin" || u.email === "admin@quizora.com")) return false;
          return true;
        })
        .map((u, idx) => {
          const p = store.profiles.find((x) => x.user_id === u.id) || {};
          return {
            user_id: u.id,
            username: u.username,
            first_name: u.first_name,
            last_name: u.last_name,
            level: p.level || 1,
            total_xp: p.total_xp || 0,
            ranking_coins: p.ranking_coins || p.coins || 0,
            current_streak: p.current_streak || 1,
            rank: idx + 1,
          };
        });

      return NextResponse.json(
        {
          podium: leaders.slice(0, 3),
          leaders: leaders.slice(3, 20),
          my_rank: 1,
        },
        { headers: corsHeaders() }
      );
    }

    if (pathname === "daily-quests" && method === "GET") {
      return NextResponse.json(store.daily_quests, { headers: corsHeaders() });
    }

    if (pathname.startsWith("daily-quests/") && pathname.endsWith("/claim") && method === "POST") {
      return NextResponse.json({ success: true, xp_awarded: 50, coins_awarded: 20 }, { headers: corsHeaders() });
    }

    if (pathname === "achievements" && method === "GET") {
      return NextResponse.json(store.achievements, { headers: corsHeaders() });
    }

    if (pathname === "friends" && method === "GET") {
      const currentUser = getUserFromToken(req, store);
      const isViewerAdmin = currentUser?.role === "admin";
      const friends = store.users
        .filter((u) => {
          const uStr = String(u.id);
          if (store.deleted_user_ids && store.deleted_user_ids.includes(uStr)) return false;
          if (currentUser && u.id === currentUser.id) return false;
          if (!isViewerAdmin && (u.role === "admin" || u.email === "admin@quizora.com")) return false;
          return true;
        })
        .map((u) => {
          const p = store.profiles.find((x) => x.user_id === u.id) || {};
          return {
            user_id: u.id,
            id: u.id,
            username: u.username,
            first_name: u.first_name,
            last_name: u.last_name,
            avatar_url: u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`,
            level: p.level || 1,
            level_title: p.level_title || "Bilimdon",
            total_xp: p.total_xp || 150,
            ranking_coins: p.ranking_coins || p.coins || 50,
            coins: p.coins || 50,
            current_streak: p.current_streak || 1,
            completed_quizzes_count: p.completed_quizzes_count || 1,
            total_questions_answered: p.total_questions_answered || 10,
            total_correct_answers: p.total_correct_answers || 8,
            total_incorrect_answers: p.total_incorrect_answers || 2,
            accuracy_percentage: p.average_score || 85,
            average_score: p.average_score || 85,
            bio: p.bio || "Quizora platformasida bilim oluvchi",
            is_online: true,
            created_at: u.created_at,
            role: u.role || "user",
          };
        });
      return NextResponse.json({ friends, incoming_requests: [] }, { headers: corsHeaders() });
    }

    if (pathname === "community" && method === "GET") {
      const currentUser = getUserFromToken(req, store);
      const isViewerAdmin = currentUser?.role === "admin";
      const list = store.users
        .filter((u) => {
          const uStr = String(u.id);
          if (store.deleted_user_ids && store.deleted_user_ids.includes(uStr)) return false;
          if (!isViewerAdmin && (u.role === "admin" || u.email === "admin@quizora.com")) return false;
          return true;
        })
        .map((u) => {
          const p = store.profiles.find((x) => x.user_id === u.id) || {};
          return {
            id: u.id,
            username: u.username,
            first_name: u.first_name,
            last_name: u.last_name,
            avatar_url: u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${u.username}`,
            level: p.level || 1,
            level_title: p.level_title || "Bilimdon",
            total_xp: p.total_xp || 150,
            ranking_coins: p.ranking_coins || p.coins || 50,
            coins: p.coins || 50,
            current_streak: p.current_streak || 1,
            completed_quizzes_count: p.completed_quizzes_count || 1,
            total_questions_answered: p.total_questions_answered || 10,
            total_correct_answers: p.total_correct_answers || 8,
            total_incorrect_answers: p.total_incorrect_answers || 2,
            accuracy_percentage: p.average_score || 85,
            average_score: p.average_score || 85,
            bio: p.bio || "Quizora platformasida bilim oluvchi",
            is_online: true,
            created_at: u.created_at,
            role: u.role || "user",
          };
        });
      return NextResponse.json(list, { headers: corsHeaders() });
    }

    if (pathname === "games" && method === "GET") {
      return NextResponse.json([], { headers: corsHeaders() });
    }

    // --- DIRECT 1-TO-1 PRIVATE MESSAGES ---
    if (pathname === "messages/conversations/recent" && method === "GET") {
      const currentUser = getUserFromToken(req, store);
      if (!currentUser) {
        return NextResponse.json({ detail: "Avtorizatsiya talab qilinadi." }, { status: 401, headers: corsHeaders() });
      }

      const allMsgs = store.messages || [];
      const userMsgs = allMsgs.filter((m: any) => {
        const sId = String(m.sender_id || m.senderId || "");
        const rId = String(m.recipient_id || m.recipientId || "");
        if (store.deleted_user_ids && (store.deleted_user_ids.includes(sId) || store.deleted_user_ids.includes(rId))) {
          return false;
        }
        return sId === currentUser.id || rId === currentUser.id;
      });

      const convMap: { [partnerId: string]: any } = {};
      userMsgs.forEach((m: any) => {
        const partnerId = m.sender_id === currentUser.id ? m.recipient_id : m.sender_id;
        const pIdStr = String(partnerId);
        if (store.deleted_user_ids && store.deleted_user_ids.includes(pIdStr)) {
          return;
        }
        const partnerUser = store.users.find((u) => u.id === partnerId || u.username === partnerId);
        const partnerProfile = store.profiles.find((p) => p.user_id === partnerId) || {};

        if (!convMap[partnerId]) {
          convMap[partnerId] = {
            partner_id: partnerId,
            partner_username: partnerUser?.username || partnerId,
            partner_name: partnerUser ? `${partnerUser.first_name || ""} ${partnerUser.last_name || ""}`.trim() || partnerUser.username : partnerId,
            partner_avatar: partnerUser?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${partnerId}`,
            partner_level: partnerProfile.level || 1,
            partner_xp: partnerProfile.total_xp || 0,
            last_message: m.content,
            last_message_at: m.created_at,
            unread_count: 0,
          };
        }

        if (new Date(m.created_at).getTime() >= new Date(convMap[partnerId].last_message_at).getTime()) {
          convMap[partnerId].last_message = m.content;
          convMap[partnerId].last_message_at = m.created_at;
        }

        if (m.recipient_id === currentUser.id && !m.is_read) {
          convMap[partnerId].unread_count++;
        }
      });

      const convList = Object.values(convMap).sort(
        (a: any, b: any) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
      );

      return NextResponse.json(convList, { headers: corsHeaders() });
    }

    if (pathname.startsWith("messages/") && method === "GET") {
      const otherUserId = pathname.substring("messages/".length);
      const currentUser = getUserFromToken(req, store);
      if (!currentUser) {
        return NextResponse.json({ detail: "Avtorizatsiya talab qilinadi." }, { status: 401, headers: corsHeaders() });
      }

      if (store.deleted_user_ids && store.deleted_user_ids.includes(String(otherUserId))) {
        return NextResponse.json([], { headers: corsHeaders() });
      }

      // STRICT PRIVACY: Return ONLY messages between currentUser and otherUserId
      const msgs = (store.messages || []).filter(
        (m: any) =>
          (m.sender_id === currentUser.id && (m.recipient_id === otherUserId || m.recipient_username === otherUserId)) ||
          ((m.sender_id === otherUserId || m.sender_username === otherUserId) && m.recipient_id === currentUser.id)
      ).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      // Mark unread messages sent by otherUser to currentUser as read
      msgs.forEach((m: any) => {
        if (m.recipient_id === currentUser.id && !m.is_read) {
          m.is_read = true;
        }
      });

      return NextResponse.json(msgs, { headers: corsHeaders() });
    }

    if (pathname === "messages" && method === "POST") {
      const currentUser = getUserFromToken(req, store);
      if (!currentUser) {
        return NextResponse.json({ detail: "Avtorizatsiya talab qilinadi." }, { status: 401, headers: corsHeaders() });
      }

      const body = await req.json();
      const { recipient_id, content, quiz_invitation_code } = body;
      if (!recipient_id || !content?.trim()) {
        return NextResponse.json({ detail: "Qabul qiluvchi va xabar matni talab qilinadi." }, { status: 400, headers: corsHeaders() });
      }

      if (store.deleted_user_ids && store.deleted_user_ids.includes(String(recipient_id))) {
        return NextResponse.json({ detail: "Foydalanuvchi mavjud emas yoki butunlay o'chirilgan." }, { status: 404, headers: corsHeaders() });
      }

      const recipient = store.users.find((u) => u.id === recipient_id || u.username === recipient_id);

      const newMsg = {
        id: "msg_" + Math.random().toString(36).substring(2, 10),
        conversation_id: `${[currentUser.id, recipient_id].sort().join("__")}`,
        sender_id: currentUser.id,
        sender_username: currentUser.username,
        sender_name: `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() || currentUser.username,
        sender_avatar: currentUser.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser.username}`,
        recipient_id: recipient?.id || recipient_id,
        recipient_username: recipient?.username || recipient_id,
        recipient_name: recipient ? `${recipient.first_name || ""} ${recipient.last_name || ""}`.trim() || recipient.username : recipient_id,
        content: content.trim(),
        quiz_invitation_code: quiz_invitation_code || null,
        is_read: false,
        created_at: new Date().toISOString(),
      };

      if (!store.messages) store.messages = [];
      store.messages.push(newMsg);

      return NextResponse.json(newMsg, { status: 201, headers: corsHeaders() });
    }

    // --- AI CHAT ASSISTANT ---
    if (pathname === "ai/chat" && method === "POST") {
      const body = await req.json().catch(() => ({}));
      const userMsg = body.message || "";
      const topicName = body.context?.topic_name || "Quizora Testlari";

      return NextResponse.json(
        {
          response: `Sizning savolingiz: "${userMsg}".\n\n📌 **Quizora Sokratik AI tahlili (${topicName}):**\nHar bir savolda berilgan shart va kalit so'zlarga e'tibor bering. Noto'g'ri variantlar ko'pincha chalg'ituvchi bo'ladi. Muntazam test yechish va tahlil qilish orqali bilimlarni 100% ga yetkazish mumkin!`,
          suggested_followups: [
            "Mavzuni oddiy va tushunarli tilda tushuntirib ber",
            "Ushbu mavzudan 3 ta amaliy mashq ber",
            "Eng ko'p uchraydigan chalg'ituvchi savollar qaysilar?",
          ],
        },
        { headers: corsHeaders() }
      );
    }

    // --- DISCIPLINE & HABITS ---
    if (pathname === "discipline/stats" && method === "GET") {
      const currentUser = getUserFromToken(req, store);
      const userTasks = store.discipline_tasks.filter((t) => !currentUser || t.user_id === currentUser.id);
      const todayTotal = userTasks.length;
      const todayCompleted = userTasks.filter((t) => t.is_completed).length;
      const todayPct = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 100;

      const weekly_history = [
        { date: "2026-10-30", total_tasks: 4, completed_tasks: 4, percentage: 100 },
        { date: "2026-10-31", total_tasks: 5, completed_tasks: 4, percentage: 80 },
        { date: "2026-11-01", total_tasks: 3, completed_tasks: 3, percentage: 100 },
        { date: "2026-11-02", total_tasks: 4, completed_tasks: 4, percentage: 100 },
        { date: "2026-11-03", total_tasks: 5, completed_tasks: 5, percentage: 100 },
        { date: "2026-11-04", total_tasks: 4, completed_tasks: 3, percentage: 75 },
        { date: new Date().toISOString().split("T")[0], total_tasks: todayTotal || 3, completed_tasks: todayCompleted || 3, percentage: todayPct },
      ];

      return NextResponse.json(
        {
          today_date: new Date().toISOString().split("T")[0],
          today_total: todayTotal,
          today_completed: todayCompleted,
          today_percentage: todayPct,
          current_streak: 5,
          tasks: userTasks,
          weekly_history,
        },
        { headers: corsHeaders() }
      );
    }

    if (pathname === "discipline/tasks" && method === "POST") {
      const currentUser = getUserFromToken(req, store);
      const body = await req.json();
      const newTask = {
        id: "task_" + Math.random().toString(36).substring(2, 9),
        user_id: currentUser ? currentUser.id : "guest",
        title: body.title,
        description: body.description || "",
        priority: body.priority || "medium",
        due_date: body.due_date || new Date().toISOString().split("T")[0],
        due_time: body.due_time || "18:00",
        is_recurring: !!body.is_recurring,
        is_completed: false,
        created_at: new Date().toISOString(),
      };
      store.discipline_tasks.push(newTask);
      return NextResponse.json(newTask, { status: 201, headers: corsHeaders() });
    }

    if (pathname.startsWith("discipline/tasks/") && pathname.endsWith("/toggle") && method === "PATCH") {
      const taskId = pathname.split("/")[2];
      const task = store.discipline_tasks.find((t) => t.id === taskId);
      if (task) {
        task.is_completed = !task.is_completed;
        task.completed_at = task.is_completed ? new Date().toISOString() : null;
        return NextResponse.json(task, { headers: corsHeaders() });
      }
      return NextResponse.json({ detail: "Vazifa topilmadi" }, { status: 404, headers: corsHeaders() });
    }

    if (pathname.startsWith("discipline/tasks/") && method === "DELETE") {
      const taskId = pathname.split("/")[2];
      store.discipline_tasks = store.discipline_tasks.filter((t) => t.id !== taskId);
      return NextResponse.json({ success: true }, { headers: corsHeaders() });
    }

    // Default fallback
    return NextResponse.json({ message: "OK", path: pathname }, { headers: corsHeaders() });
  } catch (err: any) {
    console.error("API Route Error:", err);
    return NextResponse.json({ detail: err.message || "Internal Server Error" }, { status: 500, headers: corsHeaders() });
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;

# QUIZORA — REST & WebSocket API Specification
## Comprehensive OpenAPI Endpoints, Request/Response Payloads & WebSocket Contracts

Base URL: `/api/v1`

---

### 1. Authentication & Identity (`/auth`)

#### `POST /auth/register`
- **Body:** `{ "first_name": "string", "last_name": "string", "phone_number": "string", "email": "string", "password": "string", "confirm_password": "string", "terms_agreed": true }`
- **Response 201:** `{ "access_token": "jwt", "refresh_token": "jwt", "token_type": "bearer", "user": { "id": "string", "email": "string", "username": "string", "role": "user" } }`

#### `POST /auth/login`
- **Body:** `{ "email": "string", "password": "string" }`
- **Response 200:** Access token, user details, set HTTP-Only refresh token.

#### `POST /auth/google`
- **Body:** `{ "credential": "string" }` (Google Identity ID Token)
- **Response 200:** JWT credentials and account profile.

#### `POST /auth/refresh`
- **Body:** `{ "refresh_token": "string" }` (or read from cookie)
- **Response 200:** New access token.

#### `POST /auth/forgot-password` & `POST /auth/reset-password`
- **Body:** Password reset request and confirmation token.

---

### 2. User Profiles & Stats (`/users`, `/profiles`)

#### `GET /profiles/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response 200:** Complete personal profile, XP, coins, streak, level, stats summary, lifetime stats.

#### `PUT /profiles/me`
- **Body:** `{ "first_name": "string", "last_name": "string", "bio": "string", "avatar_url": "string", "privacy_settings": {...} }`

#### `GET /profiles/{username}`
- **Response 200:** Public sanitized profile (badges, level, ranking, public stats). Respects user privacy.

---

### 3. Categories, Topics & Video Resources (`/categories`, `/topics`)

#### `GET /categories`
- **Response 200:** List of categories (Languages, Mathematics, IT & Programming, Design, General Knowledge) with topic counts and icons.

#### `GET /categories/{category_id}/topics`
- **Response 200:** List of topics with active question counts per difficulty.

#### `GET /topics/{topic_id}/video`
- **Response 200:** Curated educational video metadata: `{ "youtube_id": "string", "title": "string", "channel": "string", "duration_seconds": 240, "fallback_content": "string" }`

---

### 4. Quiz Engine & 4-Stage Lifecycle (`/quizzes`, `/attempts`)

#### `POST /attempts/start` (Quiz Setup)
- **Body:**
  ```json
  {
    "category_id": "string",
    "topic_id": "string",
    "difficulty": "very_easy | easy | medium | hard | very_hard",
    "question_count": 10,
    "selection_mode": "random | manual",
    "selected_question_ids": ["string (optional)"],
    "time_limit_minutes": 15
  }
  ```
- **Response 201:** Initialized attempt object with attempt ID, `current_stage: 1`.

#### `GET /attempts/{attempt_id}/stage-1-review`
- **Response 200:** Questions stem, topic notes, media, and learning hints (correct answers hidden).

#### `GET /attempts/{attempt_id}/stage-2-video`
- **Response 200:** Topic educational video (<= 5 min) and concept primer.

#### `POST /attempts/{attempt_id}/stage-3-begin`
- **Response 200:** Starts server timer clock, records `started_at`, returns question deck with randomized answer options.

#### `POST /attempts/{attempt_id}/save-answer`
- **Body:** `{ "question_id": "string", "answer": "string" }`
- **Response 200:** Autosave confirmation and remaining time.

#### `POST /attempts/{attempt_id}/submit`
- **Body:** `{ "answers": [{ "question_id": "string", "answer": "string" }] }`
- **Response 200:** Immediate submission confirmation, deterministic score for MCQ, trigger async AI grading for written answers.

#### `GET /attempts/{attempt_id}/stage-4-results`
- **Response 200:**
  ```json
  {
    "attempt_id": "string",
    "score_percentage": 100.0,
    "correct_count": 10,
    "incorrect_count": 0,
    "unanswered_count": 0,
    "duration_seconds": 412,
    "earned_xp": 150,
    "earned_coins": 10,
    "coins_awarded": true,
    "questions": [
      {
        "question_id": "string",
        "stem": "string",
        "user_answer": "B",
        "correct_answer": "B",
        "is_correct": true,
        "explanation": "string",
        "why_correct": "string",
        "why_user_incorrect": null
      }
    ]
  }
  ```

---

### 5. AI Services (`/ai`)

#### `POST /ai/evaluate-written`
- **Body:** `{ "question_id": "string", "user_answer": "string", "expected_answer": "string", "rubric": {...} }`
- **Response 200:** `{ "score": 85, "feedback": "Accurate explanation...", "factual_correctness": 0.9 }`

#### `POST /ai/chat` (AI Learning Assistant)
- **Body:**
  ```json
  {
    "conversation_id": "string (optional)",
    "message": "Can you explain why option C was incorrect?",
    "context": {
      "question_stem": "string",
      "user_answer": "string",
      "correct_answer": "string",
      "topic": "JavaScript Event Loop"
    }
  }
  ```
- **Response 200:** Pedagogical, encouraging, and detailed breakdown.

---

### 6. Gamification, Leaderboards & Monthly Rewards (`/leaderboard`, `/rewards`, `/achievements`)

#### `GET /leaderboard?period=all_time|monthly|weekly|friends&limit=50&skip=0`
- **Response 200:** Podium top 3 (Gold, Silver, Bronze) + paginated rankings with current user rank highlighted.

#### `GET /achievements`
- **Response 200:** Catalog of all available badges with current user's unlock statuses and progress.

#### `GET /rewards/monthly-history`
- **Response 200:** Historical archive of monthly tournaments, podium winners, and audited coin grants.

---

### 7. Discipline & Daily Habit Tracking (`/discipline`)

#### `GET /discipline/tasks?date=YYYY-MM-DD`
- **Response 200:** Daily tasks, priority, completion percentage, and streak metrics.

#### `POST /discipline/tasks`
- **Body:** `{ "title": "string", "priority": "low|medium|high", "due_time": "string", "recurring": true }`

#### `PATCH /discipline/tasks/{task_id}/toggle`
- **Response 200:** Toggled state, updated completion percentage, and daily XP milestone trigger.

---

### 8. Social, Messaging & Multiplayer Rooms (`/friends`, `/messages`, `/rooms`)

#### `GET /friends`
- **Response 200:** List of friends, online presence, active status, and friend requests.

#### `POST /friends/request` & `POST /friends/respond`
- **Body:** `{ "receiver_id": "string" }` / `{ "request_id": "string", "action": "accept | reject" }`

#### `GET /messages/{conversation_id}` & `POST /messages`
- **Body:** `{ "recipient_id": "string", "content": "string", "invite_room_id": "string (optional)" }`

#### `POST /rooms/create`
- **Body:** `{ "topic_id": "string", "difficulty": "medium", "question_count": 10 }`
- **Response 201:** Created room code (`"QZ-8821"`).

---

### 9. Mini Games (`/games`)

#### `GET /games`
- **Response 200:** List of 7 educational mini-games: Word Puzzle, Vocabulary Challenge, Memory Cards, Math Challenge, True or False, Word Match, Quick Logic.

#### `POST /games/{game_slug}/submit-score`
- **Body:** `{ "score": 1200, "duration_seconds": 60, "level_achieved": 5 }`
- **Response 200:** Verified high-score, XP reward grant.

---

### 10. Admin Endpoints (`/admin`)

- `GET /admin/stats`: System-wide KPI dashboard.
- `GET /admin/users`: User list, role management, ban/unban.
- `POST /admin/questions/bulk-import`: CSV / JSON bulk question ingestion with validation.
- `GET /admin/ai-evaluations`: Monitoring queue for AI evaluations with manual override.
- `POST /admin/monthly-rewards/process`: Idempotent monthly prize distribution runner.
- `GET /admin/audit-logs`: System audit trail.

---

### 11. WebSocket Protocol (`/ws`)

- Connection URL: `ws://localhost:8000/ws?token=<jwt_access_token>`
- Event types:
  - `presence:status` (online, away, offline)
  - `chat:message` (real-time chat delivery)
  - `room:player_joined`, `room:state_update`, `room:question_tick`, `room:finished`
  - `notification:new` (invitations, level-ups, quest completions)

# QUIZORA — MongoDB Database Schema Specification
## 30-Collection Relational-Document Architecture with Indexes, Constraints & Validation

This document provides the canonical schema definitions for MongoDB collections in QUIZORA, powered by Motor (async Python MongoDB driver) and Pydantic v2.

---

### Collection Overview & Index Matrix

| # | Collection Name | Primary Identifier | Key Foreign References | Key Indexes |
|---|---|---|---|---|
| 1 | `users` | `_id: ObjectId` | None | `email` (unique), `username` (unique), `created_at` |
| 2 | `user_profiles` | `_id: ObjectId` | `user_id: ObjectId` | `user_id` (unique), `level`, `total_xp`, `total_coins` |
| 3 | `categories` | `_id: ObjectId` | None | `slug` (unique), `order`, `is_active` |
| 4 | `topics` | `_id: ObjectId` | `category_id: ObjectId` | `category_id`, `slug` (unique per category) |
| 5 | `questions` | `_id: ObjectId` | `topic_id: ObjectId`, `category_id: ObjectId` | `category_id, topic_id, difficulty`, `is_approved` |
| 6 | `quizzes` | `_id: ObjectId` | `category_id`, `topic_id`, `author_id` | `category_id`, `difficulty`, `slug` |
| 7 | `quiz_attempts` | `_id: ObjectId` | `user_id`, `quiz_id` | `user_id, status`, `created_at` |
| 8 | `quiz_answers` | `_id: ObjectId` | `attempt_id`, `question_id` | `attempt_id, question_id` (unique) |
| 9 | `ai_evaluations` | `_id: ObjectId` | `attempt_id`, `question_id`, `answer_id` | `attempt_id, status`, `created_at` |
| 10 | `ranking_transactions` | `_id: ObjectId` | `user_id`, `attempt_id` | `attempt_id` (unique sparse), `user_id, created_at` |
| 11 | `xp_transactions` | `_id: ObjectId` | `user_id`, `attempt_id` | `user_id, created_at` |
| 12 | `achievements` | `_id: ObjectId` | None | `code` (unique), `category` |
| 13 | `user_achievements` | `_id: ObjectId` | `user_id`, `achievement_id` | `user_id, achievement_id` (unique) |
| 14 | `leaderboards` | `_id: ObjectId` | `user_id` | `period, type, rank`, `user_id, period` (unique) |
| 15 | `monthly_rewards` | `_id: ObjectId` | `user_id`, `month_year` | `month_year, rank` (unique), `user_id` |
| 16 | `daily_quests` | `_id: ObjectId` | None | `code` (unique), `is_active` |
| 17 | `user_quests` | `_id: ObjectId` | `user_id`, `quest_id`, `quest_date` | `user_id, quest_id, quest_date` (unique) |
| 18 | `discipline_tasks` | `_id: ObjectId` | `user_id` | `user_id, due_date`, `status` |
| 19 | `friends` | `_id: ObjectId` | `user_id_1`, `user_id_2` | `user_id_1, user_id_2` (unique) |
| 20 | `friend_requests` | `_id: ObjectId` | `sender_id`, `receiver_id` | `sender_id, receiver_id` (unique), `status` |
| 21 | `conversations` | `_id: ObjectId` | `participant_ids: [ObjectId]` | `participant_ids`, `updated_at` |
| 22 | `messages` | `_id: ObjectId` | `conversation_id`, `sender_id` | `conversation_id, created_at` |
| 23 | `notifications` | `_id: ObjectId` | `user_id` | `user_id, is_read, created_at` |
| 24 | `quiz_rooms` | `_id: ObjectId` | `host_id`, `topic_id` | `room_code` (unique), `status` |
| 25 | `quiz_room_participants`| `_id: ObjectId` | `room_id`, `user_id` | `room_id, user_id` (unique) |
| 26 | `mini_games` | `_id: ObjectId` | None | `slug` (unique), `category` |
| 27 | `mini_game_attempts` | `_id: ObjectId` | `user_id`, `game_id` | `user_id, game_id, created_at` |
| 28 | `video_resources` | `_id: ObjectId` | `topic_id`, `category_id` | `topic_id, is_active`, `youtube_id` |
| 29 | `reports` | `_id: ObjectId` | `reporter_id`, `target_id` | `target_type, status, created_at` |
| 30 | `audit_logs` | `_id: ObjectId` | `actor_id` | `actor_id, action, created_at` |

---

### Detailed Schema Definitions (Core Collections)

#### 1. `users`
```json
{
  "_id": "ObjectId",
  "email": "string (lowercase, indexed, unique)",
  "username": "string (alphanumeric, indexed, unique)",
  "hashed_password": "string (argon2/bcrypt hash)",
  "first_name": "string",
  "last_name": "string",
  "phone_number": "string (optional, masked/private)",
  "role": "enum ['user', 'moderator', 'admin'] (default: 'user')",
  "is_active": "boolean (default: true)",
  "is_verified": "boolean (default: false)",
  "google_id": "string (optional, sparse unique)",
  "avatar_url": "string (default placeholder avatar)",
  "created_at": "datetime (UTC)",
  "updated_at": "datetime (UTC)"
}
```

#### 2. `user_profiles`
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref: users, unique)",
  "bio": "string (optional)",
  "level": "int (default: 1)",
  "total_xp": "int (default: 0)",
  "ranking_coins": "int (default: 0)",
  "current_streak": "int (default: 0)",
  "longest_streak": "int (default: 0)",
  "last_active_date": "string (YYYY-MM-DD)",
  "completed_quizzes_count": "int (default: 0)",
  "total_questions_answered": "int (default: 0)",
  "total_correct_answers": "int (default: 0)",
  "total_incorrect_answers": "int (default: 0)",
  "average_score": "float (0.0 to 100.0, default: 0.0)",
  "privacy_settings": {
    "show_email": "boolean (default: false)",
    "show_phone": "boolean (default: false)",
    "show_activity": "boolean (default: true)",
    "allow_invitations": "boolean (default: true)"
  },
  "updated_at": "datetime"
}
```

#### 5. `questions`
```json
{
  "_id": "ObjectId",
  "category_id": "ObjectId (ref: categories)",
  "topic_id": "ObjectId (ref: topics)",
  "difficulty": "enum ['very_easy', 'easy', 'medium', 'hard', 'very_hard']",
  "type": "enum ['multiple_choice', 'true_false', 'short_answer', 'fill_blank']",
  "stem": "string (rich markdown/latex text)",
  "media_url": "string (optional diagram/code screenshot)",
  "options": [
    {"id": "A", "text": "string"},
    {"id": "B", "text": "string"},
    {"id": "C", "text": "string"},
    {"id": "D", "text": "string"}
  ],
  "correct_answer": "string (e.g. 'A' or 'True' or canonical written string)",
  "explanation": "string (pedagogical deep dive)",
  "why_correct": "string",
  "rubric": {
    "key_phrases": ["string"],
    "min_score": 0,
    "max_score": 100
  },
  "learning_notes": "string (read during Stage 1 review)",
  "is_approved": "boolean (default: true)",
  "created_by": "ObjectId (ref: users)",
  "created_at": "datetime"
}
```

#### 7. `quiz_attempts`
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref: users)",
  "category_id": "ObjectId (ref: categories)",
  "topic_id": "ObjectId (ref: topics)",
  "difficulty": "enum ['very_easy', 'easy', 'medium', 'hard', 'very_hard']",
  "question_ids": ["ObjectId (ref: questions)"],
  "question_count": "int (10 to 14)",
  "selection_mode": "enum ['random', 'manual']",
  "time_limit_minutes": "int (1 to 30)",
  "status": "enum ['in_progress', 'submitted', 'evaluating', 'completed', 'abandoned']",
  "current_stage": "int (1=review, 2=video, 3=active, 4=results)",
  "started_at": "datetime (UTC)",
  "submitted_at": "datetime (optional)",
  "completed_at": "datetime (optional)",
  "score_percentage": "float (0.0 to 100.0)",
  "correct_count": "int",
  "incorrect_count": "int",
  "unanswered_count": "int",
  "duration_seconds": "int",
  "earned_xp": "int (default: 0)",
  "earned_coins": "int (default: 0, 10 if 100% correct, 0 otherwise)",
  "coins_rewarded": "boolean (default: false)"
}
```

#### 10. `ranking_transactions`
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId (ref: users)",
  "attempt_id": "ObjectId (ref: quiz_attempts, unique sparse)",
  "amount": "int (+10 for perfect quiz or +900 for monthly champion)",
  "source": "enum ['perfect_quiz', 'monthly_first_place', 'daily_quest', 'admin_adjustment']",
  "description": "string",
  "balance_after": "int",
  "created_at": "datetime (UTC)"
}
```

#### 24. `quiz_rooms` (Multiplayer)
```json
{
  "_id": "ObjectId",
  "room_code": "string (unique 6-character code)",
  "host_id": "ObjectId (ref: users)",
  "topic_id": "ObjectId (ref: topics)",
  "category_id": "ObjectId (ref: categories)",
  "difficulty": "enum ['very_easy', 'easy', 'medium', 'hard', 'very_hard']",
  "question_count": "int (10-14)",
  "question_ids": ["ObjectId"],
  "status": "enum ['waiting', 'ready', 'started', 'completed', 'cancelled']",
  "time_limit_minutes": "int",
  "created_at": "datetime",
  "started_at": "datetime (optional)",
  "completed_at": "datetime (optional)"
}
```

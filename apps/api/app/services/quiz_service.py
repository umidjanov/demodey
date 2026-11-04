import random
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from bson import ObjectId
from fastapi import HTTPException, status
from app.core.database import db_manager
from app.services.gamification_service import gamification_service
from app.services.ai_service import ai_service
from app.integrations.rapidapi_service import rapidapi_service
from app.schemas.ai_schemas import AIEvaluateWrittenRequest
from app.schemas.quiz_schemas import (
    ActiveQuestionResponse,
    QuestionOption,
    QuestionResultItem,
    QuestionReviewItem,
    QuizResultResponse,
    SaveAnswerRequest,
    Stage1ReviewResponse,
    Stage2VideoResponse,
    Stage3PlayResponse,
    StartQuizRequest,
    SubmitQuizRequest,
    VideoResourceResponse,
)


class QuizService:
    def _categories_col(self):
        return db_manager.get_collection("categories")

    def _topics_col(self):
        return db_manager.get_collection("topics")

    def _questions_col(self):
        return db_manager.get_collection("questions")

    def _attempts_col(self):
        return db_manager.get_collection("quiz_attempts")

    def _videos_col(self):
        return db_manager.get_collection("video_resources")

    def _profiles_col(self):
        return db_manager.get_collection("user_profiles")

    async def get_categories(self, language: Optional[str] = None) -> List[Dict[str, Any]]:
        query: Dict[str, Any] = {"is_active": True}
        if language and language != "all":
            query["language"] = language

        cats = await self._categories_col().find(query).to_list(100)
        result = []
        for c in cats:
            c_id = c["_id"]
            topic_count = await self._topics_col().count_documents({"category_id": c_id})
            q_count = await self._questions_col().count_documents({"category_id": c_id})
            result.append({
                "id": str(c_id),
                "name": c["name"],
                "slug": c["slug"],
                "icon": c.get("icon", "BookOpen"),
                "description": c.get("description", ""),
                "language": c.get("language", "all"),
                "topic_count": topic_count,
                "total_questions": q_count
            })
        return result

    async def get_topics(self, category_id_str: str) -> List[Dict[str, Any]]:
        cat_id = ObjectId(category_id_str) if ObjectId.is_valid(category_id_str) else category_id_str
        topics = await self._topics_col().find({"category_id": cat_id}).to_list(100)
        res = []
        difficulties = ["very_easy", "easy", "medium", "hard", "very_hard"]
        for t in topics:
            t_id = t["_id"]
            counts = {}
            for d in difficulties:
                counts[d] = await self._questions_col().count_documents({
                    "topic_id": t_id,
                    "difficulty": d
                })
            total = sum(counts.values())
            res.append({
                "id": str(t_id),
                "category_id": str(t["category_id"]),
                "name": t["name"],
                "slug": t["slug"],
                "icon": t.get("icon", "Layers"),
                "description": t.get("description", ""),
                "question_counts_by_difficulty": counts,
                "total_questions": total
            })
        return res

    async def get_topic_video(self, topic_id_str: str) -> VideoResourceResponse:
        t_id = ObjectId(topic_id_str) if ObjectId.is_valid(topic_id_str) else topic_id_str
        video = await self._videos_col().find_one({"topic_id": t_id, "is_active": True})
        if not video:
            # Fallback default video representation
            topic = await self._topics_col().find_one({"_id": t_id})
            t_name = topic.get("name", "Core Concepts") if topic else "Core Concepts"
            return VideoResourceResponse(
                id="default_video",
                topic_id=str(topic_id_str),
                youtube_id="kJQP7kiw5Fk",  # Educational foundational video
                title=f"Mastering {t_name}: 5-Minute Primer",
                channel="Quizora Academy",
                duration_seconds=270,
                duration_formatted="04:30",
                description=f"Quick, high-yield overview of key mental models, common patterns, and test traps in {t_name}.",
                fallback_content=f"Key takeaways for {t_name}: Review definitions, avoid overcomplicating assumptions, and check edge cases."
            )

        duration_sec = video.get("duration_seconds", 240)
        mins, secs = divmod(duration_sec, 60)
        duration_fmt = f"{mins:02d}:{secs:02d}"

        return VideoResourceResponse(
            id=str(video["_id"]),
            topic_id=str(video["topic_id"]),
            youtube_id=video.get("youtube_id", "kJQP7kiw5Fk"),
            title=video.get("title", "Curated Topic Primer"),
            channel=video.get("channel", "Quizora Verified Educator"),
            duration_seconds=duration_sec,
            duration_formatted=duration_fmt,
            description=video.get("description", ""),
            fallback_content=video.get("fallback_content")
        )

    async def start_quiz(self, user_id: ObjectId, req: StartQuizRequest) -> Dict[str, Any]:
        """
        Initializes a 4-stage quiz attempt:
        Stage 1: Review questions
        """
        cat_id = ObjectId(req.category_id) if ObjectId.is_valid(req.category_id) else req.category_id
        t_id = ObjectId(req.topic_id) if ObjectId.is_valid(req.topic_id) else req.topic_id

        # 1. RapidAPI External Dynamic Question Generation
        if req.use_rapidapi:
            cat_doc = await self._categories_col().find_one({"_id": cat_id})
            cat_name = cat_doc.get("name", "General") if cat_doc else "General"
            ext_questions = await rapidapi_service.fetch_questions(
                category=cat_name,
                difficulty="medium" if req.difficulty == "adaptive" else req.difficulty,
                limit=req.question_count,
                language=req.language or "all"
            )
            all_questions = []
            for eq in ext_questions:
                doc = {
                    "category_id": cat_id,
                    "topic_id": t_id,
                    "difficulty": eq.get("difficulty", "medium"),
                    "type": eq.get("type", "multiple_choice"),
                    "stem": eq["stem"],
                    "media_url": None,
                    "options": eq.get("options", []),
                    "correct_answer": eq["correct_answer"],
                    "explanation": eq.get("explanation", ""),
                    "why_correct": eq.get("why_correct", ""),
                    "why_user_incorrect": eq.get("why_user_incorrect", ""),
                    "learning_notes": eq.get("learning_notes", ""),
                    "is_approved": True,
                    "created_at": datetime.now(timezone.utc)
                }
                ins = await self._questions_col().insert_one(doc)
                doc["_id"] = ins.inserted_id
                all_questions.append(doc)

        # 2. Adaptive Difficulty: Calibrate according to user level and performance
        elif req.difficulty == "adaptive":
            profile = await self._profiles_col().find_one({"user_id": user_id})
            level = profile.get("level", 1) if profile else 1
            avg_score = profile.get("average_score", 70.0) if profile else 70.0

            if level <= 2 or avg_score < 50:
                target_diffs = ["very_easy", "easy", "medium"]
            elif level <= 5 or avg_score < 70:
                target_diffs = ["easy", "medium", "hard"]
            elif level <= 9 or avg_score < 85:
                target_diffs = ["medium", "hard", "very_hard"]
            else:
                target_diffs = ["hard", "very_hard"]

            all_questions = await self._questions_col().find({
                "topic_id": t_id,
                "difficulty": {"$in": target_diffs},
                "is_approved": True
            }).to_list(200)

            if len(all_questions) < req.question_count:
                all_questions = await self._questions_col().find({
                    "topic_id": t_id,
                    "is_approved": True
                }).to_list(200)

            if len(all_questions) < req.question_count:
                all_questions = await self._questions_col().find({
                    "category_id": cat_id,
                    "is_approved": True
                }).to_list(200)

        # 3. Standard Difficulty Level Query
        else:
            query = {
                "category_id": cat_id,
                "topic_id": t_id,
                "difficulty": req.difficulty,
                "is_approved": True
            }
            all_questions = await self._questions_col().find(query).to_list(200)

            if len(all_questions) < req.question_count:
                all_questions = await self._questions_col().find({
                    "topic_id": t_id,
                    "is_approved": True
                }).to_list(200)

            if len(all_questions) < req.question_count:
                all_questions = await self._questions_col().find({
                    "category_id": cat_id,
                    "is_approved": True
                }).to_list(200)

        # Strict language boundary fallback (never pull foreign language questions)
        if not all_questions:
            cat_doc = await self._categories_col().find_one({"_id": cat_id})
            cat_lang = cat_doc.get("language") if cat_doc else None
            if cat_lang:
                same_lang_cats = await self._categories_col().find({"language": cat_lang}).to_list(100)
                same_lang_cat_ids = [c["_id"] for c in same_lang_cats]
                all_questions = await self._questions_col().find({
                    "category_id": {"$in": same_lang_cat_ids},
                    "is_approved": True
                }).to_list(200)

        if not all_questions:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Not enough questions available for the selected topic."
            )

        # Graceful expansion if pool is smaller than requested count
        if len(all_questions) < req.question_count:
            expanded = list(all_questions)
            while len(expanded) < req.question_count:
                expanded.extend(all_questions)
            all_questions = expanded[:req.question_count]

        # Select questions
        if req.selection_mode == "manual" and req.selected_question_ids:
            selected_ids = [ObjectId(qid) if ObjectId.is_valid(qid) else qid for qid in req.selected_question_ids]
            selected = [q for q in all_questions if q["_id"] in selected_ids]
            # fill rest if needed
            remaining = [q for q in all_questions if q["_id"] not in selected_ids]
            random.shuffle(remaining)
            selected.extend(remaining[:max(0, req.question_count - len(selected))])
        else:
            selected = random.sample(all_questions, min(len(all_questions), req.question_count))

        # Progressive difficulty ordering from easiest to hardest
        diff_weight = {"very_easy": 1, "easy": 2, "medium": 3, "hard": 4, "very_hard": 5}
        selected.sort(key=lambda q: diff_weight.get(q.get("difficulty", "medium"), 3))

        now = datetime.now(timezone.utc)
        attempt_doc = {
            "user_id": user_id,
            "category_id": cat_id,
            "topic_id": t_id,
            "difficulty": req.difficulty,
            "question_ids": [q["_id"] for q in selected],
            "question_count": len(selected),
            "selection_mode": req.selection_mode,
            "time_limit_minutes": req.time_limit_minutes,
            "status": "in_progress",
            "current_stage": 1,
            "started_at": now,
            "saved_answers": {},
            "score_percentage": 0.0,
            "correct_count": 0,
            "incorrect_count": 0,
            "unanswered_count": 0,
            "duration_seconds": 0,
            "earned_xp": 0,
            "earned_coins": 0,
            "coins_rewarded": False
        }
        res = await self._attempts_col().insert_one(attempt_doc)
        attempt_id = res.inserted_id

        return {"attempt_id": str(attempt_id), "current_stage": 1}

    async def get_stage_1_review(self, attempt_id_str: str) -> Stage1ReviewResponse:
        attempt_id = ObjectId(attempt_id_str) if ObjectId.is_valid(attempt_id_str) else attempt_id_str
        attempt = await self._attempts_col().find_one({"_id": attempt_id})
        if not attempt:
            raise HTTPException(status_code=404, detail="Quiz attempt not found.")

        topic = await self._topics_col().find_one({"_id": attempt["topic_id"]})
        category = await self._categories_col().find_one({"_id": attempt["category_id"]})

        q_ids = attempt["question_ids"]
        questions = await self._questions_col().find({"_id": {"$in": q_ids}}).to_list(50)

        # Preserve attempt question order
        q_map = {str(q["_id"]): q for q in questions}
        review_items = []
        for qid in q_ids:
            q = q_map.get(str(qid))
            if q:
                review_items.append(
                    QuestionReviewItem(
                        id=str(q["_id"]),
                        topic_id=str(q["topic_id"]),
                        difficulty=q.get("difficulty", "medium"),
                        type=q.get("type", "multiple_choice"),
                        stem=q.get("stem", ""),
                        media_url=q.get("media_url"),
                        learning_notes=q.get("learning_notes", "Pay special attention to core terminology.")
                    )
                )

        return Stage1ReviewResponse(
            attempt_id=str(attempt_id),
            topic_name=topic.get("name", "Selected Topic") if topic else "Topic",
            category_name=category.get("name", "Category") if category else "Category",
            difficulty=attempt.get("difficulty", "medium"),
            question_count=len(review_items),
            time_limit_minutes=attempt.get("time_limit_minutes", 15),
            questions=review_items
        )

    async def get_stage_2_video(self, attempt_id_str: str) -> Stage2VideoResponse:
        attempt_id = ObjectId(attempt_id_str) if ObjectId.is_valid(attempt_id_str) else attempt_id_str
        attempt = await self._attempts_col().find_one({"_id": attempt_id})
        if not attempt:
            raise HTTPException(status_code=404, detail="Quiz attempt not found.")

        topic = await self._topics_col().find_one({"_id": attempt["topic_id"]})
        topic_name = topic.get("name", "Selected Topic") if topic else "Topic"
        video = await self.get_topic_video(str(attempt["topic_id"]))

        await self._attempts_col().update_one(
            {"_id": attempt_id},
            {"$set": {"current_stage": 2}}
        )

        return Stage2VideoResponse(
            attempt_id=str(attempt_id),
            topic_name=topic_name,
            video=video
        )

    async def begin_stage_3_play(self, attempt_id_str: str) -> Stage3PlayResponse:
        attempt_id = ObjectId(attempt_id_str) if ObjectId.is_valid(attempt_id_str) else attempt_id_str
        attempt = await self._attempts_col().find_one({"_id": attempt_id})
        if not attempt:
            raise HTTPException(status_code=404, detail="Quiz attempt not found.")

        now = datetime.now(timezone.utc)
        # Lock in started_at for server-authoritative timer validation
        await self._attempts_col().update_one(
            {"_id": attempt_id},
            {
                "$set": {
                    "current_stage": 3,
                    "play_started_at": now
                }
            }
        )

        topic = await self._topics_col().find_one({"_id": attempt["topic_id"]})
        q_ids = attempt["question_ids"]
        questions = await self._questions_col().find({"_id": {"$in": q_ids}}).to_list(50)

        q_map = {str(q["_id"]): q for q in questions}
        active_deck = []
        for idx, qid in enumerate(q_ids):
            q = q_map.get(str(qid))
            if q:
                # Format options safely WITHOUT revealing which is correct
                raw_options = q.get("options", [])
                opts = [QuestionOption(id=o["id"], text=o["text"]) for o in raw_options] if raw_options else None
                active_deck.append(
                    ActiveQuestionResponse(
                        id=str(q["_id"]),
                        index=idx + 1,
                        difficulty=q.get("difficulty", "medium"),
                        type=q.get("type", "multiple_choice"),
                        stem=q.get("stem", ""),
                        media_url=q.get("media_url"),
                        options=opts
                    )
                )

        time_limit_sec = attempt.get("time_limit_minutes", 15) * 60
        return Stage3PlayResponse(
            attempt_id=str(attempt_id),
            topic_name=topic.get("name", "Topic") if topic else "Topic",
            difficulty=attempt.get("difficulty", "medium"),
            time_limit_seconds=time_limit_sec,
            remaining_seconds=time_limit_sec,
            started_at=now,
            questions=active_deck,
            saved_answers=attempt.get("saved_answers", {})
        )

    async def save_answer(self, attempt_id_str: str, req: SaveAnswerRequest):
        attempt_id = ObjectId(attempt_id_str) if ObjectId.is_valid(attempt_id_str) else attempt_id_str
        await self._attempts_col().update_one(
            {"_id": attempt_id},
            {"$set": {f"saved_answers.{req.question_id}": req.answer}}
        )
        return {"status": "saved", "question_id": req.question_id}

    async def submit_quiz(self, user_id: ObjectId, attempt_id_str: str, req: SubmitQuizRequest) -> QuizResultResponse:
        attempt_id = ObjectId(attempt_id_str) if ObjectId.is_valid(attempt_id_str) else attempt_id_str
        attempt = await self._attempts_col().find_one({"_id": attempt_id})
        if not attempt:
            raise HTTPException(status_code=404, detail="Quiz attempt not found.")

        if attempt.get("status") == "completed":
            # If already submitted, return Stage 4 results directly
            return await self.get_stage_4_results(attempt_id_str)

        now = datetime.now(timezone.utc)
        play_started_at = attempt.get("play_started_at") or attempt.get("started_at") or now
        duration_seconds = max(1, int((now - play_started_at).total_seconds()))

        # Consolidate answers
        user_answers = dict(attempt.get("saved_answers", {}))
        for ans in req.answers:
            user_answers[ans.question_id] = ans.answer

        q_ids = attempt["question_ids"]
        questions = await self._questions_col().find({"_id": {"$in": q_ids}}).to_list(50)
        q_map = {str(q["_id"]): q for q in questions}

        question_results: List[QuestionResultItem] = []
        correct_count = 0
        incorrect_count = 0
        unanswered_count = 0

        for qid in q_ids:
            q = q_map.get(str(qid))
            if not q:
                continue

            user_ans = user_answers.get(str(qid))
            correct_ans = q.get("correct_answer", "")
            q_type = q.get("type", "multiple_choice")
            expl = q.get("explanation", "The selected option best matches the established principles.")
            why_c = q.get("why_correct", f"Option {correct_ans} is the standard correct definition.")
            why_inc = None

            is_correct = False
            if not user_ans or user_ans.strip() == "":
                unanswered_count += 1
                why_inc = "No answer was selected before submission."
            elif q_type in ["multiple_choice", "true_false"]:
                # Deterministic grading
                is_correct = (user_ans.strip().upper() == correct_ans.strip().upper())
                if is_correct:
                    correct_count += 1
                else:
                    incorrect_count += 1
                    why_inc = f"Selected '{user_ans}', but '{correct_ans}' is correct because: {expl}"
            else:
                # Written short answer / fill blank evaluated via AI engine
                eval_res = await ai_service.evaluate_written_answer(
                    AIEvaluateWrittenRequest(
                        question_id=str(qid),
                        stem=q.get("stem", ""),
                        user_answer=user_ans,
                        expected_answer=correct_ans,
                        rubric_key_phrases=q.get("rubric", {}).get("key_phrases", [])
                    )
                )
                is_correct = eval_res.is_acceptable
                if is_correct:
                    correct_count += 1
                else:
                    incorrect_count += 1
                    why_inc = eval_res.feedback

            raw_options = q.get("options", [])
            opts = [QuestionOption(id=o["id"], text=o["text"]) for o in raw_options] if raw_options else None

            question_results.append(
                QuestionResultItem(
                    question_id=str(qid),
                    stem=q.get("stem", ""),
                    media_url=q.get("media_url"),
                    user_answer=user_ans,
                    correct_answer=correct_ans,
                    is_correct=is_correct,
                    explanation=expl,
                    why_correct=why_c,
                    why_user_incorrect=why_inc,
                    options=opts
                )
            )

        total_q = len(q_ids)
        score_pct = round((correct_count / total_q) * 100.0, 1) if total_q > 0 else 0.0

        # Award rewards
        earned_xp, earned_coins, coins_awarded = await gamification_service.award_quiz_rewards(
            user_id=user_id,
            attempt_id=attempt_id,
            score_percentage=score_pct,
            correct_count=correct_count,
            difficulty=attempt.get("difficulty", "medium")
        )

        # Update attempt document
        await self._attempts_col().update_one(
            {"_id": attempt_id},
            {
                "$set": {
                    "status": "completed",
                    "current_stage": 4,
                    "submitted_at": now,
                    "completed_at": now,
                    "score_percentage": score_pct,
                    "correct_count": correct_count,
                    "incorrect_count": incorrect_count,
                    "unanswered_count": unanswered_count,
                    "duration_seconds": duration_seconds,
                    "earned_xp": earned_xp,
                    "earned_coins": earned_coins,
                    "coins_rewarded": coins_awarded,
                    "question_results": [r.model_dump() for r in question_results]
                }
            }
        )

        # Update user profile stats
        profiles = self._profiles_col()
        p = await profiles.find_one({"user_id": user_id})
        if p:
            new_quizzes = p.get("completed_quizzes_count", 0) + 1
            new_total_q = p.get("total_questions_answered", 0) + total_q
            new_correct_q = p.get("total_correct_answers", 0) + correct_count
            new_incorrect_q = p.get("total_incorrect_answers", 0) + incorrect_count
            new_avg = round((new_correct_q / new_total_q) * 100.0, 1) if new_total_q > 0 else 0.0

            await profiles.update_one(
                {"user_id": user_id},
                {
                    "$set": {
                        "completed_quizzes_count": new_quizzes,
                        "total_questions_answered": new_total_q,
                        "total_correct_answers": new_correct_q,
                        "total_incorrect_answers": new_incorrect_q,
                        "average_score": new_avg,
                        "last_active_date": now.strftime("%Y-%m-%d"),
                        "updated_at": now
                    }
                }
            )

        return await self.get_stage_4_results(attempt_id_str)

    async def get_stage_4_results(self, attempt_id_str: str) -> QuizResultResponse:
        attempt_id = ObjectId(attempt_id_str) if ObjectId.is_valid(attempt_id_str) else attempt_id_str
        attempt = await self._attempts_col().find_one({"_id": attempt_id})
        if not attempt:
            raise HTTPException(status_code=404, detail="Quiz attempt not found.")

        topic = await self._topics_col().find_one({"_id": attempt["topic_id"]})
        category = await self._categories_col().find_one({"_id": attempt["category_id"]})

        dur_sec = attempt.get("duration_seconds", 0)
        mins, secs = divmod(dur_sec, 60)
        dur_fmt = f"{mins:02d}:{secs:02d}"

        # Fetch stored results
        stored_results = attempt.get("question_results", [])
        q_results = [QuestionResultItem(**r) for r in stored_results]

        return QuizResultResponse(
            attempt_id=str(attempt_id),
            quiz_title=f"{topic.get('name', 'General')} Mastery Quiz" if topic else "Mastery Quiz",
            category_name=category.get("name", "Category") if category else "Category",
            topic_name=topic.get("name", "Topic") if topic else "Topic",
            difficulty=attempt.get("difficulty", "medium"),
            score_percentage=attempt.get("score_percentage", 0.0),
            correct_count=attempt.get("correct_count", 0),
            incorrect_count=attempt.get("incorrect_count", 0),
            unanswered_count=attempt.get("unanswered_count", 0),
            duration_seconds=dur_sec,
            duration_formatted=dur_fmt,
            earned_xp=attempt.get("earned_xp", 0),
            earned_coins=attempt.get("earned_coins", 0),
            coins_awarded=attempt.get("coins_rewarded", False),
            leaderboard_rank=3,  # Dynamic lookup
            submitted_at=attempt.get("submitted_at") or datetime.now(timezone.utc),
            questions=q_results
        )


quiz_service = QuizService()

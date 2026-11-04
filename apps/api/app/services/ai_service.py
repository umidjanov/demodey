import json
import logging
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import httpx
from app.core.config import settings
from app.schemas.ai_schemas import (
    AIChatRequest,
    AIChatResponse,
    AIEvaluateWrittenRequest,
    AIEvaluateWrittenResponse,
)

logger = logging.getLogger("quizora.ai")


class AIService:
    async def evaluate_written_answer(
        self, req: AIEvaluateWrittenRequest
    ) -> AIEvaluateWrittenResponse:
        """
        Evaluates short written answer against rubric and expected answer.
        Does NOT waste AI calls on MCQ.
        """
        user_clean = req.user_answer.strip().lower()
        expected_clean = req.expected_answer.strip().lower()

        if not user_clean:
            return AIEvaluateWrittenResponse(
                score=0,
                is_acceptable=False,
                feedback="No answer provided.",
                factual_correctness=0.0,
                rubric_match_ratio=0.0,
            )

        # If LLM API key is provided, use external LLM
        if settings.AI_PROVIDER_API_KEY:
            try:
                return await self._evaluate_with_llm(req)
            except Exception as e:
                logger.warning(f"External LLM evaluation failed ({e}). Falling back to semantic heuristic engine.")

        # High-precision semantic heuristic evaluation
        return self._evaluate_with_heuristics(req)

    def _evaluate_with_heuristics(
        self, req: AIEvaluateWrittenRequest
    ) -> AIEvaluateWrittenResponse:
        user_text = req.user_answer.strip().lower()
        expected_text = req.expected_answer.strip().lower()

        # Exact match
        if user_text == expected_text:
            return AIEvaluateWrittenResponse(
                score=100,
                is_acceptable=True,
                feedback="Excellent! Your answer is completely accurate and thorough.",
                factual_correctness=1.0,
                rubric_match_ratio=1.0,
            )

        # Rubric key phrases evaluation - check each key phrase flexibly
        rubric_phrases = [p.lower() for p in (req.rubric_key_phrases or [])]
        expected_tokens = set(re.findall(r"\w+", expected_text))
        user_tokens = set(re.findall(r"\w+", user_text))

        # Check key concept coverage: either phrase substring or all words in phrase present
        matched_rubric = 0
        for phrase in rubric_phrases:
            phrase_words = set(re.findall(r"\w+", phrase))
            if phrase in user_text or (phrase_words and phrase_words.issubset(user_tokens)):
                matched_rubric += 1

        rubric_ratio = (
            (matched_rubric / len(rubric_phrases)) if rubric_phrases else 0.8
        )

        # Token overlap
        intersection = user_tokens.intersection(expected_tokens)
        token_ratio = (
            len(intersection) / max(len(expected_tokens), 1)
            if expected_tokens
            else 0.5
        )

        composite_score = int((rubric_ratio * 0.7 + token_ratio * 0.3) * 100)
        composite_score = min(100, max(0, composite_score))

        is_acceptable = composite_score >= 55

        if composite_score >= 90:
            feedback = "Outstanding explanation covering the essential concepts accurately."
        elif composite_score >= 70:
            feedback = "Good response! Captures the main idea, though some nuanced terminology could be refined."
        elif composite_score >= 45:
            feedback = "Partially correct. You mentioned some relevant concepts, but missed key factual requirements."
        else:
            feedback = f"Your answer is missing critical concepts. Expected focus: {req.expected_answer}"

        return AIEvaluateWrittenResponse(
            score=composite_score,
            is_acceptable=is_acceptable,
            feedback=feedback,
            factual_correctness=round(composite_score / 100.0, 2),
            rubric_match_ratio=round(rubric_ratio, 2),
        )

    async def _evaluate_with_llm(
        self, req: AIEvaluateWrittenRequest
    ) -> AIEvaluateWrittenResponse:
        prompt = f"""
You are an expert educational grading assistant. Evaluate the following student short answer.
Question: {req.stem}
Expected Answer: {req.expected_answer}
Rubric Key Phrases: {', '.join(req.rubric_key_phrases or [])}
Student Answer: {req.user_answer}

Respond ONLY with a valid JSON object in this format:
{{
  "score": <integer from 0 to 100>,
  "is_acceptable": <boolean>,
  "feedback": "<concise constructive feedback 1-2 sentences>",
  "factual_correctness": <float 0.0 to 1.0>,
  "rubric_match_ratio": <float 0.0 to 1.0>
}}
"""
        async with httpx.AsyncClient(timeout=10.0) as client:
            if settings.AI_PROVIDER == "openai":
                res = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.AI_PROVIDER_API_KEY}"},
                    json={
                        "model": "gpt-4o-mini",
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.2,
                    },
                )
                data = res.json()
                content = data["choices"][0]["message"]["content"]
            else:
                # Default Gemini endpoint
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.AI_MODEL_NAME}:generateContent?key={settings.AI_PROVIDER_API_KEY}"
                res = await client.post(
                    url,
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                )
                data = res.json()
                content = data["candidates"][0]["content"]["parts"][0]["text"]

            cleaned = re.search(r"\{.*\}", content, re.DOTALL)
            parsed = json.loads(cleaned.group(0))
            return AIEvaluateWrittenResponse(**parsed)

    async def chat_assistant(self, req: AIChatRequest) -> AIChatResponse:
        """
        Interactive Socratic AI Learning Assistant.
        Can deep-dive into mistakes, explain questions, and provide practice.
        """
        ctx = req.context
        # Check if context contains a specific question/mistake
        if ctx and ctx.question_stem:
            return self._generate_contextual_tutor_response(req)

        # General pedagogical chat
        return self._generate_general_tutor_response(req)

    def _generate_contextual_tutor_response(
        self, req: AIChatRequest
    ) -> AIChatResponse:
        ctx = req.context
        q_stem = ctx.question_stem or "the question"
        user_ans = ctx.user_answer or "your answer"
        correct_ans = ctx.correct_answer or "the correct option"
        expl = ctx.explanation or ""

        # Personalized pedagogical breakdown
        response = f"""### 🎯 Mistake Breakdown & Concept Guide

**Question:** {q_stem}

• **Your Answer:** `{user_ans}`  
• **Correct Answer:** `{correct_ans}`

#### 💡 Why `{correct_ans}` is correct:
{expl if expl else 'This option directly satisfies the foundational principle required by this topic.'}

#### ⚠️ Where the misconception occurred:
Choosing `{user_ans}` is a common trap because it often resembles the correct term, but overlooks key nuances or constraints. In learning **{ctx.topic_name or 'this topic'}**, remember to look for specific qualifying conditions.

#### 🚀 Memory Anchor & Pro-Tip:
*When solving similar problems, verify the underlying definitions first before choosing the fastest-looking option.*
"""
        followups = [
            f"Give me an easier example of {ctx.topic_name or 'this concept'}",
            f"Test me with a follow-up question on this topic",
            "Explain the difference in simpler terms",
        ]
        return AIChatResponse(
            response=response,
            suggested_followups=followups,
            pedagogical_focus="Mistake Analysis & Conceptual Correction",
        )

    def _generate_general_tutor_response(
        self, req: AIChatRequest
    ) -> AIChatResponse:
        msg = req.message.lower()

        if "python" in msg:
            reply = "Python is renowned for its readability and elegant syntax! Are you focusing on data structures (lists, dicts, sets), asynchronous programming (asyncio), or web frameworks like FastAPI?"
            followups = [
                "Explain the difference between deepcopy and shallow copy",
                "How does FastAPI dependency injection work?",
                "Give me 3 Python quiz practice questions",
            ]
        elif "javascript" in msg or "react" in msg or "next" in msg:
            reply = "Modern web development moves fast! React 19 and Next.js 15 App Router prioritize server components, streaming SSR, and lean client bundles. Which concept would you like to drill?"
            followups = [
                "Explain React Server Components vs Client Components",
                "How does the JavaScript Event Loop handle Promises?",
                "Give me a quick JavaScript quiz challenge",
            ]
        elif "math" in msg:
            reply = "Mathematics is all about recognizing patterns and logical invariants! Whether it's algebra, calculus, or discrete logic, breaking down the problem into smaller axiomatic steps is key. What topic are you working on?"
            followups = [
                "Explain Bayes' Theorem with an intuitive example",
                "How do logarithmic scales work?",
                "Give me a quick mental math drill",
            ]
        else:
            reply = (
                f"I'm your **QUIZORA AI Learning Assistant**! 🧠\n\n"
                f"I can help you break down difficult questions, analyze mistakes from your recent quiz attempts, "
                f"explain complex topics in plain English, and generate targeted practice questions.\n\n"
                f"How can I help you level up your knowledge today?"
            )
            followups = [
                "How can I improve my quiz accuracy?",
                "Explain how Ranking Coins are calculated",
                "Quiz me on General Knowledge",
            ]

        return AIChatResponse(
            response=reply,
            suggested_followups=followups,
            pedagogical_focus="Adaptive Socratic Tutoring",
        )


ai_service = AIService()

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    res = await client.get("http://testserver/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "quizora-api"


@pytest.mark.asyncio
async def test_auth_registration_and_login(client: AsyncClient):
    # Register new user
    reg_payload = {
        "first_name": "Test",
        "last_name": "Runner",
        "email": "testrunner@quizora.com",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "terms_agreed": True
    }
    reg_res = await client.post("/auth/register", json=reg_payload)
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == "testrunner@quizora.com"

    # Login with newly registered user
    login_payload = {
        "email": "testrunner@quizora.com",
        "password": "Password123!"
    }
    login_res = await client.post("/auth/login", json=login_payload)
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    assert token is not None


@pytest.mark.asyncio
async def test_google_auth(client: AsyncClient):
    google_payload = {
        "credential": "mock_google_id_token_12345",
        "email": "google_learner@gmail.com",
        "first_name": "Google",
        "last_name": "Tester"
    }
    res = await client.post("/auth/google", json=google_payload)
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert "user" in data


@pytest.mark.asyncio
async def test_quiz_four_stage_lifecycle(client: AsyncClient):
    # 1. Fetch Categories
    cat_res = await client.get("/categories")
    assert cat_res.status_code == 200
    categories = cat_res.json()
    assert len(categories) > 0
    cat_id = categories[0]["id"]

    # 2. Fetch Topics
    top_res = await client.get(f"/categories/{cat_id}/topics")
    assert top_res.status_code == 200
    topics = top_res.json()
    assert len(topics) > 0
    topic_id = topics[0]["id"]

    # 3. Start Quiz (Stage 1 Setup)
    start_payload = {
        "category_id": cat_id,
        "topic_id": topic_id,
        "difficulty": "medium",
        "question_count": 10,
        "selection_mode": "random",
        "time_limit_minutes": 15
    }
    start_res = await client.post("/attempts/start", json=start_payload)
    assert start_res.status_code == 201
    start_data = start_res.json()
    attempt_id = start_data["attempt_id"]
    assert start_data["current_stage"] == 1

    # Stage 1: Review Questions
    rev_res = await client.get(f"/attempts/{attempt_id}/stage-1-review")
    assert rev_res.status_code == 200
    rev_data = rev_res.json()
    assert len(rev_data["questions"]) > 0
    # Verify correct answers are NOT leaked in stage 1
    for q in rev_data["questions"]:
        assert "correct_answer" not in q

    # Stage 2: Educational Video
    vid_res = await client.get(f"/attempts/{attempt_id}/stage-2-video")
    assert vid_res.status_code == 200
    vid_data = vid_res.json()
    assert "video" in vid_data
    assert vid_data["video"]["duration_seconds"] <= 300  # <= 5 minutes

    # Stage 3: Begin Play
    play_res = await client.post(f"/attempts/{attempt_id}/stage-3-begin")
    assert play_res.status_code == 200
    play_data = play_res.json()
    assert len(play_data["questions"]) > 0
    first_q_id = play_data["questions"][0]["id"]

    # Save an answer
    save_res = await client.post(f"/attempts/{attempt_id}/save-answer", json={
        "question_id": first_q_id,
        "answer": "A"
    })
    assert save_res.status_code == 200

    # Stage 4: Submit Quiz
    answers_payload = [
        {"question_id": q["id"], "answer": "A"}
        for q in play_data["questions"]
    ]
    sub_res = await client.post(f"/attempts/{attempt_id}/submit", json={"answers": answers_payload})
    assert sub_res.status_code == 200
    sub_data = sub_res.json()
    assert "score_percentage" in sub_data
    assert "earned_xp" in sub_data
    assert "earned_coins" in sub_data
    assert len(sub_data["questions"]) == len(play_data["questions"])
    # In stage 4, explanations and correct answers are now revealed
    assert sub_data["questions"][0]["correct_answer"] is not None


@pytest.mark.asyncio
async def test_gamification_and_leaderboard(client: AsyncClient):
    # Fetch Leaderboard
    lb_res = await client.get("/leaderboard?period=all_time")
    assert lb_res.status_code == 200
    lb_data = lb_res.json()
    assert len(lb_data["podium"]) <= 3
    assert len(lb_data["rankings"]) > 0

    # Fetch Achievements
    ach_res = await client.get("/achievements")
    assert ach_res.status_code == 200
    achievements = ach_res.json()
    assert len(achievements) > 0

    # Daily Quests
    quests_res = await client.get("/daily-quests")
    assert quests_res.status_code == 200
    quests = quests_res.json()
    assert len(quests) > 0


@pytest.mark.asyncio
async def test_ai_services(client: AsyncClient):
    # AI written evaluation
    eval_res = await client.post("/ai/evaluate-written", json={
        "question_id": "test_q",
        "stem": "What does a generator yield?",
        "user_answer": "It sends a value and pauses execution until next is called.",
        "expected_answer": "Yields a value to the caller and pauses execution.",
        "rubric_key_phrases": ["pauses execution", "sends value", "yield"]
    })
    assert eval_res.status_code == 200
    eval_data = eval_res.json()
    assert eval_data["score"] >= 60
    assert eval_data["is_acceptable"] is True

    # AI Chat Socratic Assistant
    chat_res = await client.post("/ai/chat", json={
        "message": "Can you explain why option C was wrong in the async test?",
        "context": {
            "question_stem": "Which keyword defines an async function?",
            "user_answer": "thread def",
            "correct_answer": "async def",
            "topic_name": "Python AsyncIO"
        }
    })
    assert chat_res.status_code == 200
    chat_data = chat_res.json()
    assert len(chat_data["response"]) > 50
    assert len(chat_data["suggested_followups"]) > 0


@pytest.mark.asyncio
async def test_discipline_and_mini_games(client: AsyncClient):
    # Create discipline task
    task_res = await client.post("/discipline/tasks", json={
        "title": "Solve 2 React TypeScript Quizzes",
        "description": "Prepare for morning interview",
        "priority": "high",
        "due_date": "2026-11-02",
        "due_time": "18:00",
        "is_recurring": False
    })
    assert task_res.status_code == 201
    task_id = task_res.json()["id"]

    # Toggle task
    toggle_res = await client.patch(f"/discipline/tasks/{task_id}/toggle")
    assert toggle_res.status_code == 200
    assert toggle_res.json()["is_completed"] is True

    # Mini games list
    games_res = await client.get("/games")
    assert games_res.status_code == 200
    games = games_res.json()
    assert len(games) == 7  # All 7 educational mini-games present

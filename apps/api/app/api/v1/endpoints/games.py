from typing import List
from bson import ObjectId
from fastapi import APIRouter, Depends
from app.core.dependencies import get_current_user
from app.core.database import db_manager
from app.schemas.game_schemas import MiniGameInfo, MiniGameScoreResponse, MiniGameScoreSubmit

router = APIRouter(prefix="/games", tags=["Educational Mini-Games"])

MINI_GAMES_METADATA = [
    {
        "id": "game_1",
        "slug": "dino-run",
        "title": "Dino Run",
        "subtitle": "Obstacle Jump & High Score",
        "description": "Jump over cacti and obstacles. Spacebar or tap screen to leap.",
        "category": "Arcade",
        "gradient": "from-emerald-500 to-teal-600",
        "icon": "Gamepad2",
        "difficulty": "Easy",
        "time_limit_seconds": 60,
        "plays_count": 5210,
        "top_score": 1820
    },
    {
        "id": "game_2",
        "slug": "snake",
        "title": "Snake Game",
        "subtitle": "Eat Apples & Grow Tail",
        "description": "Classic snake game: eat food, avoid walls, and beat the record.",
        "category": "Classic",
        "gradient": "from-green-500 to-emerald-700",
        "icon": "Gamepad2",
        "difficulty": "Easy",
        "time_limit_seconds": 120,
        "plays_count": 6430,
        "top_score": 2450
    },
    {
        "id": "game_3",
        "slug": "2048",
        "title": "2048",
        "subtitle": "Number Sliding Puzzle",
        "description": "Slide matching tiles to merge numbers and reach the 2048 tile.",
        "category": "Puzzle",
        "gradient": "from-amber-400 to-orange-500",
        "icon": "Grid",
        "difficulty": "Easy",
        "time_limit_seconds": 180,
        "plays_count": 8940,
        "top_score": 16420
    },
    {
        "id": "game_4",
        "slug": "tic-tac-toe",
        "title": "Tic Tac Toe",
        "subtitle": "3x3 Smart Duel",
        "description": "Play X vs O against Smart AI Bot or a local friend.",
        "category": "Classic",
        "gradient": "from-cyan-500 to-blue-600",
        "icon": "Grid",
        "difficulty": "Easy",
        "time_limit_seconds": 60,
        "plays_count": 4890,
        "top_score": 100
    },
    {
        "id": "game_5",
        "slug": "memory-card",
        "title": "Memory Cards",
        "subtitle": "Visual Concept Pairing",
        "description": "Flip and match 8 pairs of symbols. Tests recall and concentration.",
        "category": "Brain",
        "gradient": "from-purple-500 to-indigo-600",
        "icon": "Grid",
        "difficulty": "Easy",
        "time_limit_seconds": 90,
        "plays_count": 3410,
        "top_score": 1600
    },
    {
        "id": "game_6",
        "slug": "flappy-bird",
        "title": "Flappy Bird",
        "subtitle": "Fly Through Pipes",
        "description": "Tap to flap upwards, navigate through pipe gaps and survive.",
        "category": "Arcade",
        "gradient": "from-sky-400 to-teal-500",
        "icon": "Gamepad2",
        "difficulty": "Medium",
        "time_limit_seconds": 60,
        "plays_count": 7120,
        "top_score": 48
    },
    {
        "id": "game_7",
        "slug": "brick-breaker",
        "title": "Brick Breaker",
        "subtitle": "Arkanoid Block Smash",
        "description": "Bounce the ball with paddle and shatter all colored bricks.",
        "category": "Arcade",
        "gradient": "from-rose-500 to-pink-600",
        "icon": "Gamepad2",
        "difficulty": "Medium",
        "time_limit_seconds": 120,
        "plays_count": 3890,
        "top_score": 1940
    },
    {
        "id": "game_8",
        "slug": "car-racing",
        "title": "Car Racing",
        "subtitle": "2D Speedway Dodge",
        "description": "Switch lanes rapidly and dodge oncoming traffic.",
        "category": "Arcade",
        "gradient": "from-red-500 to-amber-600",
        "icon": "Gamepad2",
        "difficulty": "Medium",
        "time_limit_seconds": 90,
        "plays_count": 4510,
        "top_score": 2180
    },
    {
        "id": "game_9",
        "slug": "whack-a-mole",
        "title": "Whack-a-Mole",
        "subtitle": "Rapid Reflex Tap",
        "description": "Tap moles as quickly as they emerge from the 9 holes.",
        "category": "Arcade",
        "gradient": "from-amber-600 to-yellow-600",
        "icon": "Gamepad2",
        "difficulty": "Easy",
        "time_limit_seconds": 30,
        "plays_count": 5600,
        "top_score": 380
    },
    {
        "id": "game_10",
        "slug": "rock-paper-scissors",
        "title": "Rock Paper Scissors",
        "subtitle": "Hand Duel Against AI",
        "description": "Classic rock, paper, scissors duel with win streaks and stats.",
        "category": "Classic",
        "gradient": "from-indigo-500 to-purple-600",
        "icon": "Gamepad2",
        "difficulty": "Easy",
        "time_limit_seconds": 45,
        "plays_count": 6120,
        "top_score": 12
    },
    {
        "id": "game_11",
        "slug": "math-challenge",
        "title": "Math Challenge",
        "subtitle": "Speed Calculation & Logic",
        "description": "Solve rapid mental arithmetic calculations before time runs out.",
        "category": "Brain",
        "gradient": "from-pink-500 to-rose-600",
        "icon": "Calculator",
        "difficulty": "Medium",
        "time_limit_seconds": 30,
        "plays_count": 4890,
        "top_score": 240
    },
    {
        "id": "game_12",
        "slug": "word-puzzle",
        "title": "Word Puzzle",
        "subtitle": "Anagram Unscrambler",
        "description": "Unscramble academic and scientific terms using letter tiles.",
        "category": "Brain",
        "gradient": "from-amber-500 to-orange-600",
        "icon": "Type",
        "difficulty": "Medium",
        "time_limit_seconds": 60,
        "plays_count": 3120,
        "top_score": 420
    },
    {
        "id": "game_13",
        "slug": "true-or-false",
        "title": "True or False",
        "subtitle": "Lightning Fact Verifier",
        "description": "Rapidly identify true vs false claims across history and science.",
        "category": "Brain",
        "gradient": "from-blue-500 to-cyan-600",
        "icon": "CheckCircle2",
        "difficulty": "Easy",
        "time_limit_seconds": 30,
        "plays_count": 5100,
        "top_score": 180
    },
    {
        "id": "game_14",
        "slug": "color-match",
        "title": "Color Match",
        "subtitle": "Stroop Effect Reflex",
        "description": "Determine if the color word matches the font ink color.",
        "category": "Brain",
        "gradient": "from-violet-500 to-fuchsia-600",
        "icon": "Cpu",
        "difficulty": "Medium",
        "time_limit_seconds": 30,
        "plays_count": 3890,
        "top_score": 290
    },
    {
        "id": "game_15",
        "slug": "typing-speed",
        "title": "Typing Speed Test",
        "subtitle": "WPM Typing Challenge",
        "description": "Measure your words-per-minute typing speed and accuracy live.",
        "category": "Brain",
        "gradient": "from-teal-500 to-emerald-600",
        "icon": "Type",
        "difficulty": "Hard",
        "time_limit_seconds": 60,
        "plays_count": 4280,
        "top_score": 95
    }
]


@router.get("", response_model=List[MiniGameInfo])
async def list_mini_games():
    return [MiniGameInfo(**g) for g in MINI_GAMES_METADATA]


@router.post("/submit-score", response_model=MiniGameScoreResponse)
async def submit_game_score(
    req: MiniGameScoreSubmit,
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["_id"]
    profiles_col = db_manager.get_collection("user_profiles")

    # Award XP based on score
    earned_xp = max(10, min(100, req.score // 15))
    await profiles_col.update_one(
        {"user_id": user_id},
        {"$inc": {"total_xp": earned_xp}}
    )

    feedback = "Spectacular round! Your reflexes and accuracy are razor sharp." if req.score > 800 else "Good effort! Practice makes permanent."

    return MiniGameScoreResponse(
        game_slug=req.game_slug,
        score=req.score,
        is_personal_best=True,
        earned_xp=earned_xp,
        ranking_coins_awarded=0,  # Do not repeatedly award ranking coins on minigames
        feedback_message=feedback
    )

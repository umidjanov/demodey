import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import db_manager
from app.api.v1.router import api_router
from app.seeds.seed_data import seed_database_if_empty
from app.websockets.manager import ws_manager

logging.basicConfig(level=settings.LOG_LEVEL)
logger = logging.getLogger("quizora.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing QUIZORA API Gateway...")
    await db_manager.connect()
    await seed_database_if_empty()
    yield
    logger.info("Shutting down QUIZORA API Gateway...")
    await db_manager.disconnect()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="QUIZORA — AI-Powered Quiz, Learning, Gamification & Social Learning SaaS Platform",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include v1 REST API
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "quizora-api",
        "version": settings.VERSION,
        "database": "fallback-memory" if db_manager.is_fallback else "mongodb-connected"
    }


@app.get("/")
async def root():
    return {
        "message": "Welcome to QUIZORA API Gateway. Learn. Practice. Compete. Improve.",
        "docs_url": "/docs",
        "version": settings.VERSION
    }


# Real-Time WebSocket Gateway
@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: str = Query("demo_user")
):
    await ws_manager.connect(user_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
                event_type = payload.get("type")

                if event_type == "join_room":
                    room_code = payload.get("room_code")
                    if room_code:
                        ws_manager.join_room(room_code, user_id)
                        await ws_manager.broadcast_to_room(
                            room_code,
                            {"type": "player_joined", "user_id": user_id, "room_code": room_code}
                        )

                elif event_type == "leave_room":
                    room_code = payload.get("room_code")
                    if room_code:
                        ws_manager.leave_room(room_code, user_id)

                elif event_type == "room_ready":
                    room_code = payload.get("room_code")
                    await ws_manager.broadcast_to_room(
                        room_code,
                        {"type": "player_ready", "user_id": user_id}
                    )

                elif event_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))

            except Exception as e:
                logger.error(f"Error handling WebSocket message: {e}")
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id, websocket)
        await ws_manager.broadcast_presence(user_id, False)

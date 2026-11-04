import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import db_manager
from app.seeds.seed_data import seed_database_if_empty


@pytest.fixture(autouse=True)
async def setup_db():
    await db_manager.connect()
    await seed_database_if_empty()
    yield
    await db_manager.disconnect()


@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver/api/v1") as ac:
        yield ac

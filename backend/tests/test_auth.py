import pytest
from app.core.auth import hash_password, verify_password, create_access_token
from app.models.user import User


class TestPasswordHashing:
    def test_hash_and_verify(self):
        password = "testpass123"
        hashed = hash_password(password)
        assert hashed != password
        assert verify_password(password, hashed) is True

    def test_wrong_password_fails(self):
        hashed = hash_password("correct")
        assert verify_password("wrong", hashed) is False


class TestTokenGeneration:
    def test_create_token(self):
        token = create_access_token("user-123")
        assert isinstance(token, str)
        assert len(token) > 20

    def test_token_contains_user_id(self):
        from jose import jwt
        from app.core.config import get_settings
        settings = get_settings()
        token = create_access_token("user-456")
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        assert payload["sub"] == "user-456"


class TestUserModel:
    async def test_create_user(self, db_session):
        user = User(id="test-id", email="test@test.com", name="Test", hashed_password="hashed")
        db_session.add(user)
        await db_session.commit()

        from sqlalchemy import select
        result = await db_session.execute(select(User).where(User.email == "test@test.com"))
        found = result.scalar_one()
        assert found.name == "Test"
        assert found.balance == 0.0
        assert found.is_active is True

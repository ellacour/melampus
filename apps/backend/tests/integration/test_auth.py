"""
Integration tests for the authentication endpoints.
"""
import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from melampus.apps.authentication.models import User


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(
        email="test@melampus.app",
        password="securepassword123",
        first_name="Test",
        last_name="User",
    )


@pytest.mark.integration
@pytest.mark.django_db
class TestRegister:
    def test_register_success(self, client):
        response = client.post(
            reverse("auth-register"),
            {
                "email": "new@melampus.app",
                "first_name": "Jean",
                "last_name": "Dupont",
                "password": "StrongPass123!",
                "password_confirm": "StrongPass123!",
            },
        )
        assert response.status_code == 201
        data = response.json()
        assert "tokens" in data
        assert "access" in data["tokens"]
        assert "refresh" in data["tokens"]
        assert data["user"]["email"] == "new@melampus.app"

    def test_register_password_mismatch(self, client):
        response = client.post(
            reverse("auth-register"),
            {
                "email": "x@melampus.app",
                "password": "pass1",
                "password_confirm": "pass2",
            },
        )
        assert response.status_code == 400

    def test_register_duplicate_email(self, client, user):
        response = client.post(
            reverse("auth-register"),
            {
                "email": user.email,
                "password": "StrongPass123!",
                "password_confirm": "StrongPass123!",
            },
        )
        assert response.status_code == 400


@pytest.mark.integration
@pytest.mark.django_db
class TestLogin:
    def test_login_success(self, client, user):
        response = client.post(
            reverse("auth-login"),
            {"email": user.email, "password": "securepassword123"},
        )
        assert response.status_code == 200
        assert "access" in response.json()

    def test_login_wrong_password(self, client, user):
        response = client.post(
            reverse("auth-login"),
            {"email": user.email, "password": "wrongpassword"},
        )
        assert response.status_code == 401

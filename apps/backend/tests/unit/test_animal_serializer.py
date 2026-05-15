"""
Unit tests for AnimalSerializer.
Covers: new fields, display fields, cross-field validation, main_usage CREATE requirement.
"""
import pytest
from unittest.mock import MagicMock

from melampus.apps.animals.serializers import AnimalSerializer
from melampus.apps.animals.models import AnimalMainUsage, Gender, ReproductiveStatus


def make_request(method="POST"):
    request = MagicMock()
    request.method = method
    request.user = MagicMock()
    return request


def valid_payload(**overrides):
    base = {
        "name": "Tornado",
        "species": "equine",
        "gender": "female",
        "main_usage": "leisure",
    }
    base.update(overrides)
    return base


@pytest.mark.unit
class TestAnimalSerializerFields:
    def test_display_fields_declared(self):
        s = AnimalSerializer()
        assert "main_usage_display" in s.fields
        assert "living_context_display" in s.fields
        assert "reproductive_status_display" in s.fields

    def test_new_fields_in_meta(self):
        s = AnimalSerializer()
        expected_fields = {
            "country",
            "main_usage",
            "living_context",
            "travels_outside_home",
            "external_animals_contact",
            "has_young_or_pregnant_animals_on_site",
            "is_breeding_animal",
            "reproductive_status",
            "expected_birth_date",
            "is_active",
        }
        assert expected_fields.issubset(set(s.fields.keys()))

    def test_read_only_fields(self):
        s = AnimalSerializer()
        for field_name in ("id", "created_at", "updated_at", "age_in_months"):
            assert s.fields[field_name].read_only, f"{field_name} should be read_only"


@pytest.mark.unit
class TestMainUsageValidation:
    def test_main_usage_unknown_rejected_on_create(self):
        data = valid_payload(main_usage="unknown")
        s = AnimalSerializer(
            data=data,
            context={"request": make_request("POST")},
        )
        assert not s.is_valid()
        assert "main_usage" in s.errors

    def test_main_usage_unknown_allowed_on_patch(self):
        """PATCH on an existing animal may keep unknown — not re-validated."""
        data = {"main_usage": "unknown"}
        s = AnimalSerializer(
            data=data,
            partial=True,
            context={"request": make_request("PATCH")},
        )
        # Partial serializer with only main_usage should pass field validation
        s.is_valid()
        assert "main_usage" not in s.errors

    def test_valid_main_usage_accepted_on_create(self):
        data = valid_payload(main_usage="competition")
        s = AnimalSerializer(
            data=data,
            context={"request": make_request("POST")},
        )
        assert s.is_valid(), s.errors


@pytest.mark.unit
class TestCountryValidation:
    def test_country_single_char_rejected(self):
        data = valid_payload(country="F")
        s = AnimalSerializer(data=data, context={"request": make_request("POST")})
        assert not s.is_valid()
        assert "country" in s.errors

    def test_country_three_chars_rejected(self):
        data = valid_payload(country="FRA")
        s = AnimalSerializer(data=data, context={"request": make_request("POST")})
        assert not s.is_valid()
        assert "country" in s.errors

    def test_country_digits_rejected(self):
        data = valid_payload(country="33")
        s = AnimalSerializer(data=data, context={"request": make_request("POST")})
        assert not s.is_valid()
        assert "country" in s.errors

    def test_country_uppercased(self):
        data = valid_payload(country="fr")
        s = AnimalSerializer(data=data, context={"request": make_request("POST")})
        assert s.is_valid(), s.errors
        assert s.validated_data["country"] == "FR"


@pytest.mark.unit
class TestCrossFieldValidation:
    def test_male_pregnant_rejected(self):
        data = valid_payload(
            gender="male",
            reproductive_status="pregnant",
            expected_birth_date="2026-09-01",
        )
        s = AnimalSerializer(data=data, context={"request": make_request("POST")})
        assert not s.is_valid()
        assert "reproductive_status" in s.errors

    def test_male_with_young_rejected(self):
        data = valid_payload(
            gender="male",
            reproductive_status="with_young",
        )
        s = AnimalSerializer(data=data, context={"request": make_request("POST")})
        assert not s.is_valid()
        assert "reproductive_status" in s.errors

    def test_female_pregnant_without_birth_date_rejected(self):
        data = valid_payload(
            gender="female",
            reproductive_status="pregnant",
        )
        s = AnimalSerializer(data=data, context={"request": make_request("POST")})
        assert not s.is_valid()
        assert "expected_birth_date" in s.errors

    def test_female_pregnant_with_birth_date_valid(self):
        data = valid_payload(
            gender="female",
            reproductive_status="pregnant",
            expected_birth_date="2026-09-01",
        )
        s = AnimalSerializer(data=data, context={"request": make_request("POST")})
        assert s.is_valid(), s.errors

    def test_breeding_animal_not_applicable_status_rejected(self):
        data = valid_payload(
            gender="female",
            is_breeding_animal=True,
            reproductive_status="not_applicable",
        )
        s = AnimalSerializer(data=data, context={"request": make_request("POST")})
        assert not s.is_valid()
        assert "reproductive_status" in s.errors

    def test_breeding_animal_with_valid_status_accepted(self):
        data = valid_payload(
            gender="female",
            is_breeding_animal=True,
            reproductive_status="empty",
        )
        s = AnimalSerializer(data=data, context={"request": make_request("POST")})
        assert s.is_valid(), s.errors

    def test_male_breeding_male_status_accepted(self):
        data = valid_payload(
            gender="male",
            is_breeding_animal=True,
            reproductive_status="breeding_male",
        )
        s = AnimalSerializer(data=data, context={"request": make_request("POST")})
        assert s.is_valid(), s.errors

    def test_unknown_gender_with_pregnant_rejected(self):
        """Unknown gender should not bypass the male-only check — only male does."""
        data = valid_payload(
            gender="unknown",
            reproductive_status="pregnant",
        )
        s = AnimalSerializer(data=data, context={"request": make_request("POST")})
        # unknown gender + pregnant is allowed (we can't determine sex)
        # expected_birth_date missing is the only error
        assert not s.is_valid()
        assert "expected_birth_date" in s.errors
        assert "reproductive_status" not in s.errors

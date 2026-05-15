"""
Unit tests for the Animal model.
No database required — tests model logic and enum values only.
"""
import pytest
from unittest.mock import patch
from datetime import date

from melampus.apps.animals.models import (
    Animal,
    AnimalMainUsage,
    Gender,
    LivingContext,
    ReproductiveStatus,
    Species,
)


@pytest.mark.unit
class TestAnimalEnums:
    def test_species_choices(self):
        values = [c[0] for c in Species.choices]
        assert "equine" in values
        assert "canine" in values
        assert "feline" in values

    def test_gender_choices(self):
        values = [c[0] for c in Gender.choices]
        assert set(values) == {"male", "female", "unknown"}

    def test_animal_main_usage_choices(self):
        values = [c[0] for c in AnimalMainUsage.choices]
        assert "leisure" in values
        assert "competition" in values
        assert "breeding" in values
        assert "unknown" in values
        assert len(values) == 10

    def test_living_context_choices(self):
        values = [c[0] for c in LivingContext.choices]
        assert "alone" in values
        assert "boarding_stable" in values
        assert "breeding_farm" in values
        assert "unknown" in values

    def test_reproductive_status_choices(self):
        values = [c[0] for c in ReproductiveStatus.choices]
        assert "not_applicable" in values
        assert "pregnant" in values
        assert "breeding_male" in values
        assert "unknown" in values
        assert len(values) == 8


@pytest.mark.unit
class TestAnimalAgeInMonths:
    def _make_animal_with_birth_date(self, birth_date):
        animal = Animal.__new__(Animal)
        animal.birth_date = birth_date
        return animal

    def test_age_in_months_returns_none_without_birth_date(self):
        animal = self._make_animal_with_birth_date(None)
        assert animal.age_in_months is None

    def test_age_in_months_approx(self):
        animal = self._make_animal_with_birth_date(date(2020, 1, 1))
        with patch("django.utils.timezone.now") as mock_now:
            mock_now.return_value.date.return_value = date(2022, 1, 1)
            result = animal.age_in_months
        # 2 years = 730 days // 30 = 24
        assert result == 24

    def test_age_in_months_newborn(self):
        today = date(2026, 5, 15)
        animal = self._make_animal_with_birth_date(today)
        with patch("django.utils.timezone.now") as mock_now:
            mock_now.return_value.date.return_value = today
            result = animal.age_in_months
        assert result == 0


@pytest.mark.unit
class TestAnimalFieldDefaults:
    def test_country_default(self):
        field = Animal._meta.get_field("country")
        assert field.default == "FR"
        assert field.max_length == 2

    def test_main_usage_default(self):
        field = Animal._meta.get_field("main_usage")
        assert field.default == AnimalMainUsage.UNKNOWN

    def test_living_context_default(self):
        field = Animal._meta.get_field("living_context")
        assert field.default == LivingContext.UNKNOWN

    def test_boolean_fields_default_false(self):
        for field_name in (
            "travels_outside_home",
            "external_animals_contact",
            "has_young_or_pregnant_animals_on_site",
            "is_breeding_animal",
        ):
            field = Animal._meta.get_field(field_name)
            assert field.default is False, f"{field_name} should default to False"

    def test_reproductive_status_default(self):
        field = Animal._meta.get_field("reproductive_status")
        assert field.default == ReproductiveStatus.NOT_APPLICABLE

    def test_expected_birth_date_nullable(self):
        field = Animal._meta.get_field("expected_birth_date")
        assert field.null is True
        assert field.blank is True

    def test_is_active_default(self):
        field = Animal._meta.get_field("is_active")
        assert field.default is True

    def test_is_active_db_index(self):
        field = Animal._meta.get_field("is_active")
        assert field.db_index is True

    def test_is_breeding_animal_db_index(self):
        field = Animal._meta.get_field("is_breeding_animal")
        assert field.db_index is True

    def test_country_db_index(self):
        field = Animal._meta.get_field("country")
        assert field.db_index is True

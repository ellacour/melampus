"""
Unit tests for the Rules Engine (VaccinationRule.applies_to).
No database required — pure logic testing.
"""
import pytest
from unittest.mock import MagicMock
from melampus.apps.vaccinations.models import VaccinationRule


@pytest.mark.unit
class TestVaccinationRuleAppliesto:
    def make_rule(self, **kwargs):
        defaults = {
            "name": "Test",
            "species": "equine",
            "min_age_months": None,
            "max_age_months": None,
            "department_codes": [],
            "frequency_days": 365,
            "is_mandatory": False,
            "is_active": True,
        }
        defaults.update(kwargs)
        rule = VaccinationRule(**defaults)
        return rule

    def make_animal(self, species="equine", age_months=24, department="31"):
        animal = MagicMock()
        animal.species = species
        animal.age_in_months = age_months
        animal.department_code = department
        return animal

    def test_applies_to_matching_species(self):
        rule = self.make_rule(species="equine")
        animal = self.make_animal(species="equine")
        assert rule.applies_to(animal) is True

    def test_does_not_apply_to_wrong_species(self):
        rule = self.make_rule(species="equine")
        animal = self.make_animal(species="canine")
        assert rule.applies_to(animal) is False

    def test_applies_to_all_species(self):
        rule = self.make_rule(species="all")
        animal = self.make_animal(species="feline")
        assert rule.applies_to(animal) is True

    def test_age_filter_min(self):
        rule = self.make_rule(min_age_months=6)
        assert rule.applies_to(self.make_animal(age_months=3)) is False
        assert rule.applies_to(self.make_animal(age_months=6)) is True
        assert rule.applies_to(self.make_animal(age_months=12)) is True

    def test_age_filter_max(self):
        rule = self.make_rule(max_age_months=12)
        assert rule.applies_to(self.make_animal(age_months=6)) is True
        assert rule.applies_to(self.make_animal(age_months=12)) is True
        assert rule.applies_to(self.make_animal(age_months=24)) is False

    def test_department_filter(self):
        rule = self.make_rule(department_codes=["31", "09"])
        assert rule.applies_to(self.make_animal(department="31")) is True
        assert rule.applies_to(self.make_animal(department="75")) is False

    def test_no_department_filter_applies_nationally(self):
        rule = self.make_rule(department_codes=[])
        assert rule.applies_to(self.make_animal(department="75")) is True

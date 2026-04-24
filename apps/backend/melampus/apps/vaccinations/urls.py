from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VaccinationRecordViewSet, VaccinationRuleViewSet

router = DefaultRouter()
router.register(r"records", VaccinationRecordViewSet, basename="vaccination-record")
router.register(r"rules", VaccinationRuleViewSet, basename="vaccination-rule")

urlpatterns = [
    path("", include(router.urls)),
]

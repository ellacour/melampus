from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RecurringCareViewSet, CareEventViewSet

router = DefaultRouter()
router.register(r"recurring", RecurringCareViewSet, basename="recurring-care")
router.register(r"events", CareEventViewSet, basename="care-event")

urlpatterns = [
    path("", include(router.urls)),
]

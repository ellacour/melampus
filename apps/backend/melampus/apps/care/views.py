from rest_framework import viewsets
from .models import RecurringCare, CareEvent
from .serializers import RecurringCareSerializer, CareEventSerializer


class RecurringCareViewSet(viewsets.ModelViewSet):
    serializer_class = RecurringCareSerializer

    def get_queryset(self):
        return RecurringCare.objects.filter(
            animal__owner=self.request.user
        ).select_related("animal")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class CareEventViewSet(viewsets.ModelViewSet):
    serializer_class = CareEventSerializer

    def get_queryset(self):
        return CareEvent.objects.filter(
            recurring_care__animal__owner=self.request.user
        ).select_related("recurring_care__animal")

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)

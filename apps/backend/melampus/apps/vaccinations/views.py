from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import VaccinationRecord, VaccinationRule
from .serializers import VaccinationRecordSerializer, VaccinationRuleSerializer
from melampus.apps.animals.models import Animal


class VaccinationRecordViewSet(viewsets.ModelViewSet):
    serializer_class = VaccinationRecordSerializer

    def get_queryset(self):
        return VaccinationRecord.objects.filter(
            animal__owner=self.request.user
        ).select_related("animal", "rule", "recorded_by")

    def perform_create(self, serializer):
        serializer.save(recorded_by=self.request.user)


class VaccinationRuleViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public read-only endpoint exposing vaccination rules.
    Supports filtering by species to get relevant recommendations.
    """
    serializer_class = VaccinationRuleSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = VaccinationRule.objects.filter(is_active=True)

    @action(detail=False, methods=["get"], url_path="for-animal/(?P<animal_id>[^/.]+)")
    def for_animal(self, request, animal_id=None):
        """Return applicable rules for a specific animal (Rules Engine endpoint)."""
        try:
            animal = Animal.objects.get(id=animal_id, owner=request.user)
        except Animal.DoesNotExist:
            return Response({"detail": "Animal non trouvé."}, status=404)

        applicable_rules = [
            rule for rule in self.get_queryset() if rule.applies_to(animal)
        ]
        serializer = self.get_serializer(applicable_rules, many=True)
        return Response(serializer.data)

from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Animal
from .serializers import AnimalSerializer


class AnimalViewSet(viewsets.ModelViewSet):
    serializer_class = AnimalSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["species", "gender"]
    search_fields = ["name", "identification_number", "breed"]
    ordering_fields = ["name", "birth_date", "created_at"]
    ordering = ["name"]

    def get_queryset(self):
        # Users can only access their own animals
        return Animal.objects.filter(owner=self.request.user).select_related("owner")

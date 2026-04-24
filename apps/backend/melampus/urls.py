from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

API_V1 = "api/v1/"

urlpatterns = [
    path("admin/", admin.site.urls),
    path(f"{API_V1}auth/", include("melampus.apps.authentication.urls")),
    path(f"{API_V1}animals/", include("melampus.apps.animals.urls")),
    path(f"{API_V1}care/", include("melampus.apps.care.urls")),
    path(f"{API_V1}vaccinations/", include("melampus.apps.vaccinations.urls")),
    path(f"{API_V1}notifications/", include("melampus.apps.notifications.urls")),
]

if settings.DEBUG:
    import debug_toolbar
    urlpatterns += [path("__debug__/", include(debug_toolbar.urls))]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

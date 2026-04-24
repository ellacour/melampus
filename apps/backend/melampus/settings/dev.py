from .base import *  # noqa: F401, F403

DEBUG = True

INSTALLED_APPS += ["debug_toolbar"]  # noqa: F405

MIDDLEWARE += ["debug_toolbar.middleware.DebugToolbarMiddleware"]  # noqa: F405

INTERNAL_IPS = ["127.0.0.1"]

# In dev, allow all origins for convenience
CORS_ALLOW_ALL_ORIGINS = True

# Emails go to console in dev
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Less strict password in dev
AUTH_PASSWORD_VALIDATORS = []

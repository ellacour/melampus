#!/bin/sh
set -e

# Run migrations in the right order to avoid auth_user issues with custom User model
python manage.py migrate contenttypes 2>&1 | grep -E "(Applying|OK)" 
python manage.py migrate authentication 2>&1 | grep -E "(Applying|OK)"
# Now auth can reference our custom User model
python manage.py migrate auth 2>&1 | grep -E "(Applying|OK)"
# Run all remaining migrations
python manage.py migrate 2>&1 | grep -E "(Applying|OK)"

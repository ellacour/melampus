# Generated migration to fake auth tables since we use a custom User model

from django.db import migrations

class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0001_initial'),
    ]

    operations = [
        migrations.RunSQL(sql="SELECT 1", reverse_sql="SELECT 1"),
    ]

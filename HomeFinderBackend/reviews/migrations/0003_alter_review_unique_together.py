# Generated by Django 5.1.4 on 2025-01-08 13:16

from django.conf import settings
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('properties', '0008_rename_isverified_property_is_verified'),
        ('reviews', '0002_remove_review_comment'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='review',
            unique_together={('property', 'user')},
        ),
    ]
# Generated by Django 4.2.15 on 2025-01-02 11:53

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_preferences_worker_layer_api_key'),
    ]

    operations = [
        migrations.AddField(
            model_name='preferences',
            name='spatial_reference_layer_max_area',
            field=models.IntegerField(default=500000000),
        ),
    ]

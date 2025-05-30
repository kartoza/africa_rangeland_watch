# Generated by Django 4.2.21 on 2025-05-27 02:24

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('alerts', '0003_merge_20250512_1410'),
    ]

    operations = [
        migrations.AddField(
            model_name='alertsetting',
            name='analysis_type',
            field=models.CharField(blank=True, choices=[('Baseline', 'Baseline'), ('Temporal', 'Temporal')], default='Baseline'),
        ),
        migrations.AddField(
            model_name='alertsetting',
            name='reference_period',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]

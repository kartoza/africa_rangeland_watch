# Generated by Django 4.2.15 on 2025-01-18 09:52

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('dashboard', '0002_delete_organisation_alter_dashboard_organisations'),
    ]

    operations = [
        migrations.AddField(
            model_name='dashboard',
            name='created_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='created_dashboards', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='dashboard',
            name='title',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AlterField(
            model_name='dashboard',
            name='privacy_type',
            field=models.CharField(choices=[('public', 'Public'), ('private', 'Private'), ('organisation', 'Organisation'), ('restricted', 'Restricted')], default='private', help_text='Privacy level of the dashboard.', max_length=20),
        ),
        migrations.AlterField(
            model_name='dashboard',
            name='users',
            field=models.ManyToManyField(blank=True, help_text='Users who have access to this dashboard.', related_name='accessible_dashboards', to=settings.AUTH_USER_MODEL),
        ),
    ]

# Generated by Django 4.2.15 on 2024-11-16 18:35

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('alerts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Ticket',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=255)),
                ('description', models.TextField()),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('status', models.CharField(choices=[('open', 'Open'), ('in_progress', 'In Progress'), ('resolved', 'Resolved'), ('pending', 'Pending')], default='open', max_length=20)),
                ('email', models.EmailField(max_length=254)),
                ('file_attachment', models.FileField(blank=True, null=True, upload_to='ticket_attachments/')),
                ('resolution_summary', models.TextField(blank=True, help_text='Summary of the resolution provided by the admin when the ticket is resolved.', null=True)),
                ('alert_setting', models.ForeignKey(blank=True, help_text='The alert setting associated with this ticket.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='tickets', to='alerts.alertsetting')),
                ('assigned_to', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_tickets', to=settings.AUTH_USER_MODEL)),
                ('indicator', models.ForeignKey(blank=True, help_text='The indicator related to this ticket.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='tickets', to='alerts.indicator')),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
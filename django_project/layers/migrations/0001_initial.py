# Generated by Django 4.2.7 on 2024-11-06 16:53

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='DataProvider',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='The name of the data provider.', max_length=255, unique=True)),
                ('file', models.FileField(blank=True, help_text='File associated with the data provider, if applicable.', null=True, upload_to='data_providers/files/')),
                ('url', models.URLField(blank=True, help_text="URL for the data provider's website or dataset.", null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Data Provider',
                'verbose_name_plural': 'Data Providers',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='InputLayer',
            fields=[
                ('uuid', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Unique identifier for the input layer.', primary_key=True, serialize=False)),
                ('name', models.CharField(help_text='Name of the input layer.', max_length=255)),
                ('layer_type', models.CharField(choices=[('vector', 'Vector'), ('raster', 'Raster')], default='vector', help_text='Type of the input layer (e.g., vector, raster).', max_length=50)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(help_text='User who created this input layer.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_layers', to=settings.AUTH_USER_MODEL)),
                ('data_provider', models.ForeignKey(help_text='The data provider associated with this layer.', on_delete=django.db.models.deletion.CASCADE, related_name='input_layers', to='layers.dataprovider')),
                ('updated_by', models.ForeignKey(help_text='User who last updated this input layer.', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='updated_layers', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Input Layer',
                'verbose_name_plural': 'Input Layers',
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='DataFeedSetting',
            fields=[
                ('uuid', models.UUIDField(default=uuid.uuid4, editable=False, help_text='Unique identifier for the data feed setting.', primary_key=True, serialize=False)),
                ('frequency', models.CharField(choices=[('daily', 'Daily'), ('weekly', 'Weekly'), ('monthly', 'Monthly')], default='weekly', help_text='Frequency of data feed updates.', max_length=20)),
                ('enable_alert', models.BooleanField(default=False, help_text='Enable or disable alerts for this data feed.')),
                ('email_alert', models.BooleanField(default=False, help_text='Enable email alerts for this data feed.')),
                ('in_app_alert', models.BooleanField(default=False, help_text='Enable in-app alerts for this data feed.')),
                ('last_sync_timestamp', models.DateTimeField(blank=True, help_text='Timestamp of the last successful sync.', null=True)),
                ('last_sync_status', models.CharField(blank=True, help_text='Status message of the last sync operation.', max_length=100, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('provider', models.ForeignKey(help_text='The data provider associated with this data feed setting.', on_delete=django.db.models.deletion.CASCADE, related_name='data_feed_settings', to='layers.dataprovider')),
            ],
            options={
                'verbose_name': 'Data Feed Setting',
                'verbose_name_plural': 'Data Feed Settings',
                'ordering': ['provider', 'frequency'],
            },
        ),
    ]
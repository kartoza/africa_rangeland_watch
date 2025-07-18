# Generated by Django 4.2.23 on 2025-07-02 09:25

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('analysis', '0013_useranalysisresults_description_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='Indicator',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='The name of the indicator.', max_length=255, unique=True)),
                ('description', models.TextField(blank=True, help_text='Description of the indicator.', null=True)),
                ('variable_name', models.CharField(help_text='The variable name used in the analysis.', max_length=255, unique=True)),
                ('source', models.CharField(choices=[('base', 'Base'), ('GPW', 'Global Pasteur Watch'), ('other', 'Other')], default='base', help_text='The source of the indicator.', max_length=50)),
                ('analysis_types', models.JSONField(blank=True, default=list, help_text='List of analysis types this indicator can be used for.', null=True)),
                ('temporal_resolutions', models.JSONField(blank=True, default=list, help_text='List of temporal resolutions this indicator can be used for.', null=True)),
                ('metadata', models.JSONField(blank=True, default=dict, help_text='Additional metadata for the indicator.', null=True)),
                ('config', models.JSONField(blank=True, default=dict, help_text='Additional configuration for the indicator.', null=True)),
                ('is_active', models.BooleanField(default=True, help_text='Indicates if the indicator is active.')),
            ],
            options={
                'verbose_name': 'Indicator',
                'verbose_name_plural': 'Indicators',
                'ordering': ['name'],
            },
        ),
    ]

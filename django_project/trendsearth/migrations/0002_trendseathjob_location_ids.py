# Generated migration - add location_ids to TrendsEarthJob

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('trendsearth', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='trendsearthjob',
            name='location_ids',
            field=models.JSONField(
                blank=True,
                null=True,
                help_text=(
                    'Sorted list of LandscapeCommunity PKs submitted for this job. '
                    'Used for cross-user deduplication: a new job is skipped when '
                    'a completed job with the same job_type, year range, and '
                    'location_ids already exists.'
                ),
            ),
        ),
    ]

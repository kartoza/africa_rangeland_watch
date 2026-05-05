# Add params JSONField to TrendsEarthJob for urbanization threshold deduplication.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('trendsearth', '0002_trendseathjob_location_ids'),
    ]

    operations = [
        migrations.AddField(
            model_name='trendsearthjob',
            name='params',
            field=models.JSONField(
                blank=True,
                null=True,
                help_text=(
                    'Extra analysis parameters that affect the output, stored as a '
                    'canonical dict. Used for deduplication and GEE asset naming. '
                    'Currently only populated for Urbanization jobs '
                    '(un_adju, isi_thr, ntl_thr, wat_thr, cap_ope, '
                    'pct_suburban, pct_urban).'
                ),
            ),
        ),
    ]

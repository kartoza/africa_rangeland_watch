# Generated by Django 4.2.15 on 2024-11-20 15:07

from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='BaseMap',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='Name of the base map.', max_length=255)),
                ('url', models.URLField(help_text='URL for the base map.')),
                ('thumbnail', models.FileField(blank=True, help_text='Thumbnail for the base map.', null=True, upload_to='base_map/thumbnails/')),
            ],
            options={
                'verbose_name': 'Base Map',
                'verbose_name_plural': 'Base Maps',
                'ordering': ['name'],
            },
        ),
    ]

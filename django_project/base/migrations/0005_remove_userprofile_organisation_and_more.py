# Generated by Django 4.2.15 on 2024-12-10 09:06

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('base', '0004_organisationinvitation_metadata_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='userprofile',
            name='organisation',
        ),
        migrations.RemoveField(
            model_name='userprofile',
            name='user_type',
        ),
        migrations.CreateModel(
            name='UserOrganisations',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('user_type', models.CharField(choices=[('manager', 'Manager'), ('member', 'Member')], default='member', help_text='The type of the user within the organisation(manager/member).', max_length=20)),
                ('organisation', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='user_organisations', to='base.organisation')),
                ('user_profile', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='user_organisations', to='base.userprofile')),
            ],
            options={
                'unique_together': {('user_profile', 'organisation')},
            },
        ),
        migrations.AddField(
            model_name='userprofile',
            name='organisations',
            field=models.ManyToManyField(blank=True, help_text='The organisations this user belongs to.', related_name='user_profiles', through='base.UserOrganisations', to='base.organisation'),
        ),
    ]

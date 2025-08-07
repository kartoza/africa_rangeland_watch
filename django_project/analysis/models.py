import json
import uuid

import ee
import calendar
import datetime
from typing import Tuple
from django.utils import timezone
from django.contrib.auth.models import User
from django.contrib.gis.db import models
from django.contrib.gis.geos import GEOSGeometry
from django.db.models.signals import pre_delete
from django.dispatch import receiver
from django.conf import settings
from django.urls import reverse
from cloud_native_gis.models import Layer, LayerType
from django.core.exceptions import ValidationError


from core.models import TaskStatus
from alerts.models import Indicator


class InterventionArea(models.Model):
    """Model to represent a geographic or intervention area."""

    name = models.CharField(
        max_length=255,
        unique=True,
        help_text="The name of the intervention area."
    )

    geom = models.GeometryField(
        srid=4326,
        blank=True,
        null=True,
        help_text="The spatial geometry of the intervention area."
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text=(
            "The date and time when this intervention area was created."
        )
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        help_text=(
            "The date and time when this intervention area was last updated."
        )
    )

    class Meta:
        verbose_name = "Intervention Area"
        verbose_name_plural = "Intervention Areas"
        ordering = ['name']

    def __str__(self):
        return self.name


class Analysis(models.Model):
    """Model to represent an analysis."""

    ANALYSIS_TYPES = [
        ('spatial', 'Spatial'),
        ('temporal', 'Temporal'),
        ('statistical', 'Statistical'),
    ]

    TEMPORAL_RESOLUTIONS = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]

    uuid = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier for the analysis."
    )

    intervention_area = models.ForeignKey(
        InterventionArea,
        on_delete=models.CASCADE,
        related_name="analyses",
        help_text=(
            "The intervention area associated with this analysis."
        ),
        blank=True
    )

    indicator = models.ForeignKey(
        Indicator,
        on_delete=models.CASCADE,
        related_name="analyses",
        help_text="The indicator being analyzed.",
        blank=True,
    )

    analysis_type = models.CharField(
        max_length=20,
        choices=ANALYSIS_TYPES,
        default='spatial',
        help_text="Type of analysis performed."
    )

    temporal_resolution = models.CharField(
        max_length=20,
        choices=TEMPORAL_RESOLUTIONS,
        blank=True,
        null=True,
        help_text="The temporal resolution of the analysis, if applicable."
    )

    reference_period_start = models.DateField(
        help_text="The start date for the reference period of the analysis.",
        blank=True
    )

    reference_period_end = models.DateField(
        help_text="The end date for the reference period of the analysis.",
        blank=True
    )

    comparison_period_start = models.DateField(
        help_text="The start date for the comparison period of the analysis.",
        blank=True
    )

    comparison_period_end = models.DateField(
        help_text="The end date for the comparison period of the analysis.",
        blank=True
    )

    geom = models.GeometryField(
        srid=4326,
        blank=True,
        null=True,
        help_text=(
            "The spatial geometry of the analysis (e.g., area of interest)."
        )
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_analyses",
        help_text="User who created this analysis."
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="The date and time when this analysis was created."
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="The date and time when this analysis was last updated."
    )

    class Meta:
        verbose_name = "Analysis"
        verbose_name_plural = "Analyses"
        ordering = ['-created_at']

    def __str__(self):
        return f"Analysis {self.uuid}"


class Project(models.Model):
    """Model to represent a project."""

    name = models.CharField(
        max_length=512,
        unique=True,
        help_text="The name of the project."
    )

    def __str__(self):
        return self.name


class Landscape(models.Model):
    """Model that represents the landscape."""

    name = models.CharField(
        max_length=255,
        help_text="The name of the landscape."
    )

    project_name = models.CharField(
        max_length=255,
        help_text="The name of the project.",
        blank=True,
        null=True,
    )

    bbox = models.PolygonField(
        srid=4326,
        blank=True,
        null=True,
        help_text="Bounding box of the landscape."
    )

    zoom = models.IntegerField(
        help_text="Zoom level of the landscape."
    )

    projects = models.ManyToManyField(
        Project,
        related_name='landscapes',
        blank=True,
        help_text="The projects associated with this landscape."
    )

    def __str__(self):
        return self.name

    @property
    def project_names(self):
        """Get the names of the projects associated with this landscape."""
        return ', '.join([project.name for project in self.projects.all()])

    class Meta:  # noqa: D106
        ordering = ('name',)

    def fetch_areas(self):
        """Fetch area from ee."""
        from analysis.analysis import initialize_engine_analysis

        # initialize engine
        initialize_engine_analysis()

        # Get communities
        communities = ee.FeatureCollection(
            'projects/ee-yekelaso1818/assets/CSA/CSA_master_20241202'
        )
        projects = [project.name for project in self.projects.all()]
        communities = communities.filter(
            ee.Filter.inList('Project', projects)
        )
        communities = communities.getInfo()['features']
        for community in communities:
            geometry = GEOSGeometry(json.dumps(community['geometry']))
            LandscapeCommunity.objects.get_or_create(
                landscape=self,
                community_id=community['id'],
                defaults={
                    "community_name": community['properties']['Name'],
                    "geometry": geometry
                }
            )


class LandscapeCommunity(models.Model):
    """Model that represents the Community of landscape.

    To fetch this
    1. Go to django admin
    2. List of landscape
    3. Select landscape that needs to be fetched
    4. Run the action "Fetch landscape area"
    """

    landscape = models.ForeignKey(Landscape, on_delete=models.CASCADE)
    community_id = models.CharField(
        max_length=256,
        help_text="The id of the community that coming from GEE.",
        unique=True
    )
    community_name = models.CharField(
        max_length=256,
        help_text="The name of the community.",
        null=True, blank=True
    )
    geometry = models.GeometryField(
        srid=4326, help_text="Geometry of community."
    )

    class Meta:
        verbose_name_plural = "Landscape Communities"
        db_table = 'analysis_landscape_community'

    def __str__(self):
        """Return string representation of LandscapeArea."""
        return self.community_name or "Unknown"


class AnalysisRasterOutput(models.Model):
    """Model that stores the raster output of an analysis."""

    uuid = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        help_text="Unique identifier for the raster."
    )
    name = models.TextField()
    size = models.BigIntegerField(default=0)
    status = models.CharField(max_length=255)
    generate_start_time = models.DateTimeField(
        null=True,
        blank=True
    )
    generate_end_time = models.DateTimeField(
        null=True,
        blank=True
    )
    status_logs = models.JSONField(
        default=dict,
        null=True,
        blank=True
    )
    # should have: analysisType, variable, landscape,
    # temporalResolution, year, month, quarter,
    # locations, reference_layer, reference_layer_id
    analysis = models.JSONField(default=dict)

    def __str__(self):
        return self.name

    @property
    def raster_filename(self):
        return f'{self.uuid}.tif'

    @staticmethod
    def generate_name(analysis):
        analysis_type = analysis.get('analysisType').lower()
        variable = analysis.get('variable').lower().replace(' ', '_')
        locations = analysis.get('locations')
        if len(locations) > 1:
            community = analysis.get('landscape', '').replace(' ', '_')
        else:
            community = locations[0].get(
                'communityName',
                ''
            ).replace(' ', '_')

        if analysis_type == 'Spatial':
            return (
                f'{community}_{variable}_{analysis_type}.tif'
            )

        temporal_res = analysis.get('temporalResolution').lower()
        date_str = analysis.get('year')
        if temporal_res == 'quarterly':
            date_str = (
                f"Q{analysis.get('quarter')}_{analysis.get('year')}"
            )
        elif temporal_res == 'monthly':
            date_str = (
                f"{calendar.month_name[analysis.get('month')].lower()}_"
                f"{analysis.get('year')}"
            )

        return (
            f'{community}_{variable}_{analysis_type}_'
            f'{temporal_res}_{date_str}.tif'
        )

    @staticmethod
    def from_temporal_analysis_input(data):
        """Create analysis dict from temporal analysis input."""
        results = [
            {
                'analysisType': data['analysisType'],
                'variable': data['variable'],
                'landscape': data['landscape'],
                'temporalResolution': data['temporalResolution'],
                'year': data['period']['year'],
                'month': data['period'].get('month'),
                'quarter': data['period'].get('quarter'),
                'locations': data['locations']
            }
        ]
        comp_years = data['comparisonPeriod']['year']
        comp_quarters = data['comparisonPeriod'].get('quarter', [])
        if comp_quarters is None or len(comp_quarters) == 0:
            comp_quarters = [None] * len(comp_years)
        comp_months = data['comparisonPeriod'].get('month', [])
        if comp_months is None or len(comp_months) == 0:
            comp_months = [None] * len(comp_years)
        for idx, comp_year in enumerate(comp_years):
            analysis = {
                'analysisType': data['analysisType'],
                'variable': data['variable'],
                'landscape': data['landscape'],
                'temporalResolution': data['temporalResolution'],
                'year': comp_year,
                'month': comp_months[idx],
                'quarter': comp_quarters[idx],
                'locations': data['locations']
            }
            results.append(analysis)
        return results

    @staticmethod
    def from_spatial_analysis_input(data):
        """Create analysis dict from spatial analysis input."""
        results = {
            'analysisType': data['analysisType'],
            'variable': data['variable'],
            'landscape': data['landscape'],
            'temporalResolution': data['temporalResolution'],
            'period': data.get('period', {}),
            'comparisonPeriod': data.get('comparisonPeriod', {}),
            'locations': data['locations'],
            'reference_layer': data.get('reference_layer', {}),
            'reference_layer_id': data.get('reference_layer_id', ''),
        }

        return results


@receiver(pre_delete, sender=AnalysisRasterOutput)
def analysisrasteroutput_pre_delete(
        sender, instance: AnalysisRasterOutput, *args, **kwargs):
    """Delete raster output when the result is deleted."""
    from analysis.utils import delete_gdrive_file
    delete_gdrive_file(f'{str(instance.uuid)}.tiff')


class UserAnalysisResults(models.Model):
    """Model to store user analysis results."""

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )
    analysis_results = models.JSONField(
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    source = models.CharField(
        max_length=255,
        null=True,
        blank=True
    )
    raster_output_path = models.CharField(
        max_length=512,
        null=True,
        blank=True,
        help_text='Path to the raster output of this analysis.'
    )
    raster_outputs = models.ManyToManyField(
        AnalysisRasterOutput,
        related_name="analysis_results"
    )

    name = models.CharField(
        null=True,
        blank=True,
        max_length=255,
        help_text="Name of the analysis result."
    )
    description = models.TextField(
        null=True,
        blank=True,
        help_text="Description of the analysis result."
    )

    @property
    def rasters(self):
        results = []
        for item in self.raster_outputs.all():
            result = {
                "id": item.uuid,
                "name": item.name,
                "size": item.size,
                "status": item.status,
                "analysis": item.analysis,
                "url": None,
                "bounds": None
            }
            layer = Layer.objects.filter(
                unique_id=item.uuid,
                layer_type=LayerType.RASTER_TILE
            ).first()
            if layer and item.status == 'COMPLETED':
                result['url'] = self._make_cog_url(layer.unique_id)
                metadata = layer.metadata or {}
                result['bounds'] = metadata.get('bounds', None)

            results.append(result)
        return results

    def _make_cog_url(self, layer_uuid: str):
        base_url = settings.DJANGO_BACKEND_URL
        if base_url.endswith('/'):
            base_url = base_url[:-1]
        return (
            f'cog://{base_url}' +
            reverse('serve-cog', kwargs={
                'layer_uuid': layer_uuid,
            })
        )

    def _get_baci_period(self, period):
        """Get the BACI period string."""
        year = period.get('year', '')
        month = period.get('month', '')
        quarter = period.get('quarter', '')
        if isinstance(year, list):
            # get the first item
            year = year[0] if year else ''
            month = month[0] if month else ''
            quarter = quarter[0] if quarter else ''
        return {
            'year': year,
            'month': calendar.month_name[int(month)] if month else '',
            'quarter': f'Q{quarter}' if quarter else ''
        }

    def _get_description(self, data):
        analysis_type = data.get('analysisType', '')
        if analysis_type == 'Baseline':
            start_date = data.get('baselineStartDate', '')
            end_date = data.get('baselineEndDate', '')
            if start_date and end_date:
                start_date = datetime.date.fromisoformat(start_date)
                end_date = datetime.date.fromisoformat(end_date)
                return (
                    f"Baseline from {start_date.strftime('%d/%m/%Y')} to "
                    f"{end_date.strftime('%d/%m/%Y')}"
                )
            return 'Baseline from 2015 to 2020'
        elif analysis_type == 'Temporal':
            temporal_res = data.get('temporalResolution', '')
            period = data.get('period', {})
            year = period.get('year', '')
            month = period.get('month', '')
            quarter = period.get('quarter', '')
            if temporal_res == 'Quarterly':
                return (
                    f"Analysis for reference period {year} Q{quarter} "
                    f"for {data.get('variable', '')}"
                )
            elif temporal_res == 'Monthly':
                month_name = calendar.month_name[int(month)]
                return (
                    f"Analysis for reference period {year} {month_name} "
                    f"for {data.get('variable', '')}"
                )
            elif temporal_res == 'Annual':
                return (
                    f"Analysis for reference period {year} "
                    f"for {data.get('variable', '')}"
                )
        elif analysis_type == 'Spatial':
            variable = data.get('variable', '')
            return (
                f'Relative % difference in {variable} between reference area '
                'and selected camp(s).'
            )
        elif analysis_type == 'BACI':
            temporal_res = data.get('temporalResolution', '')
            before_period = self._get_baci_period(
                data.get('period', {})
            )
            after_period = self._get_baci_period(
                data.get('comparisonPeriod', {})
            )
            if temporal_res == 'Annual':
                return (
                    f'Analysis between {before_period["year"]} and '
                    f'{after_period["year"]}'
                )
            elif temporal_res == 'Quarterly':
                return (
                    f'Analysis between {before_period["quarter"]} '
                    f'{before_period["year"]} and '
                    f'{after_period["quarter"]} {after_period["year"]}'
                )
            elif temporal_res == 'Monthly':
                return (
                    f'Analysis between {before_period["month"]} '
                    f'{before_period["year"]} and '
                    f'{after_period["month"]} {after_period["year"]}'
                )
        return ' - '

    def _get_name(self, data):
        """Generate name for the analysis result."""
        return (
            f"{data.get('analysisType', '')} Analysis of "
            f"{data.get('landscape', '')} for {data.get('variable', '')}"
        )

    def save(self, *args, **kwargs):
        if not self.pk:
            data = (
                self.analysis_results.get('data', {}) if
                self.analysis_results else {}
            )
            # set name and description
            self.name = self.name or self._get_name(data)
            self.description = self.description or self._get_description(data)
        super().save(*args, **kwargs)

    def __str__(self):
        created_by = self.created_by.username if self.created_by else 'Unknown'
        created_at = self.created_at
        return f"Analysis by {created_by} on {created_at}"


@receiver(pre_delete, sender=UserAnalysisResults)
def analysisresults_pre_delete(
        sender, instance: UserAnalysisResults, *args, **kwargs):
    """Delete raster output when the result is deleted."""
    from analysis.utils import delete_gdrive_file
    if instance.raster_output_path:
        delete_gdrive_file(instance.raster_output_path)


class GEEAssetType:
    """GEE asset type."""

    IMAGE = 'image'
    IMAGE_COLLECTION = 'image_collection'
    TABLE = 'table'
    CLASSIFIER = 'classifier'
    FEATURE_VIEW = 'feature_view'
    FOLDER = 'folder'

    @classmethod
    def choices(cls):
        return (
            (cls.IMAGE, cls.IMAGE),
            (cls.IMAGE_COLLECTION, cls.IMAGE_COLLECTION),
            (cls.TABLE, cls.TABLE),
            (cls.CLASSIFIER, cls.CLASSIFIER),
            (cls.FEATURE_VIEW, cls.FEATURE_VIEW),
            (cls.FOLDER, cls.FOLDER),
        )


class BaseGEEAsset(models.Model):
    """Base model to store the GEE Asset that is used in the analysis."""

    source = models.CharField(
        max_length=512,
        help_text='Source path to the asset.'
    )
    type = models.CharField(
        max_length=20,
        choices=GEEAssetType.choices(),
        help_text='Asset type.'
    )
    metadata = models.JSONField(
        default=dict,
        null=True,
        blank=True,
        help_text='Asset metadata.'
    )

    def __str__(self):
        return self.key

    @property
    def start_date(self):
        """Get start date from metadata."""
        return self.metadata.get('start_date', None)

    @property
    def end_date(self):
        """Get end date from metadata."""
        end_date_str = self.metadata.get('end_date', None)
        if end_date_str == 'now':
            return timezone.now().strftime('%Y-%m-%d')
        return end_date_str

    @classmethod
    def fetch_asset_source(cls, asset_key: str) -> str:
        """Fetch asset source by its key."""
        asset = GEEAsset.objects.filter(key=asset_key).first()
        if asset is None:
            raise KeyError(f'Asset with key {asset_key} not found!')
        return asset.source

    @classmethod
    def fetch_asset_metadata(cls, asset_key: str) -> str:
        """Fetch asset metadata by its key."""
        asset = GEEAsset.objects.filter(key=asset_key).first()
        if asset is None:
            raise KeyError(f'Asset with key {asset_key} not found!')
        return asset.metadata

    @classmethod
    def is_date_within_asset_period(cls, asset_key: str, date: str) -> bool:
        """Check if the given date is within the asset's start and end date."""
        asset = cls.objects.filter(key=asset_key).first()
        if asset is None:
            raise KeyError(f'Asset with key {asset_key} not found!')

        start_date = asset.start_date
        end_date = asset.end_date

        if not start_date or not end_date:
            raise ValueError(
                'Asset metadata must contain start_date and end_date.'
            )
        # compare only the year
        return int(start_date[:4]) <= int(date[:4]) <= int(end_date[:4])

    @classmethod
    def get_dates_within_asset_period(
        cls, asset_key: str, start_date: str, end_date: str
    ) -> Tuple[bool, str, str]:
        """Check and get given dates within asset's start and end date."""
        valid_start_date = cls.is_date_within_asset_period(
            asset_key,
            start_date
        )
        valid_end_date = cls.is_date_within_asset_period(asset_key, end_date)
        if not valid_start_date and not valid_end_date:
            return (False, None, None,)
        elif valid_start_date and not valid_end_date:
            asset = cls.objects.filter(key=asset_key).first()
            return (True, start_date, asset.end_date)
        elif not valid_start_date and valid_end_date:
            asset = cls.objects.filter(key=asset_key).first()
            return (True, asset.start_date, end_date)

        return (True, start_date, end_date,)

    class Meta:
        abstract = True


class GEEAsset(BaseGEEAsset):
    """Model to store the GEE Asset that is used in the analysis."""

    key = models.CharField(
        unique=True,
        max_length=50,
        help_text='Key to the asset.'
    )

    class Meta:
        verbose_name_plural = 'GEE Assets'
        db_table = 'analysis_gee_asset'


class AnalysisResultsCache(models.Model):
    analysis_results = models.JSONField(
        null=True,
        blank=True
    )
    analysis_inputs = models.JSONField(
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expired_at = models.DateTimeField(null=True, blank=True)

    @classmethod
    def save_cache_with_ttl(cls, ttl, **kwargs):
        """Save AnalysisResultsCache with ttl."""
        obj = AnalysisResultsCache.objects.create(**kwargs)
        if ttl is None:
            # default to 1 hour
            ttl = 1
        obj.expired_at = obj.created_at + timezone.timedelta(
            hours=ttl
        )
        obj.save()
        return obj


class AnalysisTask(models.Model):
    analysis_inputs = models.JSONField(
        null=True,
        blank=True
    )
    submitted_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(
        max_length=50,
        choices=TaskStatus.choices,
        default=TaskStatus.PENDING,
        help_text='Status of the analysis task.'
    )
    task_id = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text='ID of the task.'
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='Date and time when the task was completed.'
    )
    result = models.JSONField(
        null=True,
        blank=True,
        help_text='Result of the analysis task.'
    )
    error = models.JSONField(
        null=True,
        blank=True,
        help_text='Error message if the task failed.'
    )


class IndicatorSource(models.TextChoices):
    """Choices for the source of an indicator."""

    BASE = 'base', 'Base'
    # Global Pasteur Watch
    GPW = 'GPW', 'Global Pasteur Watch'
    OTHER = 'other', 'Other'


class BaseIndicator(models.Model):
    """Model to represent an indicator used in analysis."""

    ALLOWED_ANALYSIS_TYPES = [
        'Baseline',
        'Temporal',
        'Spatial'
    ]
    ALLOWED_TEMPORAL_RESOLUTIONS = [
        'Annual',
        'Quarterly',
        'Monthly'
    ]

    description = models.TextField(
        blank=True,
        null=True,
        help_text="Description of the indicator."
    )

    variable_name = models.CharField(
        max_length=255,
        unique=True,
        help_text="The variable name used in the analysis."
    )

    source = models.CharField(
        max_length=50,
        choices=IndicatorSource.choices,
        default=IndicatorSource.BASE,
        help_text="The source of the indicator."
    )

    analysis_types = models.JSONField(
        default=list,
        help_text="List of analysis types this indicator can be used for.",
        blank=True,
        null=True
    )

    temporal_resolutions = models.JSONField(
        default=list,
        help_text=(
            "List of temporal resolutions this indicator can be used for."
        ),
        blank=True,
        null=True
    )

    metadata = models.JSONField(
        default=dict,
        help_text="Additional metadata for the indicator.",
        blank=True,
        null=True
    )

    config = models.JSONField(
        default=dict,
        help_text="Additional configuration for the indicator.",
        blank=True,
        null=True
    )

    is_active = models.BooleanField(
        default=True,
        help_text="Indicates if the indicator is active."
    )

    def clean(self):
        super().clean()
        invalid_analysis_types = (
            set(self.analysis_types) - set(self.ALLOWED_ANALYSIS_TYPES)
        )
        if invalid_analysis_types:
            raise ValidationError(
                f"Invalid analysis types: {', '.join(invalid_analysis_types)}."
            )
        invalid_temporal_resolutions = (
            set(self.temporal_resolutions) -
            set(self.ALLOWED_TEMPORAL_RESOLUTIONS)
        )
        if invalid_temporal_resolutions:
            raise ValidationError(
                f"Invalid temporal resolutions: "
                f"{', '.join(invalid_temporal_resolutions)}."
            )

    def get_reducer(self):
        """Get the reducer based on the configuration."""
        reducer = ee.Reducer.mean()

        reducer_config = self.config.get('reducer', None)
        if reducer_config:
            if reducer_config == 'mean':
                reducer = ee.Reducer.mean()
            elif reducer_config == 'sum':
                reducer = ee.Reducer.sum()
            elif reducer_config == 'median':
                reducer = ee.Reducer.median()
            elif reducer_config == 'mode':
                reducer = ee.Reducer.mode()
            elif reducer_config == 'min':
                reducer = ee.Reducer.min()
            elif reducer_config == 'max':
                reducer = ee.Reducer.max()

        return reducer

    def get_reducer_name(self):
        """Get the name of the reducer based on the configuration."""
        return self.config.get('reducer', 'mean')

    @classmethod
    def has_statistics(cls, variable_name: str) -> bool:
        """Check if the indicator has statistics."""
        try:
            indicator = cls.objects.get(variable_name=variable_name)
            return indicator.source == IndicatorSource.BASE
        except cls.DoesNotExist:
            return False

    class Meta:
        abstract = True

    def __str__(self):
        return self.name


class Indicator(BaseIndicator):
    """Model to represent an indicator used in analysis."""

    name = models.CharField(
        max_length=255,
        unique=True,
        help_text="The name of the indicator."
    )

    class Meta:
        verbose_name = "Indicator"
        verbose_name_plural = "Indicators"
        ordering = ['name']


# class UserIndicator(BaseIndicator):
#     gee_asset_source = models.CharField(max_length=255, blank=True, null=False)
#     band_name = models.CharField(max_length=25, blank=True)
#     visualisation_parameters = models.JSONField(default=dict, blank=True)
#     created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="created_indicators")
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)

class UserGEEAsset(BaseGEEAsset):
    key = models.CharField(
        max_length=50,
        help_text='Key to the asset.'
    )
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="gee_assets")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'User GEE Assets'
        db_table = 'analysis_user_gee_asset'
        unique_together = ('key', 'created_by')


class UserIndicator(BaseIndicator):
    name = models.CharField(
        max_length=255,
        help_text="The name of the indicator."
    )
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="indicators")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def clean(self):
        super().clean()

        # check for name in Indicator
        indicator = Indicator.objects.filter(name=self.name)
        if indicator.exists():
            raise ValidationError(
                f"Invalid name: '{self.name}' already exists!"
            )

    class Meta:
        unique_together = ('name', 'created_by')


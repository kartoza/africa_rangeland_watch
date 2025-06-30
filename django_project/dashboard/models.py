import uuid
import json
import io
import matplotlib.pyplot as plt
import geopandas as gpd
import contextily as ctx
from shapely.geometry import shape

from django.contrib.auth.models import Group, User
from django.db import models
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile

from base.models import Organisation
from analysis.models import UserAnalysisResults, LandscapeCommunity


class Dashboard(models.Model):
    """Model to represent a user-configurable dashboard."""

    PRIVACY_TYPES = [
        ('public', 'Public'),
        ('private', 'Private'),
        ('organisation', 'Organisation'),
        ('restricted', 'Restricted'),
    ]

    uuid = models.UUIDField(
        primary_key=True,
        editable=False,
        default=uuid.uuid4,
        help_text="Unique identifier for the dashboard."
    )

    title = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="created_dashboards",
        null=True,
        blank=True
    )


    organisations = models.ManyToManyField(
        Organisation,
        related_name="dashboards",
        help_text="Organisations associated with this dashboard.",
        blank=True
    )

    groups = models.ManyToManyField(
        Group,
        related_name="dashboards",
        help_text="Groups that have access to this dashboard.",
        blank=True
    )

    users = models.ManyToManyField(
        User,
        related_name="accessible_dashboards",
        help_text="Users who have access to this dashboard.",
        blank=True
    )

    config = models.JSONField(
        blank=True,
        null=True,
        help_text=(
            "Configuration settings for the dashboard stored in JSON format."
        )
    )

    privacy_type = models.CharField(
        max_length=20,
        choices=PRIVACY_TYPES,
        default='private',
        help_text="Privacy level of the dashboard."
    )

    analysis_results = models.ManyToManyField(
        UserAnalysisResults,
        related_name="dashboards",
        blank=True,
        help_text=(
            "Analysis results associated with this dashboard (Deprecated)."
        )
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="The date and time when this dashboard was created."
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="The date and time when this dashboard was last updated."
    )

    metadata = models.JSONField(
        blank=True,
        null=True,
        help_text=(
            "Additional metadata for the dashboard stored in JSON format."
        )
    )

    thumbnail = models.ImageField(
        upload_to='dashboard/thumbnails/',
        blank=True,
        null=True,
        help_text="Thumbnail image of the landscape."
    )

    class Meta:
        verbose_name = "Dashboard"
        verbose_name_plural = "Dashboards"
        ordering = ['-created_at']

    def __str__(self):
        return f"Dashboard {self.uuid} ({self.privacy_type})"
    
    def save(self, *args, **kwargs):
        """Save method to generate and save OSM thumbnail."""
        if not self.thumbnail:
            self.generate_and_save_thumbnail()
        super().save(*args, **kwargs)

    def generate_and_save_thumbnail(self):
        """Generate OSM thumbnail with clearly visible features."""

        print(f'Generating dashbord thumbnail for Dashboard {self.uuid}')

        result_ids = self.widgets.values_list('analysis_result', flat=True)
        if not result_ids.exists():
            print("Result does not exist")
            return None
        result = UserAnalysisResults.objects.filter(id__in=result_ids).first()
        location_ids = [loc['community'] for loc in result.analysis_results['data']['locations']]
        
        communities = LandscapeCommunity.objects.filter(
            community_id__in=location_ids
        )
        
        if not communities.exists():
            print("No communities found")
            return None
                        
        # Create GeoDataFrame
        data = []
        
        for i, community in enumerate(communities):
            try:
                geom_dict = json.loads(community.geometry.geojson)
                geom_shape = shape(geom_dict)
                
                data.append({
                    'geometry': geom_shape,
                    'name': community.community_name or f'Community {i+1}',
                })
            except Exception as e:
                print(f"Error processing community {i}: {e}")
                continue
        
        if not data:
            print("No valid geometries found")
            return None
        
        # Create GeoDataFrame
        gdf = gpd.GeoDataFrame(data, crs='EPSG:4326')
        
        # Convert to Web Mercator for contextily
        gdf_mercator = gdf.to_crs('EPSG:3857')
        
        # Create plot with larger figure
        fig, ax = plt.subplots(1, 1, figsize=(2, 2))
        
        # Plot geometries FIRST (before basemap)
        gdf_mercator.plot(
            ax=ax,
            facecolor='none',
            edgecolor='#0B6623',  # Black outline for contrast
            linewidth=3,  # Thicker lines
            zorder=2  # Ensure features are on top
        )
        
        # Get the bounds for the basemap
                # Get the bounds for the basemap
        bounds = gdf_mercator.total_bounds
        
        # Calculate square bounds
        min_x, min_y, max_x, max_y = bounds
        width = max_x - min_x
        height = max_y - min_y
        
        # Find the larger dimension to make it square
        max_dimension = max(width, height)
        
        # Calculate center point
        center_x = (min_x + max_x) / 2
        center_y = (min_y + max_y) / 2
        
        # Calculate square bounds centered on the original bounds
        half_dimension = max_dimension / 2
        square_bounds = [
            center_x - half_dimension,  # min_x
            center_y - half_dimension,  # min_y
            center_x + half_dimension,  # max_x
            center_y + half_dimension   # max_y
        ]
        
        # Add buffer to square bounds (10% on each side)
        square_dimension = square_bounds[2] - square_bounds[0]
        buffer = square_dimension * 0.1
        
        ax.set_xlim(square_bounds[0] - buffer, square_bounds[2] + buffer)
        ax.set_ylim(square_bounds[1] - buffer, square_bounds[3] + buffer)
        
        # Add OSM basemap
        try:
            ctx.add_basemap(
                ax,
                crs=gdf_mercator.crs.to_string(),
                source=ctx.providers.OpenStreetMap.Mapnik,
                zoom='auto',
                alpha=1.0,
            )
            print("Basemap added successfully")
        except Exception as e:
            print(f"Error adding basemap: {e}")
            # Fallback: just use a simple background
            ax.set_facecolor('lightgray')
        
        # Style the plot
        ax.set_axis_off()  # Remove axes

        # Remove all margins and padding
        plt.subplots_adjust(left=0, right=1, top=1, bottom=0)
        
        # Save to BytesIO
        buffer = io.BytesIO()
        plt.savefig(
            buffer,
            format='png',
            dpi=200,
            bbox_inches='tight',
            facecolor='none',
            edgecolor='none',
            pad_inches=0,
            transparent=True
        )
        buffer.seek(0)
        
        # Save to model
        filename = f"dashboard_{self.uuid}_osm_visible.png"
        self.thumbnail.save(
            filename,
            ContentFile(buffer.getvalue()),
            save=True
        )
        
        plt.close(fig)
        buffer.close()
        
        print(f"OSM thumbnail with visible features saved: {self.thumbnail.url}")
        return self.thumbnail.url



class DashboardWidget(models.Model):
    """Class to represent a widget on a dashboard."""

    dashboard = models.ForeignKey(
        Dashboard,
        on_delete=models.CASCADE,
        related_name="widgets",
        help_text="The dashboard this widget belongs to."
    )
    widget_type = models.CharField(
        max_length=50,
        help_text="Type of the widget (e.g., chart, table, etc.)."
    )
    config = models.JSONField(
        default=dict,
        blank=True,
        null=True,
        help_text=(
            "Configuration settings for the widget stored in JSON format."
        )
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="The date and time when this widget was created."
    )
    updated_at = models.DateTimeField(
        auto_now_add=True,
        help_text="The date and time when this widget was updated."
    )
    analysis_result = models.ForeignKey(
        UserAnalysisResults,
        on_delete=models.CASCADE,
        blank=True,
        null=True,
        help_text="Analysis result associated with this widget."
    )
    order = models.PositiveIntegerField(
        default=0,
        help_text="Order of the widget in the dashboard."
    )
    title = models.CharField(
        max_length=255,
        help_text="Title of the widget."
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Description of the widget."
    )
    text_content = models.TextField(
        blank=True,
        null=True,
        help_text="Text content for the widget, if applicable."
    )

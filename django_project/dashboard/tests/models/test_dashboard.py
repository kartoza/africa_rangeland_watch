import json
import uuid
from unittest.mock import patch, MagicMock, Mock
from io import BytesIO
from PIL import Image

from django.test import TestCase
from django.contrib.gis.geos import Polygon
from django.contrib.auth.models import User, Group
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage

import geopandas as gpd
from shapely.geometry import shape
import matplotlib.pyplot as plt
import contextily as ctx

from dashboard.models import Dashboard, DashboardWidget
from base.models import Organisation
from analysis.models import UserAnalysisResults, LandscapeCommunity, Landscape


class DashboardThumbnailTest(TestCase):
    """Test cases for Dashboard thumbnail generation."""

    fixtures = [
        '1.project.json',
        '2.landscape.json',
        '3.gee_asset.json'
    ]

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        # Create test dashboard
        self.dashboard = Dashboard.objects.create(
            title='Test Dashboard',
            created_by=self.user,
            privacy_type='private'
        )

        landscape_1 = Landscape.objects.get(name='Bahine NP')
        self.community_1 = LandscapeCommunity.objects.create(
            landscape=landscape_1,
            community_id='000001',
            community_name='Community 1',
            geometry=Polygon((
                (0.0, 0.0),
                (1.0, 1.0),
                (1.0, 0.0),
                (0.0, 0.0)
            ))
        )

    def tearDown(self):
        """Clean up after tests."""
        if self.dashboard.thumbnail:
            default_storage.delete(self.dashboard.thumbnail.name)

    def test_generate_thumbnail_no_widgets(self):
        """Test generate_and_save_thumbnail when no widgets exist."""        
        result = self.dashboard.generate_and_save_thumbnail()
        
        self.assertIsNone(result)

    @patch('dashboard.models.LandscapeCommunity.objects.filter')
    @patch('dashboard.models.UserAnalysisResults.objects.filter')
    def test_generate_thumbnail_no_communities(self, mock_analysis_filter, mock_community_filter):
        """Test generate_and_save_thumbnail when no communities exist."""
        mock_widgets = MagicMock()
        self.dashboard.widgets.set(mock_widgets)
        mock_widgets.values_list.return_value.exists.return_value = True
        mock_widgets.values_list.return_value = [1, 2, 3]
        
        mock_analysis_result = MagicMock()
        mock_analysis_result.analysis_results = {
            'data': {
                'locations': [
                    {'community': 'comm1'},
                    {'community': 'comm2'}
                ]
            }
        }
        mock_analysis_filter.return_value.first.return_value = mock_analysis_result
        
        mock_community_filter.return_value.exists.return_value = False
        
        result = self.dashboard.generate_and_save_thumbnail()
        
        self.assertIsNone(result)

    @patch('dashboard.models.LandscapeCommunity.objects.filter')
    @patch('dashboard.models.UserAnalysisResults.objects.filter')
    def test_generate_thumbnail_invalid_geometry(self, mock_analysis_filter, mock_community_filter):
        """Test generate_and_save_thumbnail with invalid geometry data."""
        mock_widgets = MagicMock()
        self.dashboard.widgets.set(mock_widgets)
        mock_widgets.values_list.return_value.exists.return_value = True
        mock_widgets.values_list.return_value = [1, 2, 3]
        
        mock_analysis_result = MagicMock()
        mock_analysis_result.analysis_results = {
            'data': {
                'locations': [{'community': 'comm1'}]
            }
        }
        mock_analysis_filter.return_value.first.return_value = mock_analysis_result
        
        # Mock community with invalid geometry
        mock_community = MagicMock()
        mock_community.community_name = 'Test Community'
        mock_geometry = MagicMock()
        mock_geometry.geojson = 'invalid json'
        mock_community.geometry = mock_geometry
        
        mock_community_queryset = MagicMock()
        mock_community_queryset.exists.return_value = True
        mock_community_queryset.__iter__ = lambda x: iter([mock_community])
        mock_community_filter.return_value = mock_community_queryset
        
        result = self.dashboard.generate_and_save_thumbnail()
        
        self.assertIsNone(result)

    @patch('dashboard.models.plt.close')
    @patch('dashboard.models.plt.savefig')
    @patch('dashboard.models.plt.subplots_adjust')
    @patch('dashboard.models.plt.subplots')
    @patch('dashboard.models.ctx.add_basemap')
    @patch('dashboard.models.gpd.GeoDataFrame')
    @patch('dashboard.models.LandscapeCommunity.objects.filter')
    @patch('dashboard.models.UserAnalysisResults.objects.filter')
    def test_generate_thumbnail_success(self, mock_analysis_filter, mock_community_filter, 
                                      mock_geodataframe, mock_basemap, mock_subplots, 
                                      mock_subplots_adjust, mock_savefig, mock_close):
        """Test successful thumbnail generation."""
        widget = DashboardWidget.objects.create(
            dashboard=self.dashboard
        )
        
        mock_analysis_result = MagicMock()
        mock_analysis_result.analysis_results = {
            'data': {
                'locations': [
                    {'community': 'comm1'},
                    {'community': 'comm2'}
                ]
            }
        }
        mock_analysis_filter.return_value.first.return_value = mock_analysis_result
        
        # Mock communities with geometry
        mock_community = MagicMock()
        mock_community.community_name = 'Test Community'
        mock_geometry = MagicMock()
        mock_geometry.geojson = json.dumps({
            'type': 'Polygon',
            'coordinates': [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
        })
        mock_community.geometry = mock_geometry
        
        mock_community_queryset = MagicMock()
        mock_community_queryset.exists.return_value = True
        mock_community_queryset.__iter__ = lambda x: iter([mock_community])
        mock_community_filter.return_value = mock_community_queryset
        
        # Mock GeoDataFrame
        mock_gdf = MagicMock()
        mock_gdf.to_crs.return_value = mock_gdf
        mock_gdf.total_bounds = [0, 0, 1, 1]
        mock_gdf.crs.to_string.return_value = 'EPSG:3857'
        mock_geodataframe.return_value = mock_gdf
        
        # Mock matplotlib
        mock_fig = MagicMock()
        mock_ax = MagicMock()
        mock_subplots.return_value = (mock_fig, mock_ax)
        
        # Mock savefig to write to BytesIO
        def mock_savefig_side_effect(buffer, **kwargs):
            # Write minimal valid PNG data
            buffer.write(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x12IDATx\x9cc\x00\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82')
            buffer.seek(0)
        
        mock_savefig.side_effect = mock_savefig_side_effect
        
        result = self.dashboard.generate_and_save_thumbnail()
        
        # Verify the thumbnail was created
        self.assertIsNotNone(result)
        self.assertTrue(self.dashboard.thumbnail.name.startswith('dashboard/thumbnails/'))
        self.assertTrue(self.dashboard.thumbnail.name.endswith('.png'))
        
        # Verify method calls
        mock_geodataframe.assert_called_once()
        mock_gdf.to_crs.assert_called_with('EPSG:3857')
        mock_subplots.assert_called_once_with(1, 1, figsize=(2, 2))
        mock_basemap.assert_called_once()
        mock_savefig.assert_called_once()
        mock_close.assert_called_once()

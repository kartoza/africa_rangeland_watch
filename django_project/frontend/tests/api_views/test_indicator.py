# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Unit tests for BaseMap API.
"""

from django.urls import reverse

from core.tests.common import BaseAPIViewTest
from unittest.mock import patch, MagicMock
from analysis.models import (
    GEEAssetType,
    Indicator, 
    UserIndicator,
    IndicatorSource,
    UserGEEAsset
)
from frontend.models import AssetUploadItem
from frontend.api_views.indicator import (
    IndicatorAPI,
    UserIndicatorAPI,
    FetchBandAPI,
    GetSignedURLUploadAPI
)


class IndicatorAPITest(BaseAPIViewTest):
    """Indicator api test case."""

    fixtures = [
        '4.indicator.json'
    ]

    def run_and_check_default_indicator(self, request=None):
        """Run and check test result for default indicator"""
        view = IndicatorAPI.as_view()
        request = request or self.factory.get(
            reverse('frontend-api:indicator')
        )
        response = view(request)
        self.assertEqual(response.status_code, 200)

        item = response.data[0]
        self.assertIn('name', item)
        self.assertIn('variable', item)
        self.assertIn('analysis_types', item)
        self.assertIn('temporal_resolutions', item)
        self.assertIn('source', item)

        return response.data

    def test_get_indicator_anonymos_user(self):
        """Test get indicator API with anonymous user."""
        response_data = self.run_and_check_default_indicator()
        self.assertEqual(
            len(response_data),
            Indicator.objects.filter(
                is_active=True,
            ).count()
        )

    def test_get_indicator_auth_user_only_asset_added(self):
        """Test get indicator API with authenticated user.

        In this test, only UserGeeAsset is added. UserIndicator 
        is not configured. Hence, only default Indicator will be 
        returned.
        """

        UserGEEAsset.objects.create(
            metadata={
                "end_date": "2025-08-11", 
                "start_date": "2002-01-1",
                "band_names": ["tmax", "tmin"]
            },
            source="project/user/asset",
            type=GEEAssetType.IMAGE_COLLECTION,
            key="temperature-asset",
            created_by=self.user
        )
        request = self.factory.get(
            reverse('frontend-api:indicator')
        )
        self._force_authenticate(request, self.user)

        response_data = self.run_and_check_default_indicator(
            request
        )
        # Check only default Indicators returned
        self.assertEqual(
            len(response_data),
            Indicator.objects.filter(
                is_active=True,
            ).count()
        )

    def test_get_indicator_auth_user(self):
        """Test get indicator API with authenticated user.

        In this test, only UserGeeAsset and UserIndicator were added. 
        Hence, Indicator and UserIndicator will be returned.
        """

        user_gee = UserGEEAsset.objects.create(
            metadata={
                "end_date": "2025-08-11", 
                "start_date": "2002-01-1",
                "band_names": ["tmax", "tmin"]
            },
            source="project/user/asset",
            type=GEEAssetType.IMAGE_COLLECTION,
            key="temperature-asset",
            created_by=self.user
        )
        user_indicator = UserIndicator.objects.create(
            variable_name="Custom Temperature",
            source=IndicatorSource.OTHER,
            analysis_types=["Temporal", "Spatial", "Baseline"],
            temporal_resolutions=["Annual", "Monthly", "Quarterly"],
            metadata={
                "max": 50, 
                "min": -40, 
                "palette": ["#ADD8E6", "#008000", "#FFFF00", "#FFA500", "#FF0000", "#800080"]
            },
            config={"asset_keys": ["temperatur-asset"]},
            name="Custom Temperature",
            created_by=self.user
        )
        request = self.factory.get(
            reverse('frontend-api:indicator')
        )
        self._force_authenticate(request, self.user)

        response_data = self.run_and_check_default_indicator(
            request
        )
        # Check only default Indicators returned
        self.assertEqual(len(response_data), Indicator.objects.count() + 1)

        item = response_data[-1]
        self.assertEqual(
            item,
            {
                'name': user_indicator.name, 
                'description': user_indicator.description,
                'variable': user_indicator.variable_name, 
                'analysis_types': user_indicator.analysis_types, 
                'temporal_resolutions': user_indicator.temporal_resolutions, 
                'source': 'other',
                'config': user_indicator.config,
                'metadata': user_indicator.metadata
            }
        )


class UserIndicatorAPITest(BaseAPIViewTest):
    """Test case for UserIndicatorAPI."""

    pass


class FetchBandAPITest(BaseAPIViewTest):
    """Test case for FetchBandAPI."""

    def test_fetch_band_api_anonymous_user(self):
        """Test FetchBandAPI with anonymous user should fail."""
        view = FetchBandAPI.as_view()
        request = self.factory.post(
            reverse('frontend-api:fetch-bands'),
            data={'gee_asset_id': '', 'session_id': '12345'},
            content_type='application/json'
        )
        response = view(request)
        self.assertEqual(response.status_code, 401)

    @patch('frontend.api_views.indicator.initialize_engine_analysis')
    @patch('ee.Image')
    def test_fetch_band_api_gee_asset_id(self, mock_image, mock_init_ee):
        """Test FetchBandAPI with gee_asset_id."""
        mock_getInfo = MagicMock()
        mock_bandNames = MagicMock()
        mock_image.return_value = mock_bandNames
        mock_bandNames.bandNames.return_value = mock_getInfo
        mock_getInfo.getInfo.return_value = ['B1', 'B2', 'B3']
        view = FetchBandAPI.as_view()
        request = self.factory.post(
            reverse('frontend-api:fetch-bands'),
            data={'gee_asset_id': 'valid-id', 'session_id': ''},
            content_type='application/json'
        )
        self._force_authenticate(request, self.user)
        response = view(request)
        self.assertEqual(response.status_code, 200)
        self.assertIn('bands', response.data)
        mock_init_ee.assert_called_once()
        self.assertEqual(response.data['bands'], ['B1', 'B2', 'B3'])

    @patch('frontend.api_views.indicator.rasterio_read_gcs')
    @patch('frontend.api_views.indicator.get_gcs_client')
    def test_fetch_band_api_session_id(
        self, mock_get_gcs_client, mock_rasterio_read_gcs
    ):
        """Test FetchBandAPI with session_id."""
        session_id = 'session-12345'
        # Create asset upload item
        AssetUploadItem.objects.create(
            file_name='test_file.tif',
            file_size=1024,
            session=session_id,
            upload_path='path/to/file.tif',
            uploaded_by=self.user
        )

        mock_bucket = MagicMock()
        mock_blob = MagicMock()
        mock_get_gcs_client.return_value = mock_bucket
        mock_bucket.blob.return_value = mock_blob
        mock_blob.exists.return_value = True

        class MockDataset:
            count = 3
            descriptions = ['Red Band', 'Green@Band', '0blue']

        mock_enter = MagicMock()
        mock_enter.__enter__.return_value = MockDataset()
        mock_rasterio_read_gcs.return_value = mock_enter

        view = FetchBandAPI.as_view()
        request = self.factory.post(
            reverse('frontend-api:fetch-bands'),
            data={'gee_asset_id': '', 'session_id': session_id},
            content_type='application/json'
        )
        self._force_authenticate(request, self.user)
        response = view(request)
        self.assertEqual(response.status_code, 200)
        self.assertIn('bands', response.data)
        self.assertIn('files', response.data)
        mock_get_gcs_client.assert_called_once()
        mock_rasterio_read_gcs.assert_called_once()
        self.assertEqual(
            response.data['bands'],
            ['Red_Band', 'GreenBand', 'band_0blue']
        )


class GetSignedURLUploadAPITest(BaseAPIViewTest):
    """Test case for GetSignedURLUploadAPI."""

    def test_get_signed_url_upload_api_anonymous_user(self):
        """Test GetSignedURLUploadAPI with anonymous user should fail."""
        view = GetSignedURLUploadAPI.as_view()
        request = self.factory.post(
            reverse('frontend-api:upload-get-signed-url'),
            data={'filename': 'testfile.tif'},
            content_type='application/json'
        )
        response = view(request)
        self.assertEqual(response.status_code, 401)

    @patch('frontend.api_views.indicator.get_gcs_client')
    def test_get_signed_url_upload_api_mocked(self, mock_get_gcs_client):
        """Test GetSignedURLUploadAPI with mocked GCS client and blob."""
        mock_bucket = MagicMock()
        mock_blob = MagicMock()
        mock_generate_signed_url = MagicMock(
            return_value='https://signed-url.example.com'
        )

        mock_get_gcs_client.return_value = mock_bucket
        mock_bucket.blob.return_value = mock_blob
        mock_blob.generate_signed_url = mock_generate_signed_url

        view = GetSignedURLUploadAPI.as_view()
        request = self.factory.post(
            reverse('frontend-api:upload-get-signed-url'),
            data={
                'fileName': 'mockfile.tif',
                'contentType': 'image/tiff',
                'contentLength': 2048
            },
            content_type='application/json'
        )
        self._force_authenticate(request, self.user)
        response = view(request)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(
            response.data['signedUrl'],
            'https://signed-url.example.com'
        )
        self.assertEqual(
            response.data['deleteUrl'],
            'https://signed-url.example.com'
        )
        self.assertEqual(mock_blob.generate_signed_url.call_count, 2)

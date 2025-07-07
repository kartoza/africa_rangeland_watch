from django.test import TestCase
from django.contrib.auth.models import User
from unittest.mock import patch
from analysis.models import UserAnalysisResults, GEEAsset, GEEAssetType

class UserAnalysisResultsTest(TestCase):

    def setUp(self):
        self.user = User.objects.create(username='testuser', password='12345')
        self.analysis_result = UserAnalysisResults.objects.create(
            created_by=self.user,
            analysis_results={"result": "test"},
            raster_output_path='path/to/raster/output'
        )

    @patch('analysis.utils.delete_gdrive_file')
    def test_delete_gdrive_file_called_on_delete(
        self, mock_delete_gdrive_file
    ):
        self.analysis_result.delete()
        mock_delete_gdrive_file.assert_called_once_with(
            'path/to/raster/output'
        )

    def test_get_baci_description(self):
        """Test that the BACI period is correctly formatted."""
        analysis_result = UserAnalysisResults.objects.create(
            created_by=self.user,
            analysis_results={
                "result": "test",
                "data": {
                    "analysisType": "BACI",
                    "temporalResolution": "Quarterly",
                    "period": {
                        "year": 2020,
                        "quarter": 1
                    },
                    "comparisonPeriod": {
                        "year": [2022],
                        "quarter": [2]
                    }
                }
            },
            raster_output_path='path/to/raster/output'
        )
        self.assertEqual(
            analysis_result.description,
            "Analysis between Q1 2020 and Q2 2022"
        )


class GEEAssetTest(TestCase):

    def setUp(self):
        self.asset = GEEAsset.objects.create(
            key='test_asset',
            source='path/to/asset',
            type=GEEAssetType.IMAGE,
            metadata={
                'start_date': '2023-01-01',
                'end_date': '2023-12-31'
            }
        )

    def test_is_date_within_asset_period_within_range(self):
        result = GEEAsset.is_date_within_asset_period(
            'test_asset',
            '2023-06-15'
        )
        self.assertTrue(result)

    def test_is_date_within_asset_period_outside_range(self):
        result = GEEAsset.is_date_within_asset_period(
            'test_asset',
            '2024-01-01'
        )
        self.assertFalse(result)

    def test_is_date_within_asset_period_no_start_date(self):
        self.asset.metadata.pop('start_date')
        self.asset.save()
        with self.assertRaises(ValueError):
            GEEAsset.is_date_within_asset_period('test_asset', '2023-06-15')

    def test_is_date_within_asset_period_no_end_date(self):
        self.asset.metadata.pop('end_date')
        self.asset.save()
        with self.assertRaises(ValueError):
            GEEAsset.is_date_within_asset_period('test_asset', '2023-06-15')

    def test_is_date_within_asset_period_asset_not_found(self):
        with self.assertRaises(KeyError):
            GEEAsset.is_date_within_asset_period(
                'non_existent_asset',
                '2023-06-15'
            )

    def test_is_date_within_asset_period_same_as_end_date(self):
        result = GEEAsset.is_date_within_asset_period(
            'test_asset',
            '2023-12-31'
        )
        self.assertTrue(result)

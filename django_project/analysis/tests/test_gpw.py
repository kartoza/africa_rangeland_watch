from django.test import TestCase
from unittest.mock import patch, MagicMock
import datetime

from analysis.models import Indicator, GEEAsset
from analysis.external.gpw import (
    gpw_annual_temporal_analysis,
    gpw_spatial_analysis_dict
)


class TestAnalysisGPW(TestCase):
    """Test suite for GPW analysis functions."""

    fixtures = [
        '3.gee_asset.json',
        '4.indicator.json',
    ]

    @patch('analysis.external.gpw.ee.ImageCollection')
    def test_gpw_spatial_analysis_dict(self, mock_image_collection):
        """ Test the gpw_spatial_analysis_dict function."""
        # Setup mocks
        mock_img_instance = MagicMock()
        mock_img_instance.filterDate.return_value = mock_img_instance
        mock_img_instance.select.return_value = mock_img_instance
        mock_img_instance.filterBounds.return_value = mock_img_instance
        mock_img_instance.mean.side_effect = (
            lambda: f"mean_{mock_img_instance}"
        )
        mock_image_collection.return_value = mock_img_instance

        countries = MagicMock()
        start_date = datetime.date(2020, 1, 1)
        end_date = datetime.date(2021, 1, 1)

        result = gpw_spatial_analysis_dict(countries, start_date, end_date)

        self.assertIn('Probabilities of Cultivated Grasslands', result)
        self.assertIn(
            'Probabilities of Natural/Semi-Natural Grasslands',
            result
        )
        self.assertTrue(
            result['Probabilities of Cultivated Grasslands']
            .startswith('mean_')
        )
        self.assertTrue(
            result['Probabilities of Natural/Semi-Natural Grasslands']
            .startswith('mean_')
        )

        # Check that ImageCollection was called with correct sources
        mock_image_collection.assert_any_call(
            'projects/global-pasture-watch/assets/ggc-30m/'
            'v1/cultiv-grassland_p'
        )
        mock_image_collection.assert_any_call(
            'projects/global-pasture-watch/assets/ggc-30m/'
            'v1/nat-semi-grassland_p'
        )

    @patch('analysis.external.gpw.ee.ImageCollection')
    @patch('analysis.external.gpw.ee.List')
    @patch('analysis.external.gpw.ee.Filter.inList')
    def test_gpw_annual_temporal_analysis(
        self, mock_filter, mock_list, mock_image_collection
    ):
        """Test the gpw_annual_temporal_analysis function."""
        # Setup dates
        start_date = datetime.date(2020, 1, 1)
        test_years = [2020, 2021]

        # Setup ee.ImageCollection mock
        mock_img_col = MagicMock()
        mock_img_col.filterDate.return_value = mock_img_col
        mock_img_col.map.side_effect = lambda fn: mock_img_col
        mock_img_col.flatten.return_value = mock_img_col
        mock_img_col.select.return_value = mock_img_col
        mock_img_col.sort.return_value = mock_img_col
        mock_img_col.merge.side_effect = lambda other: mock_img_col
        mock_img_col.filter.return_value = mock_img_col
        mock_img_col.getInfo.side_effect = (
            lambda: [
                {'Name': 'A', 'Test Indicator': 1, 'year': 2020, 'month': 1}
            ]
        )
        mock_image_collection.return_value = mock_img_col

        # Setup select_geo and analysis_cache mocks
        select_geo = MagicMock()
        analysis_cache = MagicMock()
        analysis_cache.create_analysis_cache.side_effect = (
            lambda data: {'result': data}
        )

        result = gpw_annual_temporal_analysis(
            variable='Grassland dominant class',
            start_date=start_date,
            test_years=test_years,
            select_geo=select_geo,
            analysis_cache=analysis_cache
        )

        self.assertIsInstance(result, dict)
        self.assertIn('result', result)
        # Check that ImageCollection was created with correct source
        mock_image_collection.assert_called_with(
            'projects/global-pasture-watch/assets/ggc-30m/v1/grassland_c'
        )
        mock_list.assert_called_once()
        mock_filter.assert_called_once()

    def test_gpw_annual_temporal_analysis_invalid_variable(self):
        """Test gpw_annual_temporal_analysis with an invalid variable."""
        with self.assertRaises(ValueError) as context:
            gpw_annual_temporal_analysis(
                variable='Invalid Variable',
                start_date=datetime.date(2020, 1, 1),
                test_years=[2020, 2021],
                select_geo=MagicMock(),
                analysis_cache=MagicMock()
            )
            self.assertEqual(
                str(context.exception),
                'Invalid variable name: Invalid Variable'
            )

        # missing asset_keys
        indicator = Indicator.objects.get(
            name='Probabilities of Cultivated Grasslands'
        )
        indicator.config['asset_keys'] = []
        indicator.save()
        with self.assertRaises(ValueError) as context:
            gpw_annual_temporal_analysis(
                variable='Probabilities of Cultivated Grasslands',
                start_date=datetime.date(2020, 1, 1),
                test_years=[2020, 2021],
                select_geo=MagicMock(),
                analysis_cache=MagicMock()
            )
            self.assertEqual(
                str(context.exception),
                'No asset keys found for indicator: '
                'Probabilities of Cultivated Grasslands'
            )

        # invalid asset_key
        indicator.config['asset_keys'] = ['invalid_asset_key']
        indicator.save()
        with self.assertRaises(ValueError) as context:
            gpw_annual_temporal_analysis(
                variable='Probabilities of Cultivated Grasslands',
                start_date=datetime.date(2020, 1, 1),
                test_years=[2020, 2021],
                select_geo=MagicMock(),
                analysis_cache=MagicMock()
            )
            self.assertEqual(
                str(context.exception),
                'GEEAsset with key invalid_asset_key not found.'
            )

        # missing band_names
        indicator.config['asset_keys'] = ['prob_cultivated_grassland']
        indicator.save()
        gee_asset = GEEAsset.objects.get(
            key='prob_cultivated_grassland'
        )
        gee_asset.metadata['band_names'] = []
        gee_asset.save()
        with self.assertRaises(ValueError) as context:
            gpw_annual_temporal_analysis(
                variable='Probabilities of Cultivated Grasslands',
                start_date=datetime.date(2020, 1, 1),
                test_years=[2020, 2021],
                select_geo=MagicMock(),
                analysis_cache=MagicMock()
            )
            self.assertEqual(
                str(context.exception),
                'No band names found for GEEAsset prob_cultivated_grassland.'
            )

import datetime
from django.test import TestCase
from analysis.analysis import (
    spatial_get_date_filter,
    validate_spatial_date_range_filter
)


class TestSpatialDateFilter(TestCase):

    fixtures = [
        '2.gee_asset.json'
    ]

    def test_spatial_get_date_filter_with_valid_dates(self):
        analysis_dict = {
            'Spatial': {
                'start_year': 2020,
                'end_year': 2021
            }
        }
        filter_start_date, filter_end_date = spatial_get_date_filter(
            analysis_dict
        )
        self.assertEqual(
            filter_start_date,
            datetime.date.fromisoformat('2020-01-01')
        )
        self.assertEqual(
            filter_end_date,
            datetime.date.fromisoformat('2021-01-01')
        )

    def test_spatial_get_date_filter_with_no_dates(self):
        analysis_dict = {
            'Spatial': {}
        }
        filter_start_date, filter_end_date = spatial_get_date_filter(
            analysis_dict
        )
        self.assertIsNone(filter_start_date)
        self.assertIsNone(filter_end_date)

    def test_spatial_get_date_filter_with_only_start_date(self):
        analysis_dict = {
            'Spatial': {
                'start_year': 2020
            }
        }
        filter_start_date, filter_end_date = spatial_get_date_filter(
            analysis_dict
        )
        self.assertEqual(
            filter_start_date,
            datetime.date.fromisoformat('2020-01-01')
        )
        self.assertIsNone(filter_end_date)

    def test_spatial_get_date_filter_with_only_end_date(self):
        analysis_dict = {
            'Spatial': {
                'end_year': 2021
            }
        }
        filter_start_date, filter_end_date = spatial_get_date_filter(
            analysis_dict
        )
        self.assertIsNone(filter_start_date)
        self.assertEqual(
            filter_end_date, datetime.date.fromisoformat('2021-01-01')
        )

    def test_validate_spatial_date_range_filter_with_valid_range(self):
        variable = 'EVI'
        start_date = datetime.date(2020, 1, 1)
        end_date = datetime.date(2021, 1, 1)
        valid, _, _ = validate_spatial_date_range_filter(
            variable, start_date, end_date
        )
        self.assertTrue(valid)

    def test_validate_spatial_date_range_filter_with_invalid_variable(self):
        variable = 'InvalidVariable'
        start_date = datetime.date(2020, 1, 1)
        end_date = datetime.date(2021, 1, 1)
        valid, _, _ = validate_spatial_date_range_filter(
            variable, start_date, end_date
        )
        self.assertTrue(valid)

    def test_validate_spatial_date_range_filter_with_invalid_ranges(self):
        variable = 'EVI'
        start_date = datetime.date(1999, 1, 1)
        end_date = datetime.date(2020, 1, 1)
        valid, _, _ = validate_spatial_date_range_filter(
            variable, start_date, end_date
        )
        self.assertFalse(valid)

    def test_validate_spatial_date_range_filter_with_empty_dates(self):
        variable = 'EVI'
        start_date = None
        end_date = None
        valid, _, _ = validate_spatial_date_range_filter(
            variable, start_date, end_date
        )
        self.assertTrue(valid)

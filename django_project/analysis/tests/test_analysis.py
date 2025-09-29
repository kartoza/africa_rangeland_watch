import datetime
from unittest.mock import patch, MagicMock
from django.test import TestCase
from analysis.analysis import (
    spatial_get_date_filter,
    validate_spatial_date_range_filter,
    calculate_baci,
    InputLayer
)


class TestSpatialDateFilter(TestCase):

    fixtures = [
        '3.gee_asset.json'
    ]

    def test_spatial_get_date_filter_annual(self):
        analysis_dict = {
            'landscape': '',
            'analysisType': 'Spatial',
            'variable': 'NDVI',
            't_resolution': 'Annual',
            'Temporal': {
                'Annual': {
                    'ref': '',
                    'test': ''
                },
                'Quarterly': {
                    'ref': '',
                    'test': ''
                }
            },
            'Spatial': {
                'Annual': {
                    'ref': 2020,
                    'test': [2021]
                },
                'Quarterly': {
                    'ref': '',
                    'test': ''
                },
                'Monthly': {
                    'ref': '',
                    'test': ''
                }
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
            datetime.date.fromisoformat('2022-01-01')
        )

    def test_spatial_get_date_filter_quarterly(self):
        analysis_dict = {
            'landscape': '',
            'analysisType': 'Spatial',
            'variable': 'NDVI',
            't_resolution': 'Quarterly',
            'Temporal': {
                'Annual': {
                    'ref': '',
                    'test': ''
                },
                'Quarterly': {
                    'ref': '',
                    'test': ''
                }
            },
            'Spatial': {
                'Annual': {
                    'ref': 2020,
                    'test': [2021]
                },
                'Quarterly': {
                    'ref': '2',
                    'test': ['3']
                },
                'Monthly': {
                    'ref': '',
                    'test': ''
                }
            }
        }

        filter_start_date, filter_end_date = spatial_get_date_filter(
            analysis_dict
        )
        self.assertEqual(
            filter_start_date,
            datetime.date.fromisoformat('2020-04-01')
        )
        self.assertEqual(
            filter_end_date,
            datetime.date.fromisoformat('2021-10-01')
        )

    def test_spatial_get_date_filter_monthly(self):
        analysis_dict = {
            'landscape': '',
            'analysisType': 'Spatial',
            'variable': 'NDVI',
            't_resolution': 'Monthly',
            'Temporal': {
                'Annual': {
                    'ref': '',
                    'test': ''
                },
                'Quarterly': {
                    'ref': '',
                    'test': ''
                }
            },
            'Spatial': {
                'Annual': {
                    'ref': 2020,
                    'test': [2021]
                },
                'Quarterly': {
                    'ref': '',
                    'test': ''
                },
                'Monthly': {
                    'ref': '4',
                    'test': ['6']
                }
            }
        }

        filter_start_date, filter_end_date = spatial_get_date_filter(
            analysis_dict
        )
        self.assertEqual(
            filter_start_date,
            datetime.date.fromisoformat('2020-04-01')
        )
        self.assertEqual(
            filter_end_date,
            datetime.date.fromisoformat('2021-07-01')
        )

    def test_spatial_get_date_filter_with_no_dates(self):
        analysis_dict = {
            'landscape': '',
            'analysisType': 'Spatial',
            'variable': 'NDVI',
            't_resolution': 'Monthly',
            'Temporal': {
                'Annual': {
                    'ref': '',
                    'test': ''
                },
                'Quarterly': {
                    'ref': '',
                    'test': ''
                }
            },
            'Spatial': {}
        }
        filter_start_date, filter_end_date = spatial_get_date_filter(
            analysis_dict
        )
        self.assertIsNone(filter_start_date)
        self.assertIsNone(filter_end_date)

    def test_spatial_get_date_filter_with_only_start_date(self):
        analysis_dict = {
            'landscape': '',
            'analysisType': 'Spatial',
            'variable': 'NDVI',
            't_resolution': 'Monthly',
            'Temporal': {
                'Annual': {
                    'ref': '',
                    'test': ''
                },
                'Quarterly': {
                    'ref': '',
                    'test': ''
                }
            },
            'Spatial': {
                'Annual': {
                    'ref': 2020,
                    'test': []
                },
                'Quarterly': {
                    'ref': '',
                    'test': ''
                },
                'Monthly': {
                    'ref': '1',
                    'test': ''
                }
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
            'landscape': '',
            'analysisType': 'Spatial',
            'variable': 'NDVI',
            't_resolution': 'Monthly',
            'Temporal': {
                'Annual': {
                    'ref': '',
                    'test': ''
                },
                'Quarterly': {
                    'ref': '',
                    'test': ''
                }
            },
            'Spatial': {
                'Annual': {
                    'ref': '',
                    'test': ['2021']
                },
                'Quarterly': {
                    'ref': '',
                    'test': ''
                },
                'Monthly': {
                    'ref': '',
                    'test': '4'
                }
            }
        }
        filter_start_date, filter_end_date = spatial_get_date_filter(
            analysis_dict
        )
        self.assertIsNone(filter_start_date)
        self.assertEqual(
            filter_end_date, datetime.date.fromisoformat('2021-05-01')
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


class TestBACIAnalysis(TestCase):
    
    fixtures = [
        '3.gee_asset.json'
    ]

    def setUp(self):
        self.before_dict = {
            'year': 2015,
            'quarter': None,
            'month': 1,
        }
        self.after_dict = {
            'year': 2019,
            'quarter': None,
            'month': 6,
        }
        self.locations = [
            {
                'lat': -23.035376296859013,
                'lon': 32.192377992891466,
                'community': '00000000000000000161',
                'communityName': 'LNP-BNP corridor',
                'communityFeatureId': 430
            }
        ]
        self.reference_layer_geom = {
            'type': 'Polygon',
            'coordinates': [
                [
                    [32.192377992891466, -23.035376296859013],
                    [32.192377992891466, -23.035376296859013],
                    [32.192377992891466, -23.035376296859013],
                    [32.192377992891466, -23.035376296859013]
                ]
            ]
        }

    @patch('analysis.analysis.ee')
    def test_calculate_baci(self, mock_ee):
        """Test BACI calculation with valid inputs."""
        baci_result = calculate_baci(
            self.locations,
            self.reference_layer_geom,
            'NDVI',
            'Monthly',
            self.before_dict,
            self.after_dict
        )
        # get_s3_cloud_masked 3 times
        # quarterly_medians 1 time
        # multiply by 2 for before and after
        self.assertEqual(mock_ee.ImageCollection.call_count, 8)
        # Assert that baci_result is a MagicMock (from the patched ee)
        self.assertIsInstance(baci_result, MagicMock)
        # Optionally, check the name/id of the MagicMock for more specificity
        self.assertIn("ee.Join.inner().apply().map()", str(baci_result))
        # Ensure the patched ee was called as expected
        self.assertTrue(mock_ee.Join.inner.called)
        self.assertTrue(mock_ee.Join.inner().apply.called)
        self.assertTrue(mock_ee.Join.inner().apply().map.called)

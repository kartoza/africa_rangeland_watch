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


class TestSafeIntHelper(TestCase):
    """Test the _safe_int helper function."""

    def test_safe_int_with_integer(self):
        """Test _safe_int with integer input."""
        from analysis.analysis import _safe_int
        self.assertEqual(_safe_int(2021), 2021)
        self.assertEqual(_safe_int(0), 0)
        self.assertEqual(_safe_int(-5), -5)

    def test_safe_int_with_string(self):
        """Test _safe_int with string input."""
        from analysis.analysis import _safe_int
        self.assertEqual(_safe_int('2021'), 2021)
        self.assertEqual(_safe_int('0'), 0)

    def test_safe_int_with_single_element_list(self):
        """Test _safe_int with single-element list."""
        from analysis.analysis import _safe_int
        self.assertEqual(_safe_int([2021]), 2021)
        self.assertEqual(_safe_int(['2021']), 2021)

    def test_safe_int_with_nested_list(self):
        """Test _safe_int with nested list."""
        from analysis.analysis import _safe_int
        self.assertEqual(_safe_int([[2021]]), 2021)
        self.assertEqual(_safe_int([[[2021]]]), 2021)

    def test_safe_int_with_none(self):
        """Test _safe_int with None input."""
        from analysis.analysis import _safe_int
        self.assertIsNone(_safe_int(None))
        self.assertEqual(_safe_int(None, default=0), 0)
        self.assertEqual(_safe_int(None, default=2020), 2020)

    def test_safe_int_with_empty_string(self):
        """Test _safe_int with empty string."""
        from analysis.analysis import _safe_int
        self.assertIsNone(_safe_int(''))
        self.assertEqual(_safe_int('', default=0), 0)

    def test_safe_int_with_empty_list(self):
        """Test _safe_int with empty list."""
        from analysis.analysis import _safe_int
        self.assertIsNone(_safe_int([]))
        self.assertEqual(_safe_int([], default=2020), 2020)


class TestBACIArrayValueHandling(TestCase):
    """Test BACI analysis handles both array and single values."""

    fixtures = ['3.gee_asset.json']

    def setUp(self):
        """Set up test data."""
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
    @patch('analysis.analysis.AnalysisResultsCache')
    def test_baci_with_array_reference_period(
        self, mock_cache_class, mock_ee
    ):
        """Test BACI analysis with array format for reference period."""
        from analysis.analysis import run_analysis
        mock_cache = MagicMock()
        analysis_dict = {
            'landscape': 'test',
            'analysisType': 'BACI',
            'variable': 'NDVI',
            't_resolution': 'Annual',
            'Temporal': {
                'Annual': {
                    'ref': [2021],  # Array format
                    'test': [2022]
                },
                'Quarterly': {'ref': '', 'test': ''},
                'Monthly': {'ref': '', 'test': ''}
            }
        }

        # Should not raise TypeError
        result = run_analysis(
            self.locations,
            analysis_dict,
            mock_cache,
            reference_layer=self.reference_layer_geom
        )
        self.assertIsNotNone(result)

    @patch('analysis.analysis.ee')
    @patch('analysis.analysis.AnalysisResultsCache')
    def test_baci_with_single_reference_period(
        self, mock_cache_class, mock_ee
    ):
        """Test BACI with single value format for reference period."""
        from analysis.analysis import run_analysis
        mock_cache = MagicMock()
        analysis_dict = {
            'landscape': 'test',
            'analysisType': 'BACI',
            'variable': 'NDVI',
            't_resolution': 'Annual',
            'Temporal': {
                'Annual': {
                    'ref': 2021,  # Single value
                    'test': 2022
                },
                'Quarterly': {'ref': '', 'test': ''},
                'Monthly': {'ref': '', 'test': ''}
            }
        }

        # Should not raise TypeError
        result = run_analysis(
            self.locations,
            analysis_dict,
            mock_cache,
            reference_layer=self.reference_layer_geom
        )
        self.assertIsNotNone(result)

    @patch('analysis.analysis.ee')
    @patch('analysis.analysis.AnalysisResultsCache')
    def test_baci_quarterly_with_array_values(
        self, mock_cache_class, mock_ee
    ):
        """Test BACI quarterly analysis with array format."""
        from analysis.analysis import run_analysis
        mock_cache = MagicMock()
        analysis_dict = {
            'landscape': 'test',
            'analysisType': 'BACI',
            'variable': 'NDVI',
            't_resolution': 'Quarterly',
            'Temporal': {
                'Annual': {
                    'ref': [2021],
                    'test': [2022]
                },
                'Quarterly': {
                    'ref': [1],  # Q1 as array
                    'test': [2]  # Q2 as array
                },
                'Monthly': {'ref': '', 'test': ''}
            }
        }

        # Should not raise TypeError
        result = run_analysis(
            self.locations,
            analysis_dict,
            mock_cache,
            reference_layer=self.reference_layer_geom
        )
        self.assertIsNotNone(result)

    @patch('analysis.analysis.ee')
    @patch('analysis.analysis.AnalysisResultsCache')
    def test_baci_monthly_with_array_values(
        self, mock_cache_class, mock_ee
    ):
        """Test BACI monthly analysis with array format."""
        from analysis.analysis import run_analysis
        mock_cache = MagicMock()
        analysis_dict = {
            'landscape': 'test',
            'analysisType': 'BACI',
            'variable': 'NDVI',
            't_resolution': 'Monthly',
            'Temporal': {
                'Annual': {
                    'ref': [2021],
                    'test': [2022]
                },
                'Quarterly': {'ref': '', 'test': ''},
                'Monthly': {
                    'ref': [1],  # January as array
                    'test': [6]  # June as array
                }
            }
        }

        # Should not raise TypeError
        result = run_analysis(
            self.locations,
            analysis_dict,
            mock_cache,
            reference_layer=self.reference_layer_geom
        )
        self.assertIsNotNone(result)


class TestTemporalArrayValueHandling(TestCase):
    """Test Temporal analysis handles both array and single values."""

    fixtures = ['3.gee_asset.json']

    @patch('analysis.analysis.ee')
    @patch('analysis.analysis.AnalysisResultsCache')
    @patch('analysis.analysis.InputLayer')
    @patch('analysis.analysis.Indicator')
    def test_temporal_annual_with_array_values(
        self, mock_indicator_class, mock_input_layer, mock_cache_class,
        mock_ee
    ):
        """Test Temporal annual analysis with array format."""
        from analysis.analysis import run_analysis
        mock_cache = MagicMock()
        # Mock indicator with source
        mock_indicator = MagicMock()
        mock_indicator.source = 'MODIS'
        mock_indicator_class.objects.get.return_value = mock_indicator

        analysis_dict = {
            'landscape': 'test',
            'analysisType': 'Temporal',
            't_resolution': 'Annual',
            'variable': 'NDVI',
            'Temporal': {
                'Annual': {
                    'ref': [2020],  # Array format
                    'test': [[2021], [2022]]  # Nested arrays
                },
                'Quarterly': {'ref': '', 'test': ''},
                'Monthly': {'ref': '', 'test': ''}
            }
        }

        # Should not raise TypeError
        try:
            result = run_analysis([], analysis_dict, mock_cache)
            self.assertIsNotNone(result)
        except TypeError as e:
            self.fail(f"run_analysis raised TypeError: {e}")

    @patch('analysis.analysis.ee')
    @patch('analysis.analysis.AnalysisResultsCache')
    @patch('analysis.analysis.InputLayer')
    @patch('analysis.analysis.Indicator')
    def test_temporal_quarterly_with_array_values(
        self, mock_indicator_class, mock_input_layer, mock_cache_class,
        mock_ee
    ):
        """Test Temporal quarterly analysis with array format."""
        from analysis.analysis import run_analysis
        mock_cache = MagicMock()
        mock_indicator = MagicMock()
        mock_indicator.source = 'MODIS'
        mock_indicator_class.objects.get.return_value = mock_indicator

        analysis_dict = {
            'landscape': 'test',
            'analysisType': 'Temporal',
            't_resolution': 'Quarterly',
            'variable': 'NDVI',
            'Temporal': {
                'Annual': {
                    'ref': [2020],
                    'test': [[2021]]
                },
                'Quarterly': {
                    'ref': [1],  # Q1 as array
                    'test': [[2], [3]]  # Q2, Q3 as nested arrays
                },
                'Monthly': {'ref': '', 'test': ''}
            }
        }

        # Should not raise TypeError
        try:
            result = run_analysis([], analysis_dict, mock_cache)
            self.assertIsNotNone(result)
        except TypeError as e:
            self.fail(f"run_analysis raised TypeError: {e}")

    @patch('analysis.analysis.ee')
    @patch('analysis.analysis.AnalysisResultsCache')
    @patch('analysis.analysis.InputLayer')
    @patch('analysis.analysis.Indicator')
    def test_temporal_monthly_with_array_values(
        self, mock_indicator_class, mock_input_layer, mock_cache_class,
        mock_ee
    ):
        """Test Temporal monthly analysis with array format."""
        from analysis.analysis import run_analysis
        mock_cache = MagicMock()
        mock_indicator = MagicMock()
        mock_indicator.source = 'MODIS'
        mock_indicator_class.objects.get.return_value = mock_indicator

        analysis_dict = {
            'landscape': 'test',
            'analysisType': 'Temporal',
            't_resolution': 'Monthly',
            'variable': 'NDVI',
            'Temporal': {
                'Annual': {
                    'ref': [2020],
                    'test': [[2021]]
                },
                'Quarterly': {'ref': '', 'test': ''},
                'Monthly': {
                    'ref': [1],  # January as array
                    'test': [[6], [12]]  # June, December as nested arrays
                }
            }
        }

        # Should not raise TypeError
        try:
            result = run_analysis([], analysis_dict, mock_cache)
            self.assertIsNotNone(result)
        except TypeError as e:
            self.fail(f"run_analysis raised TypeError: {e}")


class TestSpatialArrayValueHandling(TestCase):
    """Test Spatial analysis handles both array and single values."""

    fixtures = ['3.gee_asset.json']

    def test_spatial_annual_with_array_values(self):
        """Test Spatial annual analysis with array format."""
        from analysis.analysis import spatial_get_date_filter

        analysis_dict = {
            'analysisType': 'Spatial',
            't_resolution': 'Annual',
            'Spatial': {
                'Annual': {
                    'ref': [2020],  # Array format
                    'test': [2021]
                },
                'Quarterly': {'ref': '', 'test': ''},
                'Monthly': {'ref': '', 'test': ''}
            }
        }

        # Should not raise TypeError
        try:
            start, end = spatial_get_date_filter(analysis_dict)
            self.assertIsNotNone(start)
            self.assertIsNotNone(end)
        except TypeError as e:
            self.fail(f"spatial_get_date_filter raised TypeError: {e}")

    def test_spatial_quarterly_with_array_values(self):
        """Test Spatial quarterly analysis with array format."""
        from analysis.analysis import spatial_get_date_filter

        analysis_dict = {
            'analysisType': 'Spatial',
            't_resolution': 'Quarterly',
            'Spatial': {
                'Annual': {
                    'ref': [2020],
                    'test': [2021]
                },
                'Quarterly': {
                    'ref': [1],  # Q1 as array
                    'test': [2]  # Q2 as array
                },
                'Monthly': {'ref': '', 'test': ''}
            }
        }

        # Should not raise TypeError
        try:
            start, end = spatial_get_date_filter(analysis_dict)
            self.assertIsNotNone(start)
            self.assertIsNotNone(end)
        except TypeError as e:
            self.fail(f"spatial_get_date_filter raised TypeError: {e}")

    def test_spatial_monthly_with_array_values(self):
        """Test Spatial monthly analysis with array format."""
        from analysis.analysis import spatial_get_date_filter

        analysis_dict = {
            'analysisType': 'Spatial',
            't_resolution': 'Monthly',
            'Spatial': {
                'Annual': {
                    'ref': [2020],
                    'test': [2021]
                },
                'Quarterly': {'ref': '', 'test': ''},
                'Monthly': {
                    'ref': [1],  # January as array
                    'test': [6]  # June as array
                }
            }
        }

        # Should not raise TypeError
        try:
            start, end = spatial_get_date_filter(analysis_dict)
            self.assertIsNotNone(start)
            self.assertIsNotNone(end)
        except TypeError as e:
            self.fail(f"spatial_get_date_filter raised TypeError: {e}")

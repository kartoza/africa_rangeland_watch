# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Analysis Runner Class
"""
import typing
import uuid
from concurrent.futures import ThreadPoolExecutor
from collections import OrderedDict
from datetime import date
from copy import deepcopy

from core.models import Preferences
from analysis.models import Indicator, IndicatorSource, AnalysisTask
from analysis.analysis import (
    initialize_engine_analysis,
    run_analysis,
    get_rel_diff,
    InputLayer,
    AnalysisResultsCacheUtils,
    spatial_get_date_filter,
    validate_spatial_date_range_filter,
    UserIndicator
)


def _temporal_analysis(locations, analysis_dict, custom_geom):
    return run_analysis(
        locations=locations,
        analysis_dict=analysis_dict,
        custom_geom=custom_geom
    )


class AnalysisRunner:

    def __init__(self, analysis_task: typing.Optional[AnalysisTask] = None):
        self.analysis_task: typing.Optional[AnalysisTask] = analysis_task

    @staticmethod
    def get_analysis_dict_baseline(data):
        """Get analysis dictionary for baseline."""
        return {
            'landscape': '',
            'analysisType': 'Baseline',
            'variable': data['landscape'],
            't_resolution': '',
            'Baseline': {
                'startDate': data.get('baselineStartDate', None),
                'endDate': data.get('baselineEndDate', None)
            },
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
                'Annual': '',
                'Quarterly': ''
            }
        }

    @staticmethod
    def get_analysis_dict_temporal(data):
        """Get analysis dictionary for temporal."""
        comp_years = data['comparisonPeriod']['year']
        comp_quarters = data['comparisonPeriod'].get('quarter', [])
        if comp_quarters is None or len(comp_quarters) == 0:
            comp_quarters = [''] * len(comp_years)
        comp_months = data['comparisonPeriod'].get('month', [])
        if comp_months is None or len(comp_months) == 0:
            comp_months = [''] * len(comp_years)

        analysis_dict = {
            'landscape': data['landscape'],
            'analysisType': 'Temporal',
            'variable': data['variable'],
            't_resolution': data['temporalResolution'],
            'Temporal': {
                'Annual': {
                    'ref': data['period']['year'],
                    'test': comp_years
                },
                'Quarterly': {
                    'ref': '',
                    'test': ''
                },
                'Monthly': {
                    'ref': '',
                    'test': ''
                }
            },
            'Spatial': {
                'Annual': '',
                'Quarterly': ''
            }
        }
        if data['temporalResolution'] == 'Quarterly':
            analysis_dict['Temporal']['Quarterly'] = {
                'ref': data['period'].get('quarter', ''),
                'test': comp_quarters,
            }
        elif data['temporalResolution'] == 'Monthly':
            analysis_dict['Temporal']['Monthly'] = {
                'ref': data['period'].get('month', ''),
                'test': comp_months,
            }
        return analysis_dict

    @staticmethod
    def get_analysis_dict_spatial(data):
        """Get analysis dictionary for spatial."""
        spatial_analysis_dict = {
            'landscape': '',
            'analysisType': 'Spatial',
            'variable': data['variable'],
            't_resolution': data['temporalResolution'],
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
                    'ref': data.get('period', {}).get('year', ''),
                    'test': data.get('comparisonPeriod', {}).get('year', '')
                },
                'Quarterly': {
                    'ref': data.get('period', {}).get('quarter', '')
                    if data['temporalResolution'] == 'Quarterly' else '',
                    'test': data.get('comparisonPeriod', {}).get('quarter', '')
                    if data['temporalResolution'] == 'Quarterly' else ''
                },
                'Monthly': {
                    'ref': data.get('period', {}).get('month', '')
                    if data['temporalResolution'] == 'Monthly' else '',
                    'test': data.get('comparisonPeriod', {}).get('month', '')
                    if data['temporalResolution'] == 'Monthly' else ''
                }
            }
        }

        temporal_analysis_dict = {
            'landscape': data['landscape'],
            'analysisType': 'Temporal',
            'variable': data['variable'],
            't_resolution': data['temporalResolution'],
            'Temporal': {
                'Annual': {
                    'ref': data.get('period', {}).get('year', ''),
                    'test': [data.get('comparisonPeriod', {}).get('year', '')]
                },
                'Quarterly': {
                    'ref': data.get('period', {}).get('quarter', '')
                    if data['temporalResolution'] == 'Quarterly' else '',
                    'test': [
                        data.get('comparisonPeriod', {}).get('quarter', '')
                    ]
                    if data['temporalResolution'] == 'Quarterly' else ''
                },
                'Monthly': {
                    'ref': data.get('period', {}).get('month', '')
                    if data['temporalResolution'] == 'Monthly' else '',
                    'test': [data.get('comparisonPeriod', {}).get('month', '')]
                    if data['temporalResolution'] == 'Monthly' else ''
                }
            },
            'Spatial': {
                'Annual': '',
                'Quarterly': ''
            }
        }

        return spatial_analysis_dict, temporal_analysis_dict

    @staticmethod
    def get_analysis_dict_baci(data):
        """Get analysis dictionary for BACI."""
        analysis_dict = {
            'landscape': data['landscape'],
            'analysisType': 'BACI',
            'variable': data['variable'],
            't_resolution': data['temporalResolution'],
            'Temporal': {
                'Annual': {
                    'ref': data.get('period', {}).get('year', ''),
                    'test': [data.get('comparisonPeriod', {}).get('year', '')]
                },
                'Quarterly': {
                    'ref': data.get('period', {}).get('quarter', '')
                    if data['temporalResolution'] == 'Quarterly' else '',
                    'test': [
                        data.get('comparisonPeriod', {}).get('quarter', '')
                    ]
                    if data['temporalResolution'] == 'Quarterly' else ''
                },
                'Monthly': {
                    'ref': data.get('period', {}).get('month', '')
                    if data['temporalResolution'] == 'Monthly' else '',
                    'test': [data.get('comparisonPeriod', {}).get('month', '')]
                    if data['temporalResolution'] == 'Monthly' else ''
                }
            },
            'Spatial': {
                'Annual': '',
                'Quarterly': ''
            }
        }

        return analysis_dict

    @staticmethod
    def get_reference_layer_geom(data):
        """Retrieve selected reference layer and return its geom."""
        layers = data['reference_layer']
        features = layers.get('features', [])
        feature_id = data.get('reference_layer_id', None)
        if not feature_id and len(features) > 0:
            return features[0]['geometry']

        for feature in features:
            if feature['properties']['id'] == feature_id:
                return feature['geometry']

        return None

    def run_baseline_analysis(self, data):
        """Run the baseline analysis."""
        analysis_dict = self.get_analysis_dict_baseline(data)
        initialize_engine_analysis()
        return run_analysis(
            locations=data.get('locations', []),
            analysis_dict=analysis_dict,
            custom_geom=data.get('custom_geom', None),
            analysis_task_id=self.analysis_task.id
        )

    @staticmethod
    def combine_temporal_analysis_results(years, input_results):
        def merge_and_sort(arrays):
            unique_dict = {}

            for array in arrays:
                for item in array['features']:
                    key = (
                        f"{item['properties']['Name']}-"
                        f"{item['properties']['date']}"
                    )
                    # Overwrites duplicates, ensuring uniqueness
                    unique_dict[key] = item
            return list(unique_dict.values())

        def add_empty_records(existing_records):
            new_records = {}
            for year in years:
                has_record = len(
                    list(
                        filter(
                            lambda x: x['properties']['year'] == year,
                            existing_records
                        )
                    )
                ) > 0
                if not has_record:
                    for record in existing_records:
                        key = f'{record["properties"]["Name"]}-{year}'
                        if key not in new_records:
                            new_record = deepcopy(record)
                            new_record['properties']['year'] = year
                            new_record['properties']['Bare ground'] = None
                            new_record['properties']['EVI'] = None
                            new_record['properties']['NDVI'] = None
                            new_records[key] = new_record
            return new_records.values()

        def add_statistics(features):
            new_features = [
                a['properties'] for a in filter(
                    lambda x: x['properties']['year'] in years,
                    features
                )
            ]

            # Process data
            aggregated = {}

            for row in new_features:
                name, year = row["Name"], int(row["year"])

                # Convert numeric values
                bare_ground = row["Bare ground"]
                evi = row["EVI"]
                ndvi = row["NDVI"]

                key = (name, year)
                if key not in aggregated:
                    aggregated[key] = {
                        "Bare ground": [],
                        "EVI": [],
                        "NDVI": []
                    }

                aggregated[key]["Bare ground"].append(bare_ground)
                aggregated[key]["EVI"].append(evi)
                aggregated[key]["NDVI"].append(ndvi)

            # Compute min, max, and mean
            results = {}
            unprocessed_years = [y for y in years]
            names = set()

            for location_year, values in aggregated.items():
                location, year = location_year
                if year in unprocessed_years:
                    unprocessed_years.remove(year)
                names.add(location)
                if year not in results:
                    results[year] = {}
                if location not in results[year]:
                    results[year][location] = {}

                for category, numbers in values.items():
                    min_val = min(numbers)
                    max_val = max(numbers)
                    mean_val = sum(numbers) / len(numbers)
                    results[year][location][category] = {
                        'min': min_val,
                        'max': max_val,
                        'mean': mean_val
                    }

            empty_data = {
                'Bare ground': {
                    'min': None, 'max': None, 'mean': None
                },
                'EVI': {
                    'min': None, 'max': None, 'mean': None
                },
                'NDVI': {
                    'min': None, 'max': None, 'mean': None
                },
            }
            for year in unprocessed_years:
                for name in names:
                    if results.get(year, None):
                        results[year].update({
                            name: empty_data
                        })
                    else:
                        results[year] = {
                            name: empty_data
                        }

            results = {
                year: {
                    name: OrderedDict(
                        sorted(value.items())
                    ) for name, value in sorted(group.items())
                } for year, group in sorted(results.items())
            }
            return results

        output_results = []
        output_results.append(input_results[0][0])
        output_results.append(input_results[0][1])
        output_results[0]['features'] = merge_and_sort(
            [ir[0] for ir in input_results]
        )

        output_results[0]['features'].extend(
            add_empty_records(output_results[1]['features'])
        )
        # add empty result if no data exist for certain year
        output_results[1]['features'] = merge_and_sort(
            [ir[1] for ir in input_results]
        )

        output_results[0]['features'] = sorted(
            output_results[0]['features'],
            key=lambda x: x['properties']['date']
        )
        output_results[1]['features'] = sorted(
            output_results[1]['features'],
            key=lambda x: x['properties']['date']
        )
        output_results[0]['statistics'] = add_statistics(
            output_results[1]['features']
        )

        return output_results

    def add_statistics(self, years, features):
        years = years if isinstance(years, list) else [years]
        new_features = [
            a['properties'] for a in filter(
                lambda x: x['properties']['year'] in years,
                features
            )
        ]

        # Process data
        aggregated = {}

        for row in new_features:
            name, year = row["Name"], int(row["year"])

            # Convert numeric values
            bare_ground = row["Bare ground"]
            evi = row["EVI"]
            ndvi = row["NDVI"]

            key = (name, year)
            if key not in aggregated:
                aggregated[key] = {
                    "Bare ground": [],
                    "EVI": [],
                    "NDVI": []
                }

            aggregated[key]["Bare ground"].append(bare_ground)
            aggregated[key]["EVI"].append(evi)
            aggregated[key]["NDVI"].append(ndvi)

        # Compute min, max, and mean
        results = {}
        unprocessed_years = [y for y in years] \
            if isinstance(years, list) else [years]
        names = set()

        for location_year, values in aggregated.items():
            location, year = location_year
            if year in unprocessed_years:
                unprocessed_years.remove(year)
            names.add(location)
            if year not in results:
                results[year] = {}
            if location not in results[year]:
                results[year][location] = {}

            for category, numbers in values.items():
                min_val = min(numbers)
                max_val = max(numbers)
                mean_val = sum(numbers) / len(numbers)
                results[year][location][category] = {
                    'min': min_val,
                    'max': max_val,
                    'mean': mean_val
                }

        empty_data = {
            'Bare ground': {
                'min': None, 'max': None, 'mean': None
            },
            'EVI': {
                'min': None, 'max': None, 'mean': None
            },
            'NDVI': {
                'min': None, 'max': None, 'mean': None
            },
        }
        for year in unprocessed_years:
            for name in names:
                if results.get(year, None):
                    results[year].update({
                        name: empty_data
                    })
                else:
                    results[year] = {
                        name: empty_data
                    }

        results = {
            year: {
                name: OrderedDict(
                    sorted(value.items())
                ) for name, value in sorted(group.items())
            } for year, group in sorted(results.items())
        }
        return results

    def run_temporal_analysis(self, data, analysis_dict=None):
        """Run the temporal analysis."""
        analysis_dict = analysis_dict or self.get_analysis_dict_temporal(data)
        variable = data['variable']
        initialize_engine_analysis()

        results = run_analysis(
            locations=data.get('locations', []) or [],
            analysis_dict=analysis_dict,
            custom_geom=data.get('custom_geom', None),
            analysis_task_id=self.analysis_task.id
        )
        if Indicator.has_statistics(variable):
            results[0]['statistics'] = self.add_statistics(
                data['comparisonPeriod']['year'],
                results[1]['features']
            )
        else:
            results[0]['statistics'] = {}

        return results

    def run_spatial_analysis(self, data):
        """Run the spatial analysis."""
        preferences = Preferences.load()
        reference_layer_geom = self.get_reference_layer_geom(data)
        if reference_layer_geom is None:
            raise ValueError(
                'Invalid reference_layer with id '
                f'{data.get('reference_layer_id')}!'
            )

        (
            spatial_analysis_dict,
            temporal_analysis_dict
        ) = self.get_analysis_dict_spatial(data)
        analysis_cache = AnalysisResultsCacheUtils({
            'locations': data.get('locations', []),
            'analysis_dict': spatial_analysis_dict,
            'args': [],
            'kwargs': {
                'reference_layer': reference_layer_geom,
                'custom_geom': data.get('custom_geom', None)
            }
        })
        output = analysis_cache.get_analysis_cache()
        if output:
            return output

        filter_start_date, filter_end_date = spatial_get_date_filter(
            spatial_analysis_dict
        )

        valid_filters, start_meta, end_meta = (
            validate_spatial_date_range_filter(
                data['variable'], filter_start_date, filter_end_date
            )
        )
        if not valid_filters:
            # validate the filter is within asset date ranges
            raise ValueError(
                f'{data['variable']} year range filter must be between '
                f'{date.fromisoformat(start_meta).year} to '
                f'{date.fromisoformat(end_meta).year}'
            )

        initialize_engine_analysis()
        locations = data.get('locations', [])
        if locations is None or len(locations) == 0:
            # return the relative different layer
            input_layers = InputLayer()
            rel_diff = get_rel_diff(
                input_layers.get_spatial_layer_dict(
                    filter_start_date,
                    filter_end_date,
                    self.analysis_task.submitted_by
                ),
                spatial_analysis_dict,
                reference_layer_geom
            )

            variable = data["variable"]
            indicator = Indicator.objects.filter(
                variable_name=variable
            ).first()
            if not indicator:
                indicator = UserIndicator.objects.filter(
                    variable_name=variable,
                    created_by=self.analysis_task.submitted_by
                ).first()
                if not indicator:
                    raise ValueError(
                        f"Indicator for variable {variable} not found"
                    )

            if indicator.source == IndicatorSource.GPW:
                metadata = indicator.metadata
            else:
                metadata = {
                    'minValue': -25,
                    'maxValue': 25,
                    'colors': ['#f9837b', '#fffcb9', '#fffcb9', '#32c2c8'],
                    'opacity': 0.7
                }
            results = {
                'id': 'spatial_analysis_rel_diff',
                'uuid': str(uuid.uuid4()),
                'name': '% difference in ' + data['variable'],
                'type': 'raster',
                'group': 'spatial_analysis',
                'metadata': metadata,
                'url': rel_diff.getMapId({
                    'min': metadata['minValue'],
                    'max': metadata['maxValue'],
                    'palette': metadata['colors'],
                    'opacity': metadata['opacity']
                })['tile_fetcher'].url_format,
                'style': None
            }
            preferences = Preferences.load()
            return analysis_cache.create_analysis_cache(
                {
                    'spatial': {'results': results},
                    'temporal': {'results': {}}
                },
                preferences.result_cache_ttl
            )

        with ThreadPoolExecutor(max_workers=2) as executor:
            spatial_future = executor.submit(
                run_analysis,
                locations=locations,
                analysis_dict=spatial_analysis_dict,
                reference_layer=reference_layer_geom,
                custom_geom=data.get('custom_geom', None),
                analysis_task_id=self.analysis_task.id
            )

            temporal_future = executor.submit(
                self.run_temporal_analysis,
                data=data,
                analysis_dict=temporal_analysis_dict
            )

            try:
                results_spatial = spatial_future.result(
                    timeout=preferences.max_wait_analysis_run_time
                )
                results_temporal = temporal_future.result(timeout=300)
            except Exception as e:
                print(f"Concurrent GEE analysis failed: {e}")
                raise

        if data.get('custom_geom', None):
            name = data.get('userDefinedFeatureName', 'User Defined Geometry')
            for feature in results_spatial.get('features', []):
                if 'properties' not in feature:
                    continue
                if 'Name' in feature['properties']:
                    continue
                feature['properties']['Name'] = name

        # Process results_spatial for custom_geom
        if data.get('custom_geom', None):
            name = data.get('userDefinedFeatureName', 'User Defined Geometry')
            for feature in results_spatial.get('features', []):
                if 'properties' not in feature:
                    continue
                if 'Name' in feature['properties']:
                    continue
                feature['properties']['Name'] = name

        return {
            'spatial': {'results': results_spatial},
            'temporal': {'results': results_temporal}
        }

    def run_baci_analysis(self, data):
        reference_layer_geom = self.get_reference_layer_geom(data)
        if reference_layer_geom is None:
            raise ValueError(
                'Invalid reference_layer with id '
                f'{data.get('reference_layer_id')}!'
            )

        analysis_dict = self.get_analysis_dict_baci(data)
        analysis_cache = AnalysisResultsCacheUtils({
            'locations': data.get('locations', []),
            'analysis_dict': analysis_dict,
            'args': [],
            'kwargs': {
                'reference_layer': reference_layer_geom
            }
        })
        output = analysis_cache.get_analysis_cache()
        if output:
            return output

        initialize_engine_analysis()
        return run_analysis(
            locations=data.get('locations', []) or [],
            analysis_dict=analysis_dict,
            reference_layer=reference_layer_geom
        )

    def run(self, data, analysis_task=None):
        """Run the analysis."""
        if data['analysisType'] == 'Baseline':
            return self.run_baseline_analysis(data)
        elif data['analysisType'] == 'Temporal':
            return self.run_temporal_analysis(data)
        elif data['analysisType'] == 'Spatial':
            return self.run_spatial_analysis(data)
        elif data['analysisType'] == 'BACI':
            return self.run_baci_analysis(data)
        else:
            raise ValueError('Invalid analysis type!')

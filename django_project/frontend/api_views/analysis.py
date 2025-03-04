# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Analysis APIs
"""
import uuid
from collections import OrderedDict
from datetime import date
from copy import deepcopy
from concurrent.futures import ThreadPoolExecutor
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Preferences
from analysis.analysis import (
    initialize_engine_analysis,
    run_analysis,
    get_rel_diff,
    InputLayer,
    AnalysisResultsCacheUtils,
    spatial_get_date_filter,
    validate_spatial_date_range_filter
)


def _temporal_analysis(lat, lon, analysis_dict, custom_geom):
    return run_analysis(
        lat=lat,
        lon=lon,
        analysis_dict=analysis_dict,
        custom_geom=custom_geom
    )


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


class AnalysisAPI(APIView):
    """API to do analysis."""

    permission_classes = [IsAuthenticated]

    def run_baseline_analysis(self, data):
        """Run the baseline analysis."""
        analysis_dict = {
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
        initialize_engine_analysis()
        return run_analysis(
            lon=float(data['longitude']),
            lat=float(data['latitude']),
            analysis_dict=analysis_dict,
            custom_geom=data.get('custom_geom', None)
        )

    def _combine_temporal_analysis_results(self, years, input_results):
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
            unprocessed_years = years
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

    def run_temporal_analysis(self, data):
        """Run the temporal analysis."""
        analysis_dict_list = []
        comp_years = data['comparisonPeriod']['year']
        comp_quarters = data['comparisonPeriod'].get('quarter', [])
        if len(comp_years) == 0:
            comp_quarters = [None] * len(comp_years)

        analysis_dict_list = []
        for idx, comp_year in enumerate(comp_years):
            analysis_dict = {
                'landscape': data['landscape'],
                'analysisType': 'Temporal',
                'variable': data['variable'],
                't_resolution': data['temporalResolution'],
                'Temporal': {
                    'Annual': {
                        'ref': data['period']['year'],
                        'test': comp_year
                    },
                    'Quarterly': {
                        'ref': data['period'].get('quarter', ''),
                        'test': (
                            comp_quarters[idx] if
                            len(comp_quarters) > 0 else ''
                        ),
                    }
                },
                'Spatial': {
                    'Annual': '',
                    'Quarterly': ''
                }
            }
            analysis_dict_list.append(analysis_dict)

        initialize_engine_analysis()

        results = []
        # Run analyses in parallel using ThreadPoolExecutor
        with ThreadPoolExecutor() as executor:
            # Submit tasks to the executor
            futures = [
                executor.submit(
                    _temporal_analysis,
                    data['latitude'],
                    data['longitude'],
                    analysis_dict,
                    data.get('custom_geom', None)
                ) for analysis_dict in analysis_dict_list
            ]
            # Collect results as they complete
            results = [future.result() for future in futures]

        results = self._combine_temporal_analysis_results(comp_years, results)
        return results

    def run_spatial_analysis(self, data):
        """Run the spatial analysis."""
        reference_layer_geom = get_reference_layer_geom(data)
        if reference_layer_geom is None:
            raise ValueError(
                'Invalid reference_layer with id '
                f'{data.get('reference_layer_id')}!'
            )

        analysis_dict = {
            'landscape': '',
            'analysisType': 'Spatial',
            'variable': data['variable'],
            't_resolution': '',
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
                'Quarterly': '',
                'start_year': data.get('spatialStartYear', None),
                'end_year': data.get('spatialEndYear', None)
            }
        }
        analysis_cache = AnalysisResultsCacheUtils({
            'lat': data['latitude'],
            'lon': data['longitude'],
            'analysis_dict': analysis_dict,
            'args': [analysis_dict],
            'kwargs': {
                'reference_layer': reference_layer_geom,
                'custom_geom': data.get('custom_geom', None)
            }
        })
        output = analysis_cache.get_analysis_cache()
        if output:
            return output

        filter_start_date, filter_end_date = spatial_get_date_filter(
            analysis_dict
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
        if data['longitude'] is None and data['latitude'] is None:
            # return the relative different layer
            input_layers = InputLayer()
            rel_diff = get_rel_diff(
                input_layers.get_spatial_layer_dict(
                    filter_start_date,
                    filter_end_date
                ),
                analysis_dict,
                reference_layer_geom
            )
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
                results,
                preferences.result_cache_ttl
            )

        results = run_analysis(
            lon=float(data['longitude']),
            lat=float(data['latitude']),
            analysis_dict=analysis_dict,
            reference_layer=reference_layer_geom,
            custom_geom=data.get('custom_geom', None)
        )

        if data.get('custom_geom', None):
            # add Name to the results
            name = data.get('userDefinedFeatureName', 'User Defined Geometry')
            for feature in results.get('features', []):
                if 'properties' not in feature:
                    continue
                if 'Name' in feature['properties']:
                    continue
                feature['properties']['Name'] = name

        return results

    def post(self, request, *args, **kwargs):
        """Fetch list of Landscape."""
        data = request.data
        try:
            if data['analysisType'] == 'Baseline':
                results = self.run_baseline_analysis(data)
            elif data['analysisType'] == 'Temporal':
                results = self.run_temporal_analysis(data)
            elif data['analysisType'] == 'Spatial':
                results = self.run_spatial_analysis(data)
            else:
                raise ValueError('Invalid analysis type')
            return Response({
                'data': data,
                'results': results
            })
        except Exception as e:
            return Response(
                {'error': str(e)}, status=status.HTTP_400_BAD_REQUEST
            )

# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Analysis APIs
"""
import uuid
from copy import deepcopy
from concurrent.futures import ThreadPoolExecutor
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from analysis.analysis import (
    initialize_engine_analysis,
    run_analysis,
    get_rel_diff,
    InputLayer
)


def _temporal_analysis(lat, lon, analysis_dict, custom_geom):
    return run_analysis(
        lat=lat,
        lon=lon,
        analysis_dict=analysis_dict,
        custom_geom=custom_geom
    )


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
                'Quarterly': ''
            }
        }
        initialize_engine_analysis()
        if data['longitude'] is None and data['latitude'] is None:
            # return the relative different layer
            input_layers = InputLayer()
            rel_diff = get_rel_diff(
                input_layers.get_spatial_layer_dict(),
                analysis_dict,
                data['reference_layer']
            )
            metadata = {
                'minValue': -25,
                'maxValue': 25,
                'colors': ['#f9837b', '#fffcb9', '#fffcb9', '#32c2c8'],
                'opacity': 0.7
            }
            return {
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

        return run_analysis(
            lon=float(data['longitude']),
            lat=float(data['latitude']),
            analysis_dict=analysis_dict,
            reference_layer=data['reference_layer'],
            custom_geom=data.get('custom_geom', None)
        )

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

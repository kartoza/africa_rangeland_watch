# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Analysis APIs
"""
import uuid
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
            analysis_dict=analysis_dict
        )

    def run_temporal_analysis(self, data):
        """Run the temporal analysis."""
        analysis_dict_list = []
        comp_years = data['comparisonPeriod']['year']
        comp_quarters = data['comparisonPeriod'].get('quarter', [])
        if len(comp_years) == 0:
            comp_quarters = [''] * len(comp_years)

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
                    run_analysis,
                    data['latitude'],
                    data['longitude'],
                    analysis_dict
                ) for analysis_dict in analysis_dict_list
            ]

            # Collect results as they complete
            results = [future.result() for future in futures]

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
            reference_layer=data['reference_layer']
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

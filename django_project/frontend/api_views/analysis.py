# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Analysis APIs
"""
import uuid
from analysis.models import Analysis, InterventionArea
from alerts.models import Indicator
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.gis.geos import Point
from django.contrib.gis.geos import GEOSGeometry

from analysis.analysis import (
    initialize_engine_analysis,
    run_analysis,
    get_rel_diff,
    InputLayer
)


class AnalysisAPI(APIView):
    """API to do analysis."""

    permission_classes = [IsAuthenticated]

    def save_analysis(self, user, data, results):
        """Save the analysis to the database."""
        try:
            # Fetch or create the intervention area
            intervention_area = None
            if 'interventionArea' in data:
                intervention_area, _ = InterventionArea.objects.get_or_create(
                    name=data['interventionArea']
                )

            # Fetch the indicator
            indicator = Indicator.objects.get(name=data['variable'])

            # Create the analysis record
            analysis = Analysis.objects.create(
                uuid=uuid.uuid4(),
                intervention_area=intervention_area,
                indicator=indicator,
                analysis_type=data['analysisType'].lower(),
                temporal_resolution=data.get('temporalResolution'),
                reference_period_start=data['period'].get('start'),
                reference_period_end=data['period'].get('end'),
                comparison_period_start=data['comparisonPeriod'].get('start'),
                comparison_period_end=data['comparisonPeriod'].get('end'),
                # geom = Point(data['longitude'], data['latitude'] ,srid=4326)
                created_by=user
            )
            return analysis
        except Exception as e:
            raise ValueError(f"Error saving analysis: {e}")

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
        analysis_dict = {
            'landscape': data['landscape'],
            'analysisType': 'Temporal',
            'variable': data['variable'],
            't_resolution': data['temporalResolution'],
            'Temporal': {
                'Annual': {
                    'ref': data['period']['year'],
                    'test': data['comparisonPeriod']['year']
                },
                'Quarterly': {
                    'ref': data['period'].get('quarter', ''),
                    'test': data['comparisonPeriod'].get('quarter', ''),
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

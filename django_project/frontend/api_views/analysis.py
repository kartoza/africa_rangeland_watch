# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Analysis APIs
"""
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from analysis.analysis import (
    initialize_engine_analysis,
    run_analysis
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

    def post(self, request, *args, **kwargs):
        """Fetch list of Landscape."""
        data = request.data
        try:
            if data['analysisType'] == 'Baseline':
                return Response(self.run_baseline_analysis(data))
            elif data['analysisType'] == 'Temporal':
                return Response(self.run_temporal_analysis(data))
            return Response(self.run_baseline_analysis(data))
        except Exception as e:
            return Response(
                {'error': str(e)}, status=status.HTTP_400_BAD_REQUEST
            )

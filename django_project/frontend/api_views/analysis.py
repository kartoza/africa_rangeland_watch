# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Analysis APIs
"""
import logging
from datetime import date
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers

from core.models import TaskStatus
from analysis.analysis import (
    AnalysisResultsCacheUtils,
    spatial_get_date_filter,
    validate_spatial_date_range_filter
)
from analysis.models import AnalysisTask
from analysis.runner import AnalysisRunner
from analysis.tasks import run_analysis_task


class AnalysisResultSerializer(serializers.Serializer):
    """Serializer for analysis API response."""
    data = serializers.JSONField()
    results = serializers.JSONField(allow_null=True)
    task_id = serializers.IntegerField(allow_null=True)
    status = serializers.ChoiceField(choices=TaskStatus.choices)
    is_cached = serializers.BooleanField()
    error = serializers.CharField(allow_null=True, required=False)
    started_at = serializers.DateTimeField(allow_null=True, required=False)
    completed_at = serializers.DateTimeField(allow_null=True, required=False)


class AnalysisAPI(APIView):
    """API to do analysis."""

    permission_classes = [IsAuthenticated]

    def check_cache(self, data):
        """Check if results are already cached."""
        analysis_dict = {}
        locations = data.get('locations', [])
        args = []
        kwargs = {}
        if data['analysisType'] == 'Temporal':
            analysis_dict = AnalysisRunner.get_analysis_dict_temporal(data)
            analysis_cache = AnalysisResultsCacheUtils({
                'locations': locations,
                'analysis_dict': analysis_dict,
                'args': args,
                'kwargs': kwargs
            })
            return analysis_cache.get_analysis_cache()

        elif data['analysisType'] == 'Spatial':
            analysis_dict = AnalysisRunner.get_analysis_dict_spatial(data)
            reference_layer_geom = (
                AnalysisRunner.get_reference_layer_geom(data)
            )
            kwargs = {
                'reference_layer': reference_layer_geom,
                'custom_geom': data.get('custom_geom', None)
            }
        elif data['analysisType'] == 'Baseline':
            analysis_dict = AnalysisRunner.get_analysis_dict_baseline(data)
            kwargs['custom_geom'] = data.get('custom_geom', None)
        elif data['analysisType'] == 'BACI':
            reference_layer_geom = (
                AnalysisRunner.get_reference_layer_geom(data)
            )
            analysis_dict = AnalysisRunner.get_analysis_dict_baci(data)
            kwargs = {
                'reference_layer': reference_layer_geom
            }

        analysis_cache = AnalysisResultsCacheUtils({
            'locations': locations,
            'analysis_dict': analysis_dict,
            'args': args,
            'kwargs': kwargs
        })

        return analysis_cache.get_analysis_cache()

    def validate_spatial_analysis(self, data):
        """Validate spatial analysis inputs."""
        reference_layer_geom = AnalysisRunner.get_reference_layer_geom(data)
        if reference_layer_geom is None:
            raise ValueError(
                'Invalid reference_layer with id '
                f'{data.get('reference_layer_id')}!'
            )

        (
            spatial_analysis_dict,
            temporal_analysis_dict
        ) = AnalysisRunner.get_analysis_dict_spatial(data)
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


    def validate_baci_analysis(self, data):
        """Validate BACI analysis inputs."""
        reference_layer_geom = AnalysisRunner.get_reference_layer_geom(data)
        if reference_layer_geom is None:
            raise ValueError(
                'Invalid reference_layer with id '
                f'{data.get('reference_layer_id')}!'
            )

    def post(self, request, *args, **kwargs):
        """Fetch list of Landscape."""
        data = request.data
        try:
            if (
                data['analysisType'] not in
                ['Baseline', 'Temporal', 'Spatial', 'BACI']
            ):
                raise ValueError('Invalid analysis type')

            # check if analysis is already cached
            results = self.check_cache(data)
            if results is not None:
                return Response(
                    AnalysisResultSerializer({
                        'data': data,
                        'results': results,
                        'task_id': None,
                        'status': TaskStatus.COMPLETED,
                        'is_cached': True,
                        'error': None,
                        'started_at': None,
                        'completed_at': None
                    }).data
                )

            # validate spatial analysis
            if data['analysisType'] == 'Spatial':
                self.validate_spatial_analysis(data)
            elif data['analysisType'] == 'BACI':
                self.validate_baci_analysis(data)

            # Create task object
            analysis_task = AnalysisTask.objects.create(
                analysis_inputs=data,
                submitted_by=request.user
            )

            # submit task
            task = run_analysis_task.delay(analysis_task.id)
            analysis_task.task_id = task.id
            analysis_task.save(update_fields=['task_id'])

            return Response(AnalysisResultSerializer({
                'data': data,
                'results': None,
                'task_id': analysis_task.id,
                'status': TaskStatus.PENDING,
                'is_cached': False,
                'error': None,
                'started_at': analysis_task.created_at,
                'completed_at': None
            }).data)
        except ValueError as e:
            logging.error(f"Validation error: {e}")
            return Response(
                {
                    'error': str(e),
                    'status': TaskStatus.FAILED
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception:
            logging.error("An error occurred during analysis", exc_info=True)
            return Response(
                {
                    'error': (
                        "An internal error has occurred. Please try again."
                    ),
                    'status': TaskStatus.FAILED
                },
                status=status.HTTP_400_BAD_REQUEST
            )


class FetchAnalysisTaskAPI(APIView):
    """API to fetch analysis task status and results."""

    def get(self, request, *args, **kwargs):
        """Fetch analysis task status and results."""
        task_id = kwargs.get('task_id')
        try:
            analysis_task = AnalysisTask.objects.get(id=task_id)
            if analysis_task.status == TaskStatus.COMPLETED:
                results = analysis_task.result
            else:
                results = None

            return Response(AnalysisResultSerializer({
                'data': analysis_task.analysis_inputs,
                'results': results,
                'task_id': task_id,
                'status': analysis_task.status,
                'is_cached': False,
                'error': (
                    analysis_task.error.get('message') if
                    analysis_task.error else None
                ),
                'started_at': analysis_task.created_at,
                'completed_at': analysis_task.completed_at
            }).data)
        except AnalysisTask.DoesNotExist:
            return Response(
                {'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND
            )

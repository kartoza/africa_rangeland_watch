from celery import shared_task
from django.utils import timezone
from alerts.models import AlertSetting, AnalysisTypes, RunningInterval
from alerts.utils import (
    trigger_alert,
    check_threshold
)
from analysis.analysis import (
    run_analysis, initialize_engine_analysis
)
from analysis.tasks import run_analysis_task
from analysis.runner import AnalysisRunner
from analysis.models import AnalysisTask, TaskStatus
import logging
import time

logger = logging.getLogger(__name__)



def get_temporal_resolution(setting: AlertSetting):
    if setting.reference_period.get('month'):
        return 'Monthly'
    elif setting.reference_period.get('quarter'):
        return 'Quarterly'
    return 'Annual'


def process_alert(
    setting: AlertSetting,
    runner: AnalysisRunner
) -> dict:
    """
    Process a single alert setting: run analysis and trigger alerts.

    Args:
        setting: AlertSetting to process
        runner: AnalysisRunner instance for running analyses

    Returns:
        dict: Processing result with keys:
            - success (bool): Whether processing succeeded
            - alert_setting_id (int): ID of alert setting
            - alert_setting_name (str): Name of alert setting
            - alerts_triggered (int): Number of alerts triggered
            - features_found (int): Number of features in result
            - processing_time (float): Time taken in seconds
            - error (str|None): Error message if failed
    """
    start_time = time.time()
    alerts_triggered = 0

    try:
        logger.info(
            f"Processing alert '{setting.name}' "
            f"(ID: {setting.id}, Type: {setting.analysis_type})"
        )

        now = timezone.now()
        locations = []
        if getattr(
            setting, "location", None
        ) and setting.location.geometry:
            centroid = setting.location.geometry.centroid
            locations = [{
                "lat": centroid.y,
                "lon": centroid.x
            }]

        if setting.analysis_type == AnalysisTypes.BASELINE:
            data = {
                "analysisType": "Baseline",
                "landscape": getattr(setting, "landscape_name", ""),
                "variable": setting.indicator.name,
                "baselineStartDate": "2022-01-01",
                "baselineEndDate": "2022-12-31",
                "locations": locations,
                "custom_geom": getattr(setting, "custom_geom", None)
            }
            # Use AnalysisRunner to build analysis_dict
            analysis_dict = runner.get_analysis_dict_baseline(data)
            analysis_result = run_analysis(
                data["locations"],
                analysis_dict,
                custom_geom=data.get("custom_geom"),
            )
            if analysis_result is None:
                logger.warning(
                    f"Alert {setting.id}: Analysis returned None "
                    f"for Baseline analysis, using empty dict"
                )
                analysis_result = {}
        elif setting.analysis_type == AnalysisTypes.TEMPORAL:
            try:
                lat = setting.location.geometry.centroid.y if\
                    setting.location.geometry else 0
            except AttributeError:
                lat = 0

            try:
                lon = setting.location.geometry.centroid.x if\
                    setting.location.geometry else 0
            except AttributeError:
                lon = 0
            data = {
                "period": {
                    "year": setting.reference_period['year'],
                    "month": setting.reference_period['month'],
                    "quarter": setting.reference_period['quarter']
                },
                "variable": setting.indicator.name,
                "landscape": setting.location.landscape.name,
                "locations": [
                    {
                        "lat": lat,
                        "lon": lon,
                        "community": setting.location.community_id,
                        "communityName": setting.location.community_name,
                        "communityFeatureId": 1
                    }
                ],
                "custom_geom": None,
                "analysisType": "Temporal",
                "comparisonPeriod": {
                    "year": [
                        now.year
                    ],
                    "month": [
                        now.month
                    ] if setting.reference_period['month'] else [],
                    "quarter": [
                        (now.month - 1) // 3 + 1
                    ] if setting.reference_period['quarter'] else []
                },
                "baselineStartDate": None,
                "temporalResolution": get_temporal_resolution(setting),
                "userDefinedFeatureId": None,
                "userDefinedFeatureName": None
            }
            # Create task object
            analysis_task = AnalysisTask.objects.create(
                analysis_inputs=data,
                submitted_by=setting.user
            )
            # submit task
            run_analysis_task(analysis_task.id)
            analysis_task.refresh_from_db()
            try:
                analysis_result = analysis_task.result[0]
            except IndexError:
                logger.warning(
                    f"Alert {setting.id}: Analysis result is empty "
                    f"(IndexError), using empty features"
                )
                analysis_result = {'features': []}
            except TypeError:
                logger.warning(
                    f"Alert {setting.id}: Analysis result has wrong type "
                    f"(TypeError), using empty features"
                )
                analysis_task.result = []
                analysis_task.save()
                analysis_result = {'features': []}

        features = (
            analysis_result[0].get("features", [])
            if isinstance(analysis_result, tuple)
            else analysis_result.get("features", [])
        )

        logger.info(
            f"Alert {setting.id}: Analysis completed, "
            f"found {len(features)} features"
        )

        if features:
            for feature in features:
                name = feature.get("properties", {}).get("Name")
                value = feature.get("properties", {}).get(
                    setting.indicator.name
                )
                if name is not None and value is not None:
                    if check_threshold(setting, value):
                        logger.info(
                            f"Alert {setting.id}: Threshold met for "
                            f"'{name}': {value}"
                        )
                        trigger_alert(setting, value, name)
                        setting.last_alert = now
                        setting.save()
                        alerts_triggered += 1
        else:
            logger.info(
                f"Alert {setting.id}: No features found, "
                f"triggering no-data alert"
            )
            message = f"No data found on {now.date()}"
            trigger_alert(setting, None, None, message)
            alerts_triggered += 1

        # Return success result
        return {
            'success': True,
            'alert_setting_id': setting.id,
            'alert_setting_name': setting.name,
            'alerts_triggered': alerts_triggered,
            'features_found': len(features),
            'processing_time': round(time.time() - start_time, 2),
            'error': None
        }

    except Exception as e:
        logger.error(
            f"Failed to process alert '{setting.name}' "
            f"(ID: {setting.id}): {e}",
            exc_info=True
        )
        return {
            'success': False,
            'alert_setting_id': setting.id,
            'alert_setting_name': setting.name,
            'alerts_triggered': 0,
            'features_found': 0,
            'processing_time': round(time.time() - start_time, 2),
            'error': str(e)
        }


@shared_task
def process_alerts():
    """
    Check all alert settings and
    trigger alerts if thresholds are breached.
    """
    initialize_engine_analysis()
    runner = AnalysisRunner()
    now = timezone.now()

    task = AnalysisTask.objects.create(
        analysis_inputs={"type": "alert_processing"},
        status=TaskStatus.RUNNING
    )

    # Initialize processing summary
    processing_summary = {
        'processed_count': 0,
        'success_count': 0,
        'failed_count': 0,
        'alerts_triggered': 0,
        'baseline_settings': [],
        'temporal_settings': [],
        'errors': []
    }

    try:
        # Get alert settings
        baseline_settings = AlertSetting.objects.filter(
            enable_alert=True,
            analysis_type=AnalysisTypes.BASELINE
        )
        temporal_settings = AlertSetting.objects.filter(
            analysis_type=AnalysisTypes.TEMPORAL
        )

        baseline_count = baseline_settings.count()
        temporal_count = temporal_settings.count()
        logger.info(
            f"Starting alert processing: {baseline_count} baseline "
            f"alerts, {temporal_count} temporal alerts "
            f"(filtered by schedule)"
        )

        # Process baseline alerts
        for setting in baseline_settings:
            processing_summary['processed_count'] += 1
            try:
                logger.info(
                    f"Processing baseline alert {setting.id}: "
                    f"{setting.name}"
                )
                result = process_alert(setting=setting, runner=runner)

                if result['success']:
                    processing_summary['success_count'] += 1
                    processing_summary['alerts_triggered'] += (
                        result['alerts_triggered']
                    )
                else:
                    processing_summary['failed_count'] += 1
                    processing_summary['errors'].append({
                        'alert_setting_id': result['alert_setting_id'],
                        'alert_setting_name': (
                            result['alert_setting_name']
                        ),
                        'analysis_type': 'Baseline',
                        'error': result['error']
                    })

                processing_summary['baseline_settings'].append(result)

            except Exception as e:
                # Catch unexpected errors not caught by process_alert()
                processing_summary['failed_count'] += 1
                processing_summary['errors'].append({
                    'alert_setting_id': setting.id,
                    'alert_setting_name': setting.name,
                    'analysis_type': 'Baseline',
                    'error': f"Unexpected error: {str(e)}"
                })
                logger.error(
                    f"Unexpected error processing baseline alert "
                    f"{setting.id}: {e}",
                    exc_info=True
                )

        # Process temporal alerts
        for setting in temporal_settings:
            run_task = False

            # Run weekly analysis every Monday
            if setting.running_interval == RunningInterval.WEEKLY and\
                now.isoweekday() == 1:
                run_task = True
            # Run monthly analysis every 1st date of month
            elif setting.running_interval == RunningInterval.MONTHLY and\
                now.day == 1:
                run_task = True
            # Run quarterly analysis on 1st date on quarter month
            elif (
                setting.running_interval == RunningInterval.QUARTERLY and
                now.day == 1 and
                now.month in [1, 4, 7, 10]
            ):
                run_task = True
            # Run annual analysis on January 1st
            elif (
                setting.running_interval == RunningInterval.ANNUAL and
                now.day == 1 and
                now.month == 1
            ):
                run_task = True

            if run_task:
                processing_summary['processed_count'] += 1
                try:
                    logger.info(
                        f"Processing temporal alert {setting.id}: "
                        f"{setting.name} (interval: "
                        f"{setting.running_interval})"
                    )
                    result = process_alert(
                        setting=setting,
                        runner=runner
                    )

                    if result['success']:
                        processing_summary['success_count'] += 1
                        processing_summary['alerts_triggered'] += (
                            result['alerts_triggered']
                        )
                    else:
                        processing_summary['failed_count'] += 1
                        processing_summary['errors'].append({
                            'alert_setting_id': (
                                result['alert_setting_id']
                            ),
                            'alert_setting_name': (
                                result['alert_setting_name']
                            ),
                            'analysis_type': 'Temporal',
                            'error': result['error']
                        })

                    processing_summary['temporal_settings'].append(
                        result
                    )

                except Exception as e:
                    # Catch unexpected errors
                    processing_summary['failed_count'] += 1
                    processing_summary['errors'].append({
                        'alert_setting_id': setting.id,
                        'alert_setting_name': setting.name,
                        'analysis_type': 'Temporal',
                        'error': f"Unexpected error: {str(e)}"
                    })
                    logger.error(
                        f"Unexpected error processing temporal alert "
                        f"{setting.id}: {e}",
                        exc_info=True
                    )

    except Exception as e:
        logger.error("Alert processing task failed", exc_info=True)
        task.status = TaskStatus.FAILED
        task.error = {"message": str(e)}

    finally:
        # Log summary
        logger.info(
            f"Alert processing complete: "
            f"{processing_summary['processed_count']} processed, "
            f"{processing_summary['success_count']} succeeded, "
            f"{processing_summary['failed_count']} failed, "
            f"{processing_summary['alerts_triggered']} alerts triggered"
        )

        # Set result and status
        task.result = processing_summary

        # Only set COMPLETED if we didn't hit top-level exception
        if task.status != TaskStatus.FAILED:
            task.status = TaskStatus.COMPLETED

        task.completed_at = timezone.now()
        task.updated_at = timezone.now()
        task.save()

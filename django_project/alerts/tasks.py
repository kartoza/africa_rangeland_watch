from celery import shared_task
from django.utils import timezone
from alerts.models import AlertSetting, AnalysisTypes
from alerts.utils import (
    trigger_alert,
    check_threshold,
)
from analysis.analysis import (
    run_analysis, initialize_engine_analysis
)
from analysis.runner import AnalysisRunner
from analysis.models import AnalysisTask, TaskStatus
import logging

logger = logging.getLogger(__name__)



def process_alert(setting: AlertSetting, runner: AnalysisRunner):
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
    elif setting.analysis_type == AnalysisTypes.TEMPORAL:
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
                    "lat": setting.location.y if setting.location else 0,
                    "lon": setting.location.x if setting.location else 0,
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
                ],
                "quarter": []
            },
            "baselineStartDate": None,
            "temporalResolution": "Monthly",
            "userDefinedFeatureId": None,
            "userDefinedFeatureName": None
        }
        # Use AnalysisRunner to build analysis_dict
        analysis_dict = runner.get_analysis_dict_temporal(data)

    analysis_result = run_analysis(
        data["locations"],
        analysis_dict,
        custom_geom=data.get("custom_geom"),
    )

    features = (
        analysis_result[0].get("features", [])
        if isinstance(analysis_result, tuple)
        else analysis_result.get("features", [])
    )

    if features:
        for feature in features:
            name = feature.get("properties", {}).get("Name")
            value = feature.get("properties", {}).get(
                setting.indicator.name
            )
            if name is not None or value is not None:
                if check_threshold(setting, value):
                    trigger_alert(setting, value, name)
                    setting.last_alert = now
                    setting.save()


@shared_task
def process_alerts():
    """
    Check all alert settings and
    trigger alerts if thresholds are breached.
    """
    initialize_engine_analysis()
    runner = AnalysisRunner()


    task = AnalysisTask.objects.create(
        analysis_inputs={"type": "alert_processing"},
        status=TaskStatus.RUNNING
    )

    try:
        # process baseline
        baseline_settings = AlertSetting.objects.filter(
            enable_alert=True,
            analysis_type=AnalysisTypes.BASELINE
        )
        for setting in baseline_settings:
            process_alert(setting=setting, runner=runner)
        
        # process temporal
        temporal_settings = AlertSetting.objects.filter(
            analysis_type=AnalysisTypes.TEMPORAL
        )
        for setting in temporal_settings:
            process_alert(setting=setting, runner=runner)
            
    except Exception as e:
        logger.error("Alert processing task failed", exc_info=True)
        task.status = TaskStatus.FAILED
        task.error = {"message": str(e)}

    finally:
        task.completed_at = timezone.now()
        task.updated_at = timezone.now()
        task.save()

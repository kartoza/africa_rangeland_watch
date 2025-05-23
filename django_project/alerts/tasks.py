from celery import shared_task
from django.utils import timezone
from alerts.models import AlertSetting
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


@shared_task
def process_alerts():
    """
    Check all alert settings and
    trigger alerts if thresholds are breached.
    """
    initialize_engine_analysis()
    now = timezone.now()
    runner = AnalysisRunner()

    task = AnalysisTask.objects.create(
        analysis_inputs={"type": "alert_processing"},
        status=TaskStatus.RUNNING
    )

    try:
        for setting in AlertSetting.objects.filter(enable_alert=True):
            locations = []
            if getattr(
                setting, "location", None
            ) and setting.location.geometry:
                centroid = setting.location.geometry.centroid
                locations = [{
                    "lat": centroid.y,
                    "lon": centroid.x
                }]

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

            features = (
                analysis_result[0].get("features", [])
                if isinstance(analysis_result, tuple)
                else analysis_result.get("features", [])
            )
            if not features:
                continue

            for feature in features:
                name = feature.get("properties", {}).get("Name")
                value = feature.get("properties", {}).get(
                    setting.indicator.name
                )
                if name is None or value is None:
                    continue

                if check_threshold(setting, value):
                    trigger_alert(setting, value, name)
                    setting.last_alert = now
                    setting.save()
    except Exception as e:
        logger.error("Alert processing task failed", exc_info=True)
        task.status = TaskStatus.FAILED
        task.error = {"message": str(e)}

    finally:
        task.completed_at = timezone.now()
        task.updated_at = timezone.now()
        task.save()

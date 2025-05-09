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


@shared_task
def process_alerts():
    """
    Check all alert settings and
    trigger alerts if thresholds are breached.
    """
    initialize_engine_analysis()
    now = timezone.now()

    for setting in AlertSetting.objects.filter(enable_alert=True):
        try:
            # Use a fixed test location from Bahine NP (South Africa region)
            # for demonstration purposes
            # TODO: once UI branch is merged, use the selected location
            # from the UI
            locations = [{
                "lat": -22.803599260196123,
                "lon": 32.40031084532916
            }]

            analysis_dict = {
                "analysisType": "Baseline",
                "variable": setting.indicator.name,
                "landscape": getattr(setting, "landscape_name", ""),
                "Temporal": {
                    "Annual": {
                        "ref": 2022,
                        "test": 2023
                    },
                    "Quarterly": {
                        "ref": "Q1-2022",
                        "test": "Q1-2023"
                    },
                },
                "t_resolution": "Annual",  # or "Quarterly"
                "Baseline": {
                    "startDate": "2022-01-01",
                    "endDate": "2022-12-31"
                },
                "Spatial": {
                    "start_year": 2022,
                    "end_year": 2023
                },
            }

            kwargs = {}
            # Check if the setting has a custom geometry
            # and use it as the reference layer
            # if it exists
            if hasattr(setting, "custom_geom") and setting.custom_geom:
                kwargs["reference_layer"] = setting.custom_geom
            else:
                # Provide a fallback reference layer
                kwargs["reference_layer"] = {
                    "type": "Polygon",
                    "coordinates": [[
                        [32.399, -22.804],
                        [32.401, -22.804],
                        [32.401, -22.802],
                        [32.399, -22.802],
                        [32.399, -22.804]
                    ]]
                }

            analysis_result = run_analysis(locations, analysis_dict, **kwargs)

            features = (
                analysis_result[0].get("features", [])
                if isinstance(analysis_result, tuple)
                else analysis_result.get("features", [])
            )
            if not analysis_result:
                continue

            # Extract features safely
            if isinstance(analysis_result, tuple):
                features = analysis_result[0].get("features", [])
            else:
                features = analysis_result.get("features", [])

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
            print(f"Failed to process alert for {setting.id}: {e}")

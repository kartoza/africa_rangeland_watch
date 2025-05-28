# layers/tasks.py
import logging

from core.celery import app
from layers.models import ExternalLayerSource, FetchHistory
from layers.utils import (
    fetch_global_pasture_watch_data,
    fetch_all_global_cropland_zenodo,
    fetch_grassland_stac_layers,
    fetch_short_vegetation_height_layers,
    fetch_soil_bare_fraction_layers,
)


logger = logging.getLogger(__name__)


FETCH_DISPATCH: dict[str, callable] = {
    "wri": fetch_global_pasture_watch_data,
    "open-earth-monitor": lambda src: fetch_all_global_cropland_zenodo(
        src, resolution="250m"
    ),
    "openlandmap-grassland": fetch_grassland_stac_layers,
    "ecodatacube-veg-height": fetch_short_vegetation_height_layers,
    "ecodatacube-bare-fraction": fetch_soil_bare_fraction_layers,
}


# Helper function to fetch data based on the source slug
def fetch_source_data(source: ExternalLayerSource):
    """
    Call the appropriate fetcher based on source.slug.
    Raises ValueError if no fetcher is registered.
    """
    fetcher = FETCH_DISPATCH.get(source.slug)
    if fetcher is None:
        raise ValueError(f"No fetcher registered for slug '{source.slug}'")
    return fetcher(source)


@app.task(name="fetch_external_layers_task")
def fetch_external_layers_task():
    """
    Iterate over every active, non-manual ExternalLayerSource and run
    its corresponding fetcher.  Log each outcome to FetchHistory.
    """
    sources = ExternalLayerSource.objects.filter(
        active=True        # don’t hit disabled sources
    ).exclude(
        fetch_type="manual"
    )

    for src in sources:
        logger.info("[RUN] Starting ingest for %s (%s)", src.name, src.slug)
        try:
            result = fetch_source_data(src)  # may return None or summary dict
            FetchHistory.objects.create(
                source=src,
                status="success",
                message=(
                    "Fetched successfully"
                    if result is None else str(result)[:250]
                ),
            )
            logger.info("[SUCCESS] Ingest completed for %s", src.slug)

        except Exception as exc:
            FetchHistory.objects.create(
                source=src,
                status="failure",
                message=str(exc)[:500],
            )
            logger.error(
                "Ingest failed for %s → %s", src.slug, exc, exc_info=True
            )

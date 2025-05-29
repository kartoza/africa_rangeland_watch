# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Utilities for layers
"""

import requests
import os
import time
import logging
from urllib.parse import urljoin
import tempfile
from tempfile import NamedTemporaryFile
import ee
import rasterio
from datetime import datetime
from django.core.files.base import ContentFile
from analysis.analysis import (
    initialize_engine_analysis,
    export_image_to_drive
)
from analysis.utils import get_gdrive_file
from layers.models import ExternalLayer, ExternalLayerSource


logger = logging.getLogger(__name__)


def upload_file(url, file_path, field_name="file", auth_header=None):
    """
    Upload a file to the given URL.

    :param url: The URL to send the POST request to.
    :param file_path: The path to the file to be uploaded.
    :param field_name: The form field name for the file (default: 'file').
    :return: The response from the server.
    """
    headers = None
    if auth_header:
        headers = {
            'Authorization': auth_header
        }
    # Open the file in binary mode
    with open(file_path, 'rb') as f:
        # Pass the file as a file-like object to the `files` parameter
        files = {field_name: (file_path, f)}

        # Send the POST request with the file
        response = requests.post(url, files=files, headers=headers)

    return response.status_code == 200


def extract_raster_metadata(file_path):
    """
    Extracts bounds, resolution, CRS,
    band info, min/max values from a GeoTIFF.
    """
    with rasterio.open(file_path) as src:
        bounds = src.bounds
        crs = src.crs.to_string()
        resolution = src.res
        band_count = src.count

        try:
            stats = src.statistics(1, approx=True)
            min_val, max_val = stats.min, stats.max
        except Exception:
            sample = src.read(1, window=((0, 512), (0, 512)))
            min_val, max_val = float(sample.min()), float(sample.max())

        return {
            "bounds": [bounds.left, bounds.bottom, bounds.right, bounds.top],
            "crs": crs,
            "resolution": resolution,
            "band_count": band_count,
            "min": float(min_val),
            "max": float(max_val),
        }


def ingest_external_layer(source, uploaded_file, created_by=None):
    """
    Ingests a raster file and creates an ExternalLayer
    linked to the given source.

    - `source`: ExternalLayerSource instance
    - `uploaded_file`: InMemoryUploadedFile (from admin or DRF upload)
    - `created_by`: User instance
    """
    filename = uploaded_file.name
    temp_path = f"/tmp/{datetime.now().timestamp()}_{filename}"

    # Save temporarily for metadata extraction
    with open(temp_path, "wb") as out:
        for chunk in uploaded_file.chunks():
            out.write(chunk)

    metadata = extract_raster_metadata(temp_path)

    # Save to ExternalLayer
    layer = ExternalLayer(
        name=filename,
        source=source,
        layer_type="raster",
        metadata=metadata,
        created_by=created_by,
        is_public=True,
        is_auto_published=source.fetch_type != "manual",
    )

    with open(temp_path, "rb") as final_file:
        layer.file.save(filename, ContentFile(final_file.read()))

    layer.save()
    os.remove(temp_path)

    return layer


def export_image(
    asset_id: str,
    region: ee.Geometry = None,
    scale: float = 1000,
    folder: str | None = None,
    vis_params: dict | None = None,
):
    """
    Export a (mosaicked) EE ImageCollection to Google Drive, wait for
    completion, download the resulting GeoTIFF to /tmp and return
    (local_path, filename).

    Returns
    -------
    tuple[str, str]
        (local_path, filename)
    """
    initialize_engine_analysis()

    timestamp = int(time.time())
    filename = f"{asset_id.split('/')[-1]}_{timestamp}.tif"
    description = filename.removesuffix(".tif")

    if region is None:
        # default AOI
        region = ee.Geometry.Rectangle([16.45, -34.85, 32.90, -22.13])

    image = ee.ImageCollection(asset_id).mosaic()

    # Launch export via helper (blocks until DONE)
    status = export_image_to_drive(
        image=image,
        description=description,
        folder=folder or "GEE_EXPORTS",
        file_name_prefix=description,
        scale=scale,
        region=region,
        vis_params=vis_params,
    )

    if status.get("state") != "COMPLETED":
        raise RuntimeError(f"[GEE] Export failed → {status}")

    logger.info("[GEE] Export completed: %s", filename)

    # Download from Drive
    gfile = get_gdrive_file(filename)
    if gfile is None:
        raise FileNotFoundError(f"[GDrive] File not found: {filename}")

    tmp_dir = tempfile.gettempdir()
    local_path = os.path.join(tmp_dir, filename)
    gfile.GetContentFile(local_path)

    logger.info("[LOCAL] File downloaded to: %s", local_path)
    return local_path, filename


def fetch_global_pasture_watch_data(source: ExternalLayerSource):
    """
    Export the Global Pasture Watch grassland-class (30 m) image from GEE,
    download it as a GeoTIFF, and store it as an ExternalLayer.

    Skips the download if the file has already been ingested.
    """
    ASSET_ID = "projects/global-pasture-watch/assets/ggc-30m/v1/grassland_c"

    tmp_path = None
    try:
        # Export image from GEE to a local temp file
        tmp_path, filename = export_image(asset_id=ASSET_ID)

        # Duplicate-ingest check
        if ExternalLayer.objects.filter(name=filename, source=source).exists():
            logger.info("[SKIP] %s already ingested.", filename)
            return

        # metadata extraction
        metadata = extract_raster_metadata(tmp_path)

        # Save the layer to DB and attach the file
        with open(tmp_path, "rb") as fh:
            layer = ExternalLayer.objects.create(
                name=filename,
                layer_type="raster",
                metadata=metadata,
                source=source,
                is_public=True,
                is_auto_published=True,
            )
            layer.file.save(filename, ContentFile(fh.read()))

        logger.info("[SUCCESS] %s ingested (Pasture Watch).", filename)

    except Exception as exc:
        logger.error("Pasture Watch ingest failed → %s", exc, exc_info=True)

    finally:
        # ensure temp file is removed even on error/skip
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)


def fetch_all_global_cropland_zenodo(
        source: ExternalLayerSource,
        resolution: str = "250m",
        years=range(2000, 2023),
):
    """
    Fetches global cropland extent files (2000–2022) at 250m or 1km from Zenodo
    and stores each year as an ExternalLayer.
    Parameters
    ----------
    source : ExternalLayerSource
        The configured Zenodo source record.
    resolution : str
        Either "250m" or "1km".
    years : iterable[int]
        Years to ingest; by default 2000-2022.
    """
    assert resolution in {"250m", "1km"}, "resolution must be '250m' or '1km'"

    base_url = "https://zenodo.org/record/12527546/files/"

    for year in years:
        filename = (
            f"cropland_glad.potapov.et.al_p_{resolution}_s_"
            f"{year}0101_{year}1231_go_epsg.4326_v20240624.tif"
        )

        # Duplicate-check
        if ExternalLayer.objects.filter(name=filename, source=source).exists():
            logger.info("[SKIP] %s already ingested.", filename)
            continue

        url = urljoin(base_url, filename)
        logger.info("[FETCH] %s", url)

        tmp_path = None
        try:
            # Stream download to temporary file
            with requests.get(url, stream=True, timeout=30) as r:
                r.raise_for_status()
                with NamedTemporaryFile(delete=False, suffix=".tif") as tmp:
                    for chunk in r.iter_content(chunk_size=8192):
                        tmp.write(chunk)
                    tmp_path = tmp.name

            # metadata extraction
            metadata = extract_raster_metadata(tmp_path)

            # Save layer to DB
            with open(tmp_path, "rb") as f:
                layer = ExternalLayer.objects.create(
                    name=filename,
                    layer_type="raster",
                    metadata=metadata,
                    source=source,
                    is_public=True,
                    is_auto_published=True,
                )
                layer.file.save(filename, ContentFile(f.read()))

            logger.info("[SUCCESS] %s ingested.", filename)

        except Exception as exc:
            logger.error("%s → %s", filename, exc, exc_info=True)

        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)


def fetch_grassland_stac_layers(
        source: ExternalLayerSource,
        years=range(2000, 2023)
):
    """
    Fetches grassland layers (30m) from the STAC collection
    and stores as ExternalLayers.

    Parameters
    ----------
    source : ExternalLayerSource
        Configured source with slug "openlandmap-grassland".
    years : iterable[int]
        The years to ingest (default 2000-2022).
    """
    stac_base = (
        "https://s3.eu-central-1.wasabisys.com/stac/openlandmap/gpw_ggc-30m/"
    )
    item_tpl = "gpw_ggc-30m_{year}0101_{year}1231/item.json"

    for year in years:
        item_url = urljoin(stac_base, item_tpl.format(year=year))
        logger.info("[STAC] Fetching item for %s → %s", year, item_url)

        tmp_path = None
        try:
            resp = requests.get(item_url, timeout=10)
            resp.raise_for_status()
            item = resp.json()

            cog_url = item["assets"]["COG"]["href"]
            filename = os.path.basename(cog_url)

            # Skip if already stored
            if ExternalLayer.objects.filter(
                name=filename, source=source
            ).exists():
                logger.info("[SKIP] %s already ingested.", filename)
                continue

            # Download COG
            logger.info("[DL] %s", cog_url)
            with requests.get(cog_url, stream=True, timeout=30) as cog_resp:
                cog_resp.raise_for_status()
                with NamedTemporaryFile(delete=False, suffix=".tif") as tmp:
                    for chunk in cog_resp.iter_content(chunk_size=8192):
                        tmp.write(chunk)
                    tmp_path = tmp.name

            # lightweight metadata
            metadata = extract_raster_metadata(tmp_path)

            # Save to DB
            with open(tmp_path, "rb") as fh:
                layer = ExternalLayer.objects.create(
                    name=filename,
                    layer_type="raster",
                    metadata=metadata,
                    source=source,
                    is_public=True,
                    is_auto_published=True,
                )
                layer.file.save(filename, ContentFile(fh.read()))

            logger.info("[SUCCESS] %s (%s) ingested.", filename, year)

        except Exception as exc:
            logger.error("Year %s → %s", year, exc, exc_info=True)

        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)


def fetch_short_vegetation_height_layers(
    source: ExternalLayerSource,
    years=range(2000, 2023),
):
    """
    Ingest annual 30 m short-vegetation-height layers from EcoDataCube STAC.

    Parameters
    ----------
    source : ExternalLayerSource
        The source with slug 'ecodatacube-veg-height'.
    years : iterable[int]
        Years to process (default 2000-2022).
    """
    stac_base = "https://s3.ecodatacube.eu/arco/stac/short.veg.height_lgb/"
    item_tpl = (
        "short.veg.height_lgb_{year}0101_{year}1231/"
        "short.veg.height_lgb_{year}0101_{year}1231.json"
    )
    cog_key = "short.veg.height_lgb_m_30m_s"   # asset key that holds the COG

    for year in years:
        item_url = urljoin(stac_base, item_tpl.format(year=year))
        logger.info("[STAC] Fetching veg-height item %s → %s", year, item_url)

        tmp_path = None
        try:
            # Fetch item metadata ────────────────────────────────
            r = requests.get(item_url, timeout=10)
            r.raise_for_status()
            item = r.json()

            if cog_key not in item["assets"]:
                raise KeyError(f"asset '{cog_key}' not found")

            cog_url = item["assets"][cog_key]["href"]
            filename = os.path.basename(cog_url)

            # Skip duplicates ───────────────────────────────────
            if ExternalLayer.objects.filter(
                name=filename, source=source
            ).exists():
                logger.info("[SKIP] %s already ingested.", filename)
                continue

            # Stream-download COG to temp file ──────────────────
            logger.info("[DL] %s", cog_url)
            with requests.get(cog_url, stream=True, timeout=30) as cog_resp:
                cog_resp.raise_for_status()
                with NamedTemporaryFile(delete=False, suffix=".tif") as tmp:
                    for chunk in cog_resp.iter_content(chunk_size=8192):
                        tmp.write(chunk)
                    tmp_path = tmp.name

            # Extract lightweight raster metadata ───────────────
            metadata = extract_raster_metadata(tmp_path)

            # Save layer to DB ──────────────────────────────────
            with open(tmp_path, "rb") as fh:
                layer = ExternalLayer.objects.create(
                    name=filename,
                    layer_type="raster",
                    metadata=metadata,
                    source=source,
                    is_public=True,
                    is_auto_published=True,
                )
                layer.file.save(filename, ContentFile(fh.read()))

            logger.info("[SUCCESS] %s (%s) ingested.", filename, year)

        except Exception as exc:
            logger.error("%s → %s", year, exc, exc_info=True)

        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)


def fetch_soil_bare_fraction_layers(
    source: ExternalLayerSource,
    years=range(2000, 2023),
):
    """
    Ingest annual bare-fraction (Europe) rasters from EcoDataCube STAC.

    Parameters
    ----------
    source : ExternalLayerSource
        Source with slug 'ecodatacube-bare-fraction'.
    years : iterable[int]
        Years to ingest (default 2000-2022).
    """
    stac_base = "https://stac.ecodatacube.eu/lcv_ndvi_landsat.glad.ard/"
    item_tpl = "lcv_ndvi_landsat.glad.ard_{year}0101_{year}1231/item.json"

    # Most items expose the main COG under this key
    cog_key = "lcv_ndvi_landsat.glad.ard_m_30m_s"

    for year in years:
        item_url = f"{stac_base}{item_tpl.format(year=year)}"
        logger.info("[STAC] Bare fraction %s → %s", year, item_url)

        tmp_path = None
        try:
            # Fetch STAC item
            r = requests.get(item_url, timeout=10)
            r.raise_for_status()
            item = r.json()

            # Resolve the COG asset key
            if cog_key not in item["assets"]:
                # Fallback: find first .tif asset
                for a in item["assets"].values():
                    if a["href"].lower().endswith((".tif", ".tiff")):
                        cog_url = a["href"]
                        break
                else:
                    raise KeyError("No GeoTIFF asset found.")
            else:
                cog_url = item["assets"][cog_key]["href"]

            filename = os.path.basename(cog_url)

            # Duplicate check
            if ExternalLayer.objects.filter(
                name=filename, source=source
            ).exists():
                logger.info("[SKIP] %s already ingested.", filename)
                continue

            # Download COG
            logger.info("[DL] %s", cog_url)
            with requests.get(cog_url, stream=True, timeout=30) as cog_resp:
                cog_resp.raise_for_status()
                with NamedTemporaryFile(delete=False, suffix=".tif") as tmp:
                    for chunk in cog_resp.iter_content(chunk_size=8192):
                        tmp.write(chunk)
                    tmp_path = tmp.name

            # Extract lightweight metadata
            metadata = extract_raster_metadata(tmp_path)

            # Save to ExternalLayer
            with open(tmp_path, "rb") as fh:
                layer = ExternalLayer.objects.create(
                    name=filename,
                    layer_type="raster",
                    metadata=metadata,
                    source=source,
                    is_public=True,
                    is_auto_published=True,
                )
                layer.file.save(filename, ContentFile(fh.read()))

            logger.info("[SUCCESS] Bare-fraction %s ingested.", year)

        except Exception as exc:
            logger.error("Bare-fraction %s → %s", year, exc, exc_info=True)

        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)

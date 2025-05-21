# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Utilities for layers
"""

import requests
import os
import time
from urllib.parse import urljoin
import tempfile
from tempfile import NamedTemporaryFile
import ee
import rasterio
from datetime import datetime
from django.core.files.base import ContentFile
from analysis.analysis import initialize_engine_analysis
from analysis.utils import get_gdrive_file
from layers.models import ExternalLayer, ExternalLayerSource


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
        array = src.read(1)
        return {
            "bounds": [bounds.left, bounds.bottom, bounds.right, bounds.top],
            "crs": crs,
            "resolution": resolution,
            "band_count": band_count,
            "min": float(array.min()),
            "max": float(array.max()),
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


def export_image(asset_id, region=None, scale=1000, folder=None):
    """
    Export a GEE image to Drive and download it locally.

    :param asset_id: GEE image asset ID (ImageCollection)
    :param region: Optional ee.Geometry (defaults to a southern Africa)
    :param scale: Pixel scale in meters
    :param folder: (Optional) Name of folder in Drive to store export
    :return: (local_path, filename)
    """
    initialize_engine_analysis()

    filename = f"{asset_id.split('/')[-1]}_{int(time.time())}.tif"

    if region is None:
        region = ee.Geometry.Rectangle([16.45, -34.85, 32.90, -22.13])

    image = ee.ImageCollection(asset_id).mosaic()

    export_params = {
        'image': image,
        'description': filename.replace('.tif', ''),
        'fileNamePrefix': filename.replace('.tif', ''),
        'region': region,
        'scale': scale,
        'fileFormat': 'GeoTIFF'
    }

    if folder:
        export_params['folder'] = folder

    task = ee.batch.Export.image.toDrive(**export_params)
    task.start()

    print(f"[GEE] Export task started: {filename}")
    while task.active():
        print("[GEE] Waiting for export to finish...")
        time.sleep(10)

    status = task.status()
    if status['state'] != 'COMPLETED':
        raise RuntimeError(f"[GEE] Export failed: {status}")

    print(f"[GEE] Export completed: {filename}")

    # Download file from Drive
    gfile = get_gdrive_file(filename)
    if not gfile:
        raise FileNotFoundError(
            f"[GDrive] File not found in Drive: {filename}"
        )

    temp_dir = tempfile.gettempdir()
    local_path = os.path.join(temp_dir, filename)
    gfile.GetContentFile(local_path)

    print(f"[Local] File downloaded to: {local_path}")
    return local_path, filename


def fetch_global_pasture_watch_data(source: ExternalLayerSource):
    """
    Fetches pasture data from GEE and stores as ExternalLayer.
    """
    ASSET_ID = "projects/global-pasture-watch/assets/ggc-30m/v1/grassland_c"

    # Export to GeoTIFF (local or cloud bucket)
    temp_path, filename = export_image(asset_id=ASSET_ID)

    # Extract metadata from GeoTIFF
    metadata = extract_raster_metadata(temp_path)

    # Save to DB
    with open(temp_path, "rb") as f:
        layer = ExternalLayer.objects.create(
            name=filename,
            layer_type="raster",
            metadata=metadata,
            created_by=None,
            source=source,
            is_public=True,
            is_auto_published=True
        )
        layer.file.save(filename, ContentFile(f.read()))


def fetch_all_global_cropland_zenodo(
        source: ExternalLayerSource,
        resolution: str = "250m"
):
    """
    Fetches global cropland extent files (2000–2022) at 250m or 1km from Zenodo
    and stores each year as an ExternalLayer.
    """
    assert resolution in ["250m", "1km"], "Resolution must be '250m' or '1km'"

    for year in range(2000, 2023):
        filename = (
            f"cropland_glad.potapov.et.al_p_{resolution}_s_"
            f"{year}0101_{year}1231_go_epsg.4326_v20240624.tif"
        )
        url = f"https://zenodo.org/record/12527546/files/{filename}"

        print(f"[INFO] Downloading {filename} from Zenodo...")

        try:
            with requests.get(url, stream=True) as r:
                r.raise_for_status()
                with NamedTemporaryFile(
                    delete=False, suffix=".tif"
                ) as tmp_file:
                    for chunk in r.iter_content(chunk_size=8192):
                        tmp_file.write(chunk)
                    tmp_path = tmp_file.name

            metadata = extract_raster_metadata(tmp_path)

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

            os.remove(tmp_path)
            print(f"[SUCCESS] Stored {filename} as ExternalLayer.")

        except Exception as e:
            print(f"[ERROR] Failed to fetch {filename}: {e}")


def fetch_grassland_stac_layers(
        source: ExternalLayerSource, years=range(2000, 2023)
):
    """
    Fetches grassland layers (30m) from the STAC collection
    and stores as ExternalLayers.
    """
    stac_base_url = (
        "https://s3.eu-central-1.wasabisys.com/stac/openlandmap/gpw_ggc-30m/"
    )
    item_template = "gpw_ggc-30m_{year}0101_{year}1231/item.json"

    for year in years:
        item_url = urljoin(stac_base_url, item_template.format(year=year))
        print(f"[INFO] Fetching STAC item for {year}: {item_url}")

        try:
            resp = requests.get(item_url)
            resp.raise_for_status()
            item = resp.json()
            asset = item["assets"]["COG"]
            cog_url = asset["href"]
            filename = cog_url.split("/")[-1]

            print(f"[INFO] Downloading COG from {cog_url}...")

            with requests.get(cog_url, stream=True) as r:
                r.raise_for_status()
                with NamedTemporaryFile(
                    delete=False, suffix=".tif"
                ) as tmp_file:
                    for chunk in r.iter_content(chunk_size=8192):
                        tmp_file.write(chunk)
                    tmp_path = tmp_file.name

            metadata = extract_raster_metadata(tmp_path)

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

            os.remove(tmp_path)
            print(f"[SUCCESS] Year {year} stored as ExternalLayer.")

        except Exception as e:
            print(f"[ERROR] Failed to process year {year}: {e}")


def fetch_short_vegetation_height_layers(
        source: ExternalLayerSource,
        years=range(2000, 2023)
):
    stac_base = "https://s3.ecodatacube.eu/arco/stac/short.veg.height_lgb/"
    item_template = "short.veg.height_lgb_{year}0101_{year}1231/item.json"

    for year in years:
        item_url = stac_base + item_template.format(year=year)
        try:
            r = requests.get(item_url)
            r.raise_for_status()
            item = r.json()
            cog_url = item["assets"]["COG"]["href"]
            filename = cog_url.split("/")[-1]

            print(f"[INFO] Fetching vegetation height COG {filename}")

            with requests.get(cog_url, stream=True) as cog:
                cog.raise_for_status()
                with NamedTemporaryFile(
                    delete=False, suffix=".tif"
                ) as tmp_file:
                    for chunk in cog.iter_content(chunk_size=8192):
                        tmp_file.write(chunk)
                    tmp_path = tmp_file.name

            metadata = extract_raster_metadata(tmp_path)

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
            os.remove(tmp_path)

        except Exception as e:
            print(f"[ERROR] Year {year} failed: {e}")


def fetch_soil_bare_fraction_layers(
        source: ExternalLayerSource,
        years=range(2000, 2023)
):
    """
    Fetches annual bare fraction (Europe) layers from EcoDataCube STAC
    and stores them as ExternalLayers.
    """
    stac_base = "https://stac.ecodatacube.eu/lcv_ndvi_landsat.glad.ard/"
    item_template = "lcv_ndvi_landsat.glad.ard_{year}0101_{year}1231/item.json"

    for year in years:
        item_url = f"{stac_base}{item_template.format(year=year)}"
        try:
            r = requests.get(item_url)
            r.raise_for_status()
            item = r.json()
            asset = item["assets"]["COG"]
            cog_url = asset["href"]
            filename = cog_url.split("/")[-1]

            print(f"[INFO] Downloading bare fraction layer {filename}")

            with requests.get(cog_url, stream=True) as cog:
                cog.raise_for_status()
                with NamedTemporaryFile(
                    delete=False, suffix=".tif"
                ) as tmp_file:
                    for chunk in cog.iter_content(chunk_size=8192):
                        tmp_file.write(chunk)
                    tmp_path = tmp_file.name

            metadata = extract_raster_metadata(tmp_path)

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

            os.remove(tmp_path)
            print(f"[SUCCESS] Year {year} ingested.")

        except Exception as e:
            print(f"[ERROR] Failed to process year {year}: {e}")

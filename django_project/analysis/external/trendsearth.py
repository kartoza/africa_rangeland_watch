# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Trends.Earth API client for SDG 15.3.1 LDN analysis.

How to obtain script IDs:
1. Authenticate: POST https://api2.trends.earth/auth with email/password
2. List scripts: GET https://api2.trends.earth/api/v1/script
   (requires Bearer token from step 1)
3. Each script returns: {"id": "<uuid>", "name": "<slug>"}

Alternatively, inspect network requests in the official QGIS plugin
when using each indicator tool - the script UUID appears in the
POST /api/v1/script/{uuid}/run request URL.
"""

import json
import os
import logging
from typing import Dict, List, Optional, Tuple

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

TRENDS_EARTH_BASE_URL = getattr(
    settings,
    'TRENDS_EARTH_BASE_URL',
    'https://api2.trends.earth'
)
TRENDS_EARTH_LDN_SCRIPT_SLUG = getattr(
    settings,
    'TRENDS_EARTH_LDN_SCRIPT_SLUG',
    'sdg-15-3-1-sub-indicators'
)
TRENDS_EARTH_DROUGHT_SCRIPT_SLUG = getattr(
    settings,
    'TRENDS_EARTH_DROUGHT_SCRIPT_SLUG',
    'drought-vulnerability'
)
TRENDS_EARTH_URBAN_SCRIPT_SLUG = getattr(
    settings,
    'TRENDS_EARTH_URBAN_SCRIPT_SLUG',
    'urban-area'
)
TRENDS_EARTH_POPULATION_SCRIPT_SLUG = getattr(
    settings,
    'TRENDS_EARTH_POPULATION_SCRIPT_SLUG',
    'download-data'
)
# Script UUIDs — used in POST /api/v1/script/{id}/run
# How to get: GET /api/v1/script (authenticated)
# or inspect QGIS plugin network requests
# LDN: SDG 15.3.1 Land Degradation Neutrality -
#   computes productivity, land cover, and SOC indicators
TRENDS_EARTH_LDN_SCRIPT_ID = getattr(
    settings,
    'TRENDS_EARTH_LDN_SCRIPT_ID',
    '965a2ff1-3b05-40a9-96cb-0aa4199b53d0'
)
# Drought: Drought vulnerability analysis
# using SPI, population, and land cover
TRENDS_EARTH_DROUGHT_SCRIPT_ID = getattr(
    settings,
    'TRENDS_EARTH_DROUGHT_SCRIPT_ID',
    '138773e4-501c-45f2-8eb8-2c90b9234011'
)
# Urbanization: SDG 11.3.1 Sustainable Urbanization -
#   built-up area change analysis
TRENDS_EARTH_URBAN_SCRIPT_ID = getattr(
    settings,
    'TRENDS_EARTH_URBAN_SCRIPT_ID',
    'f190312a-e637-4359-b8de-4300d2f363f7'
)
# Population: WorldPop data download (GPW)
TRENDS_EARTH_POPULATION_SCRIPT_ID = getattr(
    settings,
    'TRENDS_EARTH_POPULATION_SCRIPT_ID',
    '13715c51-0eac-41bd-9bf6-a14def7b1a3f'
)

_REQUEST_TIMEOUT = 30  # seconds

# WGS84 WKT — required by all TE job payloads
_WGS84_WKT = (
    'GEOGCS["WGS 84",DATUM["WGS_1984",'
    'SPHEROID["WGS 84",6378137,298.257223563,'
    'AUTHORITY["EPSG","7030"]],'
    'AUTHORITY["EPSG","6326"]],'
    'PRIMEM["Greenwich",0,AUTHORITY["EPSG","8901"]],'
    'UNIT["degree",0.0174532925199433,'
    'AUTHORITY["EPSG","9122"]],'
    'AUTHORITY["EPSG","4326"]]'
)

# ---------------------------------------------------------------------------
# Default land-cover legend nesting (ESA CCI -> UNCCD classes).
# Loaded from: analysis/external/data/lc_nesting_esa_to_custom.json
# ---------------------------------------------------------------------------
_DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
with open(
    os.path.join(_DATA_DIR, 'lc_nesting_esa_to_custom.json')
) as _f:
    _LC_NESTING_ESA_TO_CUSTOM = json.load(_f)

_LC_NESTING_CUSTOM_TO_IPCC = {
    "parent": _LC_NESTING_ESA_TO_CUSTOM["parent"],
    "child": _LC_NESTING_ESA_TO_CUSTOM["parent"],
    "nesting": {
        str(c["code"]): [c["code"]]
        for c in _LC_NESTING_ESA_TO_CUSTOM["parent"]["key"]
    },
}
# Add nodata mapping
_LC_NESTING_CUSTOM_TO_IPCC["nesting"]["-32768"] = [-32768]

# ---------------------------------------------------------------------------
# Default UNCCD land-cover transition matrix.
# Loaded from: analysis/external/data/lc_trans_matrix.json
# ---------------------------------------------------------------------------
with open(
    os.path.join(_DATA_DIR, 'lc_trans_matrix.json')
) as _f:
    _LC_TRANS_MATRIX = json.load(_f)


class TrendsEarthAuthError(Exception):
    """Raised when Trends.Earth credentials are invalid."""


class TrendsEarthAPIError(Exception):
    """Raised when the Trends.Earth API returns an unexpected error."""


def authenticate(email: str, password: str) -> Tuple[str, str]:
    """
    Authenticate with the Trends.Earth API.

    Returns (access_token, refresh_token).
    Raises TrendsEarthAuthError on bad credentials.
    """
    url = f'{TRENDS_EARTH_BASE_URL}/auth'
    try:
        resp = requests.post(
            url,
            json={'email': email, 'password': password},
            timeout=_REQUEST_TIMEOUT
        )
    except requests.RequestException as exc:
        raise TrendsEarthAPIError(
            f'Network error contacting Trends.Earth: {exc}'
        ) from exc

    if resp.status_code == 401:
        raise TrendsEarthAuthError(
            'Invalid Trends.Earth email or password.'
        )
    if not resp.ok:
        raise TrendsEarthAPIError(
            f'Unexpected response from Trends.Earth auth: '
            f'{resp.status_code} {resp.text[:200]}'
        )

    data = resp.json()
    access_token = data.get('access_token') or data.get('token')
    refresh_token = data.get('refresh_token', '')
    if not access_token:
        raise TrendsEarthAPIError(
            'Trends.Earth auth succeeded but returned no access_token.'
        )
    return access_token, refresh_token


def refresh_access_token(refresh_token: str) -> Tuple[str, str]:
    """
    Refresh an expired Trends.Earth access token.

    Returns (new_access_token, new_refresh_token).
    Raises TrendsEarthAuthError if the refresh token is expired.
    """
    url = f'{TRENDS_EARTH_BASE_URL}/auth/refresh'
    try:
        resp = requests.post(
            url,
            json={'refresh_token': refresh_token},
            timeout=_REQUEST_TIMEOUT
        )
    except requests.RequestException as exc:
        raise TrendsEarthAPIError(
            f'Network error refreshing Trends.Earth token: {exc}'
        ) from exc

    if resp.status_code in (401, 422):
        raise TrendsEarthAuthError(
            'Trends.Earth refresh token is expired or invalid. '
            'Please re-authenticate.'
        )
    if not resp.ok:
        raise TrendsEarthAPIError(
            f'Unexpected response refreshing token: '
            f'{resp.status_code} {resp.text[:200]}'
        )

    data = resp.json()
    new_access = data.get('access_token') or data.get('token')
    new_refresh = data.get('refresh_token', refresh_token)
    if not new_access:
        raise TrendsEarthAPIError(
            'Token refresh succeeded but returned no access_token.'
        )
    return new_access, new_refresh


def _auth_headers(access_token: str) -> Dict[str, str]:
    """Return standard authorisation headers."""
    return {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json',
    }


def get_execution_status(
    access_token: str,
    execution_id: str,
) -> Dict:
    """
    Poll the status of a Trends.Earth execution by paging through
    GET /api/v1/execution/user?include=script&page=N&per_page=100
    and matching the entry whose ``id`` equals ``execution_id``.

    Returns the matching execution JSON dict.  Key fields:
        status  – 'PENDING' | 'READY' | 'RUNNING' |
                  'FINISHED' | 'FAILED' | 'CANCELLED'
        results – result data (present when FINISHED)

    Raises TrendsEarthAPIError if the execution is not found after
    exhausting all pages.
    """
    page = 1
    per_page = 100
    while True:
        url = (
            f'{TRENDS_EARTH_BASE_URL}/api/v1/execution/user'
            f'?include=script&page={page}&per_page={per_page}'
        )
        try:
            resp = requests.get(
                url,
                headers=_auth_headers(access_token),
                timeout=_REQUEST_TIMEOUT
            )
        except requests.RequestException as exc:
            raise TrendsEarthAPIError(
                f'Network error polling execution {execution_id}: {exc}'
            ) from exc

        if resp.status_code == 401:
            raise TrendsEarthAuthError(
                'Access token rejected when polling TE job.'
            )
        if not resp.ok:
            raise TrendsEarthAPIError(
                f'Error polling executions (page {page}): '
                f'{resp.status_code} {resp.text[:400]}'
            )

        payload = resp.json()
        # Response shape: {"data": [...], "total": N, ...}
        executions = payload.get('data', [])
        if not isinstance(executions, list):
            executions = []

        for item in executions:
            if str(item.get('id')) == str(execution_id):
                return item

        # If this page had fewer records than per_page, we're done.
        if len(executions) < per_page:
            raise TrendsEarthAPIError(
                f'Execution {execution_id} not found in TE user executions.'
            )

        page += 1


def extract_result_urls(execution_data: Dict) -> List[str]:
    """
    Extract downloadable URLs from a completed TE v2 execution.

    Trends.Earth v2 uses typed result objects:

    - ``RasterResults`` — files are at
      ``rasters[key].uri.uri`` (presigned HTTPS URL or /vsigs/ path).
    - ``CloudResults``  — files are in ``urls[]``.
    - Fallback: top-level ``url`` / ``download_url`` for older shapes.

    Only HTTPS URLs are returned; /vsigs/ and /vsis3/ paths are
    logged and skipped because they require authenticated GCS/S3
    access and cannot be fetched with a plain HTTP request.

    Returns an empty list if the execution carries no output URLs.
    """
    data = execution_data.get('data', execution_data)
    results = data.get('results', [])
    if not isinstance(results, list):
        results = [results] if results else []

    if not results and data.get('type') == 'RasterResults':
        results = [data]

    urls: List[str] = []

    for result in results:
        if not isinstance(result, dict):
            continue

        result_type = result.get('type', '')

        if result_type == 'RasterResults':
            rasters = result.get('rasters', {})
            if isinstance(rasters, dict):
                for raster in rasters.values():
                    if not isinstance(raster, dict):
                        continue
                    uri_obj = raster.get('uri') or {}
                    uri = uri_obj.get('uri') if isinstance(
                        uri_obj, dict
                    ) else None
                    if isinstance(uri, str):
                        if uri.startswith('http'):
                            urls.append(uri)
                        else:
                            logger.warning(
                                'TE RasterResults URI is not an HTTP '
                                'URL (skipping): %s', uri[:120]
                            )

        elif result_type == 'CloudResults':
            for url in result.get('urls', []):
                if isinstance(url, str) and url.startswith('http'):
                    urls.append(url)

        elif result_type == 'FileResults':
            uri_obj = result.get('uri') or {}
            uri = uri_obj.get('uri') if isinstance(
                uri_obj, dict
            ) else None
            if isinstance(uri, str) and uri.startswith('http'):
                urls.append(uri)

        else:
            # Legacy / unknown shape — try direct url fields
            url = (
                result.get('url') or
                result.get('download_url') or
                result.get('uri')
            )
            if isinstance(url, str) and url.startswith('http'):
                urls.append(url)

    # Top-level fallback for very old response shapes
    if not urls:
        top_url = (
            data.get('url') or
            data.get('download_url') or
            data.get('uri')
        )
        if isinstance(top_url, str) and top_url.startswith('http'):
            urls.append(top_url)

    return urls


# Keep the old name as an alias so any other callers do not break.
extract_cog_urls = extract_result_urls


def extract_result_bands(execution_data: Dict) -> List[Dict]:
    """
    Extract COG URLs together with their band metadata from a completed
    Trends.Earth execution result.

    For ``RasterResults`` responses the ``rasters`` dict may contain a
    ``bands`` list per raster entry::

        {
          "rasters": {
            "Int16": {
              "uri": {"uri": "https://..."},
              "bands": [
                {
                  "name": "Urban",
                  "metadata": {"gee_band_name": "Urban", "year": 2000},
                  "add_to_map": false,
                  "no_data_value": -32768
                },
                ...
              ]
            }
          }
        }

    Returns a list of dicts, one per downloadable raster::

        [
          {
            "url": "https://...",
            "bands": [...]   # may be empty list for non-RasterResults shapes
          }
        ]

    Only HTTPS URLs are included (same rule as ``extract_result_urls``).
    """
    data = execution_data.get('data', execution_data)
    results = data.get('results', [])
    if not isinstance(results, list):
        results = [results] if results else []

    if not results and data.get('type') == 'RasterResults':
        results = [data]

    entries: List[Dict] = []

    for result in results:
        if not isinstance(result, dict):
            continue

        result_type = result.get('type', '')

        if result_type == 'RasterResults':
            rasters = result.get('rasters', {})
            if isinstance(rasters, dict):
                for raster in rasters.values():
                    if not isinstance(raster, dict):
                        continue
                    uri_obj = raster.get('uri') or {}
                    uri = (
                        uri_obj.get('uri')
                        if isinstance(uri_obj, dict)
                        else None
                    )
                    if isinstance(uri, str) and uri.startswith('http'):
                        bands = raster.get('bands', [])
                        if not isinstance(bands, list):
                            bands = []
                        entries.append({'url': uri, 'bands': bands})
                    elif isinstance(uri, str):
                        logger.warning(
                            'TE RasterResults URI is not an HTTP '
                            'URL (skipping): %s', uri[:120]
                        )

        elif result_type == 'CloudResults':
            for url in result.get('urls', []):
                if isinstance(url, str) and url.startswith('http'):
                    entries.append({'url': url, 'bands': []})

        elif result_type == 'FileResults':
            uri_obj = result.get('uri') or {}
            uri = (
                uri_obj.get('uri')
                if isinstance(uri_obj, dict)
                else None
            )
            if isinstance(uri, str) and uri.startswith('http'):
                entries.append({'url': uri, 'bands': []})

        else:
            url = (
                result.get('url') or
                result.get('download_url') or
                result.get('uri')
            )
            if isinstance(url, str) and url.startswith('http'):
                entries.append({'url': url, 'bands': []})

    if not entries:
        top_url = (
            data.get('url') or
            data.get('download_url') or
            data.get('uri')
        )
        if isinstance(top_url, str) and top_url.startswith('http'):
            entries.append({'url': top_url, 'bands': []})

    return entries


def _submit_job(
    access_token: str,
    script_id: str,
    params: Dict,
    job_label: str,
) -> str:
    """
    Internal helper: submit any Trends.Earth script job.

    Uses ``POST /api/v1/script/{script_id}/run`` — the correct endpoint
    for creating a new execution.

    :param access_token: Valid JWT access token.
    :param script_id:    The TE script UUID (not slug).
    :param params:       Script-specific parameter dict sent as the
        request body.
    :param job_label:    Human-readable label for log/error messages.
    :returns: Execution ID string.
    """
    url = (
        f'{TRENDS_EARTH_BASE_URL}/api/v1/script/{script_id}/run'
    )
    try:
        resp = requests.post(
            url,
            json=params,
            headers=_auth_headers(access_token),
            timeout=_REQUEST_TIMEOUT
        )
    except requests.RequestException as exc:
        raise TrendsEarthAPIError(
            f'Network error submitting {job_label} job: {exc}'
        ) from exc

    if resp.status_code == 401:
        raise TrendsEarthAuthError(
            f'Access token rejected when submitting {job_label} job.'
        )
    if not resp.ok:
        raise TrendsEarthAPIError(
            f'{job_label} job submission failed: '
            f'{resp.status_code} {resp.text[:400]}'
        )

    data = resp.json()
    execution_id = (
        data.get('data', {}).get('id') or data.get('id')
    )
    if not execution_id:
        raise TrendsEarthAPIError(
            f'{job_label} job submitted but API returned no execution id. '
            f'Response: {resp.text[:400]}'
        )
    logger.info(
        'Submitted Trends.Earth %s job: %s', job_label, execution_id
    )
    return str(execution_id)


def submit_ldn_job(
    access_token: str,
    geojson_geom: dict,
    year_initial: int,
    year_final: int,
    script_slug: Optional[str] = None,
    script_id: Optional[str] = None,
) -> str:
    """
    Submit an SDG 15.3.1 LDN calculation job to Trends.Earth.

    Uses the Trends.Earth 5-class LPD productivity mode with the MODIS
    NDVI dataset and default UNCCD land-cover nesting / transition matrix.

    :param access_token: Valid JWT access token.
    :param geojson_geom: GeoJSON geometry dict for the area of interest.
    :param year_initial: First year of the analysis period.
    :param year_final:   Last year of the analysis period.
    :param script_slug:  Unused; kept for backwards-compatibility.
    :param script_id:    Override the default LDN script UUID.
    :returns: Execution ID string for polling.
    """
    sid = script_id or TRENDS_EARTH_LDN_SCRIPT_ID

    y1 = year_initial
    y2 = year_final

    state_bl_start = y1
    state_bl_end = y2 - 3
    state_tg_start = state_bl_end + 1
    state_tg_end = state_bl_end + 3  # == y2

    # Population year: clamp y2 to available WorldPop range (2000-2020)
    pop_year = max(2000, min(y2, 2020))

    params = {
        "script": {
            "id": sid,
            "name": TRENDS_EARTH_LDN_SCRIPT_SLUG,
        },
        "productivity": {
            "mode": "TrendsEarth-LPD-5",
            # Server reads "ndvi_gee_dataset" (not "asset_productivity")
            "ndvi_gee_dataset": (
                "users/geflanddegradation/toolbox_datasets/"
                "ndvi_modis_2001_2024"
            ),
            # Server reads "trajectory_method" (not "traj_method")
            "trajectory_method": "ndvi_trend",
            "traj_year_initial": y1,
            "traj_year_final": y2,
            "perf_year_initial": y1,
            "perf_year_final": y2,
            "state_year_bl_start": state_bl_start,
            "state_year_bl_end": state_bl_end,
            "state_year_tg_start": state_tg_start,
            "state_year_tg_end": state_tg_end,
            # Server reads "climate_gee_dataset" (not "asset_climate").
            # ndvi_trend does not use the climate dataset, but the
            # server-side te_algorithms has a bug where it calls
            # ee.Image(climate_gee_dataset) before the None-guard,
            # so a real asset path must always be provided.
            "climate_gee_dataset": (
                "users/geflanddegradation/toolbox_datasets/"
                "prec_chirps_1981_2024"
            ),
        },
        "land_cover": {
            "year_initial": y1,
            "year_final": y2,
            "legend_nesting_esa_to_custom": _LC_NESTING_ESA_TO_CUSTOM,
            "legend_nesting_custom_to_ipcc": _LC_NESTING_CUSTOM_TO_IPCC,
            "trans_matrix": _LC_TRANS_MATRIX,
        },
        "soil_organic_carbon": {
            "year_initial": y1,
            "year_final": y2,
            "fl": 0.80,
            "legend_nesting_esa_to_custom": _LC_NESTING_ESA_TO_CUSTOM,
            "legend_nesting_custom_to_ipcc": _LC_NESTING_CUSTOM_TO_IPCC,
        },
        "population": {
            "year": pop_year,
            "asset": (
                "users/geflanddegradation/toolbox_datasets/"
                "worldpop_mf_v1_300m"
            ),
            "source": "WorldPop (gender breakdown)",
        },
        "period": {
            "name": "baseline",
            "year_initial": y1,
            "year_final": y2,
        },
        "geojsons": [geojson_geom],
        "crs": _WGS84_WKT,
        "crosses_180th": False,
        "task_name": f"LDN {y1}-{y2}",
        "task_notes": "",
    }
    return _submit_job(access_token, sid, params, 'LDN')


def submit_drought_job(
    access_token: str,
    geojson_geom: dict,
    year_initial: int,
    year_final: int,
    script_slug: Optional[str] = None,
    script_id: Optional[str] = None,
) -> str:
    """
    Submit a drought vulnerability analysis job to Trends.Earth.

    Note: ``year_final`` must be at least ``year_initial + 5``.

    :param access_token: Valid JWT access token.
    :param geojson_geom: GeoJSON geometry dict for the area of interest.
    :param year_initial: First year of the analysis period.
    :param year_final:   Last year (must be >= year_initial + 5).
    :param script_slug:  Unused; kept for backwards-compatibility.
    :param script_id:    Override the default drought script UUID.
    :returns: Execution ID string for polling.
    """
    sid = script_id or TRENDS_EARTH_DROUGHT_SCRIPT_ID

    params = {
        "script": {
            "id": sid,
            "name": TRENDS_EARTH_DROUGHT_SCRIPT_SLUG,
        },
        "population": {
            "asset": (
                "users/geflanddegradation/toolbox_datasets/"
                "worldpop_mf_v1_300m"
            ),
            "source": (
                "Gridded Population Count (gender breakdown)"
            ),
        },
        "land_cover": {
            "asset": (
                "users/geflanddegradation/toolbox_datasets/"
                "lcov_esacc_1992_2022"
            ),
            "source": "ESA CCI",
        },
        "spi": {
            "asset": (
                "users/geflanddegradation/toolbox_datasets/"
                "spi_gamma_gpcc_monthly_v2020"
            ),
            "source": (
                "GPCC V6 "
                "(Global Precipitation Climatology Centre)"
            ),
            "lag": 12,
        },
        # Drought sends geojsons as a raw list (no json.dumps)
        "geojsons": [geojson_geom],
        "crs": _WGS84_WKT,
        "crosses_180th": False,
        "year_initial": year_initial,
        "year_final": year_final,
        "task_name": f"Drought {year_initial}-{year_final}",
        "task_notes": "",
    }
    return _submit_job(access_token, sid, params, 'Drought')


def submit_urbanization_job(
    access_token: str,
    geojson_geom: dict,
    un_adju: bool = False,
    isi_thr: int = 30,
    ntl_thr: int = 10,
    wat_thr: int = 25,
    cap_ope: int = 200,
    pct_suburban: float = 0.25,
    pct_urban: float = 0.50,
    script_slug: Optional[str] = None,
    script_id: Optional[str] = None,
) -> str:
    """
    Submit an SDG 11.3.1 sustainable urbanization job to Trends.Earth.

    The urbanization script uses threshold parameters rather than a
    year range; all thresholds have sensible defaults matching the
    Trends.Earth QGIS plugin defaults.

    :param access_token:  Valid JWT access token.
    :param geojson_geom:  GeoJSON geometry dict for the area of interest.
    :param un_adju:       Apply UN adjustment (default False).
    :param isi_thr:       ISI threshold 0-100 (default 30).
    :param ntl_thr:       NTL threshold 0-100 (default 10).
    :param wat_thr:       Water threshold 0-100 (default 25).
    :param cap_ope:       Cap openness in metres (default 200).
    :param pct_suburban:  Suburban fraction 0-1 (default 0.25).
    :param pct_urban:     Urban fraction 0-1 (default 0.50).
    :param script_slug:   Unused; kept for backwards-compatibility.
    :param script_id:     Override the default urban script UUID.
    :returns: Execution ID string for polling.
    """
    sid = script_id or TRENDS_EARTH_URBAN_SCRIPT_ID

    params = {
        "script": {
            "id": sid,
            "name": TRENDS_EARTH_URBAN_SCRIPT_SLUG,
        },
        "un_adju": un_adju,
        "isi_thr": isi_thr,
        "ntl_thr": ntl_thr,
        "wat_thr": wat_thr,
        "cap_ope": cap_ope,
        "pct_suburban": pct_suburban,
        "pct_urban": pct_urban,
        "geojsons": json.dumps([geojson_geom]),
        "crs": _WGS84_WKT,
        "crosses_180th": False,
        "task_name": "Urbanization",
        "task_notes": "",
    }
    return _submit_job(access_token, sid, params, 'Urbanization')


def submit_population_job(
    access_token: str,
    geojson_geom: dict,
    year_initial: int,
    year_final: int,
    script_slug: Optional[str] = None,
    script_id: Optional[str] = None,
) -> str:
    """
    Submit a population (WorldPop) download job to Trends.Earth.

    :param access_token:  Valid JWT access token.
    :param geojson_geom:  GeoJSON geometry dict for the area of interest.
    :param year_initial:  Start year for the population data.
    :param year_final:    End year for the population data.
    :param script_slug:   Unused; kept for backwards-compatibility.
    :param script_id:     Override the default population script UUID.
    :returns: Execution ID string for polling.
    """
    sid = script_id or TRENDS_EARTH_POPULATION_SCRIPT_ID

    params = {
        "script": {
            "id": sid,
            "name": TRENDS_EARTH_POPULATION_SCRIPT_SLUG,
        },
        "geojsons": json.dumps([geojson_geom]),
        "crs": _WGS84_WKT,
        "crosses_180th": False,
        "year_initial": year_initial,
        "year_final": year_final,
        "asset": (
            "users/geflanddegradation/toolbox_datasets/"
            "worldpop_mf_v1_300m"
        ),
        "name": "Gridded Population Count (gender breakdown)",
        "temporal_resolution": "annual",
        "task_name": (
            f"Population {year_initial}"
            if year_initial == year_final
            else f"Population {year_initial}-{year_final}"
        ),
        "task_notes": "",
    }
    return _submit_job(access_token, sid, params, 'Population')

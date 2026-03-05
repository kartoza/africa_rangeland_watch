# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Trends.Earth API client for SDG 15.3.1 LDN analysis.
"""

import logging
from typing import Dict, List, Optional, Tuple

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

TRENDS_EARTH_BASE_URL = getattr(
    settings,
    'TRENDS_EARTH_BASE_URL',
    'https://api.trends.earth'
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

_REQUEST_TIMEOUT = 30  # seconds


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


def submit_ldn_job(
    access_token: str,
    geojson_geom: dict,
    start_year: int,
    end_year: int,
    script_slug: Optional[str] = None,
) -> str:
    """
    Submit an SDG 15.3.1 LDN calculation job to Trends.Earth.

    :param access_token: Valid JWT access token.
    :param geojson_geom: GeoJSON geometry dict for the area of interest.
    :param start_year: First year of the analysis period.
    :param end_year:   Last year of the analysis period.
    :param script_slug: Override the default LDN script slug.
    :returns: Execution ID string for polling.
    :raises TrendsEarthAPIError: on unexpected API error.
    """
    slug = script_slug or TRENDS_EARTH_LDN_SCRIPT_SLUG
    url = f'{TRENDS_EARTH_BASE_URL}/api/v1/execution'
    payload = {
        'script_slug': slug,
        'params': {
            'geojson': geojson_geom,
            'year_start': start_year,
            'year_end': end_year,
        }
    }
    try:
        resp = requests.post(
            url,
            json=payload,
            headers=_auth_headers(access_token),
            timeout=_REQUEST_TIMEOUT
        )
    except requests.RequestException as exc:
        raise TrendsEarthAPIError(
            f'Network error submitting LDN job: {exc}'
        ) from exc

    if resp.status_code == 401:
        raise TrendsEarthAuthError(
            'Access token rejected when submitting LDN job.'
        )
    if not resp.ok:
        raise TrendsEarthAPIError(
            f'LDN job submission failed: '
            f'{resp.status_code} {resp.text[:400]}'
        )

    data = resp.json()
    execution_id = (
        data.get('data', {}).get('id') or data.get('id')
    )
    if not execution_id:
        raise TrendsEarthAPIError(
            'LDN job submitted but API returned no execution id. '
            f'Response: {resp.text[:400]}'
        )
    logger.info('Submitted Trends.Earth LDN job: %s', execution_id)
    return str(execution_id)


def get_execution_status(
    access_token: str,
    execution_id: str,
) -> Dict:
    """
    Poll the status of a Trends.Earth execution.

    Returns the full execution JSON dict.  Key fields:
        status  – 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
        results – list of result dicts (present when COMPLETED)
    """
    url = f'{TRENDS_EARTH_BASE_URL}/api/v1/execution/{execution_id}'
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
            'Access token rejected when polling LDN job.'
        )
    if not resp.ok:
        raise TrendsEarthAPIError(
            f'Error polling execution {execution_id}: '
            f'{resp.status_code} {resp.text[:400]}'
        )

    return resp.json()


def extract_cog_urls(execution_data: Dict) -> List[str]:
    """
    Extract COG download URLs from a completed execution response.

    Trends.Earth v2 puts output URLs in
    ``data.results[].url`` or ``data.url``.
    Returns an empty list if the execution is not yet complete.
    """
    data = execution_data.get('data', execution_data)
    results = data.get('results', [])
    urls: List[str] = []
    if isinstance(results, list):
        for item in results:
            url = item.get('url') or item.get('download_url')
            if url:
                urls.append(url)
    # Fallback: single top-level URL
    if not urls:
        top_url = data.get('url') or data.get('download_url')
        if top_url:
            urls.append(top_url)
    return urls


def _submit_job(
    access_token: str,
    script_slug: str,
    params: Dict,
    job_label: str,
) -> str:
    """
    Internal helper: submit any Trends.Earth script job.

    :param access_token: Valid JWT access token.
    :param script_slug:  The TE script slug to execute.
    :param params:       Script-specific parameter dict.
    :param job_label:    Human-readable label for log/error messages.
    :returns: Execution ID string.
    """
    url = f'{TRENDS_EARTH_BASE_URL}/api/v1/execution'
    payload = {'script_slug': script_slug, 'params': params}
    try:
        resp = requests.post(
            url,
            json=payload,
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


def submit_drought_job(
    access_token: str,
    geojson_geom: dict,
    start_year: int,
    end_year: int,
    script_slug: Optional[str] = None,
) -> str:
    """
    Submit a drought vulnerability analysis job to Trends.Earth.

    :param access_token: Valid JWT access token.
    :param geojson_geom: GeoJSON geometry dict for the area of interest.
    :param start_year: First year of the analysis period.
    :param end_year:   Last year of the analysis period.
    :param script_slug: Override the default drought script slug.
    :returns: Execution ID string for polling.
    """
    slug = script_slug or TRENDS_EARTH_DROUGHT_SCRIPT_SLUG
    params = {
        'geojson': geojson_geom,
        'year_start': start_year,
        'year_end': end_year,
    }
    return _submit_job(access_token, slug, params, 'Drought')


def submit_urbanization_job(
    access_token: str,
    geojson_geom: dict,
    start_year: int,
    end_year: int,
    script_slug: Optional[str] = None,
) -> str:
    """
    Submit an SDG 11.3.1 sustainable urbanization job to Trends.Earth.

    :param access_token: Valid JWT access token.
    :param geojson_geom: GeoJSON geometry dict for the area of interest.
    :param start_year: First year of the analysis period.
    :param end_year:   Last year of the analysis period.
    :param script_slug: Override the default urban script slug.
    :returns: Execution ID string for polling.
    """
    slug = script_slug or TRENDS_EARTH_URBAN_SCRIPT_SLUG
    params = {
        'geojson': geojson_geom,
        'year_start': start_year,
        'year_end': end_year,
    }
    return _submit_job(access_token, slug, params, 'Urbanization')


def submit_population_job(
    access_token: str,
    geojson_geom: dict,
    year: int,
    script_slug: Optional[str] = None,
) -> str:
    """
    Submit a population (GPW download) job to Trends.Earth.

    :param access_token: Valid JWT access token.
    :param geojson_geom: GeoJSON geometry dict for the area of interest.
    :param year: Single target year for population data.
    :param script_slug: Override the default population script slug.
    :returns: Execution ID string for polling.
    """
    slug = script_slug or TRENDS_EARTH_POPULATION_SCRIPT_SLUG
    params = {
        'geojson': geojson_geom,
        'year': year,
    }
    return _submit_job(access_token, slug, params, 'Population')

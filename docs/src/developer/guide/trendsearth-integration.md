---
title: Africa Rangeland Watch
summary: Understand and monitor the impact of sustainable rangeland management in Africa.
date: 22/01/2025
some_url: https://github.com/kartoza/africa_rangeland_watch
copyright: Copyright 2023, Africa Rangeland Watch
contact: Perushan Rajah, prajah@conservation.org
license: This program is free software; you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published by
  the Free Software Foundation; either version 3 of the License, or (at your
  option) any later version.
---

# Trends.Earth Integration — SDG 15.3.1 Land Degradation

This document describes how to integrate
[Trends.Earth](https://github.com/ConservationInternational/trends.earth)
SDG 15.3.1 (Land Degradation Neutrality) data into ARW using the
[Trends.Earth REST API](https://api.trends.earth).

## Background

### What is Trends.Earth?

Trends.Earth is a tool by Conservation International for measuring land change.
It supports UNCCD reporting and tracking of SDG target 15.3 (Land Degradation
Neutrality). The `https://api.trends.earth` service runs Google Earth Engine
scripts server-side and returns Cloud-Optimised GeoTIFFs (COGs) — no GEE
account required by ARW.

### SDG 15.3.1 — Three sub-indicators

| Sub-indicator | Data source |
|---|---|
| Land productivity | MODIS/Sentinel NDVI trend (Trends.Earth, JRC, or FAO-WOCAT) |
| Land cover change | ESA CCI or custom classification |
| Soil organic carbon (SOC) | SoilGrids / ISRIC, baseline year 2000 |

The combined LDN score is a single COG where each pixel is classified as
improving, stable, or degrading.

### API workflow

The Trends.Earth API is a **job submission and polling service**:

1. `POST /auth` with email + password → JWT access token
2. `POST /api/v1/execution` with `script_slug` + parameters → `execution_id`
3. `GET /api/v1/execution/{id}` (poll) → `{status, results[]}`
4. Download output COG URLs from the finished execution

Jobs typically take 10–30 minutes. The `script_slug` for the combined LDN
calculation is `"sdg-15-3-1-ldn-calc"` (confirm via `GET /api/v1/script` with a
valid token on first run).

---

## Architecture decision: extend `analysis/`, no new app

ARW's `analysis/` app already provides everything needed:

- `AnalysisTask` — async job lifecycle (status, Celery task ID, result JSON)
- `AnalysisRasterOutput` — COG storage and `cloud_native_gis` tile serving
- `analysis/external/` — pattern for wrapping external APIs (see `gpw.py`)
- Celery polling pattern (see `check_ingestor_asset_status` in `tasks.py`)

A dedicated `trendsearth/` app is **not** needed. The integration adds:

- One new model (`TrendsEarthSetting`) to `analysis/models.py`
- Two new fields on `AnalysisTask` (`source`, `te_execution_id`)
- One new file `analysis/external/trendsearth.py`
- Two new Celery tasks in `analysis/tasks.py`
- One new DRF viewset + URL for settings management

---

## Implementation plan

### Phase 1 — Backend

#### 1a. New model: `TrendsEarthSetting`

Add to `django_project/analysis/models.py`:

```python
class TrendsEarthSetting(models.Model):
    """Stores per-user Trends.Earth API credentials.

    Only the JWT refresh token is persisted — the plaintext password is used
    once on first save to obtain tokens, then discarded.
    """
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='te_setting',
        help_text='The ARW user who owns these credentials.',
    )
    email = models.CharField(
        max_length=255,
        help_text='Trends.Earth account email.',
    )
    # Store only the long-lived refresh token, not the password.
    refresh_token = models.TextField(
        blank=True,
        help_text='JWT refresh token from the Trends.Earth API.',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Trends.Earth Setting'
        verbose_name_plural = 'Trends.Earth Settings'

    def __str__(self) -> str:
        return f'TrendsEarthSetting({self.user}, {self.email})'
```

> **Security note:** Never store the raw password. On first save, exchange
> email + password for a JWT refresh token (long-lived, ~30 days) via the API,
> then store only the refresh token. Use the refresh token to obtain short-lived
> access tokens on each job submission.

#### 1b. Extend `AnalysisTask`

Add two fields to the existing `AnalysisTask` model:

```python
# New field — which backend runs this task
source = models.CharField(
    max_length=50,
    choices=[
        ('gee', 'Google Earth Engine'),
        ('trends_earth', 'Trends.Earth'),
    ],
    default='gee',
    help_text='Computation backend for this analysis task.',
)

# New field — the remote job ID assigned by Trends.Earth
te_execution_id = models.UUIDField(
    null=True,
    blank=True,
    help_text='Execution UUID returned by the Trends.Earth API.',
)
```

The `analysis_inputs` JSON for a Trends.Earth job looks like:

```json
{
  "source": "trends_earth",
  "script_slug": "sdg-15-3-1-ldn-calc",
  "area_of_interest": {
    "type": "FeatureCollection",
    "features": [{ "type": "Feature", "geometry": { ... } }]
  },
  "year_initial": 2000,
  "year_final": 2015,
  "productivity_mode": "TRENDS_EARTH"
}
```

Run `make migrate` after adding these models.

#### 1c. New file: `analysis/external/trendsearth.py`

```python
"""
Trends.Earth API client for SDG 15.3.1 Land Degradation Neutrality.

API base: https://api.trends.earth
Auth:     POST /auth  →  JWT access + refresh tokens
Jobs:     POST /api/v1/execution  →  execution_id
Poll:     GET  /api/v1/execution/{id}
"""
import logging
from typing import Optional

import backoff
import requests

logger = logging.getLogger(__name__)

BASE_URL = 'https://api.trends.earth'
LDN_SCRIPT_SLUG = 'sdg-15-3-1-ldn-calc'


class TrendsEarthClient:

    def __init__(self, base_url: str = BASE_URL) -> None:
        self.base_url = base_url.rstrip('/')

    @backoff.on_exception(backoff.expo, requests.exceptions.RequestException,
                          max_tries=3)
    def authenticate(self, email: str, password: str) -> dict:
        """Exchange email/password for access + refresh tokens."""
        resp = requests.post(
            f'{self.base_url}/auth',
            json={'email': email, 'password': password},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()  # {'access_token': ..., 'refresh_token': ...}

    @backoff.on_exception(backoff.expo, requests.exceptions.RequestException,
                          max_tries=3)
    def refresh_access_token(self, refresh_token: str) -> str:
        """Use a refresh token to obtain a new access token."""
        resp = requests.post(
            f'{self.base_url}/auth/refresh',
            json={'refresh_token': refresh_token},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()['access_token']

    @backoff.on_exception(backoff.expo, requests.exceptions.RequestException,
                          max_tries=3)
    def submit_execution(
        self, access_token: str, script_slug: str, params: dict
    ) -> str:
        """Submit a job. Returns the execution_id string."""
        resp = requests.post(
            f'{self.base_url}/api/v1/execution',
            json={'script_slug': script_slug, 'params': params},
            headers={'Authorization': f'Bearer {access_token}'},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()['data']['id']

    @backoff.on_exception(backoff.expo, requests.exceptions.RequestException,
                          max_tries=3)
    def get_execution(self, access_token: str, execution_id: str) -> dict:
        """Poll execution status. Returns the full data dict."""
        resp = requests.get(
            f'{self.base_url}/api/v1/execution/{execution_id}',
            headers={'Authorization': f'Bearer {access_token}'},
            timeout=30,
        )
        resp.raise_for_status()
        return resp.json()['data']


def submit_ldn_job(setting, analysis_task) -> str:
    """Authenticate and submit an LDN job.

    Args:
        setting: TrendsEarthSetting instance for the requesting user.
        analysis_task: AnalysisTask instance with analysis_inputs populated.

    Returns:
        The Trends.Earth execution_id (UUID string).
    """
    client = TrendsEarthClient()
    access_token = client.refresh_access_token(setting.refresh_token)
    inputs = analysis_task.analysis_inputs
    execution_id = client.submit_execution(
        access_token=access_token,
        script_slug=inputs.get('script_slug', LDN_SCRIPT_SLUG),
        params={
            'area_of_interest': inputs['area_of_interest'],
            'year_initial': inputs['year_initial'],
            'year_final': inputs['year_final'],
            'productivity_mode': inputs.get(
                'productivity_mode', 'TRENDS_EARTH'
            ),
        },
    )
    logger.info(
        'Submitted Trends.Earth LDN job %s for task %s',
        execution_id, analysis_task.pk,
    )
    return execution_id
```

#### 1d. New Celery tasks in `analysis/tasks.py`

```python
MAX_POLL_RETRIES = 60   # 60 × 2 min = 2 hours max


@shared_task
def submit_te_job(analysis_task_id: int) -> None:
    """Authenticate with Trends.Earth and submit an LDN execution."""
    from .models import AnalysisTask, TrendsEarthSetting, TaskStatus
    from .external.trendsearth import submit_ldn_job

    task = AnalysisTask.objects.get(pk=analysis_task_id)
    setting = TrendsEarthSetting.objects.get(user=task.submitted_by)
    try:
        execution_id = submit_ldn_job(setting, task)
        task.te_execution_id = execution_id
        task.status = TaskStatus.RUNNING
        task.save(update_fields=['te_execution_id', 'status'])
        poll_te_job_status.apply_async(
            args=[analysis_task_id], countdown=120
        )
    except Exception as exc:
        logger.error('submit_te_job failed for task %s: %s', task.pk, exc)
        task.status = TaskStatus.ERROR
        task.error = {'message': str(exc)}
        task.save(update_fields=['status', 'error'])


@shared_task(bind=True, max_retries=MAX_POLL_RETRIES)
def poll_te_job_status(self, analysis_task_id: int) -> None:
    """Poll Trends.Earth until the LDN job finishes, then store outputs."""
    from .models import (
        AnalysisTask, TrendsEarthSetting, AnalysisRasterOutput, TaskStatus
    )
    from .external.trendsearth import TrendsEarthClient

    task = AnalysisTask.objects.get(pk=analysis_task_id)
    setting = TrendsEarthSetting.objects.get(user=task.submitted_by)

    client = TrendsEarthClient()
    access_token = client.refresh_access_token(setting.refresh_token)
    data = client.get_execution(access_token, str(task.te_execution_id))

    status = data.get('status')

    if status in ('PENDING', 'RUNNING', 'STARTED'):
        # Not done yet — retry after 2 minutes
        raise self.retry(countdown=120)

    if status == 'SUCCESS':
        # Download each output COG and register as AnalysisRasterOutput
        output_ids = []
        for result in data.get('results', []):
            url = result.get('url')
            if not url:
                continue
            output = _download_and_store_te_cog(url, task)
            if output:
                output_ids.append(output.pk)
        task.status = TaskStatus.SUCCESS
        task.result = {'output_ids': output_ids, 'source': 'trends_earth'}
        task.save(update_fields=['status', 'result'])
    else:
        task.status = TaskStatus.ERROR
        task.error = {'message': data.get('error', 'Unknown error')}
        task.save(update_fields=['status', 'error'])


def _download_and_store_te_cog(
    url: str, task: 'AnalysisTask'
) -> Optional['AnalysisRasterOutput']:
    """Stream-download a COG from Trends.Earth and create an output record.

    Follows the same pattern as fetch_global_pasture_watch_data() in
    layers/utils.py.
    """
    import os
    import tempfile
    import requests
    from django.core.files.base import ContentFile
    from layers.utils import extract_raster_metadata
    from .models import AnalysisRasterOutput

    filename = url.split('/')[-1].split('?')[0] or 'ldn_output.tif'
    try:
        with tempfile.NamedTemporaryFile(suffix='.tif', delete=False) as tmp:
            tmp_path = tmp.name
            with requests.get(url, stream=True, timeout=120) as r:
                r.raise_for_status()
                for chunk in r.iter_content(chunk_size=8192):
                    tmp.write(chunk)

        metadata = extract_raster_metadata(tmp_path)
        output = AnalysisRasterOutput.objects.create(
            name=AnalysisRasterOutput.generate_name(filename),
            analysis=task.analysis_inputs,
            status='SUCCESS',
        )
        with open(tmp_path, 'rb') as fh:
            output.file.save(filename, ContentFile(fh.read()))
        return output
    except Exception as exc:
        logger.error('Failed to download Trends.Earth COG %s: %s', url, exc)
        return None
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
```

#### 1e. Extend `run_analysis_task` to branch on `source`

In the existing `run_analysis_task` Celery task in `analysis/tasks.py`, add a
branch before the `AnalysisRunner` call:

```python
@shared_task
def run_analysis_task(analysis_task_id: int) -> None:
    task = AnalysisTask.objects.get(pk=analysis_task_id)

    # Route Trends.Earth jobs to their own task chain
    if task.analysis_inputs.get('source') == 'trends_earth':
        submit_te_job.delay(analysis_task_id)
        return

    # ... existing GEE runner code unchanged ...
```

#### 1f. New DRF viewset for settings management

Add to `analysis/views.py` (or a new `analysis/views_te.py`):

```python
class TrendsEarthSettingViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Manage per-user Trends.Earth API credentials."""
    permission_classes = [IsAuthenticated]
    serializer_class = TrendsEarthSettingSerializer

    def get_object(self):
        obj, _ = TrendsEarthSetting.objects.get_or_create(
            user=self.request.user
        )
        return obj

    def perform_create(self, serializer):
        """Exchange password for refresh token, then discard password."""
        from .external.trendsearth import TrendsEarthClient
        email = serializer.validated_data['email']
        password = serializer.validated_data.pop('password')
        client = TrendsEarthClient()
        tokens = client.authenticate(email, password)
        serializer.save(
            user=self.request.user,
            email=email,
            refresh_token=tokens['refresh_token'],
        )
```

Register in `analysis/urls.py`:
```python
router.register(
    r'trendsearth/settings',
    TrendsEarthSettingViewSet,
    basename='trendsearth-settings',
)
```

---

### Phase 2 — Frontend

#### 2a. Extend `analysisSlice.ts`

Add to the existing `analysisSlice.ts` state and thunks:

```typescript
// New state fields
trendsEarthConfigured: boolean;
trendsEarthEmail: string;

// New thunks
export const saveTrendsEarthSettings = createAsyncThunk(
  'analysis/saveTrendsEarthSettings',
  async (payload: { email: string; password: string }) => {
    const resp = await axios.post('/api/analysis/trendsearth/settings/', payload);
    return resp.data;
  }
);

export const fetchTrendsEarthSettings = createAsyncThunk(
  'analysis/fetchTrendsEarthSettings',
  async () => {
    const resp = await axios.get('/api/analysis/trendsearth/settings/');
    return resp.data;
  }
);
```

Submitting an LDN job reuses the **existing** `doAnalysis` thunk — just set
`source: 'trends_earth'` in the payload. Status polling via the existing
`fetchAnalysisStatus` thunk is unchanged.

#### 2b. New component: `LandDegradationPanel.tsx`

Create `src/components/LandDegradation/LandDegradationPanel.tsx`:

```
LandDegradationPanel
├── LdnCredentialsForm       — email + password → calls saveTrendsEarthSettings
├── LdnJobForm               — inputs: AOI picker, year range, productivity mode
│   ├── Area of interest     — reuse existing landscape/community selector
│   ├── Baseline year range  — default 2000–2015 (UNCCD standard)
│   ├── Reporting period     — default 2015–2023
│   └── Productivity mode    — TRENDS_EARTH / JRC / FAO_WOCAT
└── LdnJobStatus             — spinner + status text; on finish → View Layer button
```

On job completion, dispatch `fetchLayers()` from `layerSlice` so the new
output COG appears in the existing map layer panel automatically.

---

### Phase 3 — `ExternalLayerSource` fixture (optional)

If the LDN output COGs should be treated as sharable `ExternalLayer` objects
instead of private `AnalysisRasterOutput` objects, add a fixture entry:

```json
[{
  "model": "layers.externallayersource",
  "pk": null,
  "fields": {
    "name": "Trends.Earth — SDG 15.3.1 LDN",
    "slug": "trendsearth-ldn",
    "fetch_type": "api",
    "frequency": "manual",
    "active": true,
    "description": "Land Degradation Neutrality outputs from the Trends.Earth API."
  }
}]
```

Load with: `python manage.py loaddata trendsearth_ldn_source.json`

For the first iteration, using `AnalysisRasterOutput` (user-private) is
simpler. Promote to `ExternalLayer` (public) later if needed.

---

### Phase 4 — Tests

| File | What to test |
|---|---|
| `analysis/tests/test_trendsearth_client.py` | `TrendsEarthClient` — mock `requests`, test auth, submit, poll, error cases |
| `analysis/tests/test_trendsearth_tasks.py` | `submit_te_job`, `poll_te_job_status` — mock client, assert state transitions |
| `analysis/tests/test_trendsearth_views.py` | Settings viewset — `APITestCase`, test create (mocked auth), retrieve, update |

Use `@patch('analysis.external.trendsearth.requests.post')` for all HTTP mocks.

---

## Open questions

| Item | Detail |
|---|---|
| **Script slug** | Verify `"sdg-15-3-1-ldn-calc"` is current by calling `GET /api/v1/script` with a valid token. The slug can change between Trends.Earth releases. Store it as a Django setting (`TRENDS_EARTH_LDN_SCRIPT_SLUG`) rather than hard-coding it. |
| **Output file count** | The API may return 1 combined COG or 3 separate ones (one per sub-indicator). Inspect the `results[]` array on a real finished execution to confirm. |
| **Token expiry** | Refresh tokens last ~30 days. If a user's token expires, `poll_te_job_status` will fail. Add a clear error message directing the user to re-enter credentials. |
| **Rate limits** | No documented rate limits on the public API, but add `backoff` on all calls and cap concurrent job submissions per user at 1 (check for existing `RUNNING` task before submitting). |
| **AOI size** | The Trends.Earth API will reject very large geometries. Consider clipping the user's AOI to the landscape bounding box and validating area before submission. |

---

## Summary of file changes

```
django_project/
  analysis/
    models.py                     ← add TrendsEarthSetting; extend AnalysisTask
    tasks.py                      ← add submit_te_job, poll_te_job_status; extend run_analysis_task
    views.py                      ← add TrendsEarthSettingViewSet
    serializer.py                 ← add TrendsEarthSettingSerializer
    urls.py                       ← register trendsearth/settings/ route
    external/
      trendsearth.py              ← NEW: TrendsEarthClient + submit_ldn_job()
    migrations/
      XXXX_trendsearth.py         ← NEW: generated by makemigrations
    tests/
      test_trendsearth_client.py  ← NEW
      test_trendsearth_tasks.py   ← NEW
      test_trendsearth_views.py   ← NEW

django_project/frontend/src/
  store/
    analysisSlice.ts              ← extend with TE settings thunks
  components/
    LandDegradation/
      LandDegradationPanel.tsx    ← NEW
      LdnCredentialsForm.tsx      ← NEW
      LdnJobStatus.tsx            ← NEW

docs/src/developer/guide/
  trendsearth-integration.md      ← this file
```

No new Django app is needed. No changes to `INSTALLED_APPS`, `core/urls.py`,
or any other app.

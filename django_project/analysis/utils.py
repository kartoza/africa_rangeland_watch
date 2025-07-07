import base64
import json
import os
import logging
import rasterio
from datetime import date
from dateutil.relativedelta import relativedelta
from pydrive2.auth import GoogleAuth
from pydrive2.drive import GoogleDrive
from oauth2client.service_account import ServiceAccountCredentials
from rasterio.warp import transform_bounds


logger = logging.getLogger(__name__)


def _initialize_gdrive_instance():
    """Initialize gdrive instance."""
    # Authenticate to the Google Drive of the Service Account
    gauth = GoogleAuth()
    scope = ['https://www.googleapis.com/auth/drive']
    service_account_key = os.environ.get('SERVICE_ACCOUNT_KEY', '')
    if os.path.exists(service_account_key):
        gauth.credentials = (
            ServiceAccountCredentials.from_json_keyfile_name(
                service_account_key, scopes=scope
            )
        )
    else:
        gauth.credentials = (
            ServiceAccountCredentials.from_json_keyfile_dict(
                json.loads(
                    base64.b64decode(service_account_key).decode('utf-8')
                ),
                scopes=scope
            )
        )
    return GoogleDrive(gauth)


def gdrive_file_list(folder_name):
    """Get file list from a directory in gdrive."""
    gdrive = _initialize_gdrive_instance()

    # Step 1: Search for the folder by name
    folder_query = (
        f"title = '{folder_name}' and mimeType = "
        "'application/vnd.google-apps.folder' and trashed = false"
    )
    folder_list = gdrive.ListFile({'q': folder_query}).GetList()

    if not folder_list:
        # folder not found
        return None
    else:
        files = []
        for folder in folder_list:
            folder_id = folder['id']

            # Step 2: List files in the found folder
            file_query = f"'{folder_id}' in parents and trashed = false"
            _files = gdrive.ListFile({'q': file_query}).GetList()
            files.extend(_files)
        return files


def gdrive_delete_folder(folder_name):
    """Delete a folder from gdrive."""
    gdrive = _initialize_gdrive_instance()
    folder_list = gdrive.ListFile(
        {
            'q': (
                f"title = '{folder_name}' and "
                "mimeType = 'application/vnd.google-apps.folder' and "
                "trashed = false"
            )
        }
    ).GetList()

    if not folder_list:
        return False

    for folder in folder_list:
        folder.Delete()

    return True


def gdrive_create_folder(folder_name):
    """Create a folder in gdrive."""
    gdrive = _initialize_gdrive_instance()
    # Create a folder
    folder_metadata = {
        'title': folder_name,
        'mimeType': 'application/vnd.google-apps.folder'
    }

    folder = gdrive.CreateFile(folder_metadata)
    folder.Upload()


def get_gdrive_file(filename: str):
    """Retrieve a file by filename from gdrive."""
    gdrive = _initialize_gdrive_instance()
    file_list = gdrive.ListFile(
        {'q': f"title = '{filename}' and trashed = false"}
    ).GetList()

    if not file_list:
        return None

    return file_list[0]


def delete_gdrive_file(filename: str):
    """Delete file from gdrive."""
    try:
        file = get_gdrive_file(filename)
        if file:
            file.Delete()

        return True
    except Exception as ex:
        logger.error(
            f'Failed to delete file {filename} from gdrive! {ex}',
            exc_info=True
        )
    return False


def sort_nested_structure(d):
    """Sort nested dictionary."""
    if isinstance(d, dict):
        return {k: sort_nested_structure(v) for k, v in sorted(d.items())}
    elif isinstance(d, list):
        return [sort_nested_structure(item) for item in d]
    return d


def get_cog_bounds(cog_path):
    """Get bounds of a COG file."""
    try:
        with rasterio.open(cog_path) as src:
            bbox = transform_bounds(src.crs, "EPSG:4326", *src.bounds)
        return [bbox[0], bbox[1], bbox[2], bbox[3]]
    except Exception as e:
        logger.error(f"Error getting bounds for {cog_path}: {e}")
        return None


def split_dates_by_year(start_date: date, end_date: date):
    """Split a date range into yearly intervals."""
    if start_date > end_date:
        raise ValueError("start_date must be before or equal to end_date")

    current_year = start_date.year
    results = []

    while current_year <= end_date.year:
        year_start = max(start_date, date(current_year, 1, 1))
        year_end = min(end_date, date(current_year, 12, 31))
        results.append((year_start, year_end))
        current_year += 1

    return results


def get_date_range_for_analysis(temporal_resolution, year, quarter, month):
    """Get date range for analysis based on temporal resolution."""
    start_date = date(year, 1, 1)
    end_date = date(year + 1, 1, 1)
    resolution = 'year'
    resolution_step = 1
    month_filter = None
    if temporal_resolution == 'Monthly':
        start_date = start_date.replace(
            month=month
        )
        end_date = start_date + relativedelta(months=1)
        month_filter = month
        resolution = 'month'
    elif temporal_resolution == 'Quarterly':
        quarter_dict = {
            1: 1,
            2: 4,
            3: 7,
            4: 10
        }
        start_date = start_date.replace(
            month=quarter_dict[quarter]
        )
        end_date = start_date + relativedelta(months=3)
        resolution_step = 3
        month_filter = quarter_dict[quarter]
        resolution = 'month'

    return {
        'start_date': start_date,
        'end_date': end_date,
        'resolution': resolution,
        'resolution_step': resolution_step,
        'month_filter': month_filter
    }

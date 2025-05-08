import base64
import json
import os
import logging
from pydrive2.auth import GoogleAuth
from pydrive2.drive import GoogleDrive
from oauth2client.service_account import ServiceAccountCredentials

from analysis.analysis import SERVICE_ACCOUNT_KEY


logger = logging.getLogger(__name__)


def _initialize_gdrive_instance():
    """Initialize gdrive instance."""
    # Authenticate to the Google Drive of the Service Account
    gauth = GoogleAuth()
    scope = ['https://www.googleapis.com/auth/drive']
    if os.path.exists(SERVICE_ACCOUNT_KEY):
        gauth.credentials = (
            ServiceAccountCredentials.from_json_keyfile_name(
                SERVICE_ACCOUNT_KEY, scopes=scope
            )
        )
    else:
        gauth.credentials = (
            ServiceAccountCredentials.from_json_keyfile_dict(
                json.loads(
                    base64.b64decode(SERVICE_ACCOUNT_KEY).decode('utf-8')
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

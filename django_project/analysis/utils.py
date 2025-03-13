import base64
import json
import os
from pydrive2.auth import GoogleAuth
from pydrive2.drive import GoogleDrive
from oauth2client.service_account import ServiceAccountCredentials

from analysis.analysis import SERVICE_ACCOUNT_KEY


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
        # Assuming the first match is the desired folder
        folder_id = folder_list[0]['id']
        print(f"Folder ID: {folder_id}")

        # Step 2: List files in the found folder
        file_query = f"'{folder_id}' in parents and trashed = false"
        return gdrive.ListFile({'q': file_query}).GetList()


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
        print(ex)
        print(f'Failed to delete file {filename} from gdrive!')
    return False


def sort_nested_structure(d):
    """Sort nested dictionary."""
    if isinstance(d, dict):
        return {k: sort_nested_structure(v) for k, v in sorted(d.items())}
    elif isinstance(d, list):
        return [sort_nested_structure(item) for item in d]
    return d

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

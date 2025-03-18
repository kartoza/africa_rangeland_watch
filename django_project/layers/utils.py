# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Utilities for layers
"""

import requests


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

# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Utilities for layers
"""

import os
import zipfile
import requests
import subprocess
from pathlib import Path
from django.db import connection

from cloud_native_gis.models import Layer
from cloud_native_gis.utils.fiona import FileType


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


def _zip_shapefile(shp_filepath, working_dir, remove_file=True):
    zip_filepath = os.path.join(
        working_dir,
        shp_filepath.replace('.shp', '.zip')
    )
    file_name = os.path.basename(shp_filepath).replace('.shp', '')
    shp_files = ['.shp', '.dbf', '.shx', '.cpg', '.prj']
    with zipfile.ZipFile(
            zip_filepath, 'w', zipfile.ZIP_DEFLATED) as archive:
        for suffix in shp_files:
            shape_file = os.path.join(
                working_dir,
                file_name
            ) + suffix
            if not os.path.exists(shape_file):
                continue
            archive.write(
                shape_file,
                arcname=file_name + suffix
            )
            if remove_file:
                os.remove(shape_file)
    return zip_filepath


# TODO: move this to CloudNativeGIS
def export_layer(
    layer: Layer, type: FileType, working_dir: str, filename = None
):
    driver_dict = {
        FileType.GEOJSON: 'GeoJSON',
        FileType.GEOPACKAGE: 'GPKG',
        FileType.KML: 'KML',
        FileType.SHAPEFILE: 'ESRI Shapefile'
    }
    ext = (
        '.shp' if type == FileType.SHAPEFILE else
        FileType.to_extension(type)
    )
    name = Path(filename).stem if filename else str(layer.unique_id)
    export_filepath = os.path.join(
        working_dir,
        f'{name}{ext}'
    )
    conn_str = (
        'PG:dbname={NAME} user={USER} password={PASSWORD} '
        'host={HOST} port={PORT}'.format(
            **connection.settings_dict
        )
    )
    sql_str = (
        'SELECT * FROM {table_name}'.format(
            table_name=layer.query_table_name
        )
    )
    cmd_list = [
        'ogr2ogr',
        '-t_srs',
        'EPSG:4326',
        '-f',
        f'{driver_dict[type]}',
        export_filepath,
        conn_str,
        '-sql',
        sql_str
    ]
    if type == FileType.SHAPEFILE:
        cmd_list.append('-lco')
        cmd_list.append('ENCODING=UTF-8')

    try:
        subprocess.run(cmd_list, check=True)

        if type == FileType.SHAPEFILE:
            # zip the files
            export_filepath = _zip_shapefile(
                export_filepath, working_dir
            )

        return (
            export_filepath,
            'Success'
        )
    except subprocess.CalledProcessError:
        return (
            None,
            f'Failed to export layer {layer.name} to format {type}'
        )

# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Background tasks to export layer
"""

import os
import zipfile
from core.celery import app
from django.db import connection
import subprocess

from cloud_native_gis.models.layer import Layer
from cloud_native_gis.utils.fiona import FileType


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
def export_layer(layer: Layer, type: FileType, working_dir: str):
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
    export_filepath = os.path.join(
        working_dir,
        f'{str(layer.unique_id)}{ext}'
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

# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Background tasks to export layer
"""

import os
import tempfile
import zipfile
import uuid
from core.celery import app
from django.db import connection
from django.core.files.base import File
from django.conf import settings
from django.utils import timezone
import subprocess

from cloud_native_gis.models.layer import Layer
from cloud_native_gis.utils.fiona import FileType
from core.models import TaskStatus
from layers.models import ExportLayerRequest


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


@app.task
def process_export_request(export_id):
    """Process export layer request from user."""
    export_request = ExportLayerRequest.objects.get(id=export_id)
    try:
        export_request.status = TaskStatus.RUNNING
        export_request.start_datetime = timezone.now()
        export_request.save()

        exported_files = []
        with tempfile.TemporaryDirectory() as working_dir:
            for input_layer in export_request.layers:
                # find layer in cloud native gis
                layer = Layer.objects.filter(
                    unique_id=input_layer.uuid
                ).first()
                if layer is None:
                    continue

                print(f'Exporting layer {layer.unique_id}')
                file_path, msg = export_layer(
                    layer,
                    export_request.format,
                    working_dir
                )

                if file_path is None:
                    print(msg)
                    continue

                exported_files.append(file_path)

            if len(exported_files) == 0:
                raise RuntimeError('No generated file!')

            # if there are more than 1 file, zip the files
            output_file = None
            if len(exported_files) > 0:
                zip_filepath = os.path.join(
                    working_dir,
                    f'{uuid.uuid4().hex}.zip'
                )
                with zipfile.ZipFile(
                    zip_filepath, 'w', zipfile.ZIP_DEFLATED
                ) as archive:
                    for exported_file in exported_files:
                        archive.write(
                            exported_file,
                            arcname=os.path.basename(exported_file)
                        )
                output_file = zip_filepath
            else:
                output_file = exported_files[0]

            # store to media directory
            if settings.DEBUG:
                with open(output_file, 'rb') as f:
                    export_request.file.save(
                        os.path.basename(output_file),
                        File(f),
                        save=True
                    )
            else:
                # TODO: upload to API
                pass

            export_request.end_datetime = timezone.now()
            export_request.status = TaskStatus.COMPLETED
            if len(exported_files) != export_request.layers.count():
                export_request.notes = (
                    'There are '
                    f'{export_request.layers.count() - len(exported_files)} '
                    'layers that are failed to be exported!'
                )
    except Exception as ex:
        print(f'Failed to export layers {ex}')
        export_request.status = TaskStatus.FAILED
        export_request.notes = str(ex)
    finally:
        export_request.save()

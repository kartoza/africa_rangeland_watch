# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Unit tests for Export Layer Tasks.
"""

import uuid
from unittest.mock import patch
from django.test import TestCase
from cloud_native_gis.models.layer import Layer
from cloud_native_gis.utils.fiona import FileType

from core.factories import UserF
from core.models import TaskStatus
from layers.models import ExportLayerRequest, InputLayer, DataProvider
from layers.tasks.export_layer import process_export_request


class TestExportLayerTasks(TestCase):

    fixtures = [
        '2.data_provider.json'
    ]

    def setUp(self):
        self.user = UserF.create()
        self.layer = Layer.objects.create(
            unique_id=uuid.uuid4(),
            name='Test Layer',
            created_by=self.user
        )
        self.input_layer = InputLayer.objects.create(
            uuid=self.layer.unique_id,
            name=self.layer.name,
            data_provider=DataProvider.objects.get(name='User defined'),
            created_by=self.user
        )
        self.export_request = ExportLayerRequest.objects.create(
            requested_by=self.user,
            format=FileType.SHAPEFILE
        )
        self.export_request.layers.set([self.input_layer])

    @patch('layers.tasks.export_layer.upload_file')
    @patch('layers.tasks.export_layer.Layer.export_layer')
    def test_process_export_request_success(
        self, mock_export_layer, mock_upload_file
    ):
        mock_export_layer.return_value = ('/tmp/test.shp', 'Success')
        mock_upload_file.return_value = True

        process_export_request(self.export_request.id)

        self.export_request.refresh_from_db()
        mock_export_layer.assert_called_once()
        self.assertEqual(self.export_request.status, TaskStatus.COMPLETED)
        self.assertIsNotNone(self.export_request.end_datetime)
        self.assertIsNone(self.export_request.notes)

    @patch('layers.tasks.export_layer.upload_file')
    @patch('layers.tasks.export_layer.Layer.export_layer')
    def test_process_export_request_failure(
        self, mock_export_layer, mock_upload_file
    ):
        mock_export_layer.return_value = (None, 'Failed to export layer')
        mock_upload_file.return_value = False

        process_export_request(self.export_request.id)

        self.export_request.refresh_from_db()
        mock_export_layer.assert_called_once()
        self.assertEqual(self.export_request.status, TaskStatus.FAILED)
        self.assertIsNotNone(self.export_request.notes)
        self.assertIn('No generated file!', self.export_request.notes)

    @patch('layers.tasks.export_layer.upload_file')
    @patch('layers.tasks.export_layer.Layer.export_layer')
    def test_process_export_request_partial_success(
        self, mock_export_layer, mock_upload_file
    ):
        mock_export_layer.side_effect = [
            ('/tmp/test1.shp', 'Success'),
            (None, 'Failed to export layer')
        ]
        mock_upload_file.return_value = True

        second_layer = Layer.objects.create(
            unique_id=uuid.uuid4(),
            name='Test Layer 2',
            created_by=self.user
        )
        second_input_layer = InputLayer.objects.create(
            uuid=second_layer.unique_id,
            name=second_layer.name,
            data_provider=DataProvider.objects.get(name='User defined'),
            created_by=self.user
        )
        self.export_request.layers.set([self.input_layer, second_input_layer])

        process_export_request(self.export_request.id)

        self.export_request.refresh_from_db()
        self.assertEqual(mock_export_layer.call_count, 2)
        self.assertEqual(self.export_request.status, TaskStatus.COMPLETED)
        self.assertIsNotNone(self.export_request.end_datetime)
        self.assertIsNotNone(self.export_request.notes)
        self.assertIn(
            'layers that are failed to be exported',
            self.export_request.notes
        )

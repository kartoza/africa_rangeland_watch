# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Unit tests for Import Layer Tasks.
"""

import os
import requests_mock
from io import BytesIO
from unittest.mock import patch
from django.test import TestCase
from cloud_native_gis.models.layer import Layer
from cloud_native_gis.models.layer_upload import LayerUpload

from core.factories import UserF
from layers.models import InputLayer, DataProvider, LayerGroupType
from layers.tasks.import_layer import download_file_from_url, import_layer


class TestImportLayer(TestCase):
    """Test import layer tasks."""

    fixtures = [
        '1.layer_group_type.json',
        '2.data_provider.json',
        '3.input_layer.json'
    ]

    def setUp(self):
        """Setup for tests."""
        self.test_url = "https://example.com/testfile"
        self.download_dir = "./test_downloads"
        self.test_content = b"This is test file content"
        self.filename = "testfile.txt"

        # Ensure the download directory exists
        os.makedirs(self.download_dir, exist_ok=True)

    def tearDown(self):
        """Clean up after tests."""
        if os.path.exists(self.download_dir):
            for file in os.listdir(self.download_dir):
                os.remove(os.path.join(self.download_dir, file))
            os.rmdir(self.download_dir)

    @requests_mock.Mocker()
    def test_download_file(self, mock):
        """Test file download file from url."""
        # Mock HTTP response
        headers = {
            "Content-Length": str(len(self.test_content)),
            "Content-Disposition": f'attachment; filename="{self.filename}"',
        }
        mock.get(self.test_url, content=self.test_content, headers=headers)

        # Call the function
        downloaded_file = download_file_from_url(
            self.test_url, self.download_dir
        )

        # Assert file was downloaded correctly
        self.assertEqual(downloaded_file, self.filename)
        downloaded_path = os.path.join(self.download_dir, self.filename)
        self.assertTrue(os.path.exists(downloaded_path))

        with open(downloaded_path, 'rb') as file:
            self.assertEqual(file.read(), self.test_content)

    @patch.object(LayerUpload, 'import_data')
    def test_import_layer(self, mock_import_data):
        """Test import layer."""
        user = UserF.create(
            is_active=True
        )
        # create layer
        layer = Layer.objects.create(
            created_by=user,
            is_ready=True
        )
        # create InputLayer
        input_layer = InputLayer.objects.create(
            uuid=layer.unique_id,
            name=str(layer.unique_id),
            data_provider=DataProvider.objects.get(name='User defined'),
            group=LayerGroupType.objects.get(name='user-defined'),
            created_by=user,
            updated_by=user
        )
        # create LayerUpload
        layer_upload = LayerUpload.objects.create(
            created_by=user, layer=layer
        )
        mock_import_data.return_value = "OK"
        
        import_layer(layer.unique_id, layer_upload.id, None)
        
        mock_import_data.assert_called_once()
        input_layer.refresh_from_db()
        self.assertTrue(input_layer.url)

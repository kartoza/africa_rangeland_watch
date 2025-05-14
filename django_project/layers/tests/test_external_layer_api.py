from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from layers.models import ExternalLayer, ExternalLayerSource, DataProvider
from django.core.files.uploadedfile import SimpleUploadedFile
import uuid

User = get_user_model()


class ExternalLayerAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="tester", email="test@example.com", password="pass123"
        )
        self.client = APIClient()
        self.provider = DataProvider.objects.create(name="Test Provider")
        self.source = ExternalLayerSource.objects.create(
            name="Manual",
            provider=self.provider,
            fetch_type="manual",
            frequency="manual",
        )

        # Public layer
        self.public_layer = ExternalLayer.objects.create(
            name="Public Layer",
            source=self.source,
            layer_type="raster",
            metadata={"crs": "EPSG:4326"},
            is_public=True,
            created_by=self.user,
        )
        self.public_layer.file.save(
            "test.tif", SimpleUploadedFile("test.tif", b"filecontent")
        )

        # Private layer
        self.private_layer = ExternalLayer.objects.create(
            name="Private Layer",
            source=self.source,
            layer_type="raster",
            metadata={"crs": "EPSG:4326"},
            is_public=False,
            created_by=self.user,
        )

    def test_requires_authentication(self):
        response = self.client.get("/api/external-layers/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_returns_only_public_layers(self):
        self.client.login(username="tester", password="pass123")
        response = self.client.get("/api/external-layers/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(
            response.data["results"][0]["uuid"], str(self.public_layer.uuid)
        )

    def test_detail_view_returns_expected_layer(self):
        self.client.login(username="tester", password="pass123")
        url = f"/api/external-layers/{self.public_layer.uuid}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["uuid"], str(self.public_layer.uuid))
        self.assertIn("metadata", response.data)

    def test_detail_view_private_layer_not_found(self):
        self.client.login(username="tester", password="pass123")
        url = f"/api/external-layers/{self.private_layer.uuid}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_detail_view_nonexistent_layer(self):
        self.client.login(username="tester", password="pass123")
        fake_uuid = uuid.uuid4()
        url = f"/api/external-layers/{fake_uuid}/"
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

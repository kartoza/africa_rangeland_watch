import uuid
from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from layers.models import InputLayer, InputLayerType, LayerGroupType, DataProvider
from uuid import uuid4
from django.core.files.uploadedfile import SimpleUploadedFile
import mimetypes
import os


class UserInputLayersViewTest(TestCase):
    def setUp(self):
        # Create a user
        self.user = User.objects.create_user(
            username="testuser",
            password="password"
        )
        self.client.login(username="testuser", password="password")

        # Create data provider and groups
        self.data_provider = DataProvider.objects.create(name="Test Provider")
        self.group_user_defined = LayerGroupType.objects.create(
            name="user-defined")
        self.group_other = LayerGroupType.objects.create(name="other-group")

        # Create layers for the user
        self.layer1 = InputLayer.objects.create(
            uuid=uuid4(),
            name="Layer 1",
            layer_type="raster",
            created_by=self.user,
            group=self.group_user_defined,
            data_provider=self.data_provider
        )
        self.layer2 = InputLayer.objects.create(
            uuid=uuid4(),
            name="Layer 2",
            layer_type="vector",
            created_by=self.user,
            group=self.group_other,
            data_provider=self.data_provider
        )
        self.layer3 = InputLayer.objects.create(
            uuid=uuid4(),
            name="Layer 3",
            layer_type="raster",
            created_by=self.user,
            group=None,
            data_provider=self.data_provider
        )

    def test_user_input_layers_view(self):
        # Make a request to the view
        response = self.client.get(reverse("user_input_layers"))

        # Verify response status
        self.assertEqual(response.status_code, 200)

        # Parse JSON response
        data = response.json()

        # Verify grouped layers
        grouped_layers = data.get("grouped_layers", {})
        self.assertIn("user-defined", grouped_layers)
        self.assertNotIn("other-group", grouped_layers)

        # Verify content of 'user-defined' group
        user_defined_layers = grouped_layers["user-defined"]
        self.assertEqual(len(user_defined_layers), 1)
        self.assertEqual(user_defined_layers[0]["name"], "Layer 1")
        self.assertEqual(
            user_defined_layers[0]["data_provider"], "Test Provider")





class LayerViewsTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password')
        self.other_user = User.objects.create_user(username='otheruser', password='password')
        self.client.login(username='testuser', password='password')
        
        # Create a DataProvider with a file
        test_file = SimpleUploadedFile(
            "test_layer.geojson", 
            b"Dummy GeoJSON content", 
            content_type="application/geo+json"
        )
        self.data_provider = DataProvider.objects.create(name="Test Provider", file=test_file)

        # Create an InputLayer linked to the DataProvider
        self.layer_with_file = InputLayer.objects.create(
            uuid=uuid.uuid4(),
            name="Test Layer",
            data_provider=self.data_provider,
            created_by=self.user
        )
        self.layer = InputLayer.objects.create(
            uuid=uuid4(),
            name='Test Layer',
            data_provider=self.data_provider,
            created_by=self.user,
        )
        

    def test_delete_layer_success(self):
        response = self.client.delete(reverse('delete_layer', args=[self.layer.uuid]))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["message"], "Layer deleted successfully")
        self.assertFalse(InputLayer.objects.filter(uuid=self.layer.uuid).exists())

    def test_delete_layer_unauthorized(self):
        self.client.logout()
        response = self.client.delete(reverse('delete_layer', args=[self.layer.uuid]))
        self.assertEqual(response.status_code, 302)  # Redirect to login page

    def test_delete_layer_not_found(self):
        response = self.client.delete(reverse('delete_layer', args=[uuid4()]))
        self.assertEqual(response.status_code, 404)

    def test_delete_layer_forbidden(self):
        self.client.login(username='otheruser', password='password')
        response = self.client.delete(reverse('delete_layer', args=[self.layer.uuid]))
        self.assertEqual(response.status_code, 403)  # Since filter by created_by excludes it

    def test_download_layer_success(self):
        response = self.client.get(reverse('download_layer', args=[self.layer_with_file.uuid]))

        # Ensure response is successful
        self.assertEqual(response.status_code, 200)

        # Extract file extension dynamically
        file_path = self.layer_with_file.data_provider.file.name  # Get stored file name
        expected_filename = os.path.basename(file_path)
        expected_content_type, _ = mimetypes.guess_type(file_path)

        # Check content type
        self.assertEqual(response["Content-Type"], expected_content_type or "application/octet-stream")

        # Check filename in Content-Disposition
        self.assertEqual(response["Content-Disposition"], f'attachment; filename="{expected_filename}"')

    def test_download_layer_unauthorized(self):
        self.client.logout()
        response = self.client.get(reverse('download_layer', args=[self.layer_with_file.uuid]))
        self.assertEqual(response.status_code, 302)  # Redirect to login

    def test_download_layer_not_found(self):
        response = self.client.get(reverse('download_layer', args=[uuid4()]))
        self.assertEqual(response.status_code, 404)

    def test_download_layer_forbidden(self):
        self.client.login(username='otheruser', password='password')
        response = self.client.get(reverse('download_layer', args=[self.layer_with_file.uuid]))
        self.assertEqual(response.status_code, 404)

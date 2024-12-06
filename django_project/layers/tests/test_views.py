from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from layers.models import InputLayer, LayerGroupType, DataProvider
from uuid import uuid4


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


from unittest.mock import patch, MagicMock
from django.test import TestCase

from layers.models import DataProvider, InputLayer
from layers.generator.livestock import LiveStockGenerator


class LiveStockGeneratorTestCase(TestCase):
    """Test case for LiveStockGenerator."""

    fixtures = [
        '3.gee_asset.json',
        '1.layer_group_type.json',
        '2.data_provider.json',
        '3.input_layer.json',
    ]

    def setUp(self):
        self.provider = DataProvider.objects.get(name='FAO')
        self.generator = LiveStockGenerator()

    def test_generate_with_empty_data(self):
        with patch.object(
            self.generator, 'get_countries', return_value=['CountryA']
        ):
            self.provider.name = 'Empty Provider'
            self.provider.save()
            result = self.generator._generate()
            self.assertIsInstance(result, list)
            self.assertEqual(len(result), 0)
        self.provider.name = 'FAO'
        self.provider.save()

    @patch('ee.Image')
    def test_generate_success(self, mock_ee_image):
        # Mock the image object and its methods
        mock_image = MagicMock()
        mock_clipped_image = MagicMock()
        mock_tile_fetcher = MagicMock()
        mock_tile_fetcher.url_format = 'https://mock.url/{z}/{x}/{y}.png'

        mock_map_id = {'tile_fetcher': mock_tile_fetcher}

        # Setup method return chains
        mock_ee_image.return_value = mock_image
        mock_image.clipToCollection.return_value = mock_clipped_image
        mock_clipped_image.getMapId.return_value = mock_map_id
        with patch.object(
            self.generator, 'get_countries', return_value=['CountryA']
        ):
            result = self.generator._generate()
            self.assertIsInstance(result, list)
            self.assertEqual(
                len(result),
                InputLayer.objects.filter(data_provider=self.provider).count()
            )
            for layer_result in result:
                self.assertIsNotNone(layer_result.layer)
                self.assertIsNotNone(layer_result.file_url)
                self.assertIn('mock.url', layer_result.file_url)

    def test_get_asset_key(self):
        animal_name = 'Cattle'
        expected_key = 'livestock_cattle_2020'
        asset_key = self.generator._get_asset_key(animal_name)
        self.assertEqual(asset_key, expected_key)

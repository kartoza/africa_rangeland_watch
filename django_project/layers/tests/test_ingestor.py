import tempfile
import shutil
import numpy as np
from pathlib import Path
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from layers.utils import ingest_external_layer, extract_raster_metadata
from layers.models import ExternalLayerSource, DataProvider
import rasterio
from rasterio.transform import from_origin


class RasterIngestorTests(TestCase):
    def setUp(self):
        self.provider = DataProvider.objects.create(name="Test Provider")
        self.source = ExternalLayerSource.objects.create(
            name="Test Raster Dataset",
            provider=self.provider,
            fetch_type="manual",
            frequency="manual",
        )
        self.tmp_dir = tempfile.mkdtemp()

    def tearDown(self):
        shutil.rmtree(self.tmp_dir)

    def _create_temp_tif(self, name="test.tif"):
        """Creates a simple 10x10 GeoTIFF raster file for testing."""
        path = Path(self.tmp_dir) / name
        transform = from_origin(0, 10, 1, 1)  # origin x=0, y=10; pixel size 1x1

        with rasterio.open(
            path,
            "w",
            driver="GTiff",
            height=10,
            width=10,
            count=1,
            dtype="uint8",
            crs="EPSG:4326",
            transform=transform,
        ) as dst:
            dst.write(np.ones((1, 10, 10), dtype="uint8"))

        return path

    def test_extract_raster_metadata(self):
        tif_path = self._create_temp_tif()
        metadata = extract_raster_metadata(tif_path)

        self.assertEqual(metadata["crs"], "EPSG:4326")
        self.assertEqual(metadata["band_count"], 1)
        self.assertEqual(metadata["resolution"], (1.0, 1.0))
        self.assertEqual(metadata["min"], 1.0)
        self.assertEqual(metadata["max"], 1.0)
        self.assertEqual(len(metadata["bounds"]), 4)

    def test_ingest_external_layer(self):
        tif_path = self._create_temp_tif("layer.tif")
        with open(tif_path, "rb") as f:
            uploaded = SimpleUploadedFile(
                "layer.tif", f.read(), content_type="image/tiff"
            )

        layer = ingest_external_layer(source=self.source, uploaded_file=uploaded)

        self.assertEqual(layer.layer_type, "raster")
        self.assertEqual(layer.source, self.source)
        self.assertIn("crs", layer.metadata)
        self.assertTrue(layer.file.name.endswith(".tif"))
        self.assertEqual(layer.metadata["min"], 1.0)

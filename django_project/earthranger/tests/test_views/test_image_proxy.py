import requests
import requests_mock

from django.contrib.gis.geos import Point
from django.http import Http404
from rest_framework.test import APITestCase
from earthranger.factories import EarthRangerSettingFactory, EarthRangerEventsFactory


class EarthRangerImageProxyViewTests(APITestCase):

    def setUp(self):
        self.event_uuid = "7e7f43b0-d134-428e-bbaa-28e40a166ecd"
        self.image_filename = "2023-11-15_12-09-25_compliance_monitoring.jpg"
        self.image_path = (
            f"activity/event/{self.event_uuid}/file/fdd4b3ea-def3-4b9c-92ef-072a3e5dedbe/"
            f"large/{self.image_filename}"
        )

        # Create EarthRangerSetting
        self.setting = EarthRangerSettingFactory(
            url="https://test.earthranger.com",
            token="test-setting-token"
        )

        # Create EarthRangerEvents linked to the setting
        self.event = EarthRangerEventsFactory(
            earth_ranger_uuid=self.event_uuid,
            geometry=Point(10, 20),
            earth_ranger_settings=[self.setting]
        )

        # Full URL to be requested by the proxy
        self.full_url = f"https://test.earthranger.com/api/v1.0/{self.image_path}"
        self.fake_image_bytes = b"fake-image-data"

    def run_and_check_success_image_request(self):
        with requests_mock.Mocker() as m:
            m.get(
                self.full_url,
                content=self.fake_image_bytes,
                headers={
                    "content-type": "image/jpeg",
                    "content-length": str(len(self.fake_image_bytes))
                },
                status_code=200
            )

            url = f"/api/earth-ranger/proxy-image/{self.image_path}"
            response = self.client.get(url)

        # Assertions
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.content, self.fake_image_bytes)
        self.assertEqual(response["Content-Type"], "image/jpeg")
        self.assertEqual(response["Content-Length"], str(len(self.fake_image_bytes)))
        self.assertEqual(response["Cache-Control"], "private, max-age=900")
        self.assertEqual(response["X-Content-Type-Options"], "nosniff")
        self.assertIn("Content-Security-Policy", response)

    def test_proxy_image_success_1(self):
        self.run_and_check_success_image_request()

    def test_proxy_image_success_2(self):
        self.setting.url = "https://test.earthranger.com/api/v1.0/"
        self.setting.save()
        self.run_and_check_success_image_request()

    def test_proxy_image_timeout(self):
        with requests_mock.Mocker() as m:
            m.get(self.full_url, exc=requests.exceptions.Timeout)

            url = f"/api/earth-ranger/proxy-image/{self.image_path}"
            response = self.client.get(url)

        self.assertEqual(response.status_code, 504)
        self.assertEqual(response.json()["error"], "Image request timeout")

    def test_proxy_image_http_404(self):
        with requests_mock.Mocker() as m:
            m.get(self.full_url, status_code=404)

            url = f"/api/earth-ranger/proxy-image/{self.image_path}"
            response = self.client.get(url)
            
            self.assertEqual(response.status_code, 404)
            self.assertEqual(response.json()["error"], "Image not found")

    def test_proxy_image_http_403(self):
        with requests_mock.Mocker() as m:
            m.get(self.full_url, status_code=403)

            url = f"/api/earth-ranger/proxy-image/{self.image_path}"
            response = self.client.get(url)

        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.json()["error"], "Access denied to image")

    def test_proxy_image_http_other_error(self):
        with requests_mock.Mocker() as m:
            m.get(self.full_url, status_code=500)

            url = f"/api/earth-ranger/proxy-image/{self.image_path}"
            response = self.client.get(url)

        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.json()["error"], "Failed to fetch image")

    def test_proxy_image_request_exception(self):
        with requests_mock.Mocker() as m:
            m.get(self.full_url, exc=requests.exceptions.RequestException("boom"))

            url = f"/api/earth-ranger/proxy-image/{self.image_path}"
            response = self.client.get(url)

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json()["error"], "Image service unavailable")

    def test_proxy_image_non_image_content(self):
        with requests_mock.Mocker() as m:
            m.get(
                self.full_url,
                content=b"not-an-image",
                headers={"content-type": "application/json"},
                status_code=200
            )

            url = f"/api/earth-ranger/proxy-image/{self.image_path}"
            response = self.client.get(url)

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["error"], "Invalid image format")

    def test_proxy_image_unexpected_exception(self):
        # Patch requests.get to raise a generic exception
        def boom(*args, **kwargs):
            raise Exception("unexpected error")

        import requests as requests_module
        original_get = requests_module.get
        requests_module.get = boom

        url = f"/api/earth-ranger/proxy-image/{self.image_path}"
        response = self.client.get(url)

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.json()["error"], "Internal server error")

        # Restore original requests.get
        requests_module.get = original_get

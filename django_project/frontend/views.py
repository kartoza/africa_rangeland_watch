from django.views.generic import TemplateView, View
from django.http import HttpResponse
from django.utils.decorators import method_decorator
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
import json
import requests
from urllib.parse import urlparse


class HomeView(TemplateView):
    template_name = 'home.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)

        return context


@method_decorator(csrf_exempt, name="dispatch")
class SentryProxyView(View):
    sentry_key = settings.SENTRY_DSN
    def post(self, request):
        host = "sentry.io"
        known_project_ids = [36]  # Add your Sentry project IDs here

        envelope = request.body.decode("utf-8")
        pieces = envelope.split("\n", 1)
        header = json.loads(pieces[0])

        if "dsn" in header:
            dsn = urlparse(header["dsn"])
            project_id = int(dsn.path.strip("/"))

            sentry_url = f"https://{host}/api/{project_id}/envelope/"
            headers = {
                "Content-Type": "application/x-sentry-envelope",
            }
            response = requests.post(
                sentry_url,
                headers=headers,
                data=envelope.encode("utf-8"),
                timeout=200
            )

            return HttpResponse(response.content, status=response.status_code)

        return HttpResponse(status=400)

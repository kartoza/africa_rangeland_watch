# layers/tasks.py

from core.celery import app
from layers.models import ExternalLayerSource, FetchHistory


def fetch_source_data(source):
    """
    Placeholder for external data fetching logic.

    :param source: ExternalLayerSource instance
    """
    pass


@app.task(name="fetch_external_layers_task")
def fetch_external_layers_task():
    """
    Celery task to fetch external datasets from collaborators.
    This polls all registered ExternalLayerSources that are not manual.
    """
    sources = ExternalLayerSource.objects.all()

    for source in sources:
        if source.fetch_type != "manual":
            try:
                fetch_source_data(source)
                FetchHistory.objects.create(
                    source=source,
                    status="success",
                    message="Fetched successfully"
                )
            except Exception as e:
                FetchHistory.objects.create(
                    source=source,
                    status="failure",
                    message=str(e)
                )

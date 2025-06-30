from core.celery import app


@app.task(name='generate_dashboard_thumbnail')
def generate_dashboard_thumbnails(dashboard_ids):
    """Generate thumbnails for a dashboard."""
    from dashboard.models import Dashboard
    dashboards = Dashboard.objects.filter(uuid__in=dashboard_ids)
    for dashboard in dashboards:
        dashboard.generate_and_save_thumbnail()

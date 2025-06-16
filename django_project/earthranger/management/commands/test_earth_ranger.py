import ee
import logging
import json
from django.core.management.base import BaseCommand
from .sample import EVENTS

class Command(BaseCommand):
    help = 'Test Earth Eanger Events fetch'

    def handle(self, *args, **options):
        logging.basicConfig(level=logging.DEBUG)

        events = {}
        for event in json.loads(EVENTS)['data']['results']:
            events[event['event_type']] = event
        print(json.dumps(list(events.values())))
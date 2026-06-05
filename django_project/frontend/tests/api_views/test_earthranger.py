# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Unit tests for EarthRanger event-types API.
"""

from django.urls import reverse

from core.tests.common import BaseAPIViewTest
from earthranger.models import EarthRangerEvents, EarthRangerSetting
from frontend.api_views.earth_ranger_events import EarthRangerEventTypesAPI


def _make_setting(name, privacy='public', user=None):
    return EarthRangerSetting.objects.create(
        name=name,
        url='http://example.com',
        token='tok',
        privacy=privacy,
        user=user,
    )


def _make_event(setting, event_type, event_category=''):
    event = EarthRangerEvents.objects.create(
        data={
            'event_type': event_type,
            'event_category': event_category,
        }
    )
    event.earth_ranger_settings.add(setting)
    return event


class EarthRangerEventTypesAPITest(BaseAPIViewTest):
    """Tests for GET /api/earth-ranger/event-types/"""

    def _get(self, user=None):
        request = self.factory.get(
            reverse('frontend-api:earth-ranger-event-types')
        )
        if user:
            self._force_authenticate(request, user)
        view = EarthRangerEventTypesAPI.as_view()
        return view(request)

    def test_unauthenticated_sees_only_public(self):
        """Unauthenticated users only see event types from public settings."""
        public = _make_setting('public-setting', privacy='public')
        private = _make_setting(
            'private-setting', privacy='private', user=self.user
        )
        _make_event(public, 'fence_intrusion')
        _make_event(private, 'sick_animal')

        response = self._get()

        self.assertEqual(response.status_code, 200)
        types = [row['event_type'] for row in response.data]
        self.assertIn('fence_intrusion', types)
        self.assertNotIn('sick_animal', types)

    def test_authenticated_sees_public_and_own_private(self):
        """Authenticated users see public settings plus their own private ones."""
        public = _make_setting('pub', privacy='public')
        own_private = _make_setting(
            'own-priv', privacy='private', user=self.user
        )
        other_private = _make_setting(
            'other-priv', privacy='private', user=self.superuser
        )
        _make_event(public, 'fence_intrusion')
        _make_event(own_private, 'sick_animal')
        _make_event(other_private, 'wildfire')

        response = self._get(user=self.user)

        self.assertEqual(response.status_code, 200)
        types = [row['event_type'] for row in response.data]
        self.assertIn('fence_intrusion', types)
        self.assertIn('sick_animal', types)
        self.assertNotIn('wildfire', types)

    def test_response_shape(self):
        """Each item has event_type and count keys."""
        setting = _make_setting('s1')
        _make_event(setting, 'fence_intrusion')
        _make_event(setting, 'fence_intrusion')
        _make_event(setting, 'sick_animal')

        response = self._get()

        self.assertEqual(response.status_code, 200)
        self.assertGreater(len(response.data), 0)
        self._assert_keys_in_dict(response.data[0], ['event_type', 'count'])

    def test_count_is_correct(self):
        """Count reflects number of events per type."""
        setting = _make_setting('s2')
        _make_event(setting, 'fence_intrusion')
        _make_event(setting, 'fence_intrusion')
        _make_event(setting, 'sick_animal')

        response = self._get()

        counts = {row['event_type']: row['count'] for row in response.data}
        self.assertEqual(counts['fence_intrusion'], 2)
        self.assertEqual(counts['sick_animal'], 1)

    def test_empty_event_type_excluded(self):
        """Events with empty event_type are not returned."""
        setting = _make_setting('s3')
        _make_event(setting, '')

        response = self._get()

        types = [row['event_type'] for row in response.data]
        self.assertNotIn('', types)

    def test_no_events_returns_empty_list(self):
        """Returns empty list when no events exist."""
        response = self._get()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(list(response.data), [])

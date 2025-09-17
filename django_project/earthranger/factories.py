import factory
from faker import Faker
from factory.django import DjangoModelFactory
from factory import fuzzy
from django.contrib.gis.geos import Point
from core.factories import UserF
from earthranger.models import EarthRangerSetting, EarthRangerEvents
import uuid

fake = Faker()


class EarthRangerSettingFactory(DjangoModelFactory):
    """Factory for EarthRangerSetting model."""

    class Meta:
        model = EarthRangerSetting

    user = factory.SubFactory(UserF)
    name = factory.Sequence(lambda n: f"Earth Ranger Setting {n}")
    url = factory.Faker("url")
    token = factory.Faker("sha256")
    privacy = fuzzy.FuzzyChoice(["public", "private"])
    is_active = True

    @factory.post_generation
    def ensure_unique_name(obj, create, extracted, **kwargs):
        """Ensure the name is unique by appending timestamp if needed."""
        if create:
            from django.utils import timezone
            original_name = obj.name
            counter = 1
            while EarthRangerSetting.objects.filter(
                name=obj.name
            ).exclude(pk=obj.pk).exists():
                obj.name = (f"{original_name}_{counter}_"
                            f"{timezone.now().timestamp()}")
                counter += 1
            if obj.name != original_name:
                obj.save()


class EarthRangerEventsFactory(DjangoModelFactory):
    """Factory for EarthRangerEvents model."""

    class Meta:
        model = EarthRangerEvents

    data = factory.LazyFunction(lambda: {
        "id": str(uuid.uuid4()),
        "event_type": fake.random_element(elements=[
            "wildlife_sighting", "poaching_incident", "patrol_report",
            "camera_trap", "ranger_report", "community_report"
        ]),
        "event_category": fake.random_element(elements=[
            "security", "wildlife", "logistics", "maintenance", "monitoring"
        ]),
        "title": fake.sentence(nb_words=4),
        "notes": fake.text(max_nb_chars=200),
        "priority": fake.random_int(min=1, max=5),
        "state": fake.random_element(elements=[
            "new", "active", "resolved", "closed"
        ]),
        "location": {
            "latitude": float(fake.latitude()),
            "longitude": float(fake.longitude())
        },
        "reported_by": {
            "username": fake.user_name(),
            "first_name": fake.first_name(),
            "last_name": fake.last_name()
        },
        "time": fake.date_time_this_year().isoformat(),
        "updated_at": fake.date_time_this_month().isoformat(),
        "serial_number": fake.random_int(min=1000, max=9999),
        "event_details": {
            "species": fake.random_element(elements=[
                "elephant", "rhino", "lion", "leopard", "buffalo", "giraffe"
            ]),
            "number_of_animals": fake.random_int(min=1, max=20),
            "weather_conditions": fake.random_element(elements=[
                "sunny", "cloudy", "rainy", "windy"
            ])
        }
    })
    earth_ranger_uuid = factory.LazyAttribute(lambda obj: obj.data['id'])
    geometry = factory.LazyAttribute(lambda obj: Point(
        float(obj.data['location']['longitude']),
        float(obj.data['location']['latitude'])
    ) if obj.data.get('location') and 'longitude' in obj.data['location']
    and 'latitude' in obj.data['location'] else Point(0, 0))  # noqa

    @factory.post_generation
    def earth_ranger_settings(self, create, extracted, **kwargs):
        """Add earth_ranger_settings after creation."""
        if not create:
            return

        if extracted:
            # If specific settings are provided, use them
            for setting in extracted:
                self.earth_ranger_settings.add(setting)
        else:
            # Create a default setting if none provided
            setting = EarthRangerSettingFactory()
            self.earth_ranger_settings.add(setting)


class PublicEarthRangerSettingFactory(EarthRangerSettingFactory):
    """Factory for public EarthRangerSetting."""

    privacy = "public"


class PrivateEarthRangerSettingFactory(EarthRangerSettingFactory):
    """Factory for private EarthRangerSetting."""

    privacy = "private"


class InactiveEarthRangerSettingFactory(EarthRangerSettingFactory):
    """Factory for inactive EarthRangerSetting."""

    is_active = False


class WildlifeSightingEventFactory(EarthRangerEventsFactory):
    """Factory for wildlife sighting events."""

    data = factory.LazyFunction(lambda: {
        "id": str(uuid.uuid4()),
        "event_type": "wildlife_sighting",
        "event_category": "wildlife",
        "title": fake.sentence(nb_words=3),
        "notes": "Wildlife sighting reported by ranger",
        "priority": 2,
        "state": "active",
        "location": {
            "latitude": float(fake.latitude()),
            "longitude": float(fake.longitude())
        },
        "reported_by": {
            "username": fake.user_name(),
            "first_name": fake.first_name(),
            "last_name": fake.last_name()
        },
        "time": fake.date_time_this_year().isoformat(),
        "updated_at": fake.date_time_this_month().isoformat(),
        "serial_number": fake.random_int(min=1000, max=9999),
        "event_details": {
            "species": fake.random_element(elements=[
                "elephant", "rhino", "lion", "leopard", "buffalo"
            ]),
            "number_of_animals": fake.random_int(min=1, max=10),
            "behavior": fake.random_element(elements=[
                "grazing", "drinking", "resting", "moving", "feeding"
            ]),
            "weather_conditions": fake.random_element(elements=[
                "sunny", "cloudy", "rainy"
            ])
        }
    })


class SecurityIncidentEventFactory(EarthRangerEventsFactory):
    """Factory for security incident events."""

    data = factory.LazyFunction(lambda: {
        "id": str(uuid.uuid4()),
        "event_type": "poaching_incident",
        "event_category": "security",
        "title": "Security incident reported",
        "notes": fake.text(max_nb_chars=150),
        "priority": 5,
        "state": "new",
        "location": {
            "latitude": float(fake.latitude()),
            "longitude": float(fake.longitude())
        },
        "reported_by": {
            "username": fake.user_name(),
            "first_name": fake.first_name(),
            "last_name": fake.last_name()
        },
        "time": fake.date_time_this_year().isoformat(),
        "updated_at": fake.date_time_this_month().isoformat(),
        "serial_number": fake.random_int(min=1000, max=9999),
        "event_details": {
            "incident_type": fake.random_element(elements=[
                "poaching", "trespassing",
                "illegal_logging", "suspicious_activity"
            ]),
            "severity": fake.random_element(elements=[
                "low", "medium", "high", "critical"
            ]),
            "evidence_found": fake.boolean(),
            "response_required": True
        }
    })

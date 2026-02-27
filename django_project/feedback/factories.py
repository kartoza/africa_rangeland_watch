# coding=utf-8
"""
Africa Rangeland Watch (ARW).

.. note:: Feedback factories.
"""

import factory
from feedback.models import Feedback
from core.factories import UserF


class FeedbackF(factory.django.DjangoModelFactory):
    """Factory class for Feedback."""

    class Meta:  # noqa
        model = Feedback

    user = factory.SubFactory(UserF)
    name = factory.Sequence(lambda n: f'Test User {n}')
    email = factory.Sequence(lambda n: f'testuser{n}@example.com')
    message = 'This is a test feedback message.'

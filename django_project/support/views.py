from alerts.models import AlertSetting
from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status
from .models import Ticket,IssueType
from .serializers import TicketSerializer, IssueTypeSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.exceptions import ValidationError
from django.core.exceptions import ObjectDoesNotExist



class IssueTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = IssueType.objects.all()
    serializer_class = IssueTypeSerializer


class TicketViewSet(viewsets.ModelViewSet):
    queryset = Ticket.objects.all()
    serializer_class = TicketSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        if self.request.user.is_staff:
            return Ticket.objects.all()
        return Ticket.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Create a new ticket and send an email to the admin."""
        try:
            issue_type_id = self.request.data.get('issue_type')

            if issue_type_id:
                try:
                    issue_type_id = int(issue_type_id)
                    issue_type = IssueType.objects.get(id=issue_type_id)
                except ValueError:
                    raise ValidationError(
                        "Invalid issue type ID provided.It must be an integer."
                    )
                except ObjectDoesNotExist:
                    raise ValidationError(
                        "The specified issue type does not exist."
                    )

                ticket = serializer.save(issue_type=issue_type)
            else:
                ticket = serializer.save()

            ticket.send_ticket_submission_email()

        except ValidationError as e:
            raise e

        except Exception as e:
            raise ValidationError(f"An unexpected error occurred: {str(e)}")

        return ticket

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        """Update the ticket status."""

        ticket = self.get_object()
        status = request.data.get('status', None)

        if status and status in dict(Ticket.STATUS_CHOICES):
            ticket.status = status
            ticket.save()
            ticket.send_status_update_email()
            return Response(
                {"status": "Ticket status updated."},
                status=status.HTTP_200_OK
            )

        return Response(
            {"error": "Invalid status"},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'])
    def associate_alert(self, request, pk=None):
        """Associate a ticket with an alert setting when the alert is"
        "triggered."""

        ticket = self.get_object()
        alert_setting_id = request.data.get('alert_setting_id')

        try:
            alert_setting = AlertSetting.objects.get(id=alert_setting_id)
        except AlertSetting.DoesNotExist:
            return Response(
                {"error": "Alert setting not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        if alert_setting.enable_alert:
            ticket.alert_setting = alert_setting
            ticket.save()

            ticket.send_alert_email()

            return Response(
                {"status": "Alert associated with ticket."},
                status=status.HTTP_200_OK
            )

        return Response(
            {"error": "Alert setting is not enabled."},
            status=status.HTTP_400_BAD_REQUEST
        )

import base64
import mimetypes

import requests
from django.conf import settings
from django.core.mail.backends.base import BaseEmailBackend


class ResendBackend(BaseEmailBackend):
    """A Django email backend that uses the Resend API."""

    def send_messages(self, email_messages):
        """
        Send a list of email messages using the Resend API.

        :param email_messages: List of Django email messages.
        :return: The number of successfully sent messages.
        """
        count = 0

        for email in email_messages:
            response = self._send_via_resend(email)

            if response.status_code == 200:
                count += 1

        return count

    def _send_via_resend(self, email):
        """
        Send a single email via Resend.

        :param email: A Django EmailMessage object.
        :return: The response from the Resend API.
        """
        resend_api_key = settings.RESEND_API_KEY
        from_email = settings.DEFAULT_FROM_EMAIL

        payload = {
            "from": from_email,
            "to": email.to,
            "subject": email.subject,
            "text": email.body,
        }

        try:
            if email.alternatives:
                for alternative in email.alternatives:
                    if alternative[1] == "text/html":
                        payload["html"] = alternative[0]
                        break
        except AttributeError:
            pass

        # If no alternatives, fall back to email content_subtype
        if "html" not in payload and email.content_subtype == "html":
            payload["html"] = email.body

        attachments = []

        for attachment in email.attachments:
            if isinstance(attachment, tuple):
                filename, content, mime_type = attachment
                encoded_content = base64.b64encode(content).decode("utf-8")
            else:
                filename = attachment
                with open(attachment, "rb") as f:
                    content = f.read()
                mime_type, _ = mimetypes.guess_type(filename)
                encoded_content = base64.b64encode(content).decode("utf-8")

            attachments.append({
                "filename": filename,
                "content": encoded_content,
                "content_type": mime_type,
            })

        if attachments:
            payload["attachments"] = attachments

        # Prepare headers
        headers = {
            "Authorization": f"Bearer {resend_api_key}",
            "Content-Type": "application/json",
        }

        # Make the request to the Resend API
        resend_url = "https://api.resend.com/emails"
        response = requests.post(resend_url, json=payload, headers=headers)
        if response.status_code != 200:
            raise ConnectionError(response.text)
        return response

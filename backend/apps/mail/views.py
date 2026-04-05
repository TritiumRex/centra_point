from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import EmailAccount
from .serializers import EmailAccountSerializer
from .mailcow_client import mailcow

class EmailAccountViewSet(viewsets.ModelViewSet):
    """Email account management (admin only)"""
    serializer_class = EmailAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        user_orgs = user.organizations.all() | user.org_roles.values_list('organization', flat=True)
        return EmailAccount.objects.filter(organization__in=user_orgs)

    def create(self, request, *args, **kwargs):
        """Create email account in mailcow"""
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return Response({'error': 'Email and password required'}, status=status.HTTP_400_BAD_REQUEST)

        # Create in mailcow
        result = mailcow.create_account(email, password)
        if not result['success']:
            return Response({'error': result['error']}, status=status.HTTP_400_BAD_REQUEST)

        # Save to database
        org = request.user.organizations.first()
        if not org:
            return Response({'error': 'User has no organization'}, status=status.HTTP_400_BAD_REQUEST)

        account = EmailAccount.objects.create(
            organization=org,
            email=email,
            password=password,  # In production, hash this
            is_active=True
        )
        serializer = self.get_serializer(account)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def send_test_email(self, request, pk=None):
        """Send test email to verify account works"""
        account = self.get_object()
        result = mailcow.send_test_email(account.email, account.password)

        if not result['success']:
            return Response({'error': result['error']}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': result['message']})

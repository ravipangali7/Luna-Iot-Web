import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { notificationService } from '../../../api/services/notificationService';
import { confirmAction, showSuccess, showError } from '../../../utils/sweetAlert';
import type { Notification } from '../../../types/notification';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import CardBody from '../../../components/ui/cards/CardBody';
import CardHeader from '../../../components/ui/cards/CardHeader';
import Button from '../../../components/ui/buttons/Button';
import Badge from '../../../components/ui/common/Badge';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';

const NotificationShowPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const loadNotification = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const result = await notificationService.getNotificationById(parseInt(id));
      
      if (result.success && result.data) {
        setNotification(result.data);
      } else {
        setError('Notification not found');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleBack = () => {
    navigate('/notices/notifications');
  };

  const handleSendNotification = async () => {
    if (!notification) return;

    const confirmed = await confirmAction(
      'Send Push Notification',
      `Are you sure you want to send push notification "${notification.title}" to all target users?`
    );

    if (confirmed) {
      try {
        setSending(true);
        const result = await notificationService.sendNotification(notification.id);
        
        if (result.success) {
          const count = result.data?.sent_to_count || 0;
          showSuccess('Push notification sent successfully', `Notification sent to ${count} user(s)`);
        } else {
          showError('Failed to send notification', result.error);
        }
      } catch (error) {
        showError('Error sending notification', (error as Error).message);
      } finally {
        setSending(false);
      }
    }
  };

  const getTypeBadge = (type: string) => {
    const typeColors: { [key: string]: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' } = {
      'all': 'primary',
      'specific': 'warning',
      'role': 'success'
    };

    return (
      <Badge 
        variant={typeColors[type] || 'secondary'} 
        size="sm"
      >
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  useEffect(() => {
    loadNotification();
  }, [loadNotification]);

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-96">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error || !notification) {
    return (
      <Container>
        <Alert variant="danger">{error || 'Notification not found'}</Alert>
        <Button onClick={handleBack} variant="outline" className="mt-4">
          <ArrowBackIcon className="w-4 h-4" />
          Back to Notifications
        </Button>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleBack}
              variant="outline"
              size="sm"
            >
              <ArrowBackIcon className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{notification.title}</h1>
              <p className="text-gray-600">Notification Details</p>
            </div>
          </div>
          <Button
            onClick={handleSendNotification}
            disabled={sending}
            loading={sending}
            variant="success"
            icon={<SendIcon className="w-4 h-4" />}
          >
            Send Notification
          </Button>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Notification Information</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <p className="text-gray-900">{notification.title}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <p className="text-gray-900 whitespace-pre-wrap">{notification.message}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                {getTypeBadge(notification.type)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sent By
                </label>
                <p className="text-gray-900">
                  {notification.sentBy ? `${notification.sentBy.name} (${notification.sentBy.phone})` : 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created At
                </label>
                <p className="text-gray-900">
                  {notification.createdAt ? new Date(notification.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default NotificationShowPage;


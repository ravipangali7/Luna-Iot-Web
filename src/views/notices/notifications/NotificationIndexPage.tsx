import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../../api/services/notificationService';
import { confirmDelete, showSuccess, showError, confirmAction } from '../../../utils/sweetAlert';
import type { Notification } from '../../../types/notification';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import CardBody from '../../../components/ui/cards/CardBody';
import Button from '../../../components/ui/buttons/Button';
import { ViewActionButton, DeleteActionButton, ActionButtonGroup } from '../../../components/ui/buttons';
import Input from '../../../components/ui/forms/Input';
import Table from '../../../components/ui/tables/Table';
import TableHead from '../../../components/ui/tables/TableHead';
import TableHeader from '../../../components/ui/tables/TableHeader';
import TableBody from '../../../components/ui/tables/TableBody';
import TableRow from '../../../components/ui/tables/TableRow';
import TableCell from '../../../components/ui/tables/TableCell';
import Badge from '../../../components/ui/common/Badge';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import SendIcon from '@mui/icons-material/Send';

const NotificationIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingNotificationId, setSendingNotificationId] = useState<number | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await notificationService.getAllNotifications();

      if (result.success && result.data) {
        setNotifications(result.data);
        setFilteredNotifications(result.data);
      } else {
        setError(result.error || 'Failed to load notifications');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = notifications.filter(notification =>
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredNotifications(filtered);
    } else {
      setFilteredNotifications(notifications);
    }
  }, [searchQuery, notifications]);

  const handleViewNotification = (notification: Notification) => {
    navigate(`/notices/notifications/${notification.id}`);
  };

  const handleDeleteNotification = async (notification: Notification) => {
    const confirmed = await confirmDelete(
      'Delete Notification',
      `Are you sure you want to delete notification "${notification.title}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        const result = await notificationService.deleteNotification(notification.id);
        
        if (result.success) {
          showSuccess('Notification deleted successfully');
          loadNotifications();
        } else {
          showError('Failed to delete notification', result.error);
        }
      } catch (error) {
        showError('Error deleting notification', (error as Error).message);
      }
    }
  };

  const handleSendNotification = async (notification: Notification) => {
    const confirmed = await confirmAction(
      'Send Push Notification',
      `Are you sure you want to send push notification "${notification.title}" to all target users?`
    );

    if (confirmed) {
      try {
        setSendingNotificationId(notification.id);
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
        setSendingNotificationId(null);
      }
    }
  };

  const handleCreateNotification = () => {
    navigate('/notices/notifications/create');
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

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-96">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notification Management</h1>
            <p className="text-gray-600">Manage system notifications</p>
          </div>
          <Button
            onClick={handleCreateNotification}
            variant="primary"
            className="flex items-center gap-2"
          >
            <AddIcon className="w-4 h-4" />
            Add Notification
          </Button>
        </div>

        <Card>
          <CardBody>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search notifications by title or message..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={loadNotifications}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshIcon className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </CardBody>
        </Card>

        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}

        <Card>
          <CardBody>
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">
                  {searchQuery ? 'No notifications found matching your search.' : 'No notifications found.'}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={handleCreateNotification}
                    variant="primary"
                    className="mt-4"
                  >
                    Create First Notification
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table striped hover>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Title</TableHeader>
                      <TableHeader>Message</TableHeader>
                      <TableHeader>Type</TableHeader>
                      <TableHeader>Sent By</TableHeader>
                      <TableHeader>Created</TableHeader>
                      <TableHeader className="text-right">Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredNotifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">
                            {notification.title}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-gray-600 max-w-md truncate">
                            {notification.message}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getTypeBadge(notification.type)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600">
                            {notification.sentBy?.name || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {notification.createdAt ? new Date(notification.createdAt).toLocaleDateString() : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <ActionButtonGroup>
                            <ViewActionButton onClick={() => handleViewNotification(notification)} />
                            <Button
                              onClick={() => handleSendNotification(notification)}
                              disabled={sendingNotificationId === notification.id}
                              loading={sendingNotificationId === notification.id}
                              variant="success"
                              size="sm"
                              icon={<SendIcon className="w-4 h-4" />}
                              title="Send Push Notification"
                            >
                              Send
                            </Button>
                            <DeleteActionButton onClick={() => handleDeleteNotification(notification)} />
                          </ActionButtonGroup>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default NotificationIndexPage;


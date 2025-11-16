import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../../api/services/notificationService';
import { userService } from '../../../api/services/userService';
import { showSuccess } from '../../../utils/sweetAlert';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import CardBody from '../../../components/ui/cards/CardBody';
import CardHeader from '../../../components/ui/cards/CardHeader';
import Button from '../../../components/ui/buttons/Button';
import Input from '../../../components/ui/forms/Input';
import TextArea from '../../../components/ui/forms/TextArea';
import Select from '../../../components/ui/forms/Select';
import Form from '../../../components/ui/forms/Form';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import type { User } from '../../../types/auth';

const NotificationCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'all' as 'all' | 'specific' | 'role',
    targetUserIds: [] as number[],
    targetRoleIds: [] as number[]
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const loadUsers = async () => {
    try {
      const result = await userService.getAllUsers();
      if (result.success && result.data) {
        setUsers(result.data);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    }

    if (formData.type === 'specific' && formData.targetUserIds.length === 0) {
      errors.targetUserIds = 'Please select at least one user';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (name: string) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await notificationService.createNotification({
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: formData.type,
        targetUserIds: formData.type === 'specific' ? formData.targetUserIds : undefined,
        targetRoleIds: formData.type === 'role' ? formData.targetRoleIds : undefined
      });

      if (result.success) {
        showSuccess('Notification created successfully');
        navigate('/notices/notifications');
      } else {
        setError(result.error || 'Failed to create notification');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/notices/notifications');
  };

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
              <h1 className="text-2xl font-bold text-gray-900">Create Notification</h1>
              <p className="text-gray-600">Send a new notification</p>
            </div>
          </div>
        </div>

        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Notification Information</h2>
          </CardHeader>
          <CardBody>
            <Form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={handleInputChange('title')}
                    placeholder="Enter notification title"
                    error={formErrors.title}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <TextArea
                    value={formData.message}
                    onChange={handleInputChange('message')}
                    placeholder="Enter notification message"
                    rows={5}
                    error={formErrors.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.type}
                    onChange={handleInputChange('type')}
                    options={[
                      { value: 'all', label: 'All Users' },
                      { value: 'specific', label: 'Specific Users' },
                      { value: 'role', label: 'By Role' }
                    ]}
                  />
                </div>

                {formData.type === 'specific' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Users
                    </label>
                    <select
                      multiple
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      onChange={(e) => {
                        const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                        setFormData(prev => ({ ...prev, targetUserIds: selectedIds }));
                      }}
                    >
                      {users.map(user => (
                        <option key={user.id} value={user.id}>
                          {user.name} ({user.phone})
                        </option>
                      ))}
                    </select>
                    {formErrors.targetUserIds && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.targetUserIds}</p>
                    )}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={handleBack}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                    className="flex items-center gap-2"
                  >
                    {loading ? (
                      <Spinner size="sm" />
                    ) : (
                      <SaveIcon className="w-4 h-4" />
                    )}
                    Create Notification
                  </Button>
                </div>
              </div>
            </Form>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default NotificationCreatePage;


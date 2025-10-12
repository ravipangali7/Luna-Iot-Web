import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '../../api/services/userService';
import { showSuccess } from '../../utils/sweetAlert';
import type { User } from '../../types/auth';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import CardHeader from '../../components/ui/cards/CardHeader';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Select from '../../components/ui/forms/Select';
import Form from '../../components/ui/forms/Form';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';

interface Role {
  id: number;
  name: string;
}

const UserEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    roleId: '',
    status: 'ACTIVE'
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const loadUser = async () => {
    if (!id) return;

    try {
      setInitialLoading(true);
      const result = await userService.getUserByPhone(id);
      
      if (result.success && result.data) {
        const userData = result.data;
        setUser(userData);
        setFormData({
          name: userData.name || '',
          phone: userData.phone || '',
          roleId: userData.role || '',
          status: userData.status || 'ACTIVE'
        });
      } else {
        setError('User not found');
      }
    } catch (error) {
      setError('Failed to load user: ' + (error as Error).message);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const result = await userService.getAllRoles();
      if (result.success && result.data) {
        setRoles(result.data);
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[0-9+\-\s()]+$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    if (!formData.roleId) {
      errors.roleId = 'Please select a role';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (name: string) => (value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        role: formData.roleId,
        status: formData.status
      };

      const result = await userService.updateUser(user.phone, userData);

      if (result.success) {
        showSuccess('User updated successfully');
        navigate('/users');
      } else {
        setError(result.error || 'Failed to update user');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/users');
  };

  useEffect(() => {
    loadUser();
    loadRoles();
  }, [id]);

  if (initialLoading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-96">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error && !user) {
    return (
      <Container>
        <Alert variant="danger">
          {error}
        </Alert>
        <div className="mt-4">
          <Button onClick={handleBack} variant="outline">
            <ArrowBackIcon className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleBack}
              variant="outline"
              size="sm"
            >
              <ArrowBackIcon className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
              <p className="text-gray-600">Update user information</p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">User Information</h3>
          </CardHeader>
          <CardBody>
            <Form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    placeholder="Enter full name"
                    error={formErrors.name}
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange('phone')}
                    placeholder="Enter phone number"
                    error={formErrors.phone}
                    required
                  />
                </div>

                {/* Role */}
                <div>
                  <label htmlFor="roleId" className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <Select
                    id="roleId"
                    name="roleId"
                    value={formData.roleId}
                    onChange={handleInputChange('roleId')}
                    error={formErrors.roleId}
                    required
                    options={[
                      { value: '', label: 'Select a role' },
                      ...roles.map((role) => ({
                        value: role.id.toString(),
                        label: role.name
                      }))
                    ]}
                  />
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <Select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange('status')}
                    options={[
                      { value: 'ACTIVE', label: 'Active' },
                      { value: 'INACTIVE', label: 'Inactive' }
                    ]}
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
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
                  {loading ? 'Updating...' : 'Update User'}
                </Button>
              </div>
            </Form>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default UserEditPage;

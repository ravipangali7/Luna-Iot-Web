import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import Input from '../../../components/ui/forms/Input';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { showSuccess, showError } from '../../../utils/sweetAlert';
import { alertTypeService } from '../../../api/services/alertSystemService';
import type { AlertTypeCreate } from '../../../api/services/alertSystemService';

const AlertTypeCreatePage: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<AlertTypeCreate>({
    name: '',
    icon: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof AlertTypeCreate, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const submitData: AlertTypeCreate = {
        name: formData.name.trim(),
        icon: formData.icon?.trim() || undefined
      };

      await alertTypeService.create(submitData);
      showSuccess('Alert type created successfully');
      navigate('/alert-types');
    } catch (err: any) {
      console.error('Error creating alert type:', err);
      
      if (err.response?.data?.details) {
        // Handle validation errors from backend
        setValidationErrors(err.response.data.details);
      } else {
        setError(err.response?.data?.message || 'Failed to create alert type. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/alert-types');
  };

  return (
    <Container>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Alert Type</h1>
            <p className="text-gray-600 mt-1">
              Add a new alert type to the system
            </p>
          </div>
        </div>

        <Card>
          <div className="p-6">
            {error && (
              <Alert variant="danger" className="mb-6">
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(value) => handleInputChange('name', value)}
                  placeholder="Enter alert type name"
                  className={validationErrors.name ? 'border-red-500' : ''}
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-1">
                  Icon
                </label>
                <Input
                  id="icon"
                  type="text"
                  value={formData.icon || ''}
                  onChange={(value) => handleInputChange('icon', value)}
                  placeholder="Enter icon class or URL (optional)"
                  className={validationErrors.icon ? 'border-red-500' : ''}
                />
                {validationErrors.icon && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.icon}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  You can enter an icon class (e.g., "fas fa-bell") or an icon URL
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  icon={loading ? <Spinner size="sm" /> : undefined}
                >
                  {loading ? 'Creating...' : 'Create Alert Type'}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </Container>
  );
};

export default AlertTypeCreatePage;

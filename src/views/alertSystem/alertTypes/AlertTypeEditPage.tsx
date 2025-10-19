import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import Input from '../../../components/ui/forms/Input';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { showSuccess } from '../../../utils/sweetAlert';
import { alertTypeService } from '../../../api/services/alertSystemService';
import type { AlertType, AlertTypeUpdate } from '../../../api/services/alertSystemService';

const AlertTypeEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  const [alertType, setAlertType] = useState<AlertType | null>(null);
  const [formData, setFormData] = useState<AlertTypeUpdate>({
    name: '',
    icon: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchAlertType = async () => {
      if (!id) {
        setError('Invalid alert type ID');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const alertTypeData = await alertTypeService.getById(parseInt(id));
        setAlertType(alertTypeData);
        setFormData({
          name: alertTypeData.name,
          icon: alertTypeData.icon || ''
        });
      } catch (err: any) {
        console.error('Error fetching alert type:', err);
        setError(err.response?.data?.message || 'Failed to load alert type. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAlertType();
  }, [id]);

  const handleInputChange = (field: keyof AlertTypeUpdate, value: string) => {
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

    if (!formData.name?.trim()) {
      errors.name = 'Name is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || !validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const submitData: AlertTypeUpdate = {
        name: formData.name?.trim(),
        icon: formData.icon?.trim() || undefined
      };

      await alertTypeService.update(parseInt(id), submitData);
      showSuccess('Alert type updated successfully');
      navigate('/alert-types');
    } catch (err: any) {
      console.error('Error updating alert type:', err);
      
      if (err.response?.data?.details) {
        // Handle validation errors from backend
        setValidationErrors(err.response.data.details);
      } else {
        setError(err.response?.data?.message || 'Failed to update alert type. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/alert-types');
  };

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error && !alertType) {
    return (
      <Container>
        <Alert variant="danger" className="mb-6">
          {error}
        </Alert>
        <div className="flex justify-end">
          <Button variant="secondary" onClick={handleCancel}>
            Back to Alert Types
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Alert Type</h1>
            <p className="text-gray-600 mt-1">
              Update alert type information
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
                  value={formData.name || ''}
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
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={saving}
                  icon={saving ? <Spinner size="sm" /> : undefined}
                >
                  {saving ? 'Updating...' : 'Update Alert Type'}
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </div>
    </Container>
  );
};

export default AlertTypeEditPage;

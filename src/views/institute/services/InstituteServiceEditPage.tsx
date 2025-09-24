import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { instituteService, type InstituteService, type InstituteServiceUpdate } from '../../../api/services/instituteService';
import { showSuccess, showError } from '../../../utils/sweetAlert';
import RoleBasedWidget from '../../../components/role-based/RoleBasedWidget';
import Button from '../../../components/ui/buttons/Button';
import Spinner from '../../../components/ui/common/Spinner';
import Container from '../../../components/ui/layout/Container';

const InstituteServiceEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [service, setService] = useState<InstituteService | null>(null);
  const [formData, setFormData] = useState<InstituteServiceUpdate>({
    name: '',
    icon: '',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchService = async () => {
    try {
      setLoading(true);
      const result = await instituteService.getInstituteServiceById(parseInt(id!));
      
      if (result.success && result.data) {
        setService(result.data);
        setFormData({
          name: result.data.name,
          icon: result.data.icon || '',
          description: result.data.description || ''
        });
      } else {
        showError('Error', result.error || 'Failed to fetch institute service');
        navigate('/institute/services');
      }
    } catch {
      showError('Error', 'An unexpected error occurred');
      navigate('/institute/services');
    } finally {
      setLoading(false);
    }
    };

    if (id) {
      fetchService();
    }
  }, [id, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const result = await instituteService.updateInstituteService(parseInt(id!), formData);
      
      if (result.success) {
        showSuccess('Success', 'Institute service updated successfully');
        navigate('/institute/services');
      } else {
        showError('Error', result.error || 'Failed to update institute service');
      }
    } catch {
      showError('Error', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/institute/services');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">Institute service not found</p>
        <Button onClick={() => navigate('/institute/services')} variant="primary">
          Back to Services
        </Button>
      </div>
    );
  }

  return (
    <RoleBasedWidget allowedRoles={['Super Admin']}>
      <Container className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Institute Service</h1>
          <p className="text-gray-600">Update institute service details</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  placeholder="Enter service name"
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : ''}`}
                  required
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* Icon */}
              <div>
                <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <input
                  id="icon"
                  name="icon"
                  type="text"
                  value={formData.icon || ''}
                  onChange={handleInputChange}
                  placeholder="Enter icon class or URL"
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.icon ? 'border-red-500' : ''}`}
                />
                {errors.icon && <p className="mt-1 text-sm text-red-600">{errors.icon}</p>}
                <p className="mt-1 text-sm text-gray-500">
                  Enter an icon class (e.g., "fas fa-graduation-cap") or icon URL
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description || ''}
                  onChange={handleInputChange}
                  placeholder="Enter service description"
                  rows={4}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.description ? 'border-red-500' : ''}`}
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
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
                >
                  {saving ? 'Updating...' : 'Update Service'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Container>
    </RoleBasedWidget>
  );
};

export default InstituteServiceEditPage;

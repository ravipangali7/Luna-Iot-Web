import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { instituteService, type InstituteUpdate, type InstituteService } from '../../api/services/instituteService';
import { showSuccess, showError } from '../../utils/sweetAlert';
import RoleBasedWidget from '../../components/role-based/RoleBasedWidget';
import Button from '../../components/ui/buttons/Button';
import FileInput from '../../components/ui/forms/FileInput';
import Container from '../../components/ui/layout/Container';
import Spinner from '../../components/ui/common/Spinner';

const InstituteEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<InstituteService[]>([]);
  const [formData, setFormData] = useState<InstituteUpdate>({
    name: '',
    description: '',
    phone: '',
    address: '',
    latitude: undefined,
    longitude: undefined,
    logo: undefined,
    service_ids: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});


  useEffect(() => {
    const fetchInstitute = async () => {
      try {
        setLoading(true);
        const result = await instituteService.getInstituteById(parseInt(id!));
        
        if (result.success && result.data) {
          setFormData({
            name: result.data.name,
            description: result.data.description || '',
            phone: result.data.phone || '',
            address: result.data.address || '',
            latitude: result.data.latitude || undefined,
            longitude: result.data.longitude || undefined,
            logo: undefined, // Don't pre-populate file input
            service_ids: result.data.institute_services.map(service => service.id)
          });
        } else {
          showError('Error', result.error || 'Failed to fetch institute');
          navigate('/institute');
        }
      } catch {
        showError('Error', 'An unexpected error occurred');
        navigate('/institute');
      } finally {
        setLoading(false);
      }
    };

    const fetchServices = async () => {
      try {
        const result = await instituteService.getAllInstituteServices();
        if (result.success && result.data) {
          setServices(result.data);
        }
      } catch {
        // Silently fail for services
      }
    };

    if (id) {
      fetchInstitute();
      fetchServices();
    }
  }, [id, navigate]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'latitude' || name === 'longitude') {
      const numValue = value ? parseFloat(value) : undefined;
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (files: FileList | null) => {
    const file = files?.[0];
    setFormData(prev => ({
      ...prev,
      logo: file
    }));
    
    // Clear error when user selects a file
    if (errors.logo) {
      setErrors(prev => ({
        ...prev,
        logo: ''
      }));
    }
  };

  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIds = Array.from(e.target.selectedOptions, option => parseInt(option.value));
    setFormData(prev => ({
      ...prev,
      service_ids: selectedIds
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.phone && !/^[+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.latitude !== undefined && (formData.latitude < -90 || formData.latitude > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90';
    }

    if (formData.longitude !== undefined && (formData.longitude < -180 || formData.longitude > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180';
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
      const result = await instituteService.updateInstitute(parseInt(id!), formData);
      
      if (result.success) {
        showSuccess('Success', 'Institute updated successfully');
        navigate('/institute');
      } else {
        showError('Error', result.error || 'Failed to update institute');
      }
    } catch {
      showError('Error', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/institute');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }


  return (
    <RoleBasedWidget allowedRoles={['Super Admin']}>
      <Container className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Institute</h1>
          <p className="text-gray-600">Update institute details</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    placeholder="Enter institute name"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone || ''}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? 'border-red-500' : ''}`}
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
                </div>
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
                  placeholder="Enter institute description"
                  rows={4}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.description ? 'border-red-500' : ''}`}
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address || ''}
                  onChange={handleInputChange}
                  placeholder="Enter institute address"
                  rows={3}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.address ? 'border-red-500' : ''}`}
                />
                {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
              </div>

              {/* Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-2">
                    Latitude
                  </label>
                  <input
                    id="latitude"
                    name="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude || ''}
                    onChange={handleInputChange}
                    placeholder="Enter latitude"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.latitude ? 'border-red-500' : ''}`}
                  />
                  {errors.latitude && <p className="mt-1 text-sm text-red-600">{errors.latitude}</p>}
                </div>

                <div>
                  <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-2">
                    Longitude
                  </label>
                  <input
                    id="longitude"
                    name="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude || ''}
                    onChange={handleInputChange}
                    placeholder="Enter longitude"
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.longitude ? 'border-red-500' : ''}`}
                  />
                  {errors.longitude && <p className="mt-1 text-sm text-red-600">{errors.longitude}</p>}
                </div>
              </div>

              {/* Logo */}
              <div>
                <label htmlFor="logo" className="block text-sm font-medium text-gray-700 mb-2">
                  Logo
                </label>
                <FileInput
                  accept="image/*"
                  onChange={handleFileChange}
                  error={errors.logo}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Upload a new image file to replace the current logo
                </p>
              </div>

              {/* Services */}
              <div>
                <label htmlFor="service_ids" className="block text-sm font-medium text-gray-700 mb-2">
                  Services
                </label>
                <select
                  id="service_ids"
                  name="service_ids"
                  multiple
                  value={formData.service_ids?.map(id => id.toString()) || []}
                  onChange={handleServiceChange}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.service_ids ? 'border-red-500' : ''}`}
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id.toString()}>
                      {service.name}
                    </option>
                  ))}
                </select>
                {errors.service_ids && <p className="mt-1 text-sm text-red-600">{errors.service_ids}</p>}
                <p className="mt-1 text-sm text-gray-500">
                  Select multiple services offered by this institute
                </p>
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
                  {saving ? 'Updating...' : 'Update Institute'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Container>
    </RoleBasedWidget>
  );
};

export default InstituteEditPage;

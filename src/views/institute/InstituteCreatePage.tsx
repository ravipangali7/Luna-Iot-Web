import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { instituteService, type InstituteCreate, type InstituteService } from '../../api/services/instituteService';
import { showSuccess, showError } from '../../utils/sweetAlert';
import { getErrorMessage, getErrorTitle } from '../../utils/errorHandler';
import { roundCoordinate } from '../../utils/coordinateUtils';
import RoleBasedWidget from '../../components/role-based/RoleBasedWidget';
import Button from '../../components/ui/buttons/Button';
import FileInput from '../../components/ui/forms/FileInput';
import MultiSelect from '../../components/ui/forms/MultiSelect';
import Container from '../../components/ui/layout/Container';

const InstituteCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<InstituteService[]>([]);
  const [formData, setFormData] = useState<InstituteCreate>({
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
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const result = await instituteService.getAllInstituteServices();
      if (result.success && result.data) {
        setServices(result.data);
      }
    } catch (err) {
      console.error('Failed to fetch services:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'latitude' || name === 'longitude') {
      const numValue = value ? parseFloat(value) : undefined;
      // Round coordinates to 8 decimal places for precision
      const roundedValue = numValue ? roundCoordinate(numValue) : undefined;
      setFormData(prev => ({
        ...prev,
        [name]: roundedValue
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

  const handleServiceChange = (selectedValues: (number | string)[]) => {
    setFormData(prev => ({
      ...prev,
      service_ids: selectedValues as number[]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
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

    setLoading(true);
    try {
      // Ensure coordinates are properly rounded before submission
      const submissionData = {
        ...formData,
        latitude: formData.latitude ? roundCoordinate(formData.latitude) : undefined,
        longitude: formData.longitude ? roundCoordinate(formData.longitude) : undefined
      };

      const result = await instituteService.createInstitute(submissionData);
      
      if (result.success) {
        showSuccess('Success', 'Institute created successfully');
        navigate('/institute');
      } else {
        showError('Error', result.error || 'Failed to create institute');
      }
    } catch (err: unknown) {
      showError(getErrorTitle(err), getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/institute');
  };

  return (
    <RoleBasedWidget allowedRoles={['Super Admin']}>
      <Container className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Institute</h1>
          <p className="text-gray-600">Add a new institute to the system</p>
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
                    value={formData.name}
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
                    value={formData.phone}
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
                  value={formData.description}
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
                  value={formData.address}
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
                  Upload an image file for the institute logo
                </p>
              </div>

              {/* Services */}
              <div>
                <MultiSelect
                  options={services.map(service => ({
                    id: service.id,
                    label: service.name,
                    value: service.id
                  }))}
                  value={formData.service_ids || []}
                  onChange={handleServiceChange}
                  placeholder="Select services..."
                  label="Services"
                  searchable
                  error={errors.service_ids}
                />
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
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Institute'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Container>
    </RoleBasedWidget>
  );
};

export default InstituteCreatePage;

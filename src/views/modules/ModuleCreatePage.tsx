import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { moduleService, type ModuleCreate } from '../../api/services/moduleService';
import { showSuccess, showError } from '../../utils/sweetAlert';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Spinner from '../../components/ui/common/Spinner';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ModuleCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ModuleCreate>({
    name: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (name: string, value: string) => {
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

    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Module name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const result = await moduleService.createModule(formData);
      
      if (result.success) {
        showSuccess('Module created successfully');
        navigate('/modules');
      } else {
        showError('Failed to create module', result.error);
      }
    } catch (error) {
      showError('Error creating module', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/modules');
  };

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handleCancel}
            variant="outline"
            size="sm"
            icon={<ArrowBackIcon />}
          >
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Module</h1>
            <p className="text-gray-600">Add a new module to the system</p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Module Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={(value) => handleInputChange('name', value)}
                  placeholder="Enter module name"
                  error={errors.name}
                  disabled={loading}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  The slug will be automatically generated from the name.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button
                  type="button"
                  onClick={handleCancel}
                  variant="outline"
                  size="md"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={loading}
                  icon={loading ? <Spinner size="sm" /> : undefined}
                >
                  {loading ? 'Creating...' : 'Create Module'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default ModuleCreatePage;

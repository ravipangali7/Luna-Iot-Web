import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { moduleService, type Module, type ModuleUpdate } from '../../api/services/moduleService';
import { showSuccess, showError } from '../../utils/sweetAlert';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ModuleEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [module, setModule] = useState<Module | null>(null);
  const [formData, setFormData] = useState<ModuleUpdate>({
    name: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      loadModule();
    }
  }, [id]);

  const loadModule = async () => {
    try {
      setInitialLoading(true);
      setError(null);
      
      const result = await moduleService.getModuleById(parseInt(id!));
      
      if (result.success && result.data) {
        setModule(result.data);
        setFormData({
          name: result.data.name
        });
      } else {
        setError(result.error || 'Failed to load module');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setInitialLoading(false);
    }
  };

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
      
      const result = await moduleService.updateModule(parseInt(id!), formData);
      
      if (result.success) {
        showSuccess('Module updated successfully');
        navigate('/modules');
      } else {
        showError('Failed to update module', result.error);
      }
    } catch (error) {
      showError('Error updating module', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/modules');
  };

  if (initialLoading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error && !module) {
    return (
      <Container>
        <div className="space-y-6">
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
              <h1 className="text-2xl font-bold text-gray-900">Edit Module</h1>
            </div>
          </div>
          <Alert variant="danger">
            {error}
          </Alert>
        </div>
      </Container>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Edit Module</h1>
            <p className="text-gray-600">Update module information</p>
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
                  The slug will be automatically updated when you change the name.
                </p>
              </div>

              {/* Current Slug Display */}
              {module && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Slug
                  </label>
                  <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md">
                    <code className="text-sm text-gray-700">{module.slug}</code>
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    This slug will be updated automatically when you save changes.
                  </p>
                </div>
              )}

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
                  {loading ? 'Updating...' : 'Update Module'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default ModuleEditPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bannerService } from '../../../api/services/bannerService';
import { showSuccess } from '../../../utils/sweetAlert';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import CardBody from '../../../components/ui/cards/CardBody';
import CardHeader from '../../../components/ui/cards/CardHeader';
import Button from '../../../components/ui/buttons/Button';
import Input from '../../../components/ui/forms/Input';
import Form from '../../../components/ui/forms/Form';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';

const BannerCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    isActive: true,
    orderPosition: 0,
    image: null as File | null
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    // Only validate URL format if provided
    if (formData.url && formData.url.trim()) {
      try {
        new URL(formData.url);
      } catch {
        errors.url = 'Please enter a valid URL';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (name: string) => (value: string | boolean | number) => {
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        image: e.target.files![0]
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

      const result = await bannerService.createBanner({
        title: formData.title.trim(),
        url: formData.url?.trim() || undefined,
        isActive: formData.isActive,
        orderPosition: formData.orderPosition,
        image: formData.image
      });

      if (result.success) {
        showSuccess('Banner created successfully');
        navigate('/notices/banners');
      } else {
        setError(result.error || 'Failed to create banner');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/notices/banners');
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
              <h1 className="text-2xl font-bold text-gray-900">Create Banner</h1>
              <p className="text-gray-600">Add a new banner to the system</p>
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
            <h2 className="text-lg font-semibold text-gray-900">Banner Information</h2>
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
                    placeholder="Enter banner title"
                    error={formErrors.title}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL
                  </label>
                  <Input
                    type="url"
                    value={formData.url}
                    onChange={handleInputChange('url')}
                    placeholder="https://example.com (optional)"
                    error={formErrors.url}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order Position
                  </label>
                  <Input
                    type="number"
                    value={formData.orderPosition.toString()}
                    onChange={(val) => handleInputChange('orderPosition')(parseInt(val) || 0)}
                    placeholder="0"
                    error={formErrors.orderPosition}
                  />
                  <p className="mt-1 text-sm text-gray-500">Lower numbers appear first</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image (16:5 aspect ratio recommended)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive')(e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Active
                  </label>
                </div>

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
                    Create Banner
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

export default BannerCreatePage;


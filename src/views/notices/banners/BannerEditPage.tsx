import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bannerService } from '../../../api/services/bannerService';
import { showSuccess } from '../../../utils/sweetAlert';
import type { Banner } from '../../../types/banner';
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

const BannerEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    isActive: true,
    orderPosition: 0,
    image: null as File | null
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const loadBanner = async () => {
    if (!id) return;

    try {
      setInitialLoading(true);
      const result = await bannerService.getBannerById(parseInt(id));
      
      if (result.success && result.data) {
        const bannerData = result.data;
        setBanner(bannerData);
        setFormData({
          title: bannerData.title || '',
          url: bannerData.url ?? '', // Use nullish coalescing to handle null properly
          isActive: bannerData.isActive,
          orderPosition: bannerData.orderPosition ?? 0,
          image: null
        });
      } else {
        setError('Banner not found');
      }
    } catch (error) {
      setError('Failed to load banner: ' + (error as Error).message);
    } finally {
      setInitialLoading(false);
    }
  };

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

      // Ensure URL is properly handled - convert null/undefined to empty string
      const urlValue = formData.url == null ? '' : formData.url.trim();
      
      const result = await bannerService.updateBanner(parseInt(id!), {
        title: formData.title.trim(),
        url: urlValue, // Send empty string to clear, or actual value to update
        isActive: formData.isActive,
        orderPosition: formData.orderPosition,
        image: formData.image
      });

      if (result.success) {
        showSuccess('Banner updated successfully');
        navigate('/notices/banners');
      } else {
        setError(result.error || 'Failed to update banner');
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

  useEffect(() => {
    loadBanner();
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

  if (!banner) {
    return (
      <Container>
        <Alert variant="danger">Banner not found</Alert>
      </Container>
    );
  }

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
              <h1 className="text-2xl font-bold text-gray-900">Edit Banner</h1>
              <p className="text-gray-600">Update banner information</p>
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
                  {banner.imageUrl && (
                    <div className="mb-2">
                      <img src={banner.imageUrl} alt="Current" className="max-w-xs h-auto rounded" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                  <p className="mt-1 text-sm text-gray-500">Leave empty to keep current image</p>
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
                    Update Banner
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

export default BannerEditPage;


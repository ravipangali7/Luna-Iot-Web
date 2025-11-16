import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { popupService } from '../../../api/services/popupService';
import { showSuccess } from '../../../utils/sweetAlert';
import type { Popup } from '../../../types/popup';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import CardBody from '../../../components/ui/cards/CardBody';
import CardHeader from '../../../components/ui/cards/CardHeader';
import Button from '../../../components/ui/buttons/Button';
import Input from '../../../components/ui/forms/Input';
import TextArea from '../../../components/ui/forms/TextArea';
import Form from '../../../components/ui/forms/Form';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';

const PopupEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [popup, setPopup] = useState<Popup | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    isActive: true,
    image: null as File | null
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const loadPopup = async () => {
    if (!id) return;

    try {
      setInitialLoading(true);
      const result = await popupService.getPopupById(parseInt(id));
      
      if (result.success && result.data) {
        const popupData = result.data;
        setPopup(popupData);
        setFormData({
          title: popupData.title || '',
          message: popupData.message || '',
          isActive: popupData.isActive,
          image: null
        });
      } else {
        setError('Popup not found');
      }
    } catch (error) {
      setError('Failed to load popup: ' + (error as Error).message);
    } finally {
      setInitialLoading(false);
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (name: string) => (value: string | boolean) => {
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

      const result = await popupService.updatePopup(parseInt(id!), {
        title: formData.title.trim(),
        message: formData.message.trim(),
        isActive: formData.isActive,
        image: formData.image
      });

      if (result.success) {
        showSuccess('Popup updated successfully');
        navigate('/notices/popups');
      } else {
        setError(result.error || 'Failed to update popup');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/notices/popups');
  };

  useEffect(() => {
    loadPopup();
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

  if (!popup) {
    return (
      <Container>
        <Alert variant="danger">Popup not found</Alert>
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
              <h1 className="text-2xl font-bold text-gray-900">Edit Popup</h1>
              <p className="text-gray-600">Update popup information</p>
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
            <h2 className="text-lg font-semibold text-gray-900">Popup Information</h2>
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
                    placeholder="Enter popup title"
                    error={formErrors.title}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <TextArea
                    value={formData.message}
                    onChange={handleInputChange('message')}
                    placeholder="Enter popup message"
                    rows={5}
                    error={formErrors.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image
                  </label>
                  {popup.imageUrl && (
                    <div className="mb-2">
                      <img src={popup.imageUrl} alt="Current" className="max-w-xs h-auto rounded" />
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
                    Update Popup
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

export default PopupEditPage;


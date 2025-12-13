import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCommunitySirenAccess } from '../../../hooks/useCommunitySirenAccess';
import { communitySirenContactService, type CommunitySirenContactCreate } from '../../../api/services/communitySirenService';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import Input from '../../../components/ui/forms/Input';
import Checkbox from '../../../components/ui/forms/Checkbox';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { showSuccess, showError } from '../../../utils/sweetAlert';

interface FormData {
  name: string;
  phone: string;
  is_sms: boolean;
  is_call: boolean;
}

const ContactCreatePage: React.FC = () => {
  const { instituteId } = useParams<{ instituteId: string }>();
  const navigate = useNavigate();
  const { hasAccess, loading: accessLoading, isAdmin } = useCommunitySirenAccess(Number(instituteId));

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    is_sms: true,
    is_call: false
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Allow access if user has general community-siren access or is admin
    // Backend will validate specific institute access when creating
    if (accessLoading) {
      return;
    }
    
    if (!hasAccess && !isAdmin) {
      setError('Access denied. You do not have permission to create contacts for this institute.');
      setLoading(false);
    }
  }, [hasAccess, isAdmin, accessLoading]);

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
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


  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^[+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ''))) {
      errors.phone = 'Please enter a valid phone number';
    }

    if (!formData.is_sms && !formData.is_call) {
      errors.notifications = 'At least one notification method must be enabled';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload: CommunitySirenContactCreate = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        is_sms: formData.is_sms,
        is_call: formData.is_call,
        institute: Number(instituteId)
      };

      await communitySirenContactService.create(payload);
      showSuccess('Contact created successfully');
      navigate(`/community-siren/${instituteId}`);
    } catch (err: unknown) {
      console.error('Error creating contact:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create contact. Please try again.';
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    navigate(`/community-siren/${instituteId}`);
  };

  if (loading || accessLoading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Community Siren Contact</h1>
          <p className="text-gray-600">Create a new contact for the community siren</p>
        </div>

        <Card>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(value) => handleInputChange('name', value)}
                  placeholder="Enter contact name"
                  error={validationErrors.name}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(value) => handleInputChange('phone', value)}
                  placeholder="Enter phone number"
                  error={validationErrors.phone}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter phone number with country code (e.g., +1234567890)
                </p>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Notification Settings</h2>
              {validationErrors.notifications && (
                <Alert variant="danger">{validationErrors.notifications}</Alert>
              )}
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <Checkbox
                    checked={formData.is_sms}
                    onChange={(checked) => handleInputChange('is_sms', checked)}
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Send SMS notifications
                  </label>
                </div>
                
                <div className="flex items-center">
                  <Checkbox
                    checked={formData.is_call}
                    onChange={(checked) => handleInputChange('is_call', checked)}
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Make phone calls
                  </label>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Contact'
                )}
              </Button>
            </div>
          </form>
          </div>
        </Card>
      </div>
    </Container>
  );
};

export default ContactCreatePage;

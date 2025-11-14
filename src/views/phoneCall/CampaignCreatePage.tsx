import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { phoneCallService } from '../../api/services/phoneCallService';
import { showSuccess, showError } from '../../utils/sweetAlert';
import type { CampaignFormData, VoiceModel, PhoneNumber } from '../../types/phoneCall';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardHeader from '../../components/ui/cards/CardHeader';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Select from '../../components/ui/forms/Select';
import TextArea from '../../components/ui/forms/TextArea';
import DateTimePicker from '../../components/ui/forms/DateTimePicker';
import MultiSelect from '../../components/ui/forms/MultiSelect';
import Alert from '../../components/ui/common/Alert';
import Spinner from '../../components/ui/common/Spinner';

const CampaignCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    services: 'PHONE',
    user_phone: [],
    message: '',
    sms_message: '',
    description: '',
    schedule: '',
    voice: null // Voice is managed separately from view page
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CampaignFormData, string>>>({});
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoadingData(true);
      const [voicesResult, phonesResult] = await Promise.all([
        phoneCallService.getVoiceModels(),
        phoneCallService.getActivePhoneNumbers()
      ]);

      if (voicesResult.success && voicesResult.data) {
        setVoiceModels(Array.isArray(voicesResult.data) ? voicesResult.data : []);
      }

      if (phonesResult.success && phonesResult.data) {
        setPhoneNumbers(Array.isArray(phonesResult.data) ? phonesResult.data : []);
      }
    } catch (err) {
      console.error('Error fetching initial data:', err);
      setError('Failed to load voice models or phone numbers');
    } finally {
      setLoadingData(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CampaignFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    }

    if (!formData.services) {
      newErrors.services = 'Service type is required';
    }

    if (formData.user_phone.length === 0) {
      newErrors.user_phone = 'At least one phone number is required';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Voice message is required';
    }

    if ((formData.services === 'SMS' || formData.services === 'SMS & PHONE') && !formData.sms_message.trim()) {
      newErrors.sms_message = 'SMS message is required for SMS services';
    }

    if (!formData.schedule) {
      newErrors.schedule = 'Schedule date is required';
    }

    // Voice is managed separately from view page, not required in form
    // if (!formData.voice) {
    //   newErrors.voice = 'Voice model is required';
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CampaignFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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
      setErrors({});

      // Remove voice from formData before sending (voice is managed separately)
      const { voice, ...campaignData } = formData;
      const result = await phoneCallService.createCampaign(campaignData);
      
      if (result.success) {
        showSuccess('Campaign Created', 'Campaign has been created successfully.');
        navigate('/phone-call/campaigns');
      } else {
        // Handle validation errors from API
        if (result.validationErrors) {
          const fieldErrors: Partial<Record<keyof CampaignFormData, string>> = {};
          
          // Map validation errors to form fields
          Object.keys(result.validationErrors).forEach((field) => {
            const fieldKey = field as keyof CampaignFormData;
            const errorValue = result.validationErrors[field];
            
            if (Array.isArray(errorValue)) {
              fieldErrors[fieldKey] = errorValue.join(', ');
            } else if (typeof errorValue === 'object' && errorValue !== null) {
              // Handle nested errors like {'voice': {'non_field_errors': [...]}}
              const nestedErrors: string[] = [];
              Object.keys(errorValue).forEach((key) => {
                const nestedValue = errorValue[key];
                if (Array.isArray(nestedValue)) {
                  nestedErrors.push(...nestedValue);
                } else {
                  nestedErrors.push(String(nestedValue));
                }
              });
              fieldErrors[fieldKey] = nestedErrors.join(', ');
            } else {
              fieldErrors[fieldKey] = String(errorValue);
            }
          });
          
          setErrors(fieldErrors);
        }
        
        // Show general error message
        setError(result.error || 'Failed to create campaign');
        showError('Campaign Creation Failed', result.error || 'Failed to create campaign');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      showError('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/phone-call/campaigns');
  };

  if (loadingData) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Campaign</h1>
          <p className="text-gray-600">Create a new phone call or SMS campaign</p>
        </div>

        {error && (
          <Alert variant="danger" className="mb-6">
            {error}
          </Alert>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Campaign Details</h2>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.name}
                  onChange={(value) => handleInputChange('name', value)}
                  placeholder="Enter campaign name"
                  error={errors.name}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.services}
                  onChange={(value) => handleInputChange('services', value)}
                  options={[
                    { value: 'PHONE', label: 'PHONE' },
                    { value: 'SMS', label: 'SMS' },
                    { value: 'SMS & PHONE', label: 'SMS & PHONE' }
                  ]}
                  error={errors.services}
                />
              </div>

              {/* Voice field removed - managed separately from campaign view page */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Numbers <span className="text-red-500">*</span>
                </label>
                <MultiSelect
                  value={formData.user_phone.map(id => id.toString())}
                  onChange={(values) => handleInputChange('user_phone', values.map(v => typeof v === 'string' ? parseInt(v, 10) : v).filter((v): v is number => !isNaN(v)))}
                  options={phoneNumbers.map(phone => ({
                    id: phone.id,
                    value: phone.id.toString(),
                    label: phone.phone_number
                  }))}
                  placeholder="Select phone numbers"
                />
                {errors.user_phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.user_phone}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voice Message <span className="text-red-500">*</span>
                </label>
                <TextArea
                  value={formData.message}
                  onChange={(value) => handleInputChange('message', value)}
                  placeholder="Enter voice message content"
                  rows={4}
                  error={errors.message}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use variables like {'{name}'}, {'{age}'} for personalization
                </p>
              </div>

              {(formData.services === 'SMS' || formData.services === 'SMS & PHONE') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SMS Message <span className="text-red-500">*</span>
                  </label>
                  <TextArea
                    value={formData.sms_message}
                    onChange={(value) => handleInputChange('sms_message', value)}
                    placeholder="Enter SMS message content"
                    rows={4}
                    error={errors.sms_message}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Use variables like {'{name}'}, {'{age}'} for personalization
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <TextArea
                  value={formData.description || ''}
                  onChange={(value) => handleInputChange('description', value)}
                  placeholder="Enter campaign description (optional)"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Schedule Date & Time <span className="text-red-500">*</span>
                </label>
                <DateTimePicker
                  value={formData.schedule}
                  onChange={(value) => handleInputChange('schedule', value)}
                  error={errors.schedule}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Campaign will run automatically on this date and time. Leave time as 00:00 for midnight.
                </p>
              </div>

              <div className="flex justify-end gap-4 pt-4">
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
                  {loading ? 'Creating...' : 'Create Campaign'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default CampaignCreatePage;


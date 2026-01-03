import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { phoneBookService } from '../../api/services/phoneBookService';
import { showSuccess, showError } from '../../utils/sweetAlert';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Spinner from '../../components/ui/common/Spinner';

interface FormData {
  name: string;
  phone: string;
}

const PhoneBookNumberCreatePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof FormData, value: string) => {
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

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !id) {
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        phonebook: Number(id),
        name: formData.name.trim(),
        phone: formData.phone.trim()
      };

      const result = await phoneBookService.createNumber(Number(id), payload);
      
      if (result.success) {
        showSuccess('Contact Added', 'Contact has been added successfully.');
        navigate(`/phone-call/phone-books/${id}`);
      } else {
        if (result.validationErrors) {
          setValidationErrors(result.validationErrors);
        }
        showError('Failed to Add Contact', result.error || 'Failed to add contact');
      }
    } catch (err: unknown) {
      console.error('Error adding contact:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to add contact. Please try again.';
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (id) {
      navigate(`/phone-call/phone-books/${id}`);
    } else {
      navigate('/phone-call/phone-books');
    }
  };

  return (
    <Container>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add Contact</h1>
          <p className="text-gray-600">Add a new contact to the phone book</p>
        </div>

        <Card>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
                
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
                      Adding...
                    </>
                  ) : (
                    'Add Contact'
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

export default PhoneBookNumberCreatePage;

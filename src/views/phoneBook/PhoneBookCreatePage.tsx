import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { phoneBookService } from '../../api/services/phoneBookService';
import { instituteService } from '../../api/services/instituteService';
import { useAuth } from '../../hooks/useAuth';
import { showSuccess, showError } from '../../utils/sweetAlert';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Select from '../../components/ui/forms/Select';
import Spinner from '../../components/ui/common/Spinner';
import type { Institute } from '../../api/services/instituteService';

interface FormData {
  name: string;
  owner_type: 'user' | 'institute' | '';
  user: number | null;
  institute: number | null;
}

const PhoneBookCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [loadingInstitutes, setLoadingInstitutes] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    owner_type: '',
    user: null,
    institute: null
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load institutes if user has access
  const loadInstitutes = useCallback(async () => {
    try {
      setLoadingInstitutes(true);
      const result = await instituteService.getUserAccessibleInstitutes();
      if (result.success && result.data) {
        setInstitutes(result.data);
      }
    } catch (err) {
      console.error('Error loading institutes:', err);
    } finally {
      setLoadingInstitutes(false);
    }
  }, []);

  useEffect(() => {
    loadInstitutes();
  }, [loadInstitutes]);

  const handleInputChange = (field: keyof FormData, value: string | number | null) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Reset dependent fields when owner_type changes
      if (field === 'owner_type') {
        if (value === 'user') {
          updated.institute = null;
          updated.user = user?.id || null;
        } else if (value === 'institute') {
          updated.user = null;
        } else {
          updated.user = null;
          updated.institute = null;
        }
      }
      return updated;
    });
    
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

    if (!formData.owner_type) {
      errors.owner_type = 'Owner type is required';
    }

    if (formData.owner_type === 'user' && !formData.user) {
      errors.user = 'User is required';
    }

    if (formData.owner_type === 'institute' && !formData.institute) {
      errors.institute = 'Institute is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);

      const payload: any = {
        name: formData.name.trim(),
      };

      if (formData.owner_type === 'user') {
        payload.user = formData.user;
        payload.institute = null;
      } else if (formData.owner_type === 'institute') {
        payload.institute = formData.institute;
        payload.user = null;
      }

      const result = await phoneBookService.create(payload);
      
      if (result.success) {
        showSuccess('Phone Book Created', 'Phone book has been created successfully.');
        navigate('/phone-call/phone-books');
      } else {
        if (result.validationErrors) {
          setValidationErrors(result.validationErrors);
        }
        showError('Failed to Create Phone Book', result.error || 'Failed to create phone book');
      }
    } catch (err: unknown) {
      console.error('Error creating phone book:', err);
      const errorMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to create phone book. Please try again.';
      showError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/phone-call/phone-books');
  };

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Phone Book</h1>
          <p className="text-gray-600">Create a new phone book for managing contacts</p>
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
                    placeholder="Enter phone book name"
                    error={validationErrors.name}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owner Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.owner_type}
                    onChange={(value) => handleInputChange('owner_type', value as 'user' | 'institute' | '')}
                    options={[
                      { value: '', label: 'Select owner type...' },
                      { value: 'user', label: 'User (Personal)' },
                      { value: 'institute', label: 'Institute' }
                    ]}
                    error={validationErrors.owner_type}
                  />
                </div>

                {formData.owner_type === 'user' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      User
                    </label>
                    <Input
                      type="text"
                      value={user?.name || user?.phone || 'Current User'}
                      disabled
                      className="bg-gray-100"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Phone book will be created for your account
                    </p>
                  </div>
                )}

                {formData.owner_type === 'institute' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Institute <span className="text-red-500">*</span>
                    </label>
                    {loadingInstitutes ? (
                      <Spinner size="sm" />
                    ) : (
                      <Select
                        value={formData.institute?.toString() || ''}
                        onChange={(value) => handleInputChange('institute', value ? parseInt(value) : null)}
                        options={[
                          { value: '', label: 'Select institute...' },
                          ...institutes.map(inst => ({
                            value: inst.id.toString(),
                            label: inst.name
                          }))
                        ]}
                        error={validationErrors.institute}
                      />
                    )}
                  </div>
                )}
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
                    'Create Phone Book'
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

export default PhoneBookCreatePage;

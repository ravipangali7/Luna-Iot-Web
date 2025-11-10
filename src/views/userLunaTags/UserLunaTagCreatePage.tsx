import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lunaTagService } from '../../api/services/lunaTagService';
import { showSuccess } from '../../utils/sweetAlert';
import type { UserLunaTagFormData } from '../../types/lunaTag';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardHeader from '../../components/ui/cards/CardHeader';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Checkbox from '../../components/ui/forms/Checkbox';
import Alert from '../../components/ui/common/Alert';

const UserLunaTagCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<UserLunaTagFormData>({
    publicKey: '',
    name: '',
    image: null,
    expire_date: '',
    is_active: true
  });
  const [errors, setErrors] = useState<Partial<UserLunaTagFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<UserLunaTagFormData> = {};

    if (!formData.publicKey || !formData.publicKey.trim()) {
      newErrors.publicKey = 'Public Key is required';
    }

    if (!formData.name || !formData.name.trim()) {
      newErrors.name = 'Name is required';
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
    setError(null);

    try {
      // If expire_date is empty, set to 1 year from now (ISO string)
      const getOneYearFromNowIso = () => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        return d.toISOString();
      };

      const normalizedExpireDate =
        formData.expire_date && formData.expire_date.trim() !== ''
          ? formData.expire_date
          : getOneYearFromNowIso();

      const result = await lunaTagService.createUserLunaTag({
        ...formData,
        publicKey: formData.publicKey.trim(),
        name: formData.name.trim(),
        expire_date: normalizedExpireDate
      });

      if (result.success) {
        showSuccess('User Luna Tag created successfully');
        navigate('/user-luna-tags');
      } else {
        setError(result.error || 'Failed to create User Luna Tag');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UserLunaTagFormData, value: string | number | boolean | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleInputChange('image', file);
    }
  };

  const handleCancel = () => {
    navigate('/user-luna-tags');
  };

  return (
    <Container>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create User Tag</h1>
          <p className="text-gray-600">Add a new User Tag to the system</p>
        </div>

        {error && (
          <Alert variant="danger" className="mb-6">
            {error}
            {error?.toLowerCase().includes('does not exist') && formData.publicKey && (
              <div className="mt-3">
                <Button
                  type="button"
                  onClick={() => navigate(`/luna-tags/create?publicKey=${encodeURIComponent(formData.publicKey.trim())}`)}
                >
                  Create Luna Tag for this Public Key
                </Button>
              </div>
            )}
          </Alert>
        )}

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">User Tag Information</h3>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Public Key <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter public key"
                    value={formData.publicKey}
                    onChange={(value) => handleInputChange('publicKey', value as string)}
                    error={errors.publicKey}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter name"
                    value={formData.name}
                    onChange={(value) => handleInputChange('name', value as string)}
                    error={errors.name}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expire Date
                  </label>
                  <Input
                    type="datetime-local"
                    value={formData.expire_date || ''}
                    onChange={(value) => handleInputChange('expire_date', value as string)}
                  />
                </div>

                <div>
                  <Checkbox
                    checked={formData.is_active || false}
                    onChange={(checked) => handleInputChange('is_active', checked)}
                  >
                    Active
                  </Checkbox>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="submit" loading={loading}>
                    Create
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleCancel}>
                    Cancel
                  </Button>
                </div>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default UserLunaTagCreatePage;


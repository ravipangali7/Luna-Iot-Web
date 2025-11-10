import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { lunaTagService } from '../../api/services/lunaTagService';
import { showSuccess } from '../../utils/sweetAlert';
import type { LunaTagFormData } from '../../types/lunaTag';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardHeader from '../../components/ui/cards/CardHeader';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Checkbox from '../../components/ui/forms/Checkbox';
import Alert from '../../components/ui/common/Alert';

const LunaTagCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<LunaTagFormData>({
    publicKey: '',
    is_lost_mode: false
  });
  const [errors, setErrors] = useState<Partial<LunaTagFormData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<LunaTagFormData> = {};

    if (!formData.publicKey || !formData.publicKey.trim()) {
      newErrors.publicKey = 'Public Key is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof LunaTagFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    // Clear API error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await lunaTagService.createLunaTag({
        ...formData,
        publicKey: formData.publicKey.trim()
      });

      if (result.success) {
        showSuccess('Luna Tag created successfully');
        navigate('/luna-tags');
      } else {
        setError(result.error || 'Failed to create Luna Tag');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/luna-tags');
  };

  // Prefill publicKey from query param if present
  useEffect(() => {
    const pk = searchParams.get('publicKey');
    if (pk) {
      setFormData(prev => ({ ...prev, publicKey: pk }));
    }
  }, [searchParams]);

  return (
    <Container>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Luna Tag</h1>
          <p className="text-gray-600">Add a new Luna Tag to the system</p>
        </div>

        {error && (
          <Alert variant="danger" className="mb-6" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Luna Tag Information</h3>
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
                  <Checkbox
                    checked={formData.is_lost_mode || false}
                    onChange={(checked) => handleInputChange('is_lost_mode', checked)}
                  >
                    Lost Mode
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

export default LunaTagCreatePage;


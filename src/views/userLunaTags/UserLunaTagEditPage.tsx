import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { lunaTagService } from '../../api/services/lunaTagService';
import { showSuccess, showError } from '../../utils/sweetAlert';
import type { UserLunaTag, UserLunaTagFormData } from '../../types/lunaTag';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardHeader from '../../components/ui/cards/CardHeader';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Checkbox from '../../components/ui/forms/Checkbox';
import Alert from '../../components/ui/common/Alert';
import Spinner from '../../components/ui/common/Spinner';
import { API_CONFIG } from '../../config/config';

const UserLunaTagEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLunaTag, setUserLunaTag] = useState<UserLunaTag | null>(null);
  const [formData, setFormData] = useState<Partial<UserLunaTagFormData>>({
    name: '',
    image: null,
    expire_date: '',
    is_active: true
  });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      // Load UserLunaTag
      const tagResult = await lunaTagService.getAllUserLunaTags(1, 1000);
      if (tagResult.success && tagResult.data) {
        const tag = tagResult.data.data.find(t => t.id === parseInt(id));
        if (tag) {
          setUserLunaTag(tag);
          setFormData({
            name: tag.name,
            expire_date: tag.expire_date || '',
            is_active: tag.is_active
          });
        } else {
          setError('User Luna Tag not found');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id || !userLunaTag) return;

    setSaving(true);
    setError(null);

    try {
      // If expire_date is empty, set to 1 year from now (ISO string)
      const getOneYearFromNowIso = () => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        return d.toISOString();
      };

      const payload: Partial<UserLunaTagFormData> = {
        ...formData,
      };

      if (!formData.expire_date || formData.expire_date.trim() === '') {
        payload.expire_date = getOneYearFromNowIso();
      }

      const result = await lunaTagService.updateUserLunaTag(parseInt(id), payload);

      if (result.success) {
        showSuccess('User Luna Tag updated successfully');
        navigate('/user-luna-tags');
      } else {
        setError(result.error || 'Failed to update User Luna Tag');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserLunaTagFormData, value: string | boolean | File | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-screen">
          <Spinner />
        </div>
      </Container>
    );
  }

  if (!userLunaTag) {
    return (
      <Container>
        <Alert variant="danger">User Luna Tag not found</Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit User Tag</h1>
          <p className="text-gray-600">Update User Tag information</p>
        </div>

        {error && (
          <Alert variant="danger" className="mb-6">
            {error}
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
                    Luna Tag
                  </label>
                  <p className="text-gray-600 py-2">{userLunaTag.publicKey_value || userLunaTag.publicKey}</p>
                  <p className="text-xs text-gray-500 mt-1">Luna Tag cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter name"
                    value={formData.name || ''}
                    onChange={(value) => handleInputChange('name', value as string)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image
                  </label>
                  {userLunaTag.image && (
                    <img
                      src={userLunaTag.image.startsWith('http') ? userLunaTag.image : `${API_CONFIG.BASE_URL}${userLunaTag.image}`}
                      alt={userLunaTag.name}
                      className="w-32 h-32 object-cover mb-2 rounded"
                    />
                  )}
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
                  <Button type="submit" loading={saving}>
                    Update
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

export default UserLunaTagEditPage;


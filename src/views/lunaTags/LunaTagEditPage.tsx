import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { lunaTagService } from '../../api/services/lunaTagService';
import { showSuccess } from '../../utils/sweetAlert';
import type { LunaTag, LunaTagFormData } from '../../types/lunaTag';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardHeader from '../../components/ui/cards/CardHeader';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Checkbox from '../../components/ui/forms/Checkbox';
import Alert from '../../components/ui/common/Alert';
import Spinner from '../../components/ui/common/Spinner';

const LunaTagEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lunaTag, setLunaTag] = useState<LunaTag | null>(null);
  const [formData, setFormData] = useState<Partial<LunaTagFormData>>({
    is_lost_mode: false
  });

  useEffect(() => {
    loadLunaTag();
  }, [id]);

  const loadLunaTag = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const result = await lunaTagService.getAllLunaTags(1, 1000);
      
      if (result.success && result.data) {
        const tag = result.data.data.find(t => t.id === parseInt(id));
        if (tag) {
          setLunaTag(tag);
          setFormData({
            is_lost_mode: tag.is_lost_mode
          });
        } else {
          setError('Luna Tag not found');
        }
      } else {
        setError(result.error || 'Failed to load Luna Tag');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    setSaving(true);
    setError(null);

    try {
      const result = await lunaTagService.updateLunaTag(parseInt(id), formData);

      if (result.success) {
        showSuccess('Luna Tag updated successfully');
        navigate('/luna-tags');
      } else {
        setError(result.error || 'Failed to update Luna Tag');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
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

  if (!lunaTag) {
    return (
      <Container>
        <Alert variant="danger">Luna Tag not found</Alert>
      </Container>
    );
  }

  const handleInputChange = (field: keyof LunaTagFormData, value: boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    navigate('/luna-tags');
  };

  return (
    <Container>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Luna Tag</h1>
          <p className="text-gray-600">Update Luna Tag information</p>
        </div>

        {error && (
          <Alert variant="danger" className="mb-6">
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
                    Public Key
                  </label>
                  <p className="text-gray-600 py-2">{lunaTag.publicKey}</p>
                  <p className="text-xs text-gray-500 mt-1">Public Key cannot be changed</p>
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

export default LunaTagEditPage;


import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bannerService } from '../../../api/services/bannerService';
import type { Banner } from '../../../types/banner';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import CardBody from '../../../components/ui/cards/CardBody';
import CardHeader from '../../../components/ui/cards/CardHeader';
import Button from '../../../components/ui/buttons/Button';
import Badge from '../../../components/ui/common/Badge';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const BannerShowPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBanner = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const result = await bannerService.getBannerById(parseInt(id));
      
      if (result.success && result.data) {
        setBanner(result.data);
      } else {
        setError('Banner not found');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleEdit = () => {
    if (banner) {
      navigate(`/notices/banners/${banner.id}/edit`);
    }
  };

  const handleBack = () => {
    navigate('/notices/banners');
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge 
        variant={isActive ? 'success' : 'danger'} 
        size="sm"
      >
        {isActive ? 'Active' : 'Inactive'}
      </Badge>
    );
  };

  useEffect(() => {
    loadBanner();
  }, [loadBanner]);

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-96">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error || !banner) {
    return (
      <Container>
        <Alert variant="danger">{error || 'Banner not found'}</Alert>
        <Button onClick={handleBack} variant="outline" className="mt-4">
          <ArrowBackIcon className="w-4 h-4" />
          Back to Banners
        </Button>
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
              <h1 className="text-2xl font-bold text-gray-900">{banner.title}</h1>
              <p className="text-gray-600">Banner Details</p>
            </div>
          </div>
          <Button
            onClick={handleEdit}
            variant="primary"
            className="flex items-center gap-2"
          >
            <EditIcon className="w-4 h-4" />
            Edit
          </Button>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Banner Information</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <p className="text-gray-900">{banner.title}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Position
                </label>
                <p className="text-gray-900">{banner.orderPosition}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <p className="text-gray-900">
                  {banner.url ? (
                    <a href={banner.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {banner.url}
                    </a>
                  ) : (
                    <span className="text-gray-400 italic">No URL set</span>
                  )}
                </p>
              </div>

              {banner.imageUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image
                  </label>
                  <img src={banner.imageUrl} alt={banner.title} className="max-w-md h-auto rounded" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                {getStatusBadge(banner.isActive)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Click Count
                </label>
                <p className="text-gray-900">{banner.click}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created At
                </label>
                <p className="text-gray-900">
                  {banner.createdAt ? new Date(banner.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Updated At
                </label>
                <p className="text-gray-900">
                  {banner.updatedAt ? new Date(banner.updatedAt).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default BannerShowPage;


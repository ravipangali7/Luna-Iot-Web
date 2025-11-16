import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { popupService } from '../../../api/services/popupService';
import type { Popup } from '../../../types/popup';
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

const PopupShowPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [popup, setPopup] = useState<Popup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPopup = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const result = await popupService.getPopupById(parseInt(id));
      
      if (result.success && result.data) {
        setPopup(result.data);
      } else {
        setError('Popup not found');
      }
    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleEdit = () => {
    if (popup) {
      navigate(`/notices/popups/${popup.id}/edit`);
    }
  };

  const handleBack = () => {
    navigate('/notices/popups');
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
    loadPopup();
  }, [loadPopup]);

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-96">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error || !popup) {
    return (
      <Container>
        <Alert variant="danger">{error || 'Popup not found'}</Alert>
        <Button onClick={handleBack} variant="outline" className="mt-4">
          <ArrowBackIcon className="w-4 h-4" />
          Back to Popups
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
              <h1 className="text-2xl font-bold text-gray-900">{popup.title}</h1>
              <p className="text-gray-600">Popup Details</p>
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
            <h2 className="text-lg font-semibold text-gray-900">Popup Information</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <p className="text-gray-900">{popup.title}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <p className="text-gray-900 whitespace-pre-wrap">{popup.message}</p>
              </div>

              {popup.imageUrl && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image
                  </label>
                  <img src={popup.imageUrl} alt={popup.title} className="max-w-md h-auto rounded" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                {getStatusBadge(popup.isActive)}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created At
                </label>
                <p className="text-gray-900">
                  {popup.createdAt ? new Date(popup.createdAt).toLocaleString() : 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Updated At
                </label>
                <p className="text-gray-900">
                  {popup.updatedAt ? new Date(popup.updatedAt).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default PopupShowPage;


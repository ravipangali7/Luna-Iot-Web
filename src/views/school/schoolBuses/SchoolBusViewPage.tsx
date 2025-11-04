import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { schoolService } from '../../../api/services/schoolService';
import type { SchoolBus } from '../../../types/school';

const SchoolBusViewPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const busId = parseInt(id || '0');
  
  const [schoolBus, setSchoolBus] = useState<SchoolBus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await schoolService.getSchoolBusById(busId);
        if (result.success && result.data) {
          setSchoolBus(result.data);
        } else {
          setError(result.error || 'Failed to load school bus');
        }
      } catch (err) {
        console.error('Error fetching school bus:', err);
        setError('Failed to load school bus data');
      } finally {
        setLoading(false);
      }
    };
    
    if (busId) {
      fetchData();
    }
  }, [busId]);

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error || !schoolBus) {
    return (
      <Container>
        <Alert variant="danger">{error || 'School bus not found'}</Alert>
        <Button variant="secondary" onClick={() => navigate('/school/buses')} className="mt-4">
          Back to List
        </Button>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">School Bus Details</h1>
          <div className="flex space-x-2">
            <Button variant="primary" onClick={() => navigate(`/school/buses/edit/${busId}`)}>
              Edit
            </Button>
            <Button variant="secondary" onClick={() => navigate('/school/buses')}>
              Back to List
            </Button>
          </div>
        </div>

        <Card>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Institute</label>
              <p className="mt-1 text-gray-900">{schoolBus.institute.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Bus Name</label>
              <p className="mt-1 text-gray-900">{schoolBus.bus.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Vehicle Number</label>
              <p className="mt-1 text-gray-900">{schoolBus.bus.vehicleNo}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Created At</label>
              <p className="mt-1 text-gray-900">
                {new Date(schoolBus.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </Container>
  );
};

export default SchoolBusViewPage;


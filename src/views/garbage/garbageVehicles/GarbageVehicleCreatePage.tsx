import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Container from '../../../components/ui/layout/Container';
import Card from '../../../components/ui/cards/Card';
import Button from '../../../components/ui/buttons/Button';
import SingleSelect from '../../../components/ui/forms/SingleSelect';
import Spinner from '../../../components/ui/common/Spinner';
import Alert from '../../../components/ui/common/Alert';
import { showSuccess, showError } from '../../../utils/sweetAlert';
import { garbageService } from '../../../api/services/garbageService';
import type { GarbageVehicleFormData } from '../../../types/garbage';

type GarbageVehicleOption = {
  id: number;
  imei: string;
  name: string;
  vehicleNo: string;
  vehicleType: string;
  is_active: boolean;
};

const GarbageVehicleCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { id: instituteId } = useParams<{ id: string }>();
  
  const [formData, setFormData] = useState<GarbageVehicleFormData>({
    institute: instituteId ? parseInt(instituteId) : 0,
    vehicle: 0
  });
  const [vehicles, setVehicles] = useState<GarbageVehicleOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const vehiclesRes = await garbageService.getGarbageVehicles();
        
        if (vehiclesRes.success && vehiclesRes.data) {
          setVehicles(vehiclesRes.data);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoadingData(false);
      }
    };
    
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicle || !instituteId) {
      setError('Please select a vehicle');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await garbageService.createGarbageVehicle({
        institute: parseInt(instituteId),
        vehicle: formData.vehicle
      });
      if (result.success) {
        showSuccess('Garbage vehicle created successfully');
        navigate(`/garbage/${instituteId}`);
      } else {
        showError(result.error || 'Failed to create garbage vehicle');
      }
    } catch (err: any) {
      console.error('Error creating garbage vehicle:', err);
      setError(err.response?.data?.message || 'Failed to create garbage vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Container>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Add Garbage Vehicle</h1>
        <Card>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && <Alert variant="danger">{error}</Alert>}
            
            <div>
              <SingleSelect
                options={(vehicles || []).map(vehicle => ({
                  id: vehicle.id,
                  label: `${vehicle.vehicleNo} - ${vehicle.name}`,
                  value: vehicle.id
                }))}
                value={formData.vehicle || null}
                onChange={(value) => setFormData({ ...formData, vehicle: value as number })}
                placeholder="Select a vehicle"
                label="Vehicle *"
                searchable
              />
              {(vehicles || []).length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No vehicles available. Contact an administrator.
                </p>
              )}
            </div>

            <div className="flex space-x-4 pt-4">
              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? <Spinner size="sm" /> : 'Create'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate(`/garbage/${instituteId}`)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Container>
  );
};

export default GarbageVehicleCreatePage;


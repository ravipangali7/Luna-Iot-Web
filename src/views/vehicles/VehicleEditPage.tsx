import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { vehicleService } from '../../api/services/vehicleService';
import type { Vehicle, VehicleFormData } from '../../types/vehicle';
import { VEHICLE_TYPES } from '../../types/vehicle';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardHeader from '../../components/ui/cards/CardHeader';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Select from '../../components/ui/forms/Select';
import Alert from '../../components/ui/common/Alert';
import Spinner from '../../components/ui/common/Spinner';

const VehicleEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { imei } = useParams<{ imei: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [formData, setFormData] = useState<VehicleFormData>({
    imei: '',
    name: '',
    vehicleNo: '',
    vehicleType: '',
    odometer: 0,
    mileage: 0,
    speedLimit: 60,
    minimumFuel: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (imei) {
      loadVehicle();
    }
  }, [imei]);

  const loadVehicle = async () => {
    if (!imei) return;

    try {
      setLoading(true);
      setError(null);
      const result = await vehicleService.getVehicleByImei(imei);
      
      if (result.success && result.data) {
        setVehicle(result.data);
        setFormData({
          imei: result.data.imei,
          name: result.data.name,
          vehicleNo: result.data.vehicleNo,
          vehicleType: result.data.vehicleType,
          odometer: result.data.odometer,
          mileage: result.data.mileage,
          speedLimit: result.data.speedLimit,
          minimumFuel: result.data.minimumFuel
        });
      } else {
        setError(result.error || 'Failed to load vehicle');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Note: IMEI validation removed since it's read-only in edit mode

    // Vehicle name validation
    if (!formData.name) {
      newErrors.name = 'Vehicle name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Vehicle name must be at least 3 characters';
    }

    // Vehicle number validation
    if (!formData.vehicleNo) {
      newErrors.vehicleNo = 'Vehicle number is required';
    } else if (formData.vehicleNo.length < 3) {
      newErrors.vehicleNo = 'Vehicle number must be at least 3 characters';
    }

    // Vehicle type validation
    if (!formData.vehicleType) {
      newErrors.vehicleType = 'Vehicle type is required';
    }

    // Speed limit validation
    if (!formData.speedLimit || formData.speedLimit < 1 || formData.speedLimit > 200) {
      newErrors.speedLimit = 'Speed limit must be between 1 and 200 km/h';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof VehicleFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    formData.imei = imei ?? '';
    
    if (!imei || !validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const result = await vehicleService.updateVehicle(imei, formData);
      
      if (result.success) {
        navigate('/vehicles');
      } else {
        setError(result.error || 'Failed to update vehicle');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/vehicles');
  };

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (!vehicle) {
    return (
      <Container>
        <Alert variant="danger">
          Vehicle not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Vehicle</h1>
          <p className="text-gray-600">Update vehicle information</p>
        </div>

        {error && (
          <Alert variant="danger" className="mb-6">
            {error}
          </Alert>
        )}

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Vehicle Information</h3>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IMEI <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter 15-digit IMEI"
                    value={formData.imei}
                    onChange={(value) => handleInputChange('imei', value)}
                    error={errors.imei}
                    required
                    disabled={true}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    IMEI cannot be changed after vehicle creation. This field is read-only.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter vehicle name"
                    value={formData.name}
                    onChange={(value) => handleInputChange('name', value)}
                    error={errors.name}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a descriptive name for the vehicle.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter vehicle registration number"
                    value={formData.vehicleNo}
                    onChange={(value) => handleInputChange('vehicleNo', value)}
                    error={errors.vehicleNo}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the official registration number of the vehicle.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vehicle Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.vehicleType}
                    onChange={(value) => handleInputChange('vehicleType', value)}
                    error={errors.vehicleType}
                    required
                    options={[
                      { value: '', label: 'Select vehicle type' },
                      ...VEHICLE_TYPES.map(type => ({ value: type, label: type }))
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Odometer (km)
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter current odometer reading"
                    value={formData.odometer.toString()}
                    onChange={(value) => handleInputChange('odometer', parseFloat(value) || 0)}
                    error={errors.odometer?.toString()}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current odometer reading in kilometers.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mileage (km/l)
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter vehicle mileage"
                    value={formData.mileage.toString()}
                    onChange={(value) => handleInputChange('mileage', parseFloat(value) || 0)}
                    error={errors.mileage?.toString()}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Vehicle mileage in kilometers per liter.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Fuel Level (%)
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter minimum fuel level"
                    value={formData.minimumFuel.toString()}
                    onChange={(value) => handleInputChange('minimumFuel', parseFloat(value) || 0)}
                    error={errors.minimumFuel?.toString()}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum fuel level percentage for alerts.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Speed Limit (km/h) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter speed limit"
                    value={formData.speedLimit.toString()}
                    onChange={(value) => handleInputChange('speedLimit', parseInt(value) || 0)}
                    error={errors.speedLimit?.toString()}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Set the maximum speed limit for this vehicle (1-200 km/h).
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={saving}
                  disabled={saving}
                >
                  {saving ? 'Updating...' : 'Update Vehicle'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default VehicleEditPage;

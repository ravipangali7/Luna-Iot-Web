import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { deviceService } from '../../api/services/deviceService';
import type { Device, DeviceFormData } from '../../types/device';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardHeader from '../../components/ui/cards/CardHeader';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Select from '../../components/ui/forms/Select';
import Alert from '../../components/ui/common/Alert';
import Spinner from '../../components/ui/common/Spinner';

const DeviceEditPage: React.FC = () => {
  const navigate = useNavigate();
  const { imei } = useParams<{ imei: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [device, setDevice] = useState<Device | null>(null);
  const [formData, setFormData] = useState<DeviceFormData>({
    imei: '',
    phone: '',
    sim: '',
    protocol: '',
    iccid: '',
    model: ''
  });
  const [errors, setErrors] = useState<Partial<DeviceFormData>>({});

  useEffect(() => {
    if (imei) {
      loadDevice();
    }
  }, [imei]);

  const loadDevice = async () => {
    if (!imei) return;

    try {
      setLoading(true);
      setError(null);
      const result = await deviceService.getDeviceByImei(imei);
      
      if (result.success && result.data) {
        setDevice(result.data);
        setFormData({
          imei: result.data.imei,
          phone: result.data.phone,
          sim: result.data.sim,
          protocol: result.data.protocol,
          iccid: result.data.iccid || '',
          model: result.data.model
        });
      } else {
        setError(result.error || 'Failed to load device');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<DeviceFormData> = {};

    // IMEI validation (15 digits)
    if (!formData.imei) {
      newErrors.imei = 'IMEI is required';
    } else if (!/^\d{15}$/.test(formData.imei)) {
      newErrors.imei = 'IMEI must be exactly 15 digits';
    }

    // Phone validation (10 digits starting with 9)
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^9\d{9}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits starting with 9';
    }

    // SIM validation
    if (!formData.sim) {
      newErrors.sim = 'SIM provider is required';
    }

    // Protocol validation
    if (!formData.protocol) {
      newErrors.protocol = 'Protocol is required';
    }

    // Model validation
    if (!formData.model) {
      newErrors.model = 'Model is required';
    }

    // ICCID validation (optional, but if provided must be 19-20 digits)
    if (formData.iccid && !/^\d{19,20}$/.test(formData.iccid)) {
      newErrors.iccid = 'ICCID must be 19-20 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof DeviceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imei || !validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const result = await deviceService.updateDevice(imei, formData);
      
      if (result.success) {
        navigate('/devices');
      } else {
        setError(result.error || 'Failed to update device');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/devices');
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

  if (!device) {
    return (
      <Container>
        <Alert variant="danger">
          Device not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Device</h1>
          <p className="text-gray-600">Update device information</p>
        </div>

        {error && (
          <Alert variant="danger" className="mb-6">
            {error}
          </Alert>
        )}

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Device Information</h3>
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    placeholder="Enter 10-digit phone number"
                    value={formData.phone}
                    onChange={(value) => handleInputChange('phone', value)}
                    error={errors.phone}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SIM Provider <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.sim}
                    onChange={(value) => handleInputChange('sim', value)}
                    error={errors.sim}
                    required
                    options={[
                      { value: '', label: 'Select SIM provider' },
                      { value: 'NTC', label: 'NTC' },
                      { value: 'Ncell', label: 'Ncell' },
                      { value: 'SmartCell', label: 'SmartCell' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Protocol <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.protocol}
                    onChange={(value) => handleInputChange('protocol', value)}
                    error={errors.protocol}
                    required
                    options={[
                      { value: '', label: 'Select protocol' },
                      { value: 'GT06', label: 'GT06' },
                      { value: 'GT06N', label: 'GT06N' },
                      { value: 'GT06E', label: 'GT06E' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.model}
                    onChange={(value) => handleInputChange('model', value)}
                    error={errors.model}
                    required
                    options={[
                      { value: '', label: 'Select model' },
                      { value: 'EC08', label: 'EC08' },
                      { value: 'TK103B', label: 'TK103B' },
                      { value: 'TK103C', label: 'TK103C' }
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ICCID
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter ICCID (19-20 digits, optional)"
                    value={formData.iccid}
                    onChange={(value) => handleInputChange('iccid', value)}
                    error={errors.iccid}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ICCID is optional. If provided, it must be 19-20 digits.
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
                  {saving ? 'Updating...' : 'Update Device'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default DeviceEditPage;

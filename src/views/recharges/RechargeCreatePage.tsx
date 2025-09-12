import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { rechargeService } from '../../api/services/rechargeService';
import { deviceService } from '../../api/services/deviceService';
import type { RechargeFormData } from '../../types/recharge';
import type { Device } from '../../types/device';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardHeader from '../../components/ui/cards/CardHeader';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Select from '../../components/ui/forms/Select';
import Alert from '../../components/ui/common/Alert';
import Spinner from '../../components/ui/common/Spinner';
import RoleBasedWidget from '../../components/role-based/RoleBasedWidget';
import { ROLES } from '../../utils/roleUtils';

const RechargeCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [formData, setFormData] = useState<RechargeFormData>({
    deviceId: 0,
    amount: 0
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [topupResult, setTopupResult] = useState<any>(null);

  useEffect(() => {
    loadDevices();
  }, []);

  // Handle URL parameters for pre-selecting device
  useEffect(() => {
    const deviceId = searchParams.get('deviceId');
    const imei = searchParams.get('imei');
    
    if (deviceId && devices.length > 0) {
      const deviceIdNum = parseInt(deviceId);
      const device = devices.find(d => d.id === deviceIdNum);
      if (device) {
        setFormData(prev => ({ ...prev, deviceId: deviceIdNum }));
      }
    } else if (imei && devices.length > 0) {
      const device = devices.find(d => d.imei === imei);
      if (device) {
        setFormData(prev => ({ ...prev, deviceId: device.id }));
      }
    }
  }, [searchParams, devices]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const result = await deviceService.getAllDevices();
      
      if (result.success && result.data) {
        setDevices(result.data);
      } else {
        setError(result.error || 'Failed to load devices');
      }
    } catch (err) {
      console.error('Error loading devices:', err);
      setError('Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.deviceId || formData.deviceId === 0) {
      errors.deviceId = 'Please select a device';
    }

    if (!formData.amount || formData.amount <= 0) {
      errors.amount = 'Amount must be greater than 0';
    }

    if (formData.amount && formData.amount > 10000) {
      errors.amount = 'Amount cannot exceed Rs 10,000';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setTopupResult(null);

      const result = await rechargeService.createRecharge(formData);
      
      if (result.success) {
        setSuccess('Recharge and top-up completed successfully!');
        setTopupResult((result.data as any)?.topupResult);
        setTimeout(() => {
          navigate('/recharges');
        }, 2000);
      } else {
        setError(result.error || 'Failed to create recharge');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof RechargeFormData, value: any) => {
    setFormData(prev => {
      const newFormData = {
        ...prev,
        [field]: value
      };
      
      // Reset amount when device changes to ensure valid amount selection
      if (field === 'deviceId') {
        newFormData.amount = 0;
      }
      
      return newFormData;
    });
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Get recharge amount options based on SIM type
  const getRechargeAmountOptions = () => {
    const selectedDevice = devices.find(d => d.id === formData.deviceId);
    const isNTC = selectedDevice?.sim?.toLowerCase().includes('ntc');
    
    if (isNTC) {
      return [
        { value: '', label: 'Select amount...' },
        { value: '20', label: 'Rs 20' },
        { value: '30', label: 'Rs 30' },
        { value: '40', label: 'Rs 40' },
        { value: '50', label: 'Rs 50' },
        { value: '80', label: 'Rs 80' },
        { value: '100', label: 'Rs 100' },
        { value: '150', label: 'Rs 150' },
        { value: '200', label: 'Rs 200' },
        { value: '250', label: 'Rs 250' },
        { value: '300', label: 'Rs 300' },
        { value: '400', label: 'Rs 400' },
        { value: '500', label: 'Rs 500' },
        { value: '800', label: 'Rs 800' },
        { value: '1000', label: 'Rs 1,000' }
      ];
    } else {
      // Default Ncell options
      return [
        { value: '', label: 'Select amount...' },
        { value: '50', label: 'Rs 50' },
        { value: '80', label: 'Rs 80' },
        { value: '100', label: 'Rs 100' },
        { value: '150', label: 'Rs 150' },
        { value: '200', label: 'Rs 200' },
        { value: '250', label: 'Rs 250' },
        { value: '300', label: 'Rs 300' },
        { value: '400', label: 'Rs 400' },
        { value: '500', label: 'Rs 500' },
        { value: '800', label: 'Rs 800' },
        { value: '1000', label: 'Rs 1,000' }
      ];
    }
  };

  const handleCancel = () => {
    navigate('/recharges');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-NP', {
      style: 'currency',
      currency: 'NPR'
    }).format(amount);
  };

  return (
    <Container>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Recharge</h1>
            <p className="text-gray-600">Add a new recharge for a device</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onDismiss={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert variant="success" dismissible onDismiss={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        {/* Top-up Result Details */}
        {topupResult && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Top-up Details</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        topupResult.success 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {topupResult.success ? 'Success' : 'Failed'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">SIM Type:</span>
                    <p className="mt-1 text-sm text-gray-900">{topupResult.simType}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Reference ID:</span>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{topupResult.reference}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Transaction ID:</span>
                    <p className="mt-1 text-sm text-gray-900">{topupResult.transactionId || 'N/A'}</p>
                  </div>
                </div>
                
                {topupResult.success && (
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Credits Consumed:</span>
                      <p className="mt-1 text-sm text-gray-900">{topupResult.creditsConsumed}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Credits Available:</span>
                      <p className="mt-1 text-sm text-gray-900">{topupResult.creditsAvailable}</p>
                    </div>
                  </div>
                )}
                
                <div className="pt-3 border-t">
                  <span className="text-sm font-medium text-gray-500">Message:</span>
                  <p className="mt-1 text-sm text-gray-900">{topupResult.message}</p>
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Form */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Recharge Details</h3>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Device *
                </label>
                <Select
                  value={formData.deviceId.toString()}
                  onChange={(value) => handleInputChange('deviceId', value ? parseInt(value) : 0)}
                  options={[
                    { value: '0', label: 'Select a device...' },
                    ...devices.map(device => ({ 
                      value: device.id.toString(), 
                      label: `${device.imei} - ${device.phone} (${device.model})` 
                    }))
                  ]}
                />
                {validationErrors.deviceId && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.deviceId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <Select
                  value={formData.amount ? formData.amount.toString() : ''}
                  onChange={(value) => handleInputChange('amount', value ? parseFloat(value) : 0)}
                  options={getRechargeAmountOptions()}
                />
                {validationErrors.amount && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.amount}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  {formData.deviceId > 0 ? (
                    devices.find(d => d.id === formData.deviceId)?.sim?.toLowerCase().includes('ntc') 
                      ? 'NTC SIM: Select from Rs 20, Rs 30, Rs 40, or higher amounts'
                      : 'Ncell SIM: Select from Rs 50 or higher amounts'
                  ) : (
                    'Select from predefined recharge amounts based on SIM type'
                  )}
                </p>
              </div>

              {/* Preview */}
              {formData.deviceId > 0 && formData.amount > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Preview</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Device:</span>
                      <span className="font-medium">
                        {devices.find(d => d.id === formData.deviceId)?.imei} 
                        ({devices.find(d => d.id === formData.deviceId)?.phone})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium text-green-600">
                        {formatAmount(formData.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
                  <Button
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <Spinner size="sm" className="mr-2" />
                        Creating...
                      </div>
                    ) : (
                      'Create Recharge'
                    )}
                  </Button>
                </RoleBasedWidget>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default RechargeCreatePage;

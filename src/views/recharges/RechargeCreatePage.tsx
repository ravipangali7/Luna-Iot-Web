import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { rechargeService } from '../../api/services/rechargeService';
import type { RechargeFormData } from '../../types/recharge';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardHeader from '../../components/ui/cards/CardHeader';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Select from '../../components/ui/forms/Select';
import Alert from '../../components/ui/common/Alert';
import Spinner from '../../components/ui/common/Spinner';
import RoleBasedWidget from '../../components/role-based/RoleBasedWidget';
import { ROLES } from '../../utils/roleUtils';

const RechargeCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [devices, setDevices] = useState<{ id: number; imei: string; phone: string }[]>([]);
  const [formData, setFormData] = useState<RechargeFormData>({
    deviceId: 0,
    amount: 0
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      // This would typically come from a device service
      // For now, we'll use a mock list or you can implement device loading
      const mockDevices = [
        { id: 1, imei: '123456789012345', phone: '+1234567890' },
        { id: 2, imei: '123456789012346', phone: '+1234567891' },
        { id: 3, imei: '123456789012347', phone: '+1234567892' },
      ];
      setDevices(mockDevices);
    } catch (err) {
      console.error('Error loading devices:', err);
      setError('Failed to load devices');
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
      errors.amount = 'Amount cannot exceed $10,000';
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

      const result = await rechargeService.createRecharge(formData);
      
      if (result.success) {
        setSuccess('Recharge created successfully!');
        setTimeout(() => {
          navigate('/recharges');
        }, 1500);
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
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleCancel = () => {
    navigate('/recharges');
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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
          <Button variant="outline" onClick={handleCancel}>
            Back to Recharges
          </Button>
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
                      label: `${device.imei} (${device.phone})` 
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
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max="10000"
                    placeholder="0.00"
                    value={formData.amount ? formData.amount.toString() : ''}
                    onChange={(value) => handleInputChange('amount', value ? parseFloat(value) : 0)}
                    className="pl-7"
                  />
                </div>
                {validationErrors.amount && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.amount}</p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Enter amount between $0.01 and $10,000
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

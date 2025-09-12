import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleAccessService } from '../../api/services/vehicleAccessService';
import type { VehicleAccessFormData, VehicleAccessPermissions } from '../../types/vehicleAccess';
import { VEHICLE_ACCESS_PERMISSIONS } from '../../types/vehicleAccess';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardHeader from '../../components/ui/cards/CardHeader';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Select from '../../components/ui/forms/Select';
import Checkbox from '../../components/ui/forms/Checkbox';
import Alert from '../../components/ui/common/Alert';
import Spinner from '../../components/ui/common/Spinner';

const VehicleAccessCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [vehicleSearchQuery, setVehicleSearchQuery] = useState('');
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [showVehicleSuggestions, setShowVehicleSuggestions] = useState(false);
  const userInputRef = useRef<HTMLDivElement>(null);
  const vehicleInputRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<VehicleAccessFormData>({
    userId: 0,
    vehicleId: 0,
    imei: '',
    permissions: {
      allAccess: false,
      liveTracking: false,
      history: false,
      report: false,
      vehicleProfile: false,
      events: false,
      geofencing: false,
      troubleshoot: false,
      vehicleEdit: false,
      shareTracking: false,
    }
  });

  useEffect(() => {
    loadUsersAndVehicles();
  }, []);

  const loadUsersAndVehicles = async () => {
    try {
      setLoading(true);
      const [usersResult, vehiclesResult] = await Promise.all([
        vehicleAccessService.getAvailableUsers(),
        vehicleAccessService.getAvailableVehicles()
      ]);

      if (usersResult.success && usersResult.data) {
        setUsers(usersResult.data);
      }

      if (vehiclesResult.success && vehiclesResult.data) {
        setVehicles(vehiclesResult.data);
      }
    } catch (err) {
      setError('Failed to load users and vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof VehicleAccessFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: checked
      }
    }));
  };

  const handleVehicleChange = (vehicleId: string) => {
    const vehicle = vehicles.find(v => v.id === parseInt(vehicleId));
    setFormData(prev => ({
      ...prev,
      vehicleId: parseInt(vehicleId),
      imei: vehicle?.imei || ''
    }));
  };

  const handleAllAccessChange = (checked: boolean) => {
    const newPermissions: VehicleAccessPermissions = {
      allAccess: checked,
      liveTracking: checked,
      history: checked,
      report: checked,
      vehicleProfile: checked,
      events: checked,
      geofencing: checked,
      troubleshoot: checked,
      vehicleEdit: checked,
      shareTracking: checked,
    };

    setFormData(prev => ({
      ...prev,
      permissions: newPermissions
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.userId === 0 || formData.vehicleId === 0) {
      setError('Please select both user and vehicle');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await vehicleAccessService.createVehicleAccess(formData);

      if (result.success) {
        navigate('/vehicle-access');
      } else {
        setError(result.error || 'Failed to create vehicle access');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const selectedUser = users.find(u => u.id === formData.userId);
  const selectedVehicle = vehicles.find(v => v.id === formData.vehicleId);

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.phone?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.name?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  // Filter vehicles based on search query
  const filteredVehicles = vehicles.filter(vehicle => 
    vehicle.vehicleNo?.toLowerCase().includes(vehicleSearchQuery.toLowerCase()) ||
    vehicle.name?.toLowerCase().includes(vehicleSearchQuery.toLowerCase())
  );

  if (loading && users.length === 0) {
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Vehicle Access</h1>
            <p className="text-gray-600">Grant access permissions to users for specific vehicles</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* User Selection */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Select User</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative" ref={userInputRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search User
                  </label>
                  <Input
                    placeholder="Search by name or phone number"
                    value={userSearchQuery}
                    onChange={(value) => {
                      setUserSearchQuery(value);
                      setShowUserSuggestions(value.length > 0);
                      // Auto-select if exact match found
                      const user = users.find(u => u.phone === value || u.name === value);
                      if (user) {
                        handleInputChange('userId', user.id);
                        setShowUserSuggestions(false);
                      } else {
                        handleInputChange('userId', 0);
                      }
                    }}
                    onFocus={() => setShowUserSuggestions(userSearchQuery.length > 0)}
                    onBlur={() => setTimeout(() => setShowUserSuggestions(false), 200)}
                  />
                </div>
                
                {/* User Suggestions Dropdown - Fixed Position */}
                {showUserSuggestions && filteredUsers.length > 0 && userInputRef.current && (
                  <div 
                    className="fixed bg-white border border-gray-300 rounded-md shadow-xl max-h-60 overflow-auto z-[9999]"
                    style={{
                      top: userInputRef.current.getBoundingClientRect().bottom + window.scrollY + 4,
                      left: userInputRef.current.getBoundingClientRect().left + window.scrollX,
                      width: userInputRef.current.getBoundingClientRect().width
                    }}
                  >
                    {filteredUsers.map(user => (
                      <div
                        key={user.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => {
                          setUserSearchQuery(user.phone || user.name);
                          handleInputChange('userId', user.id);
                          setShowUserSuggestions(false);
                        }}
                      >
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-600">{user.phone}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select User
                  </label>
                  <Select
                    value={formData.userId.toString()}
                    onChange={(value) => {
                      const userId = parseInt(value);
                      handleInputChange('userId', userId);
                      if (userId > 0) {
                        const user = users.find(u => u.id === userId);
                        setUserSearchQuery(user?.phone || '');
                      } else {
                        setUserSearchQuery('');
                      }
                    }}
                    options={[
                      { value: '0', label: 'Select a user' },
                      ...users.map(user => ({
                        value: user.id.toString(),
                        label: `${user.name} (${user.phone})`
                      }))
                    ]}
                  />
                </div>
              </div>

              {selectedUser && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">Selected User</h4>
                  <div className="mt-2 space-y-1">
                    <p><span className="font-medium">Name:</span> {selectedUser.name}</p>
                    <p><span className="font-medium">Phone:</span> {selectedUser.phone}</p>
                    <p><span className="font-medium">Email:</span> {selectedUser.email || 'N/A'}</p>
                    <p><span className="font-medium">Role:</span> {selectedUser.role?.name || 'N/A'}</p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Vehicle Selection */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Select Vehicle</h3>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative" ref={vehicleInputRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Vehicle
                  </label>
                  <Input
                    placeholder="Search by vehicle number or name"
                    value={vehicleSearchQuery}
                    onChange={(value) => {
                      setVehicleSearchQuery(value);
                      setShowVehicleSuggestions(value.length > 0);
                      // Auto-select if exact match found
                      const vehicle = vehicles.find(v => v.vehicleNo === value || v.name === value);
                      if (vehicle) {
                        handleVehicleChange(vehicle.id.toString());
                        setShowVehicleSuggestions(false);
                      } else {
                        handleInputChange('vehicleId', 0);
                        handleInputChange('imei', '');
                      }
                    }}
                    onFocus={() => setShowVehicleSuggestions(vehicleSearchQuery.length > 0)}
                    onBlur={() => setTimeout(() => setShowVehicleSuggestions(false), 200)}
                  />
                </div>
                
                {/* Vehicle Suggestions Dropdown - Fixed Position */}
                {showVehicleSuggestions && filteredVehicles.length > 0 && vehicleInputRef.current && (
                  <div 
                    className="fixed bg-white border border-gray-300 rounded-md shadow-xl max-h-60 overflow-auto z-[9999]"
                    style={{
                      top: vehicleInputRef.current.getBoundingClientRect().bottom + window.scrollY + 4,
                      left: vehicleInputRef.current.getBoundingClientRect().left + window.scrollX,
                      width: vehicleInputRef.current.getBoundingClientRect().width
                    }}
                  >
                    {filteredVehicles.map(vehicle => (
                      <div
                        key={vehicle.id}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => {
                          setVehicleSearchQuery(vehicle.vehicleNo || vehicle.name);
                          handleVehicleChange(vehicle.id.toString());
                          setShowVehicleSuggestions(false);
                        }}
                      >
                        <div className="font-medium">{vehicle.vehicleNo} - {vehicle.name}</div>
                        <div className="text-sm text-gray-600">{vehicle.vehicleType} | IMEI: {vehicle.imei}</div>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Vehicle
                  </label>
                  <Select
                    value={formData.vehicleId.toString()}
                    onChange={(value) => {
                      const vehicleId = parseInt(value);
                      handleVehicleChange(value);
                      if (vehicleId > 0) {
                        const vehicle = vehicles.find(v => v.id === vehicleId);
                        setVehicleSearchQuery(vehicle?.vehicleNo || '');
                      } else {
                        setVehicleSearchQuery('');
                      }
                    }}
                    options={[
                      { value: '0', label: 'Select a vehicle' },
                      ...vehicles.map(vehicle => ({
                        value: vehicle.id.toString(),
                        label: `${vehicle.vehicleNo} (${vehicle.name}) [${vehicle.vehicleType}]`
                      }))
                    ]}
                  />
                </div>
              </div>

              {selectedVehicle && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">Selected Vehicle</h4>
                  <div className="mt-2 space-y-1">
                    <p><span className="font-medium">Vehicle No:</span> {selectedVehicle.vehicleNo}</p>
                    <p><span className="font-medium">Name:</span> {selectedVehicle.name}</p>
                    <p><span className="font-medium">Type:</span> {selectedVehicle.vehicleType}</p>
                    <p><span className="font-medium">IMEI:</span> {selectedVehicle.imei}</p>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Access Permissions</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="flex items-center">
                  <Checkbox
                    checked={formData.permissions.allAccess}
                    onChange={handleAllAccessChange}
                    className="text-lg font-medium"
                  >
                    All Access
                  </Checkbox>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {VEHICLE_ACCESS_PERMISSIONS.filter(p => p.key !== 'allAccess').map(permission => (
                    <div key={permission.key} className="flex items-center">
                      <Checkbox
                        checked={formData.permissions[permission.key as keyof VehicleAccessPermissions]}
                        onChange={(checked) => handlePermissionChange(permission.key, checked)}
                        disabled={formData.permissions.allAccess}
                      >
                        {permission.label}
                      </Checkbox>
                    </div>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/vehicle-access')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={loading}
            >
              Create Vehicle Access
            </Button>
          </div>
        </form>
      </div>
    </Container>
  );
};

export default VehicleAccessCreatePage;

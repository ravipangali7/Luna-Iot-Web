import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { vehicleAccessService } from '../../api/services/vehicleAccessService';
import { confirmDelete, showSuccess, showError } from '../../utils/sweetAlert';
import type { VehicleAccessFormData, VehicleAccessPermissions } from '../../types/vehicleAccess';
import { VEHICLE_ACCESS_PERMISSIONS } from '../../types/vehicleAccess';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Input from '../../components/ui/forms/Input';
import Select from '../../components/ui/forms/Select';
import Checkbox from '../../components/ui/forms/Checkbox';
import Alert from '../../components/ui/common/Alert';
import Spinner from '../../components/ui/common/Spinner';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import TableHeader from '../../components/ui/tables/TableHeader';
import Badge from '../../components/ui/common/Badge';

const VehicleAccessManagePage: React.FC = () => {
  const navigate = useNavigate();
  const { imei } = useParams<{ imei: string }>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [formData, setFormData] = useState<VehicleAccessFormData>({
    userId: 0,
    vehicleId: 0,
    imei: imei || '',
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
  const userInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (imei) {
      loadData();
    }
  }, [imei]);

  const loadData = async () => {
    try {
      setInitialLoading(true);
      setError(null);

      const [vehiclesResult, usersResult] = await Promise.all([
        vehicleAccessService.getAllVehiclesWithAccess(),
        vehicleAccessService.getAvailableUsers()
      ]);

      if (vehiclesResult.success && vehiclesResult.data) {
        const foundVehicle = vehiclesResult.data.find(v => v.imei === imei);
        if (foundVehicle) {
          setVehicle(foundVehicle);
        } else {
          setError('Vehicle not found');
        }
      }

      if (usersResult.success && usersResult.data) {
        setUsers(usersResult.data);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setInitialLoading(false);
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
    
    if (formData.userId === 0) {
      setError('Please select a user');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get the selected user's phone number
      const selectedUser = users.find(u => u.id === formData.userId);
      if (!selectedUser) {
        setError('Selected user not found');
        return;
      }

      const result = await vehicleAccessService.createVehicleAccess(formData, selectedUser.phone);

      if (result.success) {
        // Reload data to show updated access
        await loadData();
        // Reset form
        setFormData(prev => ({
          ...prev,
          userId: 0,
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
        }));
        setUserSearchQuery('');
      } else {
        setError(result.error || 'Failed to assign vehicle access');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccess = async (userVehicle: any) => {
    const confirmed = await confirmDelete(
      'Remove Vehicle Access',
      `Are you sure you want to remove ${userVehicle.user?.name || 'this user'}'s access to this vehicle?`
    );
    
    if (confirmed) {
      try {
        // Try with userId first, fallback to userPhone if userId is not available
        const userId = userVehicle.user?.id || userVehicle.userId;
        const userPhone = userVehicle.user?.phone;
        
        if (!userId && !userPhone) {
          showError('Error', 'User ID or phone number is required for deletion');
          return;
        }
        
        // Use userId if available, otherwise use userPhone
        const result = userId 
          ? await vehicleAccessService.deleteVehicleAccessById(imei!, userId)
          : await vehicleAccessService.deleteVehicleAccess(imei!, userPhone);
          
        if (result.success) {
          showSuccess('Access Removed', 'User access has been successfully removed from the vehicle.');
          await loadData(); // Reload the list
        } else {
          showError('Failed to Remove Access', result.error || 'Failed to remove vehicle access');
        }
      } catch (err) {
        showError('Error', 'An unexpected error occurred while removing access');
      }
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.phone?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.name?.toLowerCase().includes(userSearchQuery.toLowerCase())
  );

  if (initialLoading) {
    return (
      <Container>
        <div className="flex justify-center items-center h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error && error.includes('Vehicle not found')) {
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Vehicle Access</h1>
            <p className="text-gray-600">
              {vehicle ? `${vehicle.vehicleNo} - ${vehicle.name}` : 'Loading...'}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/vehicle-access')}
          >
            Back to Vehicle Access
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger">
            {error}
          </Alert>
        )}

        {/* Current Access */}
        {vehicle && (
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold mb-4">Current Access</h3>
              {vehicle.userVehicles && vehicle.userVehicles.length > 0 ? (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>User</TableHeader>
                      <TableHeader>Phone</TableHeader>
                      <TableHeader>Permissions</TableHeader>
                      <TableHeader>Actions</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vehicle.userVehicles.map((userVehicle: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{userVehicle.user?.name || 'Unknown User'}</div>
                            {userVehicle.isMainUser && (
                              <Badge variant="primary" size="sm">Main User</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{userVehicle.user?.phone || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {userVehicle.allAccess ? (
                              <Badge variant="success">All Access</Badge>
                            ) : (
                              <>
                                {userVehicle.liveTracking && <Badge variant="info">Live Tracking</Badge>}
                                {userVehicle.history && <Badge variant="info">History</Badge>}
                                {userVehicle.report && <Badge variant="info">Report</Badge>}
                                {userVehicle.vehicleProfile && <Badge variant="info">Vehicle Profile</Badge>}
                                {userVehicle.events && <Badge variant="info">Events</Badge>}
                                {userVehicle.geofencing && <Badge variant="info">Geofencing</Badge>}
                                {userVehicle.troubleshoot && <Badge variant="info">Troubleshoot</Badge>}
                                {userVehicle.vehicleEdit && <Badge variant="info">Vehicle Edit</Badge>}
                                {userVehicle.shareTracking && <Badge variant="info">Share Tracking</Badge>}
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteAccess(userVehicle)}
                            icon={
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            }
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No users have access to this vehicle yet.
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Add New Access */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold mb-4">Add New Access</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Selection */}
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
                    onBlur={() => {
                      // Use a small delay to allow click events to register
                      setTimeout(() => {
                        // Check if the active element is within the suggestion dropdown
                        const activeElement = document.activeElement;
                        if (!activeElement || !activeElement.closest('[data-suggestion-dropdown]')) {
                          setShowUserSuggestions(false);
                        }
                      }, 200);
                    }}
                  />
                  
                  {/* User Suggestions Dropdown - Fixed Position */}
                  {showUserSuggestions && filteredUsers.length > 0 && userInputRef.current && (
                    <div 
                      className="fixed bg-white border border-gray-300 rounded-md shadow-xl max-h-60 overflow-auto z-[9999]"
                      data-suggestion-dropdown
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
                          onMouseDown={(e) => {
                            e.preventDefault(); // Prevent input blur
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
                </div>
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

              {/* Selected User Info */}
              {formData.userId > 0 && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Selected User</h4>
                  {(() => {
                    const selectedUser = users.find(u => u.id === formData.userId);
                    return selectedUser ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Name:</span> {selectedUser.name}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {selectedUser.phone}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {selectedUser.email || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Role:</span> {selectedUser.role?.name || 'N/A'}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Permissions */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Access Permissions</h4>
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
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || formData.userId === 0}
                >
                  {loading ? 'Assigning Access...' : 'Assign Access'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default VehicleAccessManagePage;

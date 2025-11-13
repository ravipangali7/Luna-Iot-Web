import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { vehicleAccessService } from '../../api/services/vehicleAccessService';
import { confirmDelete, showSuccess, showError } from '../../utils/sweetAlert';
import type { VehicleAccessFormData, VehicleAccessPermissions } from '../../types/vehicleAccess';
import { VEHICLE_ACCESS_PERMISSIONS } from '../../types/vehicleAccess';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import Button from '../../components/ui/buttons/Button';
import Checkbox from '../../components/ui/forms/Checkbox';
import SingleSelect from '../../components/ui/forms/SingleSelect';
import Alert from '../../components/ui/common/Alert';
import Spinner from '../../components/ui/common/Spinner';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import TableHeader from '../../components/ui/tables/TableHeader';
import Badge from '../../components/ui/common/Badge';
import RoleBasedWidget from '../../components/role-based/RoleBasedWidget';
import { ROLES } from '../../utils/roleUtils';

const VehicleAccessManagePage: React.FC = () => {
  const navigate = useNavigate();
  const { imei } = useParams<{ imei: string }>();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<VehicleAccessPermissions | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [vehicle, setVehicle] = useState<any>(null);
  const [users, setUsers] = useState<{ id: number; name: string; phone: string; email?: string; role?: string }[]>([]);
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
      relay: false,
    }
  });

  const loadData = useCallback(async () => {
    try {
      setInitialLoading(true);
      setError(null);

      const [vehiclesResult, usersResult] = await Promise.all([
        vehicleAccessService.getVehicleAccessAssignmentsLight(imei || ''),
        vehicleAccessService.getAvailableUsers()
      ]);

      if (vehiclesResult.success && vehiclesResult.data) {
        // Light API returns { vehicle, userVehicles } structure
        setVehicle({
          ...vehiclesResult.data.vehicle,
          userVehicles: vehiclesResult.data.userVehicles || []
        });
      }

      if (usersResult.success && usersResult.data) {
        setUsers(usersResult.data);
      }
    } catch {
      setError('Failed to load data');
    } finally {
      setInitialLoading(false);
    }
  }, [imei]);

  useEffect(() => {
    if (imei) {
      loadData();
    }
  }, [imei, loadData]);

  const handleInputChange = (field: keyof VehicleAccessFormData, value: string | number) => {
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
      relay: checked,
    };

    setFormData(prev => ({
      ...prev,
      permissions: newPermissions
    }));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditAccess = (userVehicle: any) => {
    setEditingUser(userVehicle);
    setEditFormData({
      allAccess: userVehicle.allAccess || false,
      liveTracking: userVehicle.liveTracking || false,
      history: userVehicle.history || false,
      report: userVehicle.report || false,
      vehicleProfile: userVehicle.vehicleProfile || false,
      events: userVehicle.events || false,
      geofencing: userVehicle.geofencing || false,
      troubleshoot: userVehicle.troubleshoot || false,
      vehicleEdit: userVehicle.vehicleEdit || false,
      shareTracking: userVehicle.shareTracking || false,
      relay: userVehicle.relay || false,
    });
  };

  const handleEditPermissionChange = (permission: string, checked: boolean) => {
    if (editFormData) {
      setEditFormData(prev => ({
        ...prev!,
        [permission]: checked
      }));
    }
  };

  const handleEditAllAccessChange = (checked: boolean) => {
    if (editFormData) {
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
        relay: checked,
      };

      setEditFormData(newPermissions);
    }
  };

  const handleUpdateAccess = async () => {
    if (!editingUser || !editFormData) return;

    try {
      setLoading(true);
      setError(null);

      const userId = editingUser.user?.id || editingUser.userId;
      const userPhone = editingUser.user?.phone;

      if (!userId && !userPhone) {
        setError('User ID or phone number is required for update');
        return;
      }

      const result = await vehicleAccessService.updateVehicleAccess(
        imei || '',
        userPhone || '',
        editFormData as unknown as Record<string, boolean>
      );

      if (result.success) {
        showSuccess('Access Updated', 'User access has been successfully updated.');
        await loadData();
        setEditingUser(null);
        setEditFormData(null);
      } else {
        setError(result.error || 'Failed to update vehicle access');
      }
    } catch {
      setError('An unexpected error occurred while updating access');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditFormData(null);
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
            relay: false,
          }
        }));
      } else {
        setError(result.error || 'Failed to assign vehicle access');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccess = async (userVehicle: { user?: { id?: number; phone?: string; name?: string }; userId?: number }) => {
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
          ? await vehicleAccessService.deleteVehicleAccessById(imei || '', userId)
          : await vehicleAccessService.deleteVehicleAccess(imei || '', userPhone || '');
          
        if (result.success) {
          showSuccess('Access Removed', 'User access has been successfully removed from the vehicle.');
          await loadData(); // Reload the list
        } else {
          showError('Failed to Remove Access', result.error || 'Failed to remove vehicle access');
        }
      } catch {
        showError('Error', 'An unexpected error occurred while removing access');
      }
    }
  };


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
                    {vehicle.userVehicles.map((userVehicle: { user?: { name?: string; phone?: string }; isMainUser?: boolean; allAccess?: boolean; liveTracking?: boolean; history?: boolean; report?: boolean; vehicleProfile?: boolean; events?: boolean; geofencing?: boolean; troubleshoot?: boolean; vehicleEdit?: boolean; shareTracking?: boolean; relay?: boolean }, index: number) => (
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
                          <div className="flex space-x-2">
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleEditAccess(userVehicle)}
                              icon={
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              }
                            >
                              Edit
                            </Button>
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
                          </div>
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

        {/* Edit Access */}
        {editingUser && editFormData && (
          <Card>
            <CardBody>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Edit Access - {editingUser.user?.name || 'Unknown User'}
                </h3>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  }
                >
                  Cancel
                </Button>
              </div>

              {/* Edit Permissions */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Access Permissions</h4>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Checkbox
                      checked={editFormData.allAccess}
                      onChange={handleEditAllAccessChange}
                      className="text-lg font-medium"
                    >
                      All Access
                    </Checkbox>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {VEHICLE_ACCESS_PERMISSIONS.filter(p => p.key !== 'allAccess').map(permission => (
                      <RoleBasedWidget 
                        key={permission.key} 
                        allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}
                      >
                        <div className="flex items-center">
                          <Checkbox
                            checked={editFormData[permission.key as keyof VehicleAccessPermissions]}
                            onChange={(checked) => handleEditPermissionChange(permission.key, checked)}
                            disabled={editFormData.allAccess}
                          >
                            {permission.label}
                          </Checkbox>
                        </div>
                      </RoleBasedWidget>
                    ))}
                  </div>
                </div>
              </div>

              {/* Update Button */}
              <div className="flex justify-end mt-6">
                <Button
                  variant="primary"
                  onClick={handleUpdateAccess}
                  disabled={loading}
                >
                  {loading ? 'Updating Access...' : 'Update Access'}
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Add New Access */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold mb-4">Add New Access</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* User Selection */}
              <div>
                <SingleSelect
                  options={users.map(user => ({
                    id: user.id,
                    label: `${user.name} (${user.phone})`,
                    value: user.id
                  }))}
                  value={formData.userId === 0 ? null : formData.userId}
                  onChange={(value) => {
                    const userId = value === null ? 0 : (typeof value === 'number' ? value : parseInt(value.toString()));
                    handleInputChange('userId', userId);
                    // Clear error when user is selected
                    if (error && error.includes('Please select a user')) {
                      setError(null);
                    }
                  }}
                  placeholder="Select a user..."
                  label="Select User *"
                  searchable
                  error={error && error.includes('Please select a user') ? error : undefined}
                />
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
                          <span className="font-medium">Role:</span> {selectedUser.role || 'N/A'}
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
                      <RoleBasedWidget 
                        key={permission.key} 
                        allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}
                      >
                        <div className="flex items-center">
                          <Checkbox
                            checked={formData.permissions[permission.key as keyof VehicleAccessPermissions]}
                            onChange={(checked) => handlePermissionChange(permission.key, checked)}
                            disabled={formData.permissions.allAccess}
                          >
                            {permission.label}
                          </Checkbox>
                        </div>
                      </RoleBasedWidget>
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

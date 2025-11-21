import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { userService } from '../../api/services/userService';
import { walletService } from '../../api/services/walletService';
import type { User } from '../../types/auth';
import type { Wallet } from '../../types/wallet';
import type { Vehicle } from '../../types/vehicle';
import Container from '../../components/ui/layout/Container';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import CardHeader from '../../components/ui/cards/CardHeader';
import Button from '../../components/ui/buttons/Button';
import Badge from '../../components/ui/common/Badge';
import Spinner from '../../components/ui/common/Spinner';
import Alert from '../../components/ui/common/Alert';
import Table from '../../components/ui/tables/Table';
import TableHead from '../../components/ui/tables/TableHead';
import TableHeader from '../../components/ui/tables/TableHeader';
import TableBody from '../../components/ui/tables/TableBody';
import TableRow from '../../components/ui/tables/TableRow';
import TableCell from '../../components/ui/tables/TableCell';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';

const UserShowPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserData = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      // Load user data
      const userResult = await userService.getUserByPhone(id);
      if (!userResult.success || !userResult.data) {
        setError('User not found');
        return;
      }

      const userData = userResult.data;
      setUser(userData);

      // Load wallet data
      const walletResult = await walletService.getWalletByUser(parseInt(id));
      if (walletResult.success && walletResult.data) {
        setWallet(walletResult.data);
      }

      // Load user's vehicles (if any)
      // Note: This would need a specific API endpoint for user vehicles
      // For now, we'll show a placeholder
      setVehicles([]);

    } catch (error) {
      setError('An unexpected error occurred: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleEditUser = () => {
    if (user) {
      navigate(`/users/${user.id}/edit`);
    }
  };

  const handleBack = () => {
    navigate('/users');
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

  const getRoleBadge = (role: string | undefined) => {
    if (!role) return <Badge variant="secondary" size="sm">No Role</Badge>;
    
    const roleColors: { [key: string]: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' } = {
      'Super Admin': 'danger',
      'Dealer': 'warning',
      'Customer': 'success',
      'Manager': 'primary'
    };

    return (
      <Badge 
        variant={roleColors[role] || 'secondary'} 
        size="sm"
      >
        {role}
      </Badge>
    );
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  if (loading) {
    return (
      <Container>
        <div className="flex justify-center items-center min-h-96">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error || !user) {
    return (
      <Container>
        <Alert variant="danger">
          {error || 'User not found'}
        </Alert>
        <div className="mt-4">
          <Button onClick={handleBack} variant="outline">
            <ArrowBackIcon className="w-4 h-4 mr-2" />
            Back to Users
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              onClick={handleBack}
              variant="outline"
              size="sm"
            >
              <ArrowBackIcon className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600">User Details & Report</p>
            </div>
          </div>
          <Button
            onClick={handleEditUser}
            variant="primary"
            className="flex items-center gap-2"
          >
            <EditIcon className="w-4 h-4" />
            Edit User
          </Button>
        </div>

        {/* User Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PersonIcon className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold">Basic Information</h3>
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-gray-900">{user.name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="text-gray-900">{user.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Role</label>
                    <div className="mt-1">
                      {getRoleBadge(user.role)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      {getStatusBadge(user.status === 'ACTIVE')}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="text-gray-900">{formatDate(user.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="text-gray-900">{formatDate(user.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Wallet Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AccountBalanceWalletIcon className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-semibold">Wallet Information</h3>
              </div>
            </CardHeader>
            <CardBody>
              {wallet ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      रु{(typeof wallet.balance === 'string' ? parseFloat(wallet.balance) : wallet.balance || 0).toFixed(2)}
                    </div>
                    <p className="text-sm text-gray-500">Current Balance</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-gray-500">Wallet ID</label>
                      <p className="font-medium">{wallet.id}</p>
                    </div>
                    <div>
                      <label className="text-gray-500">Last Updated</label>
                      <p className="font-medium">{formatDate(wallet.updated_at)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No wallet found for this user</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Permissions & Roles */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SecurityIcon className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Roles & Permissions</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Primary Role</label>
                <div className="mt-1">
                  {getRoleBadge(user.role)}
                </div>
              </div>
              {user.roles && user.roles.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-500">All Roles</label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {user.roles.map((role, index) => (
                      <Badge key={index} variant="secondary" size="sm">
                        {role.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Vehicles */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DirectionsCarIcon className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Associated Vehicles</h3>
            </div>
          </CardHeader>
          <CardBody>
            {vehicles.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Vehicle Name</TableHeader>
                      <TableHeader>IMEI</TableHeader>
                      <TableHeader>Vehicle No</TableHeader>
                      <TableHeader>Type</TableHeader>
                      <TableHeader>Status</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {vehicles.map((vehicle) => (
                      <TableRow key={vehicle.imei}>
                        <TableCell>{vehicle.name}</TableCell>
                        <TableCell>{vehicle.imei}</TableCell>
                        <TableCell>{vehicle.vehicleNo}</TableCell>
                        <TableCell>{vehicle.vehicleType}</TableCell>
                        <TableCell>
                          <Badge variant={vehicle.is_active ? 'success' : 'danger'} size="sm">
                            {vehicle.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8">
                <DirectionsCarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No vehicles associated with this user</p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Recent Activity</h3>
          </CardHeader>
          <CardBody>
            <div className="text-center py-8">
              <p className="text-gray-500">Activity log feature coming soon</p>
            </div>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default UserShowPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { vehicleService } from '../../api/services/vehicleService';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import CardHeader from '../../components/ui/cards/CardHeader';
import Input from '../../components/ui/forms/Input';
import Button from '../../components/ui/buttons/Button';
import Spinner from '../../components/ui/common/Spinner';
import Badge from '../../components/ui/common/Badge';
import type { Vehicle } from '../../types/vehicle';

const ReportIndexPage: React.FC = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadVehicles();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [vehicles, searchQuery]);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehicleService.getAllVehicles();
      
      if (response.success && response.data) {
        setVehicles(response.data);
      } else {
        console.error('Failed to load vehicles:', response.error);
      }
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = vehicles;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = vehicles.filter(vehicle => 
        vehicle.name.toLowerCase().includes(query) ||
        vehicle.vehicleNo.toLowerCase().includes(query) ||
        vehicle.imei.toLowerCase().includes(query) ||
        vehicle.vehicleType.toLowerCase().includes(query)
      );
    }

    setFilteredVehicles(filtered);
  };

  const handleVehicleSelect = (vehicle: Vehicle) => {
    navigate(`/reports/${vehicle.imei}`);
  };

  const getStatusBadge = (vehicle: Vehicle) => {
    if (vehicle.latestStatus) {
      const status = vehicle.latestStatus.ignition ? 'Running' : 'Stopped';
      return (
        <Badge 
          variant={vehicle.latestStatus.ignition ? 'success' : 'secondary'}
          size="sm"
        >
          {status}
        </Badge>
      );
    }
    return <Badge variant="secondary" size="sm">No Data</Badge>;
  };

  const getAssignedUsers = (vehicle: Vehicle) => {
    if (vehicle.userVehicle && vehicle.userVehicle.user) {
      return vehicle.userVehicle.user.name;
    }
    return 'Unassigned';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Reports</h1>
          <p className="text-gray-600">Select a vehicle to generate reports</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardBody>
          <div className="max-w-md">
            <Input
              type="text"
              placeholder="Search vehicles by name, number, IMEI, or type..."
              value={searchQuery}
              onChange={(value) => setSearchQuery(value)}
            />
          </div>
        </CardBody>
      </Card>

      {/* Vehicles List */}
      {filteredVehicles.length === 0 ? (
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <div className="text-gray-500 text-lg">
                {searchQuery ? 'No vehicles found matching your search' : 'No vehicles found'}
              </div>
            </div>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{vehicle.name}</h3>
                    <p className="text-sm text-gray-600">{vehicle.vehicleNo}</p>
                  </div>
                  {getStatusBadge(vehicle)}
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">IMEI:</span>
                      <p className="font-medium">{vehicle.imei}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Type:</span>
                      <p className="font-medium">{vehicle.vehicleType}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Assigned to:</span>
                      <p className="font-medium">{getAssignedUsers(vehicle)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Odometer:</span>
                      <p className="font-medium">{vehicle.odometer} km</p>
                    </div>
                  </div>
                  
                  {vehicle.latestLocation && vehicle.latestLocation.latitude && vehicle.latestLocation.longitude && (
                    <div className="text-sm">
                      <span className="text-gray-500">Last Location:</span>
                      <p className="font-medium">
                        {Number(vehicle.latestLocation.latitude).toFixed(6)}, {Number(vehicle.latestLocation.longitude).toFixed(6)}
                      </p>
                    </div>
                  )}

                  <div className="pt-3">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => handleVehicleSelect(vehicle)}
                    >
                      Generate Report
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportIndexPage;

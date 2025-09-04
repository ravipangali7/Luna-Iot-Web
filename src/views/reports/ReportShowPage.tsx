import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vehicleService } from '../../api/services/vehicleService';
import { reportService } from '../../api/services/reportService';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import CardHeader from '../../components/ui/cards/CardHeader';
import Input from '../../components/ui/forms/Input';
import Button from '../../components/ui/buttons/Button';
import Spinner from '../../components/ui/common/Spinner';
import Badge from '../../components/ui/common/Badge';
import type { Vehicle } from '../../types/vehicle';
import type { ReportData } from '../../types/report';

const ReportShowPage: React.FC = () => {
  const { imei } = useParams<{ imei: string }>();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (imei) {
      loadVehicle();
      initializeDates();
    }
  }, [imei]);

  const loadVehicle = async () => {
    if (!imei) return;
    
    try {
      setLoading(true);
      const response = await vehicleService.getVehicleByImei(imei);
      
      if (response.success && response.data) {
        setVehicle(response.data);
      } else {
        console.error('Failed to load vehicle:', response.error);
        navigate('/reports');
      }
    } catch (error) {
      console.error('Error loading vehicle:', error);
      navigate('/reports');
    } finally {
      setLoading(false);
    }
  };

  const initializeDates = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    setStartDate(yesterday.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  const generateReport = async () => {
    if (!imei || !startDate || !endDate) return;

    try {
      setGenerating(true);
      console.log('Generating report for:', { imei, startDate, endDate });
      
      const response = await reportService.generateReport(imei, startDate, endDate);
      console.log('Report service response:', response);
      
      if (response.success && response.data) {
        console.log('Report data received:', response.data);
        setReportData(response.data);
      } else {
        console.error('Failed to generate report:', response.error);
        alert('Failed to generate report: ' + (response.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report: ' + (error as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
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

  if (!vehicle) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Vehicle not found</p>
        <Button variant="primary" onClick={() => navigate('/reports')} className="mt-4">
          Back to Reports
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Report: {vehicle.vehicleNo}
          </h1>
          <p className="text-gray-600">Generate comprehensive vehicle reports</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/reports')}>
          Back to Reports
        </Button>
      </div>

      {/* Vehicle Card */}
      <Card>
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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
        </CardBody>
      </Card>

      {/* Date Selector */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Select Date Range</h3>
        </CardHeader>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(value) => setStartDate(value)}
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(value) => setEndDate(value)}
              />
            </div>
            <Button
              variant="primary"
              onClick={generateReport}
              disabled={!startDate || !endDate || generating}
              loading={generating}
            >
              {generating ? 'Generating...' : 'Generate Report'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Report Content */}
      {generating && (
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <Spinner size="lg" />
              <p className="text-gray-600 mt-4">Generating Report...</p>
            </div>
          </CardBody>
        </Card>
      )}

      {reportData && !generating && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Number(reportData.stats.totalKm).toFixed(1)} km
                  </div>
                  <div className="text-sm text-gray-600">Total Distance</div>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatDuration(reportData.stats.totalTime)}
                  </div>
                  <div className="text-sm text-gray-600">Total Time</div>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Number(reportData.stats.averageSpeed).toFixed(1)} km/h
                  </div>
                  <div className="text-sm text-gray-600">Avg Speed</div>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {Number(reportData.stats.maxSpeed).toFixed(0)} km/h
                  </div>
                  <div className="text-sm text-gray-600">Max Speed</div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {formatDuration(reportData.stats.totalIdleTime)}
                  </div>
                  <div className="text-sm text-gray-600">Idle Time</div>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatDuration(reportData.stats.totalRunningTime)}
                  </div>
                  <div className="text-sm text-gray-600">Running Time</div>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {formatDuration(reportData.stats.totalOverspeedTime)}
                  </div>
                  <div className="text-sm text-gray-600">Overspeed Time</div>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatDuration(reportData.stats.totalStopTime)}
                  </div>
                  <div className="text-sm text-gray-600">Stop Time</div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Daily Data Table */}
          {reportData.dailyData.length > 0 && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Daily Summary</h3>
              </CardHeader>
              <CardBody>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Distance (km)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Avg Speed (km/h)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Max Speed (km/h)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Data Points
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.dailyData.map((day, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {new Date(day.date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {Number(day.totalKm).toFixed(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {Number(day.averageSpeed).toFixed(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {Number(day.maxSpeed).toFixed(0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {day.locationCount}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {!reportData && !generating && startDate && endDate && (
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <div className="text-gray-500 text-lg">
                Select date range and generate report to view data
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default ReportShowPage;

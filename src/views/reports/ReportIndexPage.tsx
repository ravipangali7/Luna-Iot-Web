import React, { useState, useEffect } from 'react';
import { vehicleService } from '../../api/services/vehicleService';
import { reportService } from '../../api/services/reportService';
import Card from '../../components/ui/cards/Card';
import CardBody from '../../components/ui/cards/CardBody';
import CardHeader from '../../components/ui/cards/CardHeader';
import DatePicker from '../../components/ui/forms/DatePicker';
import Select from '../../components/ui/forms/Select';
import Button from '../../components/ui/buttons/Button';
import Spinner from '../../components/ui/common/Spinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Vehicle } from '../../types/vehicle';
import type { ReportData } from '../../types/report';

const ReportIndexPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Data state
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    loadVehicles();
    initializeDates();
  }, []);

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

  const initializeDates = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    setStartDate(yesterday.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  };

  // Get today's date in YYYY-MM-DD format for max date validation
  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Handle start date change
  const handleStartDateChange = (date: string) => {
    setStartDate(date);
    
    // If end date is before new start date, reset end date to start date
    if (endDate && date && endDate < date) {
      setEndDate(date);
    }
  };

  // Handle end date change
  const handleEndDateChange = (date: string) => {
    setEndDate(date);
  };

  const generateReport = async () => {
    if (!selectedVehicle || !startDate || !endDate) {
      return;
    }

    try {
      setLoadingReport(true);

      const response = await reportService.generateReport(selectedVehicle, startDate, endDate);

      if (response.success && response.data) {
        setReportData(response.data);
      } else {
        console.error('Failed to generate report:', response.error);
        setReportData(null);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      setReportData(null);
    } finally {
      setLoadingReport(false);
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

  // Format numbers exactly like Flutter app
  const formatNumber = (value: number, decimalPlaces: number): string => {
    const fixedValue = fixNaN(value);
    return fixedValue.toFixed(decimalPlaces);
  };

  // Helper function to fix NaN values
  const fixNaN = (value: any): number => {
    if (isNaN(value) || value === null || value === undefined) {
      return 0;
    }
    return Number(value);
  };

  // Format data for charts - matching Flutter app precision
  const formatChartData = (dailyData: any[]) => {
    return dailyData.map((day, index) => ({
      day: index + 1,
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      averageSpeed: fixNaN(day.averageSpeed),
      maxSpeed: fixNaN(day.maxSpeed),
      totalKm: fixNaN(day.totalKm),
      locationCount: fixNaN(day.locationCount)
    }));
  };

  const vehicleOptions = vehicles.map(vehicle => ({
    value: vehicle.imei,
    label: `${vehicle.vehicleNo} - ${vehicle.name}`
  }));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehicle Reports</h1>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Vehicle
              </label>
              <Select
                options={vehicleOptions}
                value={selectedVehicle}
                onChange={setSelectedVehicle}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <DatePicker
                value={startDate}
                onChange={handleStartDateChange}
                max={getTodayString()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <DatePicker
                value={endDate}
                onChange={handleEndDateChange}
                min={startDate || undefined}
                max={getTodayString()}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button
                variant="primary"
                onClick={generateReport}
                loading={loadingReport}
                disabled={!selectedVehicle || !startDate || !endDate}
                className="w-full"
              >
                GO
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Report Content */}
      {loadingReport && (
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <Spinner size="lg" />
              <p className="text-gray-600 mt-4">Generating Report...</p>
            </div>
          </CardBody>
        </Card>
      )}

      {reportData && !loadingReport && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(reportData.stats.totalKm, 1)} km
                  </div>
                  <div className="text-sm text-gray-600">Total Distance</div>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatDuration(fixNaN(reportData.stats.totalTime))}
                  </div>
                  <div className="text-sm text-gray-600">Total Time</div>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatNumber(reportData.stats.averageSpeed, 1)} km/h
                  </div>
                  <div className="text-sm text-gray-600">Avg Speed</div>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {formatNumber(reportData.stats.maxSpeed, 0)} km/h
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
                    {formatDuration(fixNaN(reportData.stats.totalIdleTime))}
                  </div>
                  <div className="text-sm text-gray-600">Idle Time</div>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatDuration(fixNaN(reportData.stats.totalRunningTime))}
                  </div>
                  <div className="text-sm text-gray-600">Running Time</div>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {formatDuration(fixNaN(reportData.stats.totalOverspeedTime))}
                  </div>
                  <div className="text-sm text-gray-600">Overspeed Time</div>
                </div>
              </CardBody>
            </Card>
            <Card>
              <CardBody>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatDuration(fixNaN(reportData.stats.totalStopTime))}
                  </div>
                  <div className="text-sm text-gray-600">Stop Time</div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Speed and Distance Charts */}
          {reportData.dailyData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Daily Speed Chart */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900">Daily Speed</h3>
                </CardHeader>
                <CardBody>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formatChartData(reportData.dailyData)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickLine={{ stroke: '#6B7280' }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickLine={{ stroke: '#6B7280' }}
                          label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: 'none', 
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                          formatter={(value: any, name: string) => [
                            `${formatNumber(Number(value), 1)} km/h`, 
                            name === 'averageSpeed' ? 'Average Speed' : 'Max Speed'
                          ]}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="averageSpeed" 
                          stroke="#3B82F6" 
                          strokeWidth={3}
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                          name="Average Speed"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="maxSpeed" 
                          stroke="#EF4444" 
                          strokeWidth={3}
                          dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                          name="Max Speed"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>

              {/* Daily Distance Chart */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900">Daily Distance</h3>
                </CardHeader>
                <CardBody>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={formatChartData(reportData.dailyData)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }}
                          tickLine={{ stroke: '#6B7280' }}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickLine={{ stroke: '#6B7280' }}
                          label={{ value: 'Distance (km)', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: 'none', 
                            borderRadius: '8px',
                            color: '#F9FAFB'
                          }}
                          formatter={(value: any) => [`${formatNumber(Number(value), 1)} km`, 'Distance']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="totalKm" 
                          stroke="#10B981" 
                          strokeWidth={3}
                          dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardBody>
              </Card>
            </div>
          )}

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
                            {formatNumber(day.totalKm, 1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(day.averageSpeed, 1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(day.maxSpeed, 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(day.locationCount, 0)}
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

      {/* No Data Message */}
      {!loadingReport && selectedVehicle && startDate && endDate && !reportData && (
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Found</h3>
              <p className="text-gray-600">No report data found for the selected vehicle and date range.</p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default ReportIndexPage;

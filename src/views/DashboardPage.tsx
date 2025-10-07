import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Container from '../components/ui/layout/Container';
import Card from '../components/ui/cards/Card';
import CardHeader from '../components/ui/cards/CardHeader';
import CardBody from '../components/ui/cards/CardBody';
import { userService } from '../api/services/userService';
import { deviceService } from '../api/services/deviceService';
import { vehicleService } from '../api/services/vehicleService';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalDealers: number;
  totalCustomers: number;
  totalDevices: number;
  totalVehicles: number;
  expiredVehicles: number;
  totalSms: number;
  totalBalance: number;
  serverBalance: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalDealers: 0,
    totalCustomers: 0,
    totalDevices: 0,
    totalVehicles: 0,
    expiredVehicles: 0,
    totalSms: 0,
    totalBalance: 0,
    serverBalance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [
          usersResult,
          devicesResult,
          vehiclesResult,
        ] = await Promise.all([
          userService.getAllUsers(),
          deviceService.getAllDevices(),
          vehicleService.getAllVehicles(),
        ]);

        // Calculate stats
        const users = usersResult.data || [];
        const devices = devicesResult.data || [];
        const vehicles = vehiclesResult.data || [];

        // Calculate user stats
        const totalUsers = users.length;
        const activeUsers = users.filter(user => user.status === 'ACTIVE').length;
        const totalDealers = users.filter(user => user.role === 'DEALER').length;
        const totalCustomers = users.filter(user => user.role === 'CUSTOMER').length;

        // Calculate device stats
        const totalDevices = devices.length;

        // Calculate vehicle stats
        const totalVehicles = vehicles.length;
        const expiredVehicles = vehicles.filter(vehicle => {
          // Check if vehicle has expired based on expireDate
          return vehicle.expireDate && new Date(vehicle.expireDate) < new Date();
        }).length;

        // For now, we'll use placeholder values for SMS and balance data
        // These would need to be fetched from appropriate APIs
        const totalSms = 0; // Placeholder - would need SMS service
        const totalBalance = 0; // Placeholder - would need balance service
        const serverBalance = 0; // Placeholder - would need server balance service

        setStats({
          totalUsers,
          activeUsers,
          totalDealers,
          totalCustomers,
          totalDevices,
          totalVehicles,
          expiredVehicles,
          totalSms,
          totalBalance,
          serverBalance,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    change?: string;
  }> = ({ title, value, icon, color, bgColor, change }) => (
    <Card shadow="sm" className="hover:shadow-md transition-shadow">
      <CardBody className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>
              {loading ? '...' : value}
            </p>
            {change && (
              <p className="text-xs text-gray-500 mt-1">{change}</p>
            )}
          </div>
          <div className={`w-12 h-12 ${bgColor} rounded-full flex items-center justify-center`}>
            {icon}
          </div>
        </div>
      </CardBody>
    </Card>
  );

  return (
        <Container>
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}! 👋
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Monitor and manage your IoT system from one central dashboard. 
                Get real-time insights into system performance and status.
              </p>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                icon={
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                }
                color="text-blue-600"
                bgColor="bg-blue-100"
              />
              
              <StatCard
                title="Active Users"
                value={stats.activeUsers}
                icon={
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
                color="text-green-600"
                bgColor="bg-green-100"
              />
              
              <StatCard
                title="Total Dealers"
                value={stats.totalDealers}
                icon={
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                }
                color="text-purple-600"
                bgColor="bg-purple-100"
              />
              
              <StatCard
                title="Total Customers"
                value={stats.totalCustomers}
                icon={
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
                color="text-indigo-600"
                bgColor="bg-indigo-100"
              />
              
              <StatCard
                title="Total Devices"
                value={stats.totalDevices}
                icon={
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                }
                color="text-orange-600"
                bgColor="bg-orange-100"
              />
              
              <StatCard
                title="Total Vehicles"
                value={stats.totalVehicles}
                icon={
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
                  </svg>
                }
                color="text-red-600"
                bgColor="bg-red-100"
              />
              
              <StatCard
                title="Expired Vehicles"
                value={stats.expiredVehicles}
                icon={
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                }
                color="text-yellow-600"
                bgColor="bg-yellow-100"
              />
              
              <StatCard
                title="Total SMS"
                value={stats.totalSms}
                icon={
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                }
                color="text-teal-600"
                bgColor="bg-teal-100"
              />
              
              <StatCard
                title="Total Balance"
                value={`$${stats.totalBalance.toLocaleString()}`}
                icon={
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                }
                color="text-emerald-600"
                bgColor="bg-emerald-100"
              />
              
              <StatCard
                title="Server Balance"
                value={`$${stats.serverBalance.toLocaleString()}`}
                icon={
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                }
                color="text-cyan-600"
                bgColor="bg-cyan-100"
              />
            </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">User logged in</p>
                  <p className="text-xs text-gray-500">Admin user connected</p>
                </div>
                <span className="text-xs text-gray-500">2 min ago</span>
              </div>
              
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">System updated</p>
                  <p className="text-xs text-gray-500">New features deployed</p>
                </div>
                <span className="text-xs text-gray-500">5 min ago</span>
              </div>
              
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Geofence alert</p>
                  <p className="text-xs text-gray-500">Location boundary crossed</p>
                </div>
                <span className="text-xs text-gray-500">12 min ago</span>
                  </div>
                </div>
          </CardBody>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center">
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <p className="text-sm font-medium text-gray-600">Add User</p>
              </button>
              
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center">
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium text-gray-600">Generate Report</p>
              </button>
              
              <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center">
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-sm font-medium text-gray-600">Create Geofence</p>
              </button>
            </div>
              </CardBody>
            </Card>
          </div>
        </Container>
  );
};

export default DashboardPage;
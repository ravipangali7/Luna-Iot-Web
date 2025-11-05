import React, { useState, useEffect } from 'react';
import Container from '../components/ui/layout/Container';
import Card from '../components/ui/cards/Card';
import CardBody from '../components/ui/cards/CardBody';
import { dashboardService } from '../api/services/dashboardService';
import type { DashboardStats } from '../api/services/dashboardService';
import { externalAppLinkService } from '../api/services/externalAppLinkService';
import type { ExternalAppLink } from '../api/services/externalAppLinkService';

const DashboardPage: React.FC = () => {
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
    todayAddedVehicles: 0,
    todayTransaction: 0,
    totalHitsToday: 0,
    todayKm: 0,
  });
  const [loading, setLoading] = useState(true);
  const [externalAppLinks, setExternalAppLinks] = useState<ExternalAppLink[]>([]);
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [passwordVisible, setPasswordVisible] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        
        // Fetch dashboard stats from the new API endpoint
        const result = await dashboardService.getDashboardStats();
        
        if (result.success && result.data) {
          setStats(result.data);
        } else {
          console.error('Error fetching dashboard stats:', result.error);
          // Set default values on error
          setStats({
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
            todayAddedVehicles: 0,
            todayTransaction: 0,
            totalHitsToday: 0,
            todayKm: 0,
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Set default values on error
        setStats({
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
          todayAddedVehicles: 0,
          todayTransaction: 0,
          totalHitsToday: 0,
          todayKm: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  useEffect(() => {
    const fetchExternalAppLinks = async () => {
      try {
        const result = await externalAppLinkService.getExternalAppLinks();
        
        if (result.success && result.data) {
          setExternalAppLinks(result.data);
        } else {
          console.error('Error fetching external app links:', result.error);
        }
      } catch (error) {
        console.error('Error fetching external app links:', error);
      }
    };

    fetchExternalAppLinks();
  }, []);

  const toggleCard = (id: number) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const togglePasswordVisibility = (id: number) => {
    setPasswordVisible(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

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
            <p className="text-xs font-medium text-gray-600 mb-1">{title}</p>
            <p className={`text-md font-bold ${color}`}>
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

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
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
                title="SMS Balance"
                value={`${stats.totalSms.toLocaleString()}`}
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
                value={`Rs ${stats.totalBalance.toLocaleString()}`}
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
                value={`Rs ${stats.serverBalance.toLocaleString()}`}
                icon={
                  <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                  </svg>
                }
                color="text-cyan-600"
                bgColor="bg-cyan-100"
              />
              
              <StatCard
                title="Today Added Vehicle"
                value={stats.todayAddedVehicles}
                icon={
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                }
                color="text-orange-600"
                bgColor="bg-orange-100"
              />
              
              <StatCard
                title="Today Transaction"
                value={stats.todayTransaction}
                icon={
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                }
                color="text-purple-600"
                bgColor="bg-purple-100"
              />
              
              <StatCard
                title="Total Hits Today"
                value={stats.totalHitsToday.toLocaleString()}
                icon={
                  <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
                color="text-indigo-600"
                bgColor="bg-indigo-100"
              />
              
              <StatCard
                title="Today Km"
                value={`${stats.todayKm.toLocaleString()} km`}
                icon={
                  <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                }
                color="text-teal-600"
                bgColor="bg-teal-100"
              />
            </div>

            {/* External App Section */}
            {externalAppLinks.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">External App</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {externalAppLinks.map((app) => (
                    <Card 
                      key={app.id} 
                      shadow="sm" 
                      className="hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group max-w-full"
                    >
                      <CardBody className="p-0 overflow-hidden">
                        {/* Card Header */}
                        <div 
                          className="p-5 bg-gradient-to-br from-gray-50 to-white cursor-pointer overflow-hidden"
                          onClick={() => toggleCard(app.id)}
                        >
                          <div className="flex items-start justify-between mb-3 gap-2">
                            <div className="flex items-center space-x-3 flex-1 min-w-0 overflow-hidden">
                              {app.logo ? (
                                <div className="flex-shrink-0">
                                  <img 
                                    src={app.logo} 
                                    alt={app.name} 
                                    className="w-14 h-14 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                      if (fallback) fallback.style.display = 'flex';
                                    }}
                                  />
                                  <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg border-2 border-gray-200 flex items-center justify-center hidden">
                                    <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                    </svg>
                                  </div>
                                </div>
                              ) : (
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg border-2 border-gray-200 flex items-center justify-center flex-shrink-0">
                                  <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                  </svg>
                                </div>
                              )}
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <h3 className="font-semibold text-gray-900 text-base truncate" title={app.name}>{app.name}</h3>
                                {app.link && (() => {
                                  try {
                                    const hostname = new URL(app.link).hostname;
                                    return <p className="text-xs text-gray-500 truncate mt-0.5" title={hostname}>{hostname}</p>;
                                  } catch {
                                    return <p className="text-xs text-gray-500 truncate mt-0.5">External Link</p>;
                                  }
                                })()}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCard(app.id);
                              }}
                              className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                            >
                              <svg 
                                className={`w-5 h-5 transition-transform duration-200 ${expandedCard === app.id ? 'transform rotate-180' : ''}`}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* Open Link Button */}
                          {app.link && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                try {
                                  const url = new URL(app.link);
                                  window.open(url.toString(), '_blank', 'noopener,noreferrer');
                                } catch (error) {
                                  console.error('Invalid URL:', app.link);
                                }
                              }}
                              className="w-full mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2 shadow-sm"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              <span>Open Link</span>
                            </button>
                          )}
                        </div>
                        
                        {/* Expanded Content */}
                        {expandedCard === app.id && (
                          <div className="px-5 pb-5 pt-0 border-t border-gray-100 bg-gray-50/50 animate-in slide-in-from-top-2 duration-200 overflow-hidden">
                            <div className="pt-4 space-y-4">
                              {(app.username || app.password) && (
                                <div className="space-y-3">
                                  {app.username && (
                                    <div className="min-w-0">
                                      <label className="text-xs font-semibold text-gray-700 mb-1.5 block uppercase tracking-wide">Username</label>
                                      <div className="flex items-center space-x-2 min-w-0">
                                        <div className="flex-1 min-w-0">
                                          <input
                                            type="text"
                                            value={app.username}
                                            readOnly
                                            className="w-full min-w-0 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            style={{ 
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap',
                                              overflow: 'hidden'
                                            }}
                                            onFocus={(e) => {
                                              e.target.style.overflow = 'auto';
                                              e.target.style.textOverflow = 'clip';
                                              e.target.scrollLeft = 0;
                                            }}
                                            onBlur={(e) => {
                                              e.target.style.overflow = 'hidden';
                                              e.target.style.textOverflow = 'ellipsis';
                                            }}
                                            title={app.username}
                                          />
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(app.username);
                                          }}
                                          className="flex-shrink-0 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-gray-200"
                                          title="Copy username"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                  {app.password && (
                                    <div className="min-w-0">
                                      <label className="text-xs font-semibold text-gray-700 mb-1.5 block uppercase tracking-wide">Password</label>
                                      <div className="flex items-center space-x-2 min-w-0">
                                        <div className="flex-1 min-w-0">
                                          <input
                                            type={passwordVisible[app.id] ? "text" : "password"}
                                            value={app.password}
                                            readOnly
                                            className="w-full min-w-0 px-3 py-2 bg-white border border-gray-200 rounded-md text-sm text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            style={{ 
                                              textOverflow: 'ellipsis',
                                              whiteSpace: 'nowrap',
                                              overflow: 'hidden'
                                            }}
                                            onFocus={(e) => {
                                              e.target.style.overflow = 'auto';
                                              e.target.style.textOverflow = 'clip';
                                              e.target.scrollLeft = 0;
                                            }}
                                            onBlur={(e) => {
                                              e.target.style.overflow = 'hidden';
                                              e.target.style.textOverflow = 'ellipsis';
                                            }}
                                            title={app.password}
                                          />
                                        </div>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            togglePasswordVisibility(app.id);
                                          }}
                                          className="flex-shrink-0 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-gray-200"
                                          title={passwordVisible[app.id] ? "Hide password" : "Show password"}
                                        >
                                          {passwordVisible[app.id] ? (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L3 12l3.29-3.29m13.42 13.42L21 21M12 12l3.29-3.29m0 0L21 3l-3.29 3.29m0 0L12 12l-3.29 3.29" />
                                            </svg>
                                          ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                          )}
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigator.clipboard.writeText(app.password);
                                          }}
                                          className="flex-shrink-0 p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-gray-200"
                                          title="Copy password"
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                          </svg>
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            )}

          </div>
        </Container>
  );
};

export default DashboardPage;
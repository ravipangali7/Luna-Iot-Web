import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useRefresh } from '../../contexts/RefreshContext';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { triggerRefresh } = useRefresh();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Navigation handlers
  const handleBack = () => {
    window.history.back();
  };

  const handleRefresh = () => {
    triggerRefresh();
  };

  const handleLiveTracking = () => {
    navigate('/live-tracking');
  };

  const handleAllVehicles = () => {
    navigate('/vehicles');
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          onMenuClick={toggleSidebar}
          onBack={location.pathname !== '/live-tracking' ? handleBack : undefined}
          onRefresh={handleRefresh}
          onLiveTracking={handleLiveTracking}
          onAllVehicles={handleAllVehicles}
          onFullscreen={handleFullscreen}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
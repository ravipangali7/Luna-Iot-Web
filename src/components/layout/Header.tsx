import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRefresh } from '../../contexts/RefreshContext';
import Button from '../ui/buttons/Button';
import IconButton from '../ui/buttons/IconButton';
import RoleBasedWidget from '../role-based/RoleBasedWidget';
import { ROLES } from '../../utils/roleUtils';

interface HeaderProps {
  onMenuClick: () => void;
  onBack?: () => void;
  onRefresh?: () => void;
  onLiveTracking?: () => void;
  onAllVehicles?: () => void;
  onFullscreen?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onMenuClick: _onMenuClick, 
  onBack, 
  onRefresh, 
  onLiveTracking, 
  onAllVehicles, 
  onFullscreen, 
}) => {
  const { user } = useAuth();
  const { isRefreshing } = useRefresh();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Navigation buttons */}
        <div className="flex items-center space-x-3">
          {/* Back Button */}
          {onBack && (
            <IconButton
              variant="outline"
              size="sm"
              onClick={onBack}
              className="border-red-500 text-red-500 hover:bg-red-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </IconButton>
          )}

          {/* Refresh Button */}
          <IconButton
            variant="outline"
            size="sm"
            onClick={onRefresh}
            loading={isRefreshing}
            className="border-blue-500 text-blue-500 hover:bg-blue-50"
          >
            <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </IconButton>

          {/* Live Tracking Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onLiveTracking}
            className="border-red-500 text-red-500 hover:bg-red-50 flex items-center space-x-2"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          >
            Live Tracking
          </Button>

          {/* All Vehicles Button */}
          <RoleBasedWidget allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
          <Button
            variant="outline"
            size="sm"
            onClick={onAllVehicles}
            className="border-red-500 text-red-500 hover:bg-red-50 flex items-center space-x-2"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            }
          >
            All Vehicles
          </Button>
          </RoleBasedWidget>
        </div>

        {/* Right side - User controls */}
        <div className="flex items-center space-x-4">
          {/* Fullscreen Button */}
          <IconButton
            variant="outline"
            size="sm"
            onClick={onFullscreen}
            className="border-gray-400 text-gray-400 hover:bg-gray-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </IconButton>

          {/* User Info */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-600">{user?.name}</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};

export default Header;
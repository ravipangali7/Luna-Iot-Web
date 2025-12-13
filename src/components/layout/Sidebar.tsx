import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSchoolAccess } from '../../hooks/useSchoolAccess';
import { useAlertSystemAccess } from '../../hooks/useAlertSystemAccess';
import { useCommunitySirenAccess } from '../../hooks/useCommunitySirenAccess';
import { useGarbageAccess } from '../../hooks/useGarbageAccess';
import { usePublicVehicleAccess } from '../../hooks/usePublicVehicleAccess';
import Button from '../ui/buttons/Button';
import Badge from '../ui/common/Badge';
import logo from '../../assets/logo.png';
import { ROLES } from '../../utils/roleUtils';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: string;
  children?: NavItem[];
  allowedRoles?: string[];
  requiredPermissions?: string[];
  requireAllPermissions?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, canAny, canAll } = useAuth();
  const { hasAccess: hasSchoolAccess } = useSchoolAccess();
  const { hasAccess: hasAlertSystemAccess } = useAlertSystemAccess();
  const { hasAccess: hasCommunitySirenAccess } = useCommunitySirenAccess();
  const { hasAccess: hasGarbageAccess } = useGarbageAccess();
  const { hasAccess: hasPublicVehicleAccess } = usePublicVehicleAccess();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isOpen && window.innerWidth < 1024) {
      onToggle();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Navigation configuration with dynamic permissions
  const navigationItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      allowedRoles: ['Super Admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
        </svg>
      )
    },
    {
      id: 'vehicles',
      label: 'Vehicles',
      path: '/Vehicles',
      allowedRoles: ['Super Admin', 'Dealer', 'Customer'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2a1 1 0 011 1v8m-4 0h1m4 0h1a1 1 0 001-1v-1a1 1 0 00-1-1h-1" />
        </svg>
      ),
      children: [
        {
          id: 'add-vehicle',
          label: 'Add Vehicle',
          path: '/vehicles/create',
          allowedRoles: ['Super Admin', 'Dealer', 'Customer'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )
        },
        {
          id: 'all-vehicles',
          label: 'All Vehicles',
          path: '/vehicles',
          allowedRoles: ['Super Admin', 'Dealer', 'Customer'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
          )
        },
        {
          id: 'live-tracking',
          label: 'Live Tracking',
          path: '/live-tracking',
          allowedRoles: ['Super Admin', 'Dealer', 'Customer'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A2 2 0 013 15.382V6.618a2 2 0 011.553-1.894L9 2m0 18v-16m0 16l6-2.727m0 0V4m0 13.273L21 17.382A2 2 0 0021 15.382V6.618a2 2 0 00-1.553-1.894L15 4" />
            </svg>
          )
        },
        {
          id: 'reports',
          label: 'Reports',
          path: '/reports',
          allowedRoles: ['Super Admin', 'Dealer', 'Customer'],
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        },
        {
          id: 'playback',
          label: 'Playback',
          path: '/playback',
          allowedRoles: ['Super Admin', 'Dealer', 'Customer'],
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m6-6V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2v-2M7 7h10M7 11h4m6 0h2M7 15h4m6 0h2" />
            </svg>
          )
        },
      ]
    },
    {
      id: 'devices',
      label: 'Devices',
      path: '/devices',
      allowedRoles: ['Super Admin', 'Dealer'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      ),
      children: [
        {
          id: 'add-device',
          label: 'Add Device',
          path: '/devices/create',
          allowedRoles: ['Super Admin'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )
        },
        {
          id: 'gps-devices',
          label: 'GPS',
          path: '/devices/gps',
          allowedRoles: ['Super Admin', 'Dealer'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )
        },
        {
          id: 'buzzer-devices',
          label: 'Buzzer',
          path: '/devices/buzzer',
          allowedRoles: ['Super Admin', 'Dealer'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          )
        },
        {
          id: 'sos-devices',
          label: 'SOS Switch',
          path: '/devices/sos',
          allowedRoles: ['Super Admin', 'Dealer'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          )
        }
      ]
    },
    {
      id: 'subscription-plans',
      label: 'Subscription Plans',
      path: '/subscription-plans',
      allowedRoles: ['Super Admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      id: 'device-orders',
      label: 'Device Orders',
      path: '/device-orders',
      allowedRoles: ['Super Admin', 'Dealer'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
      children: [
        {
          id: 'order-catalog',
          label: 'Product Catalog',
          path: '/device-orders/catalog',
          allowedRoles: ['Super Admin', 'Dealer'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          )
        },
        {
          id: 'order-cart',
          label: 'Cart',
          path: '/device-orders/cart',
          allowedRoles: ['Super Admin', 'Dealer'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )
        },
        {
          id: 'order-list',
          label: 'My Orders',
          path: '/device-orders',
          allowedRoles: ['Super Admin', 'Dealer'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )
        }
      ]
    },
    
    
    {
      id: 'recharges',
      label: 'Recharges',
      path: '/recharges',
      allowedRoles: ['Super Admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    
    {
      id: 'vehicle-tag',
      label: 'Vehicle Tag',
      path: '/vehicle-tag',
      allowedRoles: ['Super Admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      children: [
        {
          id: 'vehicle-tag-list',
          label: 'Tag',
          path: '/vehicle-tag',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )
        },
        {
          id: 'vehicle-tag-bulk',
          label: 'Bulk Tag',
          path: '/vehicle-tag/bulk',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
          )
        },
        {
          id: 'vehicle-tag-history',
          label: 'History',
          path: '/vehicle-tag/history',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        }
      ]
    },
    {
      id: 'vehicle-access',
      label: 'Vehicle Access',
      path: '/vehicle-access',
      allowedRoles: ['Super Admin', 'Dealer', 'Customer'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      id: 'geofences',
      label: 'Geofences',
      path: '/geofences',
      allowedRoles: ['Super Admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      id: 'notice-group',
      label: 'Notice',
      path: '/notices/popups',
      allowedRoles: ['Super Admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
      children: [
        {
          id: 'popups',
          label: 'Popup',
          path: '/notices/popups',
          allowedRoles: ['Super Admin'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          )
        },
        {
          id: 'notifications',
          label: 'Notification',
          path: '/notices/notifications',
          allowedRoles: ['Super Admin'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          )
        },
        {
          id: 'banners',
          label: 'Banner',
          path: '/notices/banners',
          allowedRoles: ['Super Admin'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )
        }
      ]
    },
    
    {
      id: 'luna-tag-group',
      label: 'Luna Tag',
      path: '/luna-tags',
      allowedRoles: ['Super Admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" strokeWidth={2} />
          <circle cx="12" cy="12" r="6" strokeWidth={2} />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      ),
      children: [
        {
          id: 'luna-tag',
          label: 'Luna Tag',
          path: '/luna-tags',
          allowedRoles: ['Super Admin'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          )
        },
        {
          id: 'user-tag',
          label: 'User Tag',
          path: '/user-luna-tags',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          )
        }
      ]
    },
    
    {
      id: 'finance',
      label: 'Finance',
      path: '/finance',
      allowedRoles: ['Super Admin', 'Dealer', 'Customer'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      children: [
        {
          id: 'my-wallet',
          label: 'My Wallet',
          path: '/my-wallet',
          allowedRoles: ['Super Admin', 'Dealer', 'Customer'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          )
        },
        {
          id: 'wallet-management',
          label: 'Wallet Management',
          path: '/wallet',
          allowedRoles: ['Super Admin'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        },
        {
          id: 'transactions',
          label: 'Transactions',
          path: '/transactions',
          allowedRoles: ['Super Admin'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          )
        },
        {
          id: 'due-transactions',
          label: 'Due Transactions',
          path: '/due-transactions',
          allowedRoles: ['Super Admin', 'Dealer', 'Customer'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        }
      ]
    },
    {
      id: 'institute',
      label: 'Institute',
      path: '/institute',
      allowedRoles: ['Super Admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      children: [
        {
          id: 'institute-service',
          label: 'Institute Service',
          path: '/institute/services',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        {
          id: 'institute-management',
          label: 'Institute',
          path: '/institute',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          )
        },
        {
          id: 'modules',
          label: 'Modules',
          path: '/modules',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          )
        }
      ]
    },
    {
      id: 'alert-system-group',
      label: 'Alert System',
      path: '/alert-system',
      allowedRoles: ['Super Admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      children: [
        {
          id: 'alert-system',
          label: 'Alert System',
          path: '/alert-system',
          allowedRoles: ['Super Admin'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        {
          id: 'alert-types',
          label: 'Alert Types',
          path: '/alert-types',
          allowedRoles: ['Super Admin'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          )
        },
        {
          id: 'alert-history',
          label: 'History',
          path: '/alert-history',
          allowedRoles: ['Super Admin'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        }
      ]
    },
    {
      id: 'community-siren-group',
      label: 'Community Siren',
      path: '/community-siren',
      allowedRoles: ['Super Admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
        </svg>
      ),
      children: [
        {
          id: 'community-siren',
          label: 'Community Siren',
          path: '/community-siren',
          allowedRoles: ['Super Admin'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        {
          id: 'community-siren-history',
          label: 'History',
          path: '/community-siren-history',
          allowedRoles: ['Super Admin'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        }
      ]
    },
    {
      id: 'phone-call-group',
      label: 'Phone Call',
      path: '/phone-call/campaigns',
      allowedRoles: ['Super Admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      ),
      children: [
        {
          id: 'campaigns',
          label: 'Campaigns',
          path: '/phone-call/campaigns',
          allowedRoles: ['Super Admin'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )
        },
        {
          id: 'create-campaign',
          label: 'Create Campaign',
          path: '/phone-call/campaigns/create',
          allowedRoles: ['Super Admin'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )
        }
      ]
    },
    {
      id: 'school',
      label: 'School',
      path: '/school',
      allowedRoles: ['Super Admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      id: 'garbage',
      label: 'Garbage',
      path: '/garbage',
      allowedRoles: ['Super Admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12h2m14 0h2M5 12v6a2 2 0 002 2h10a2 2 0 002-2v-6M5 12V8a2 2 0 012-2h10a2 2 0 012 2v4M7 8V6a2 2 0 012-2h6a2 2 0 012 2v2M7 8h10" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18a1 1 0 11-2 0 1 1 0 012 0zM17 18a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
      )
    },
    {
      id: 'public-vehicle',
      label: 'Public Vehicle',
      path: '/public-vehicle',
      allowedRoles: ['Super Admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      )
    },
    {
      id: 'users',
      label: 'Users',
      path: '/users',
      // No allowedRoles restriction - children will be filtered based on their own restrictions
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      children: [
        {
          id: 'add-user',
          label: 'Add User',
          path: '/users/add',
          allowedRoles: ['Super Admin', 'Dealer', 'Customer'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )
        },
        {
          id: 'user-management',
          label: 'User Management',
          path: '/users',
          allowedRoles: ['Super Admin'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )
        },
        {
          id: 'roles',
          label: 'Roles & Permissions',
          path: '/users/roles',
          allowedRoles: ['Super Admin'],
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          )
        }
      ]
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      path: '/monitoring',
      allowedRoles: ['Super Admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      children: [
        {
          id: 'device-monitoring',
          label: 'Device M.',
          path: '/monitoring/device',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          )
        },
        {
          id: 'vehicle-monitoring',
          label: 'Vehicle M.',
          path: '/monitoring/vehicle',
          icon: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
            </svg>
          )
        }
      ]
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/settings',
      allowedRoles: ['Super Admin'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  // Filter navigation items based on user permissions
  const filteredNavigationItems = useMemo(() => {
    if (!user) return [];

    const filterItems = (items: NavItem[]): NavItem[] => {
      return items.filter(item => {
        // Special handling for School item: check both role-based and module-based access
        if (item.id === 'school') {
          // Check if user is Super Admin (role-based)
          if (user.roles && user.roles.length > 0) {
            const userRoleNames = user.roles.map(role => role.name);
            const isSuperAdmin = userRoleNames.includes(ROLES.SUPER_ADMIN);
            
            // Show if Super Admin OR has school module access
            if (isSuperAdmin || hasSchoolAccess) {
              return true;
            }
          }
          return false;
        }

        // Special handling for Alert System item: check both role-based and module-based access
        if (item.id === 'alert-system-group' || item.id === 'alert-system') {
          // Check if user is Super Admin (role-based)
          if (user.roles && user.roles.length > 0) {
            const userRoleNames = user.roles.map(role => role.name);
            const isSuperAdmin = userRoleNames.includes(ROLES.SUPER_ADMIN);
            
            // Show if Super Admin OR has alert system module access
            if (isSuperAdmin || hasAlertSystemAccess) {
              return true;
            }
          }
          return false;
        }

        // Special handling for Alert History: check both role-based and module-based access
        if (item.id === 'alert-history') {
          // Check if user is Super Admin (role-based)
          if (user.roles && user.roles.length > 0) {
            const userRoleNames = user.roles.map(role => role.name);
            const isSuperAdmin = userRoleNames.includes(ROLES.SUPER_ADMIN);
            
            // Show if Super Admin OR has alert system module access
            if (isSuperAdmin || hasAlertSystemAccess) {
              return true;
            }
          }
          return false;
        }

        // Special handling for Community Siren item: check both role-based and module-based access
        if (item.id === 'community-siren-group' || item.id === 'community-siren' || item.id === 'community-siren-history') {
          // Check if user is Super Admin (role-based)
          if (user.roles && user.roles.length > 0) {
            const userRoleNames = user.roles.map(role => role.name);
            const isSuperAdmin = userRoleNames.includes(ROLES.SUPER_ADMIN);
            
            // Show if Super Admin OR has community siren module access
            if (isSuperAdmin || hasCommunitySirenAccess) {
              return true;
            }
          }
          return false;
        }

        // Special handling for Garbage item: check both role-based and module-based access
        if (item.id === 'garbage') {
          // Check if user is Super Admin (role-based)
          if (user.roles && user.roles.length > 0) {
            const userRoleNames = user.roles.map(role => role.name);
            const isSuperAdmin = userRoleNames.includes(ROLES.SUPER_ADMIN);
            
            // Show if Super Admin OR has garbage module access
            if (isSuperAdmin || hasGarbageAccess) {
              return true;
            }
          }
          return false;
        }

        // Special handling for Public Vehicle item: check both role-based and module-based access
        if (item.id === 'public-vehicle') {
          // Check if user is Super Admin (role-based)
          if (user.roles && user.roles.length > 0) {
            const userRoleNames = user.roles.map(role => role.name);
            const isSuperAdmin = userRoleNames.includes(ROLES.SUPER_ADMIN);
            
            // Show if Super Admin OR has public vehicle module access
            if (isSuperAdmin || hasPublicVehicleAccess) {
              return true;
            }
          }
          return false;
        }

        // Check role-based access (backward compatibility)
        if (item.allowedRoles && item.allowedRoles.length > 0) {
          if (!user.roles || user.roles.length === 0) return false;

          const userRoleNames = user.roles.map(role => role.name);
          const hasRoleAccess = item.allowedRoles.some(role => {
            switch (role.toLowerCase()) {
              case 'super admin':
                return userRoleNames.includes(ROLES.SUPER_ADMIN);
              case 'dealer':
                return userRoleNames.includes(ROLES.DEALER);
              case 'customer':
                return userRoleNames.includes(ROLES.CUSTOMER);
              default:
                return userRoleNames.includes(role);
            }
          });

          if (!hasRoleAccess) return false;
        }

        // Check permission-based access
        if (item.requiredPermissions && item.requiredPermissions.length > 0) {
          const hasPermissionAccess = item.requireAllPermissions
            ? canAll(item.requiredPermissions)
            : canAny(item.requiredPermissions);

          if (!hasPermissionAccess) return false;
        }

        // If no specific requirements, show the item
        if (!item.allowedRoles && !item.requiredPermissions) {
          return true;
        }

        // If item has children, filter them too
        if (item.children) {
          const filteredChildren = filterItems(item.children);
          return filteredChildren.length > 0; // Only show parent if it has accessible children
        }

        return true;
      }).map(item => ({
        ...item,
        children: item.children ? filterItems(item.children) : undefined
      }));
    };

    return filterItems(navigationItems);
  }, [user, canAny, canAll, hasSchoolAccess, hasAlertSystemAccess, hasCommunitySirenAccess, hasGarbageAccess, hasPublicVehicleAccess, navigationItems]);

  const handleLogout = async () => {
    logout();
    navigate('/login');
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const renderNavItem = (item: NavItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isItemActive = isActive(item.path);

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else {
              navigate(item.path);
            }
          }}
          className={`
            w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
            
            ${isItemActive
              ? 'text-green-700 border'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }
          `}
          style={{
            backgroundColor: isItemActive ? 'rgba(12, 160, 31, 0.08)' : undefined,
            borderColor: isItemActive ? 'rgba(12, 160, 31, 0.2)' : undefined
          }}
        >
          <div className="flex items-center space-x-3">
            <span
              className={`${isItemActive ? 'text-green-600' : 'text-gray-500'}`}
              style={{ color: isItemActive ? 'var(--color-primary)' : undefined }}
            >
              {item.icon}
            </span>
            <span className='text-xs'>{item.label}</span>
          </div>

          <div className="flex items-center space-x-2">
            {item.badge && (
              <Badge variant="primary" size="sm">
                {item.badge}
              </Badge>
            )}
            {hasChildren && (
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </button>

        {hasChildren && isExpanded && (
          <div className="mt-1 bg-gray-100 p-2 rounded-lg">
            {item.children!.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-[15rem] bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
        flex flex-col h-full
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex flex-col items-start space-x-3">
            <img src={logo} alt="Luna IOT" className="h-8 w-auto" />
          </div>

          {/* Close button for mobile */}
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation - Scrollable area */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto min-h-0">
          {filteredNavigationItems.map(item => renderNavItem(item))}
        </nav>

        {/* User Profile & Logout - Fixed at bottom */}
        <div className="border-t border-gray-200 p-4 flex-shrink-0">
          <div className="flex items-center space-x-3 mb-4">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'rgba(12, 160, 31, 0.15)' }}
            >
              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--color-primary)' }}
              >
                {user?.name?.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">
                {user?.roles && user.roles.length > 0 ? user.roles[0].name : 'No Role'}
              </p>
            </div>
          </div>

          <Button
            onClick={handleLogout}
            variant="danger"
            size="sm"
            className="w-full"
          >
            Logout
          </Button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
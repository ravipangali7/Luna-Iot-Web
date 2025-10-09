import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RefreshProvider } from './contexts/RefreshContext';
import { useAuth } from './hooks/useAuth';
import LoginPage from './views/auth/LoginPage';
import DashboardPage from './views/DashboardPage';
import Layout from './components/layout/Layout';
import { DeviceIndexPage, DeviceCreatePage, DeviceEditPage } from './views/devices';
import { VehicleIndexPage, VehicleCreatePage, VehicleEditPage } from './views/vehicles';
import { VehicleAccessIndexPage, VehicleAccessCreatePage, VehicleAccessEditPage, VehicleAccessManagePage } from './views/vehicleAccess';
import { RechargeIndexPage, RechargeCreatePage } from './views/recharges';
import { ReportIndexPage } from './views/reports';
import { PlaybackIndexPage } from './views/playback';
import { InstituteIndexPage, InstituteCreatePage, InstituteEditPage, InstituteShowPage } from './views/institute';
import { InstituteServiceIndexPage, InstituteServiceCreatePage, InstituteServiceEditPage } from './views/institute/services';
import { InstituteModuleCreatePage, InstituteModuleEditPage } from './views/institute/modules';
import { SubscriptionPlanIndexPage, SubscriptionPlanCreatePage, SubscriptionPlanEditPage } from './views/subscriptionPlans';
import RoleBasedRoute from './components/role-based/RoleBasedRoute';
import { ROLES } from './utils/roleUtils';

import './styles/variables.css';
import './styles/components.css';
import LiveTrackingIndexPage from './views/live_tracking/LiveTrackingIndexPage';
import LiveTrackingShowPage from './views/live_tracking/LiveTrackingShowPage';
import SharedTrackPage from './views/shared_track/SharedTrackPage';
import DeviceMonitoringPage from './views/DeviceMonitoringPage';
import DeviceMonitoringShowPage from './views/DeviceMonitoringShowPage';
import VehicleMonitoringPage from './views/VehicleMonitoringPage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component (redirects if already authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Role-based redirect if user is already logged in
  if (user) {
    let redirectPath = '/dashboard'; // Default for Super Admin
    
    if (user.roles && user.roles.length > 0) {
      const userRoleNames = user.roles.map(role => role.name);
      
      if (userRoleNames.includes(ROLES.SUPER_ADMIN)) {
        redirectPath = '/dashboard';
      } else if (userRoleNames.includes(ROLES.DEALER) || userRoleNames.includes(ROLES.CUSTOMER)) {
        redirectPath = '/live-tracking';
      }
    }
    
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};



const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />

      {/* Public Shared Track Route - No authentication required */}
      <Route path="/share-track/:token" element={<SharedTrackPage />} />

      {/* Protected routes with layout */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/live-tracking" replace />} />
        <Route path="dashboard" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <DashboardPage />
          </RoleBasedRoute>
        } />

        {/* Device Routes - Super Admin and Dealer only */}
        <Route path="devices" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
            <DeviceIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="devices/create" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <DeviceCreatePage />
          </RoleBasedRoute>
        } />
        <Route path="devices/edit/:imei" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <DeviceEditPage />
          </RoleBasedRoute>
        } />

        {/* Vehicle Routes - All roles can access */}
        <Route path="vehicles" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
            <VehicleIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="vehicles/create" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER, ROLES.CUSTOMER]}>
            <VehicleCreatePage />
          </RoleBasedRoute>
        } />
        <Route path="vehicles/edit/:imei" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER, ROLES.CUSTOMER]}>
            <VehicleEditPage />
          </RoleBasedRoute>
        } />

        {/* Vehicle Access Routes - Super Admin and Dealer only */}
        <Route path="vehicle-access" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
            <VehicleAccessIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="vehicle-access/create" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
            <VehicleAccessCreatePage />
          </RoleBasedRoute>
        } />
        <Route path="vehicle-access/edit/:id" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
            <VehicleAccessEditPage />
          </RoleBasedRoute>
        } />
        <Route path="vehicle-access/manage/:imei" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
            <VehicleAccessManagePage />
          </RoleBasedRoute>
        } />

        {/* Recharge Routes - Super Admin and Dealer only */}
        <Route path="recharges" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <RechargeIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="recharges/create" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <RechargeCreatePage />
          </RoleBasedRoute>
        } />

        {/* Live Tracking Routes - All roles can access */}
        <Route path="live-tracking" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER, ROLES.CUSTOMER]}>
            <LiveTrackingIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="live-tracking/:imei" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER, ROLES.CUSTOMER]}>
            <LiveTrackingShowPage />
          </RoleBasedRoute>
        } />

        {/* Report Routes - All roles can access */}
        <Route path="reports" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER, ROLES.CUSTOMER]}>
            <ReportIndexPage />
          </RoleBasedRoute>
        } />

        {/* Playback Routes - All roles can access */}
        <Route path="playback" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER, ROLES.CUSTOMER]}>
            <PlaybackIndexPage />
          </RoleBasedRoute>
        } />

        {/* Monitoring Routes - All roles can access */}
        <Route path="monitoring/device" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <DeviceMonitoringPage />
          </RoleBasedRoute>
        } />
        <Route path="monitoring/device/:imei" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <DeviceMonitoringShowPage />
          </RoleBasedRoute>
        } />
        <Route path="monitoring/vehicle" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <VehicleMonitoringPage />
          </RoleBasedRoute>
        } />

        {/* Institute Routes - Super Admin only */}
        <Route path="institute" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <InstituteIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="institute/create" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <InstituteCreatePage />
          </RoleBasedRoute>
        } />
        <Route path="institute/:id" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <InstituteShowPage />
          </RoleBasedRoute>
        } />
        <Route path="institute/:id/edit" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <InstituteEditPage />
          </RoleBasedRoute>
        } />

        {/* Institute Service Routes - Super Admin only */}
        <Route path="institute/services" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <InstituteServiceIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="institute/services/create" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <InstituteServiceCreatePage />
          </RoleBasedRoute>
        } />
        <Route path="institute/services/:id/edit" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <InstituteServiceEditPage />
          </RoleBasedRoute>
        } />

        {/* Institute Module Routes - Super Admin only */}
        <Route path="institute/modules/create" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <InstituteModuleCreatePage />
          </RoleBasedRoute>
        } />
        <Route path="institute/modules/:id/edit" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <InstituteModuleEditPage />
          </RoleBasedRoute>
        } />

        {/* Subscription Plan Routes - Super Admin and Manager only */}
        <Route path="subscription-plans" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <SubscriptionPlanIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="subscription-plans/create" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <SubscriptionPlanCreatePage />
          </RoleBasedRoute>
        } />
        <Route path="subscription-plans/:id/edit" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <SubscriptionPlanEditPage />
          </RoleBasedRoute>
        } />
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <RefreshProvider>
          <AppRoutes />
        </RefreshProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
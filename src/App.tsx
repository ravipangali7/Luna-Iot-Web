import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RefreshProvider } from './contexts/RefreshContext';
import { useAuth } from './hooks/useAuth';
import LoginPage from './views/auth/LoginPage';
import DashboardPage from './views/DashboardPage';
import Layout from './components/layout/Layout';
import { DeviceCreatePage, DeviceEditPage } from './views/devices';
import GpsDeviceIndexPage from './views/devices/GpsDeviceIndexPage';
import BuzzerDeviceIndexPage from './views/devices/BuzzerDeviceIndexPage';
import SosDeviceIndexPage from './views/devices/SosDeviceIndexPage';
import { VehicleIndexPage, VehicleCreatePage, VehicleEditPage } from './views/vehicles';
import { VehicleAccessIndexPage, VehicleAccessCreatePage, VehicleAccessEditPage, VehicleAccessManagePage } from './views/vehicleAccess';
import { RechargeIndexPage, RechargeCreatePage } from './views/recharges';
import { ReportIndexPage } from './views/reports';
import { PlaybackIndexPage } from './views/playback';
import { InstituteIndexPage, InstituteCreatePage, InstituteEditPage, InstituteShowPage } from './views/institute';
import { InstituteServiceIndexPage, InstituteServiceCreatePage, InstituteServiceEditPage } from './views/institute/services';
import { InstituteModuleCreatePage, InstituteModuleEditPage } from './views/institute/modules';
import { ModuleIndexPage, ModuleCreatePage, ModuleEditPage } from './views/modules';
import { AlertSystemIndexPage, AlertSystemShowPage } from './views/alertSystem';
import { GeofenceCreatePage, GeofenceEditPage, GeofenceViewPage } from './views/alertSystem/geofences';
import { RadarIndexPage, RadarCreatePage, RadarEditPage, RadarViewPage } from './views/alertSystem/radars';
import RadarShowPage from './views/alertSystem/radars/RadarShowPage';
import { BuzzerIndexPage, BuzzerCreatePage, BuzzerEditPage, BuzzerViewPage } from './views/alertSystem/buzzers';
import { SwitchIndexPage, SwitchCreatePage, SwitchEditPage, SwitchViewPage } from './views/alertSystem/switches';
import { ContactIndexPage, ContactCreatePage, ContactEditPage, ContactViewPage } from './views/alertSystem/contacts';
import { AlertTypeIndexPage, AlertTypeCreatePage, AlertTypeEditPage } from './views/alertSystem/alertTypes';
import { AlertHistoryIndexPage, AlertHistoryViewPage } from './views/alertHistory';
import { SubscriptionPlanIndexPage, SubscriptionPlanCreatePage, SubscriptionPlanEditPage } from './views/subscriptionPlans';
import { UserIndexPage, UserShowPage, UserCreatePage, UserEditPage } from './views/users';
import { WalletIndexPage, MyWalletPage } from './views/wallet';
import { TransactionIndexPage, WalletTransactionsPage, UserTransactionsPage } from './views/transactions';
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

      {/* Public shared tracking route - no authentication required */}
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
        <Route path="devices" element={<Navigate to="/devices/gps" replace />} />
        <Route path="devices/gps" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
            <GpsDeviceIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="devices/buzzer" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
            <BuzzerDeviceIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="devices/sos" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
            <SosDeviceIndexPage />
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

        {/* Module Routes - Super Admin only */}
        <Route path="modules" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <ModuleIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="modules/create" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <ModuleCreatePage />
          </RoleBasedRoute>
        } />
        <Route path="modules/:id/edit" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <ModuleEditPage />
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

        {/* User Management Routes - Super Admin only */}
        <Route path="users" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <UserIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="users/create" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <UserCreatePage />
          </RoleBasedRoute>
        } />
        <Route path="users/:id" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <UserShowPage />
          </RoleBasedRoute>
        } />
        <Route path="users/:id/edit" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <UserEditPage />
          </RoleBasedRoute>
        } />

        {/* Wallet Management Routes - Super Admin only */}
        <Route path="wallet" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <WalletIndexPage />
          </RoleBasedRoute>
        } />

        {/* My Wallet Route - All authenticated users */}
        <Route path="my-wallet" element={
          <MyWalletPage />
        } />

        {/* Transaction Routes - Super Admin only */}
        <Route path="transactions" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <TransactionIndexPage />
          </RoleBasedRoute>
        } />

        {/* Wallet Transactions Route - Super Admin only */}
        <Route path="wallet/:walletId/transactions" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <WalletTransactionsPage />
          </RoleBasedRoute>
        } />

        {/* User Transactions Route - All authenticated users */}
        <Route path="my-transactions" element={
          <UserTransactionsPage />
        } />

        {/* Alert System Routes - Super Admin only */}
        <Route path="alert-system" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <AlertSystemIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="alert-system/:id" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <AlertSystemShowPage />
          </RoleBasedRoute>
        } />

        {/* Geofence Routes - Super Admin only */}
        <Route path="alert-system/:instituteId/geofences/create" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <GeofenceCreatePage />
          </RoleBasedRoute>
        } />
        <Route path="alert-system/:instituteId/geofences/:id" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <GeofenceViewPage />
          </RoleBasedRoute>
        } />
        <Route path="alert-system/:instituteId/geofences/:id/edit" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <GeofenceEditPage />
          </RoleBasedRoute>
        } />

        {/* Radar Routes - Super Admin only */}
        <Route path="alert-system/:instituteId/radars" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <RadarIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="alert-system/:instituteId/radars/create" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <RadarCreatePage />
          </RoleBasedRoute>
        } />
        <Route path="alert-system/:instituteId/radars/:id" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <RadarViewPage />
          </RoleBasedRoute>
        } />
        <Route path="alert-system/:instituteId/radars/:id/edit" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <RadarEditPage />
          </RoleBasedRoute>
        } />

        {/* Buzzer Routes - Super Admin only */}
        <Route path="alert-system/:instituteId/buzzers" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <BuzzerIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="alert-system/:instituteId/buzzers/create" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <BuzzerCreatePage />
          </RoleBasedRoute>
        } />
        <Route path="alert-system/:instituteId/buzzers/:id" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <BuzzerViewPage />
          </RoleBasedRoute>
        } />
        <Route path="alert-system/:instituteId/buzzers/:id/edit" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <BuzzerEditPage />
          </RoleBasedRoute>
        } />

        {/* Switch Routes - Super Admin only */}
        <Route path="alert-system/:instituteId/switches" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <SwitchIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="alert-system/:instituteId/switches/create" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <SwitchCreatePage />
          </RoleBasedRoute>
        } />
        <Route path="alert-system/:instituteId/switches/:id" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <SwitchViewPage />
          </RoleBasedRoute>
        } />
        <Route path="alert-system/:instituteId/switches/:id/edit" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <SwitchEditPage />
          </RoleBasedRoute>
        } />

        {/* Contact Routes - Super Admin only */}
        <Route path="alert-system/:instituteId/contacts" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <ContactIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="alert-system/:instituteId/contacts/create" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <ContactCreatePage />
          </RoleBasedRoute>
        } />
        <Route path="alert-system/:instituteId/contacts/:id" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <ContactViewPage />
          </RoleBasedRoute>
        } />
        <Route path="alert-system/:instituteId/contacts/:id/edit" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <ContactEditPage />
          </RoleBasedRoute>
        } />

        {/* Alert Type Routes - Super Admin only */}
        <Route path="alert-types" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <AlertTypeIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="alert-types/create" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <AlertTypeCreatePage />
          </RoleBasedRoute>
        } />
        <Route path="alert-types/:id/edit" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <AlertTypeEditPage />
          </RoleBasedRoute>
        } />

        {/* Alert History Routes - Super Admin only */}
        <Route path="alert-history" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <AlertHistoryIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="alert-history/:id" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <AlertHistoryViewPage />
          </RoleBasedRoute>
        } />
      </Route>

      {/* Radar Show Page - Public access via token (outside Layout, full screen) */}
      <Route path="alert-system/radar/token/:token" element={<RadarShowPage />} />
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
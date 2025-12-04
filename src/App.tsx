import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RefreshProvider } from './contexts/RefreshContext';
import { useAuth } from './hooks/useAuth';
import LoginPage from './views/auth/LoginPage';
import RegisterPage from './views/auth/RegisterPage';
import ForgotPasswordPage from './views/auth/ForgotPasswordPage';
import VerifyForgotPasswordOTPPage from './views/auth/VerifyForgotPasswordOTPPage';
import ResetPasswordPage from './views/auth/ResetPasswordPage';
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
import { GeofenceCreatePage, GeofenceEditPage } from './views/alertSystem/geofences';
import { RadarIndexPage, RadarCreatePage, RadarEditPage } from './views/alertSystem/radars';
import RadarShowPage from './views/alertSystem/radars/RadarShowPage';
import { BuzzerIndexPage, BuzzerCreatePage, BuzzerEditPage } from './views/alertSystem/buzzers';
import { SwitchIndexPage, SwitchCreatePage, SwitchEditPage } from './views/alertSystem/switches';
import { ContactIndexPage, ContactCreatePage, ContactEditPage } from './views/alertSystem/contacts';
import { AlertTypeIndexPage, AlertTypeCreatePage, AlertTypeEditPage } from './views/alertSystem/alertTypes';
import { AlertHistoryIndexPage, AlertHistoryViewPage } from './views/alertHistory';
import { SubscriptionPlanIndexPage, SubscriptionPlanCreatePage, SubscriptionPlanEditPage } from './views/subscriptionPlans';
import { ProductCatalogPage, CartPage, OrderCreatePage, OrderIndexPage, OrderShowPage } from './views/deviceOrders';
import { UserIndexPage, UserShowPage, UserCreatePage, UserEditPage } from './views/users';
import AddUserPage from './views/users/AddUserPage';
import SchoolIndexPage from './views/school/SchoolIndexPage';
import SchoolShowPage from './views/school/SchoolShowPage';
import { SchoolBusCreatePage, SchoolBusEditPage } from './views/school/schoolBuses';
import SchoolBusViewPage from './views/school/schoolBuses/SchoolBusViewPage';
import SchoolParentCreatePage from './views/school/schoolParents/SchoolParentCreatePage';
import SchoolParentEditPage from './views/school/schoolParents/SchoolParentEditPage';
import SchoolParentViewPage from './views/school/schoolParents/SchoolParentViewPage';
import SchoolSMSCreatePage from './views/school/schoolSMS/SchoolSMSCreatePage';
import SchoolSMSEditPage from './views/school/schoolSMS/SchoolSMSEditPage';
import GarbageIndexPage from './views/garbage/GarbageIndexPage';
import GarbageShowPage from './views/garbage/GarbageShowPage';
import GarbageVehicleCreatePage from './views/garbage/garbageVehicles/GarbageVehicleCreatePage';
import PublicVehicleIndexPage from './views/publicVehicle/PublicVehicleIndexPage';
import PublicVehicleShowPage from './views/publicVehicle/PublicVehicleShowPage';
import PublicVehicleViewPage from './views/publicVehicle/PublicVehicleViewPage';
import PublicVehicleCreatePage from './views/publicVehicle/PublicVehicleCreatePage';
import PublicVehicleEditPage from './views/publicVehicle/PublicVehicleEditPage';
import { WalletIndexPage, MyWalletPage } from './views/wallet';
import { TransactionIndexPage, WalletTransactionsPage, UserTransactionsPage } from './views/transactions';
import PaymentCallbackPage from './views/payment/PaymentCallbackPage';
import { DueTransactionIndexPage, DueTransactionShowPage } from './views/dueTransactions';
import DueTransactionEditPage from './views/dueTransactions/DueTransactionEditPage';
import { LunaTagIndexPage, LunaTagCreatePage, LunaTagEditPage } from './views/lunaTags';
import { UserLunaTagIndexPage, UserLunaTagCreatePage, UserLunaTagEditPage } from './views/userLunaTags';
import { CampaignIndexPage, CampaignCreatePage, CampaignEditPage, CampaignViewPage } from './views/phoneCall';
import { PopupIndexPage, PopupCreatePage, PopupEditPage, PopupShowPage } from './views/notices/popups';
import { NotificationIndexPage, NotificationCreatePage, NotificationShowPage } from './views/notices/notifications';
import { BannerIndexPage, BannerCreatePage, BannerEditPage, BannerShowPage } from './views/notices/banners';
import SettingsPage from './views/settings/SettingsPage';
import { VehicleTagIndexPage, BulkTagPage, VehicleTagAlertPage, VehicleTagHistoryPage } from './views/vehicleTag';
import RoleBasedRoute from './components/role-based/RoleBasedRoute';
import ModuleBasedRoute from './components/role-based/ModuleBasedRoute';
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
      <Route path="/register" element={
        <PublicRoute>
          <RegisterPage />
        </PublicRoute>
      } />
      <Route path="/forgot-password" element={
        <PublicRoute>
          <ForgotPasswordPage />
        </PublicRoute>
      } />
      <Route path="/verify-forgot-password-otp" element={
        <PublicRoute>
          <VerifyForgotPasswordOTPPage />
        </PublicRoute>
      } />
      <Route path="/reset-password" element={
        <PublicRoute>
          <ResetPasswordPage />
        </PublicRoute>
      } />

      {/* Public shared tracking route - no authentication required */}
      <Route path="/share-track/:token" element={<SharedTrackPage />} />
      
      {/* Payment callback route - accessible from ConnectIPS redirect */}
      <Route path="/payment/callback" element={<PaymentCallbackPage />} />
      
      {/* Vehicle Tag Alert Page - Public access (no login required) */}
      <Route path="/vehicle-tag/alert/:vtid" element={<VehicleTagAlertPage />} />

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

        {/* Luna Tag Routes - Super Admin only */}
        <Route path="luna-tags" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <LunaTagIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="luna-tags/create" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <LunaTagCreatePage />
          </RoleBasedRoute>
        } />
        <Route path="luna-tags/edit/:id" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <LunaTagEditPage />
          </RoleBasedRoute>
        } />

        {/* User Luna Tag Routes - All authenticated users */}
        <Route path="user-luna-tags" element={
          <UserLunaTagIndexPage />
        } />
        <Route path="user-luna-tags/create" element={
          <UserLunaTagCreatePage />
        } />
        <Route path="user-luna-tags/edit/:id" element={
          <UserLunaTagEditPage />
        } />

        {/* Vehicle Routes - All roles can access */}
        <Route path="vehicles" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER, ROLES.CUSTOMER]}>
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

        {/* Vehicle Access Routes - All roles can access */}
        <Route path="vehicle-access" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER, ROLES.CUSTOMER]}>
            <VehicleAccessIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="vehicle-access/create" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER, ROLES.CUSTOMER]}>
            <VehicleAccessCreatePage />
          </RoleBasedRoute>
        } />
        <Route path="vehicle-access/edit/:id" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER, ROLES.CUSTOMER]}>
            <VehicleAccessEditPage />
          </RoleBasedRoute>
        } />
        <Route path="vehicle-access/manage/:imei" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER, ROLES.CUSTOMER]}>
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

        {/* Device Order Routes - Dealer and Super Admin only */}
        <Route path="device-orders/catalog" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
            <ProductCatalogPage />
          </RoleBasedRoute>
        } />
        <Route path="device-orders/cart" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
            <CartPage />
          </RoleBasedRoute>
        } />
        <Route path="device-orders/checkout" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
            <OrderCreatePage />
          </RoleBasedRoute>
        } />
        <Route path="device-orders" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
            <OrderIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="device-orders/:id" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
            <OrderShowPage />
          </RoleBasedRoute>
        } />

        {/* User Management Routes - Super Admin only */}
        <Route path="users" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <UserIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="users/add" element={<AddUserPage />} />
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

        {/* Notice Routes - Super Admin only */}
        {/* Popup Routes */}
        <Route path="notices/popups" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <PopupIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="notices/popups/create" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <PopupCreatePage />
          </RoleBasedRoute>
        } />
        <Route path="notices/popups/:id" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <PopupShowPage />
          </RoleBasedRoute>
        } />
        <Route path="notices/popups/:id/edit" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <PopupEditPage />
          </RoleBasedRoute>
        } />

        {/* Notification Routes */}
        <Route path="notices/notifications" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <NotificationIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="notices/notifications/create" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <NotificationCreatePage />
          </RoleBasedRoute>
        } />
        <Route path="notices/notifications/:id" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <NotificationShowPage />
          </RoleBasedRoute>
        } />

        {/* Banner Routes */}
        <Route path="notices/banners" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <BannerIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="notices/banners/create" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <BannerCreatePage />
          </RoleBasedRoute>
        } />
        <Route path="notices/banners/:id" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <BannerShowPage />
          </RoleBasedRoute>
        } />
        <Route path="notices/banners/:id/edit" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <BannerEditPage />
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

        {/* Due Transaction Routes - All authenticated users */}
        <Route path="due-transactions" element={
          <DueTransactionIndexPage />
        } />
        <Route path="due-transactions/:id" element={
          <DueTransactionShowPage />
        } />
        <Route path="due-transactions/:id/edit" element={
          <DueTransactionEditPage />
        } />

        {/* Alert System Routes - Super Admin or Institute Module access */}
        <Route path="alert-system" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="alert-system">
            <AlertSystemIndexPage />
          </ModuleBasedRoute>
        } />
        <Route path="alert-system/:id" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="alert-system">
            <AlertSystemShowPage />
          </ModuleBasedRoute>
        } />

        {/* Geofence Routes - Super Admin or Institute Module access */}
        <Route path="alert-system/:instituteId/geofences/create" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="alert-system">
            <GeofenceCreatePage />
          </ModuleBasedRoute>
        } />
        <Route path="alert-system/:instituteId/geofences/:id/edit" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="alert-system">
            <GeofenceEditPage />
          </ModuleBasedRoute>
        } />

        {/* Radar Routes - Super Admin or Institute Module access */}
        <Route path="alert-system/:instituteId/radars" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="alert-system">
            <RadarIndexPage />
          </ModuleBasedRoute>
        } />
        <Route path="alert-system/:instituteId/radars/create" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="alert-system">
            <RadarCreatePage />
          </ModuleBasedRoute>
        } />
        <Route path="alert-system/:instituteId/radars/:id/edit" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="alert-system">
            <RadarEditPage />
          </ModuleBasedRoute>
        } />

        {/* Buzzer Routes - Super Admin or Institute Module access */}
        <Route path="alert-system/:instituteId/buzzers" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="alert-system">
            <BuzzerIndexPage />
          </ModuleBasedRoute>
        } />
        <Route path="alert-system/:instituteId/buzzers/create" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="alert-system">
            <BuzzerCreatePage />
          </ModuleBasedRoute>
        } />
        <Route path="alert-system/:instituteId/buzzers/:id/edit" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="alert-system">
            <BuzzerEditPage />
          </ModuleBasedRoute>
        } />

        {/* Switch Routes - Super Admin or Institute Module access */}
        <Route path="alert-system/:instituteId/switches" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="alert-system">
            <SwitchIndexPage />
          </ModuleBasedRoute>
        } />
        <Route path="alert-system/:instituteId/switches/create" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="alert-system">
            <SwitchCreatePage />
          </ModuleBasedRoute>
        } />
        <Route path="alert-system/:instituteId/switches/:id/edit" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="alert-system">
            <SwitchEditPage />
          </ModuleBasedRoute>
        } />

        {/* Contact Routes - Super Admin or Institute Module access */}
        <Route path="alert-system/:instituteId/contacts" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="alert-system">
            <ContactIndexPage />
          </ModuleBasedRoute>
        } />
        <Route path="alert-system/:instituteId/contacts/create" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="alert-system">
            <ContactCreatePage />
          </ModuleBasedRoute>
        } />
        <Route path="alert-system/:instituteId/contacts/:id/edit" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="alert-system">
            <ContactEditPage />
          </ModuleBasedRoute>
        } />

        {/* Alert Type Routes - Super Admin or Institute Module access */}
        <Route path="alert-types" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="alert-system">
            <AlertTypeIndexPage />
          </ModuleBasedRoute>
        } />
        <Route path="alert-types/create" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="alert-system">
            <AlertTypeCreatePage />
          </ModuleBasedRoute>
        } />
        <Route path="alert-types/:id/edit" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="alert-system">
            <AlertTypeEditPage />
          </ModuleBasedRoute>
        } />

        {/* Alert History Routes - Super Admin or Institute Module access */}
        <Route path="alert-history" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="alert-system">
            <AlertHistoryIndexPage />
          </ModuleBasedRoute>
        } />
        <Route path="alert-history/:id" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="alert-system">
            <AlertHistoryViewPage />
          </ModuleBasedRoute>
        } />

        {/* Phone Call Campaign Routes - Super Admin only */}
        <Route path="phone-call/campaigns" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <CampaignIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="phone-call/campaigns/create" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <CampaignCreatePage />
          </RoleBasedRoute>
        } />
        <Route path="phone-call/campaigns/:id" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <CampaignViewPage />
          </RoleBasedRoute>
        } />
        <Route path="phone-call/campaigns/:id/edit" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <CampaignEditPage />
          </RoleBasedRoute>
        } />

        {/* School Routes - Super Admin or users with school module access */}
        <Route path="school" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="school">
            <SchoolIndexPage />
          </ModuleBasedRoute>
        } />
        <Route path="school/:id" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="school">
            <SchoolShowPage />
          </ModuleBasedRoute>
        } />
        <Route path="school/:id/buses/create" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="school">
            <SchoolBusCreatePage />
          </ModuleBasedRoute>
        } />
        <Route path="school/:id/buses/:busId" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="school">
            <SchoolBusViewPage />
          </ModuleBasedRoute>
        } />
        <Route path="school/:id/buses/:busId/edit" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="school">
            <SchoolBusEditPage />
          </ModuleBasedRoute>
        } />
        <Route path="school/:id/parents/create" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="school">
            <SchoolParentCreatePage />
          </ModuleBasedRoute>
        } />
        <Route path="school/:id/parents/:parentId" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="school">
            <SchoolParentViewPage />
          </ModuleBasedRoute>
        } />
        <Route path="school/:id/parents/:parentId/edit" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="school">
            <SchoolParentEditPage />
          </ModuleBasedRoute>
        } />
        <Route path="school/:id/sms/create" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="school">
            <SchoolSMSCreatePage />
          </ModuleBasedRoute>
        } />
        <Route path="school/:id/sms/:smsId/edit" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="school">
            <SchoolSMSEditPage />
          </ModuleBasedRoute>
        } />

        {/* Garbage Routes - Super Admin or users with garbage module access */}
        <Route path="garbage" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="garbage">
            <GarbageIndexPage />
          </ModuleBasedRoute>
        } />
        <Route path="garbage/:id" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="garbage">
            <GarbageShowPage />
          </ModuleBasedRoute>
        } />
        <Route path="garbage/:id/vehicles/create" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="garbage">
            <GarbageVehicleCreatePage />
          </ModuleBasedRoute>
        } />

        {/* Public Vehicle Routes - Super Admin or users with public-vehicle module access */}
        <Route path="public-vehicle" element={
          <ModuleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]} moduleType="public-vehicle">
            <PublicVehicleIndexPage />
          </ModuleBasedRoute>
        } />
        <Route path="public-vehicle/:id" element={
          <ModuleBasedRoute moduleType="public-vehicle">
            <PublicVehicleShowPage />
          </ModuleBasedRoute>
        } />
        <Route path="public-vehicle/:id/vehicles/create" element={
          <ModuleBasedRoute moduleType="public-vehicle">
            <PublicVehicleCreatePage />
          </ModuleBasedRoute>
        } />
        <Route path="public-vehicle/:id/vehicles/:vehicleId" element={
          <ModuleBasedRoute moduleType="public-vehicle">
            <PublicVehicleViewPage />
          </ModuleBasedRoute>
        } />
        <Route path="public-vehicle/:id/vehicles/:vehicleId/edit" element={
          <ModuleBasedRoute moduleType="public-vehicle">
            <PublicVehicleEditPage />
          </ModuleBasedRoute>
        } />

        {/* Vehicle Tag Routes - Super Admin only */}
        <Route path="vehicle-tag" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <VehicleTagIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="vehicle-tag/bulk" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <BulkTagPage />
          </RoleBasedRoute>
        } />
        <Route path="vehicle-tag/history" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <VehicleTagHistoryPage />
          </RoleBasedRoute>
        } />

        {/* Settings Route - Super Admin only */}
        <Route path="settings" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
            <SettingsPage />
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
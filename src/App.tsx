import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import LoginPage from './views/auth/LoginPage';
import DashboardPage from './views/DashboardPage';
import Layout from './components/layout/Layout';
import { DeviceIndexPage, DeviceCreatePage, DeviceEditPage } from './views/devices';
import { VehicleIndexPage, VehicleCreatePage, VehicleEditPage } from './views/vehicles';
import { RechargeIndexPage, RechargeCreatePage } from './views/recharges';
import { ReportIndexPage } from './views/reports';
import { PlaybackIndexPage } from './views/playback';
import RoleBasedRoute from './components/role-based/RoleBasedRoute';
import { ROLES } from './utils/roleUtils';

import './styles/variables.css';
import './styles/components.css';
import LiveTrackingIndexPage from './views/live_tracking/LiveTrackingIndexPage';
import LiveTrackingShowPage from './views/live_tracking/LiveTrackingShowPage';

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
    
    if (user.role) {
      const userRole = typeof user.role === 'string' ? user.role : user.role.name;
      
      if (userRole === ROLES.SUPER_ADMIN) {
        redirectPath = '/dashboard';
      } else if (userRole === ROLES.DEALER || userRole === ROLES.CUSTOMER) {
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

        {/* Recharge Routes - Super Admin and Dealer only */}
        <Route path="recharges" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
            <RechargeIndexPage />
          </RoleBasedRoute>
        } />
        <Route path="recharges/create" element={
          <RoleBasedRoute allowedRoles={[ROLES.SUPER_ADMIN, ROLES.DEALER]}>
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
      </Route>
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
};

export default App;
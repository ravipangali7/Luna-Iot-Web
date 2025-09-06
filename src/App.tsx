import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import LoginPage from './views/auth/LoginPage';
import DashboardPage from './views/DashboardPage';
import Layout from './components/layout/Layout';
import { DeviceIndexPage, DeviceCreatePage, DeviceEditPage } from './views/devices';
import { VehicleIndexPage, VehicleCreatePage, VehicleEditPage } from './views/vehicles';
import { ReportIndexPage, ReportShowPage } from './views/reports';
import { PlaybackIndexPage, PlaybackShowPage } from './views/playback';

import './styles/variables.css';
import './styles/components.css';
import LiveTrackingIndexPage from './views/live_tracking/LiveTrackingIndexPage';

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

  // Fix: Redirect to dashboard if user is already logged in
  return !user ? <>{children}</> : <Navigate to="/dashboard" replace />;
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
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Device Routes */}
        <Route path="devices" element={<DeviceIndexPage />} />
        <Route path="devices/create" element={<DeviceCreatePage />} />
        <Route path="devices/edit/:imei" element={<DeviceEditPage />} />

        {/* Vehicle Routes */}
        <Route path="vehicles" element={<VehicleIndexPage />} />
        <Route path="vehicles/create" element={<VehicleCreatePage />} />
        <Route path="vehicles/edit/:imei" element={<VehicleEditPage />} />

        {/* Report Routes */}
        <Route path="live-tracking" element={<LiveTrackingIndexPage />} />
        <Route path="live-tracking/:imei" element={<ReportShowPage />} />

        {/* Report Routes */}
        <Route path="reports" element={<ReportIndexPage />} />
        <Route path="reports/:imei" element={<ReportShowPage />} />

        {/* Playback Routes */}
        <Route path="playback" element={<PlaybackIndexPage />} />
        <Route path="playback/:imei" element={<PlaybackShowPage />} />
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
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socketService, { type DeviceMonitoringMessage } from '../services/socketService';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../utils/roleUtils';
import { deviceService } from '../api/services/deviceService';
import { vehicleService } from '../api/services/vehicleService';
import type { Device } from '../types/device';
import type { Vehicle } from '../types/vehicle';
import Container from '../components/ui/layout/Container';
import Card from '../components/ui/cards/Card';
import CardBody from '../components/ui/cards/CardBody';
import Button from '../components/ui/buttons/Button';
import Spinner from '../components/ui/common/Spinner';
import Alert from '../components/ui/common/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const DeviceMonitoringShowPage: React.FC = () => {
  const { imei } = useParams<{ imei: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<DeviceMonitoringMessage[]>([]);
  const [filteredMessages, setFilteredMessages] = useState<DeviceMonitoringMessage[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [, setDevice] = useState<Device | null>(null);
  const [, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if user is super admin
  const isSuperAdmin = user?.roles?.some(role => role.name === ROLES.SUPER_ADMIN) || false;

  const loadDeviceData = useCallback(async () => {
    if (!imei) return;

    try {
      setLoading(true);
      setError(null);

      // Load device data
      const deviceResult = await deviceService.getDeviceByImei(imei);
      if (deviceResult.success && deviceResult.data) {
        setDevice(deviceResult.data);
      }

      // Try to find associated vehicle
      try {
        const vehicleResult = await vehicleService.getVehicleByImei(imei);
        if (vehicleResult.success && vehicleResult.data) {
          setVehicle(vehicleResult.data);
        }
      } catch (e) {
        console.log(e);
        // Vehicle might not exist, that's okay
        console.log('No vehicle found for IMEI:', imei);
      }

    } catch (error) {
      console.error('Error loading device data:', error);
      setError('Failed to load device information');
    } finally {
      setLoading(false);
    }
  }, [imei]);

  useEffect(() => {
    if (!imei) {
      setError('IMEI parameter is required');
      setLoading(false);
      return;
    }

    // Only proceed if user is super admin
    if (!isSuperAdmin) {
      setError('Access denied - Super Admin required');
      setLoading(false);
      return;
    }

    // Load device and vehicle data
    loadDeviceData();

    // Connect to socket
    socketService.connect();

    // Set up event listeners
    socketService.onConnectionChange((connected) => {
      setIsConnected(connected);
    });

    socketService.onMessageReceived((message) => {
      setMessages(prev => [...prev, message]);
    });

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, [imei, loadDeviceData, isSuperAdmin]);

  // Filter messages for this specific IMEI
  useEffect(() => {
    if (imei) {
      const filtered = messages.filter(message => 
        message.message.toLowerCase().includes(imei.toLowerCase())
      );
      setFilteredMessages(filtered);
    }
  }, [messages, imei]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredMessages, autoScroll]);

  const refreshMonitoring = () => {
    socketService.clearMessages();
    setMessages([]);
    setFilteredMessages([]);
  };


  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center min-h-64">
          <Spinner size="lg" />
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert variant="danger" dismissible={false}>
          {error}
        </Alert>
        <div className="mt-4">
          <Button onClick={() => navigate('/monitoring/device')} variant="secondary">
            <ArrowBackIcon className="w-4 h-4 mr-2" />
            Back to Device Monitoring
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Device Monitoring</h1>
              <p className="text-gray-600">IMEI: {imei}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Monitoring Console */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Monitoring Console</h3>
              <div className="flex items-center space-x-2">
                {/* Auto-scroll toggle */}
                <Button
                  onClick={() => setAutoScroll(!autoScroll)}
                  variant={autoScroll ? 'primary' : 'secondary'}
                  size="sm"
                >
                  {autoScroll ? '↓ Auto-scroll' : '↑ Manual'}
                </Button>
                
                {/* Refresh button */}
                <Button
                  onClick={refreshMonitoring}
                  variant="outline"
                  size="sm"
                >
                  ↻ Refresh
                </Button>
              </div>
            </div>

            {/* Messages Container */}
            <div className="h-96 bg-black text-green-400 font-mono overflow-y-auto rounded-lg p-4">
              {filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <div className="text-6xl mb-4">🖥️</div>
                  <h3 className="text-xl font-semibold mb-2">No monitoring data for this device</h3>
                  <p className="text-sm">Waiting for device activity...</p>
                  <div className="mt-4 flex items-center">
                    <span className="text-green-400">$</span>
                    <span className="animate-pulse ml-2">_</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMessages.map((message, index) => (
                    <div
                      key={index}
                      className="rounded-lg p-4 hover:bg-gray-800 transition-colors"
                    >
                      <div className="text-sm text-green-500 font-mono whitespace-pre-wrap">
                        {message.message}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
};

export default DeviceMonitoringShowPage;

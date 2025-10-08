import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/config';
import { ROLES } from '../utils/roleUtils';
import type { User } from '../types/auth';

export interface DeviceMonitoringMessage {
  message: string;
  timestamp?: string;
}

export interface StatusUpdate {
  imei: string;
  [key: string]: unknown;
}

export interface LocationUpdate {
  imei: string;
  [key: string]: unknown;
}

class SocketService {
  private socket: Socket | null = null;
  private serverUrl: string;
  private isConnected: boolean = false;
  private deviceMonitoringMessages: DeviceMonitoringMessage[] = [];
  private statusUpdates: Map<string, StatusUpdate> = new Map();
  private locationUpdates: Map<string, LocationUpdate> = new Map();
  private currentTrackingImei: string | null = null;
  private currentUser: User | null = null;

  // Event listeners
  private listeners: {
    onConnectionChange?: (connected: boolean) => void;
    onMessageReceived?: (message: DeviceMonitoringMessage) => void;
    onStatusUpdate?: (imei: string, status: StatusUpdate) => void;
    onLocationUpdate?: (imei: string, location: LocationUpdate) => void;
  } = {};

  constructor() {
    // Use the socket URL from config
    this.serverUrl = API_CONFIG.SOCKET_URL;
  }

  // Set current user for role-based access control
  setCurrentUser(user: User | null): void {
    this.currentUser = user;
  }

  // Check if current user is super admin
  private isSuperAdmin(): boolean {
    if (!this.currentUser?.roles || this.currentUser.roles.length === 0) {
      return false;
    }
    return this.currentUser.roles.some(role => role.name === ROLES.SUPER_ADMIN);
  }

  connect(): void {
    // If already connected, don't reconnect
    if (this.socket && this.isConnected) {
      return;
    }

    // If socket exists but not connected, dispose it first
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    try {
      this.socket = io(this.serverUrl, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10,
        timeout: 20000,
        forceNew: true,
      });

      this.setupEventListeners();
    } catch {
      this.isConnected = false;
      this.listeners.onConnectionChange?.(false);
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) {
      return;
    }

    // Socket event listeners
    this.socket.on('connect', () => {
      this.isConnected = true;
      this.listeners.onConnectionChange?.(true);
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      this.listeners.onConnectionChange?.(false);
    });

    this.socket.on('connect_error', () => {
      this.isConnected = false;
      this.listeners.onConnectionChange?.(false);
    });

    this.socket.on('reconnect_error', () => {
      this.isConnected = false;
      this.listeners.onConnectionChange?.(false);
    });

    this.socket.on('reconnect_failed', () => {
      this.isConnected = false;
      this.listeners.onConnectionChange?.(false);
    });

    this.socket.on('reconnect', () => {
      this.isConnected = true;
      this.listeners.onConnectionChange?.(true);
    });

    // Listen for Device Monitoring messages (Super Admin only)
    this.socket.on('device_monitoring', (data: unknown) => {
      // Check if user is super admin before processing device monitoring data
      if (!this.isSuperAdmin()) {
        return;
      }

      try {
        let messageText = '';

        if (data && typeof data === 'object' && 'message' in data) {
          // New format: { message: "text" }
          if (data.message != null) {
            messageText = data.message.toString();
          }
        } else if (typeof data === 'string') {
          // Old format: direct string
          messageText = data;
        } else {
          // Fallback
          messageText = data?.toString() || '';
        }

        if (messageText) {
          const message: DeviceMonitoringMessage = {
            message: messageText,
            timestamp: new Date().toISOString(),
          };
          this.deviceMonitoringMessages.push(message);
          this.listeners.onMessageReceived?.(message);
        }
      } catch {
        const errorMessage: DeviceMonitoringMessage = {
          message: `Error processing: ${data}`,
          timestamp: new Date().toISOString(),
        };
        this.deviceMonitoringMessages.push(errorMessage);
        this.listeners.onMessageReceived?.(errorMessage);
      }
    });

    // Listen for Status Updates
    this.socket.on('status_update', (data: unknown) => {
      this.handleStatusUpdate(data);
      // Also notify vehicle status callbacks
      this.vehicleStatusCallbacks.forEach(callback => callback(data));
    });

    // Listen for Location Updates
    this.socket.on('location_update', (data: unknown) => {
      this.handleLocationUpdate(data);
      // Also notify vehicle location callbacks
      this.vehicleLocationCallbacks.forEach(callback => callback(data));
    });

    // Listen for Vehicle Updates
    this.socket.on('vehicle_update', (data: unknown) => {
      this.vehicleUpdateCallbacks.forEach(callback => callback(data));
    });
  }

  private handleStatusUpdate(data: unknown): void {
    try {
      if (!data) {
        return;
      }

      if (data && typeof data === 'object' && 'imei' in data) {
        const imei = (data as { imei: unknown }).imei?.toString();
        if (imei) {
          // Only process if no tracking IMEI is set OR if this matches the tracking IMEI
          if (!this.currentTrackingImei || this.currentTrackingImei === imei) {
            const statusUpdate = { ...data } as StatusUpdate;
            this.statusUpdates.set(imei, statusUpdate);
            this.listeners.onStatusUpdate?.(imei, statusUpdate);
          }
        }
      }
    } catch {
      // Silent error handling
    }
  }

  private handleLocationUpdate(data: unknown): void {
    try {
      if (!data) {
        return;
      }

      if (data && typeof data === 'object' && 'imei' in data) {
        const imei = (data as { imei: unknown }).imei?.toString();
        if (imei) {
          // Only process if no tracking IMEI is set OR if this matches the tracking IMEI
          if (!this.currentTrackingImei || this.currentTrackingImei === imei) {
            const locationUpdate = { ...data } as LocationUpdate;
            this.locationUpdates.set(imei, locationUpdate);
            this.listeners.onLocationUpdate?.(imei, locationUpdate);
          }
        }
      }
    } catch {
      // Silent error handling
    }
  }

  sendMessage(message: string): void {
    if (this.isConnected && this.socket) {
      this.socket.emit('send_message', { message });
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.listeners.onConnectionChange?.(false);
  }

  clearMessages(): void {
    this.deviceMonitoringMessages = [];
  }

  // Getters
  get connected(): boolean {
    return this.isConnected;
  }

  get messages(): DeviceMonitoringMessage[] {
    return [...this.deviceMonitoringMessages];
  }

  getStatusForImei(imei: string): StatusUpdate | undefined {
    return this.statusUpdates.get(imei);
  }

  getLocationForImei(imei: string): LocationUpdate | undefined {
    return this.locationUpdates.get(imei);
  }

  // Set the current tracking IMEI - only process updates for this IMEI
  setTrackingImei(imei: string | null): void {
    this.currentTrackingImei = imei;
  }

  // Clear tracking IMEI - process all updates
  clearTrackingImei(): void {
    this.currentTrackingImei = null;
  }

  // Event listener management
  onConnectionChange(callback: (connected: boolean) => void): void {
    this.listeners.onConnectionChange = callback;
  }

  onMessageReceived(callback: (message: DeviceMonitoringMessage) => void): void {
    this.listeners.onMessageReceived = callback;
  }

  onStatusUpdate(callback: (imei: string, status: StatusUpdate) => void): void {
    this.listeners.onStatusUpdate = callback;
  }

  onLocationUpdate(callback: (imei: string, location: LocationUpdate) => void): void {
    this.listeners.onLocationUpdate = callback;
  }

  // Additional methods for compatibility with existing code
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  reconnect(): void {
    this.disconnect();
    this.connect();
  }

  // Vehicle update subscription methods
  private vehicleUpdateCallbacks: Set<(data: unknown) => void> = new Set();

  subscribeToVehicleUpdates(callback: (data: unknown) => void): void {
    this.vehicleUpdateCallbacks.add(callback);
  }

  unsubscribeFromVehicleUpdates(callback: (data: unknown) => void): void {
    this.vehicleUpdateCallbacks.delete(callback);
  }

  // Vehicle location and status subscription methods
  private vehicleLocationCallbacks: Set<(data: unknown) => void> = new Set();
  private vehicleStatusCallbacks: Set<(data: unknown) => void> = new Set();

  subscribeToVehicleLocation(callback: (data: unknown) => void): void {
    this.vehicleLocationCallbacks.add(callback);
  }

  unsubscribeFromVehicleLocation(callback: (data: unknown) => void): void {
    this.vehicleLocationCallbacks.delete(callback);
  }

  subscribeToVehicleStatus(callback: (data: unknown) => void): void {
    this.vehicleStatusCallbacks.add(callback);
  }

  unsubscribeFromVehicleStatus(callback: (data: unknown) => void): void {
    this.vehicleStatusCallbacks.delete(callback);
  }
}

// Create a singleton instance
export const socketService = new SocketService();
export default socketService;
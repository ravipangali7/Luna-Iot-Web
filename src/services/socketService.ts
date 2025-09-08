import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '../config/config';

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.connect();
  }

  private connect(): void {
    try {
      // Connect to the socket server
      this.socket = io(API_CONFIG.SOCKET_URL, {
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay,
        reconnectionDelayMax: 5000,
        upgrade: true,
        rememberUpgrade: true
      });

      this.socket.on('connect', () => {
        console.log('✅ Socket connected:', this.socket?.id);
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.socket.on('disconnect', (reason: string) => {
        console.log('❌ Socket disconnected:', reason);
        this.isConnected = false;

        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          this.handleReconnect();
        }
      });

      this.socket.on('connect_error', (error: any) => {
        console.error('❌ Socket connection error:', error);
        this.isConnected = false;
        this.handleReconnect();
      });

      this.socket.on('reconnect', (attemptNumber: number) => {
        console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.socket.on('reconnect_error', (error: any) => {
        console.error('Socket reconnection error:', error);
      });

      this.socket.on('reconnect_failed', (error: any) => {
        console.error('Socket reconnection failed:', error);
        this.isConnected = false;
      });

    } catch (error) {
      console.error('Failed to initialize socket:', error);
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

      setTimeout(() => {
        if (this.socket) {
          this.socket.connect();
        } else {
          this.connect();
        }
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Subscribe to vehicle status updates
  subscribeToVehicleStatus(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('status_update', callback);
    }
  }

  // Subscribe to vehicle location updates
  subscribeToVehicleLocation(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('location_update', callback);
    }
  }

  // Subscribe to all vehicle updates (combines status and location)
  subscribeToVehicleUpdates(callback: (data: any) => void): void {
    if (this.socket) {
      // Listen to both status and location updates
      this.socket.on('status_update', callback);
      this.socket.on('location_update', callback);
    }
  }

  // Unsubscribe from vehicle status updates
  unsubscribeFromVehicleStatus(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('status_update', callback);
    }
  }

  // Unsubscribe from vehicle location updates
  unsubscribeFromVehicleLocation(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('location_update', callback);
    }
  }

  // Unsubscribe from all vehicle updates
  unsubscribeFromVehicleUpdates(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('status_update', callback);
      this.socket.off('location_update', callback);
    }
  }

  // Emit events to server
  emit(event: string, data: any): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  // Get connection status
  getConnectionStatus(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }

  // Disconnect socket
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Reconnect socket
  reconnect(): void {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connect();
  }

  // Subscribe to device monitoring messages
  subscribeToDeviceMonitoring(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('device_monitoring', callback);
    }
  }

  // Unsubscribe from device monitoring messages
  unsubscribeFromDeviceMonitoring(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('device_monitoring', callback);
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;

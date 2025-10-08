import React, { useState, useEffect, useRef } from 'react';
import socketService, { type DeviceMonitoringMessage } from '../services/socketService';
import { useAuth } from '../hooks/useAuth';
import { ROLES } from '../utils/roleUtils';

const DeviceMonitoringPage: React.FC = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<DeviceMonitoringMessage[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if user is super admin
  const isSuperAdmin = user?.roles?.some(role => role.name === ROLES.SUPER_ADMIN) || false;

  useEffect(() => {
    // Only connect to socket if user is super admin
    if (isSuperAdmin) {
      // Connect to socket
      socketService.connect();

      // Set up event listeners
      socketService.onConnectionChange((connected) => {
        setIsConnected(connected);
      });

      socketService.onMessageReceived((message) => {
        setMessages(prev => [...prev, message]);
      });
    }

    // Cleanup on unmount
    return () => {
      if (isSuperAdmin) {
        socketService.disconnect();
      }
    };
  }, [isSuperAdmin]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, autoScroll]);

  const refreshMonitoring = () => {
    if (isSuperAdmin) {
      socketService.clearMessages();
      setMessages([]);
    }
  };

  // Show access denied message for non-super-admin users
  if (!isSuperAdmin) {
    return (
      <div className="h-[90vh] bg-black text-red-400 font-mono overflow-hidden flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-lg mb-4">Device Monitoring is restricted to Super Administrators only.</p>
          <p className="text-sm text-gray-400">
            Your role: {user?.roles?.map(role => role.name).join(', ') || 'No role assigned'}
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="h-[90vh] bg-black text-green-400 font-mono overflow-hidden flex flex-col">
      {/* Fixed Header */}
      <div className="bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-bold text-green-400">Device Monitoring</h1>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-300">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-3 py-1 rounded text-sm ${
              autoScroll 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-600 text-gray-300'
            }`}
            title={autoScroll ? 'Disable Auto-scroll' : 'Enable Auto-scroll'}
          >
            {autoScroll ? '↓' : '↑'}
          </button>
          
          {/* Refresh button */}
          <button
            onClick={refreshMonitoring}
            className="px-3 py-1 bg-gray-600 text-gray-300 rounded text-sm hover:bg-gray-500"
            title="Refresh Monitoring"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Messages Container - Takes remaining space */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <div className="text-6xl mb-4">🖥️</div>
            <h3 className="text-xl font-semibold mb-2">No monitoring data yet</h3>
            <p className="text-sm">Waiting for device activity...</p>
            <div className="mt-4 flex items-center">
              <span className="text-green-400">$</span>
              <span className="animate-pulse ml-2">_</span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message, index) => {
              // const messageType = getMessageType(message.message);
              // const messageColor = getMessageColor(messageType);
              // const messageIcon = getMessageIcon(messageType);
              
              return (
                <div
                  key={index}
                  className="rounded-lg p-4 hover:bg-gray-800 transition-colors"
                >
                  {/* Message header */}
                  {/* <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{messageIcon}</span>
                      <span className={`text-xs font-bold uppercase ${messageColor}`}>
                        {messageType}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatTime(message.timestamp)}
                    </span>
                  </div> */}
                  
                  {/* Message content */}
                  <div className="text-sm text-green-500 font-mono whitespace-pre-wrap">
                    {message.message}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceMonitoringPage;

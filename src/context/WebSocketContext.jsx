// src/context/WebSocketContext.jsx

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback
} from 'react';

import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './AuthContext';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error(
      'useWebSocket must be used within a WebSocketProvider'
    );
  }

  return context;
};

export const WebSocketProvider = ({ children }) => {
  const { user } = useAuth();

  const [isConnected, setIsConnected] = useState(false);

  const [bridgeDeviceId, setBridgeDeviceId] = useState(() => {
    return (
      localStorage.getItem('bridgeDeviceId') ||
      'bridge_1784353031921'
    );
  });

  const [bridgeConnected, setBridgeConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  const stompClientRef = useRef(null);
  const subscriptionsRef = useRef(new Map());
  const reconnectAttempts = useRef(0);

  const maxReconnectAttempts = 10;

  /*
   * IMPORTANT:
   *
   * Do NOT use:
   *
   * https://scanning-unused-dash.ngrok-free.dev/ws
   *
   * here.
   *
   * Using /ws makes the browser connect to:
   *
   * http://localhost:5174/ws
   *
   * and Vite proxies it to:
   *
   * https://scanning-unused-dash.ngrok-free.dev/ws
   *
   */

  const getWsUrl = useCallback(() => {
    return '/ws';
  }, []);

  /*
   * Setup subscriptions
   */
  const setupSubscriptions = useCallback(() => {
    if (
      !stompClientRef.current ||
      !stompClientRef.current.connected
    ) {
      console.warn(
        'Cannot setup subscriptions: WebSocket not connected'
      );

      return;
    }

    /*
     * Remove previous automatic subscriptions
     * before creating new ones.
     */
    subscriptionsRef.current.forEach((subscription, id) => {
      try {
        subscription.unsubscribe();
      } catch (error) {
        console.error(
          `Error removing subscription ${id}:`,
          error
        );
      }
    });

    subscriptionsRef.current.clear();

    const destinations = [
      '/topic/call-status',
      '/topic/call-requests',
      '/topic/call',
      `/topic/call/${bridgeDeviceId}`,
      '/user/queue/call',
      user?.username ? `/topic/attendance/${user.username}` : null
    ];

    destinations.filter(Boolean).forEach((destination) => {
      const subId = `sub-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 7)}`;

      try {
        const subscription =
          stompClientRef.current.subscribe(
            destination,
            (message) => {
              try {
                const data = JSON.parse(message.body);

                console.log(
                  `📨 Received on ${destination}:`,
                  data
                );

                if (destination.startsWith('/topic/attendance/')) {
                  window.dispatchEvent(new CustomEvent('attendance:update', { detail: data }));
                  return;
                }

                /*
                 * Handle call status updates
                 */
                if (
                  destination === '/topic/call-status' ||
                  destination ===
                    `/topic/call/${bridgeDeviceId}`
                ) {
                  if (
                    data.status ||
                    data.callStatus ||
                    data.state
                  ) {
                    window.dispatchEvent(
                      new CustomEvent(
                        'bridgeCallStatus',
                        {
                          detail: data
                        }
                      )
                    );
                  }
                }
              } catch (error) {
                /*
                 * Message is not JSON.
                 */
                console.log(
                  `📨 Raw message on ${destination}:`,
                  message.body
                );
              }
            }
          );

        subscriptionsRef.current.set(
          subId,
          subscription
        );
      } catch (error) {
        console.error(
          `Failed to subscribe to ${destination}:`,
          error
        );
      }
    });

    console.log('✅ Subscriptions setup complete');
  }, [bridgeDeviceId, user?.username]);

  /*
   * Register Android bridge device
   */
  const registerDevice = useCallback(() => {
    if (
      !stompClientRef.current ||
      !stompClientRef.current.connected
    ) {
      console.warn(
        'Cannot register device: WebSocket not connected'
      );

      return;
    }

    if (!user) {
      console.warn(
        'Cannot register device: No user'
      );

      return;
    }

    const deviceId = bridgeDeviceId;

    const registerMsg = {
      deviceId: deviceId,
      username: user.username || 'admin',
      deviceType: 'android_bridge'
    };

    console.log(
      '📱 Registering device:',
      registerMsg
    );

    try {
      stompClientRef.current.publish({
        destination: '/app/bridge/register',
        body: JSON.stringify(registerMsg)
      });

      /*
       * Registration response subscription
       */
      const subId = `register-${Date.now()}`;

      /*
       * Remove previous registration subscription
       * if it exists.
       */
      const existingRegistration =
        subscriptionsRef.current.get(
          'bridge-registration'
        );

      if (existingRegistration) {
        try {
          existingRegistration.unsubscribe();
        } catch (error) {
          console.error(
            'Error removing old registration subscription:',
            error
          );
        }

        subscriptionsRef.current.delete(
          'bridge-registration'
        );
      }

      const subscription =
        stompClientRef.current.subscribe(
          `/user/${deviceId}/queue/register`,
          (message) => {
            try {
              const data = JSON.parse(
                message.body
              );

              console.log(
                '✅ Device registration response:',
                data
              );

              if (data.status === 'success') {
                setBridgeConnected(true);

                localStorage.setItem(
                  'bridgeDeviceId',
                  deviceId
                );
              }
            } catch (error) {
              console.error(
                'Error parsing registration response:',
                error
              );
            }
          }
        );

      subscriptionsRef.current.set(
        'bridge-registration',
        subscription
      );

      console.log(
        '📱 Registration message sent successfully'
      );
    } catch (error) {
      console.error(
        'Error registering device:',
        error
      );
    }
  }, [user, bridgeDeviceId]);

  /*
   * Connect to STOMP WebSocket
   */
  const connect = useCallback(() => {
    /*
     * Don't create another connection if one already exists.
     */
    if (
      stompClientRef.current &&
      (
        stompClientRef.current.active ||
        stompClientRef.current.connected
      )
    ) {
      console.log(
        'WebSocket connection already active'
      );

      return;
    }

    const wsUrl = getWsUrl();

    console.log(
      '🔌 Connecting to WebSocket:',
      wsUrl
    );

    /*
     * Reset connection state
     */
    setConnectionError(null);

    const stompClient = new Client({
      /*
       * IMPORTANT:
       *
       * This is now /ws.
       *
       * Vite proxy will forward:
       *
       * /ws
       *
       * to:
       *
       * https://scanning-unused-dash.ngrok-free.dev/ws
       */
      webSocketFactory: () => {
        console.log(
          '🔌 Creating SockJS connection:',
          wsUrl
        );

        return new SockJS(wsUrl);
      },

      /*
       * STOMP debug logs
       */
      debug: (message) => {
        if (import.meta.env.DEV) {
          console.debug(
            'STOMP:',
            message
          );
        }
      },

      /*
       * Automatic reconnect
       */
      reconnectDelay: 5000,

      /*
       * Heartbeat
       */
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,

      /*
       * Successful connection
       */
      onConnect: () => {
        console.log(
          '✅ WebSocket connected'
        );

        setIsConnected(true);
        setConnectionError(null);

        reconnectAttempts.current = 0;

        /*
         * Register device
         */
        if (user) {
          registerDevice();
        }

        /*
         * Setup application subscriptions
         */
        setupSubscriptions();
      },

      /*
       * Disconnect
       */
      onDisconnect: () => {
        console.log(
          '❌ WebSocket disconnected'
        );

        setIsConnected(false);
        setBridgeConnected(false);
      },

      /*
       * STOMP error
       */
      onStompError: (frame) => {
        console.error(
          'STOMP error:',
          frame
        );

        const errorMessage =
          frame?.headers?.message ||
          'STOMP error';

        setConnectionError(
          errorMessage
        );

        setIsConnected(false);
      },

      /*
       * WebSocket error
       */
      onWebSocketError: (error) => {
        console.error(
          'WebSocket error:',
          error
        );

        setConnectionError(
          'WebSocket connection error'
        );

        setIsConnected(false);
      },

      /*
       * WebSocket close
       */
      onWebSocketClose: (event) => {
        console.log(
          '🔌 WebSocket closed:',
          event
        );

        setIsConnected(false);
        setBridgeConnected(false);
      }
    });

    /*
     * Save STOMP client
     */
    stompClientRef.current =
      stompClient;

    /*
     * Activate connection
     */
    stompClient.activate();

    /*
     * Cleanup function
     */
    return () => {
      console.log(
        '🧹 Cleaning up WebSocket connection'
      );

      /*
       * Unsubscribe everything
       */
      subscriptionsRef.current.forEach(
        (subscription, id) => {
          try {
            subscription.unsubscribe();
          } catch (error) {
            console.error(
              `Error unsubscribing ${id}:`,
              error
            );
          }
        }
      );

      subscriptionsRef.current.clear();

      /*
       * Deactivate STOMP client
       */
      if (stompClient) {
        try {
          stompClient.deactivate();
        } catch (error) {
          console.error(
            'Error deactivating STOMP:',
            error
          );
        }
      }

      if (
        stompClientRef.current ===
        stompClient
      ) {
        stompClientRef.current = null;
      }

      setIsConnected(false);
      setBridgeConnected(false);
    };
  }, [
    getWsUrl,
    user,
    registerDevice,
    setupSubscriptions
  ]);

  /*
   * Subscribe to a topic
   */
  const subscribe = useCallback(
    (destination, callback, id) => {
      if (
        !stompClientRef.current ||
        !stompClientRef.current.connected
      ) {
        console.warn(
          'Cannot subscribe: WebSocket not connected'
        );

        return null;
      }

      const subId =
        id ||
        `sub-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 7)}`;

      /*
       * Remove existing subscription with
       * same ID.
       */
      const existing =
        subscriptionsRef.current.get(
          subId
        );

      if (existing) {
        try {
          existing.unsubscribe();
        } catch (error) {
          console.error(
            'Error removing existing subscription:',
            error
          );
        }

        subscriptionsRef.current.delete(
          subId
        );
      }

      try {
        const subscription =
          stompClientRef.current.subscribe(
            destination,
            (message) => {
              try {
                const data =
                  JSON.parse(
                    message.body
                  );

                callback(data);
              } catch (error) {
                /*
                 * If message isn't JSON,
                 * return raw body.
                 */
                callback(
                  message.body
                );
              }
            }
          );

        subscriptionsRef.current.set(
          subId,
          subscription
        );

        console.log(
          '📡 Subscribed:',
          destination
        );

        return subId;
      } catch (error) {
        console.error(
          `Error subscribing to ${destination}:`,
          error
        );

        return null;
      }
    },
    []
  );

  /*
   * Unsubscribe
   */
  const unsubscribe = useCallback(
    (id) => {
      if (!id) {
        return;
      }

      const subscription =
        subscriptionsRef.current.get(
          id
        );

      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (error) {
          console.error(
            'Error unsubscribing:',
            error
          );
        }

        subscriptionsRef.current.delete(
          id
        );

        console.log(
          '📡 Unsubscribed:',
          id
        );
      }
    },
    []
  );

  /*
   * Send STOMP message
   */
  const sendMessage = useCallback(
    (destination, body) => {
      if (
        !stompClientRef.current ||
        !stompClientRef.current.connected
      ) {
        console.error(
          'Cannot send message: WebSocket not connected'
        );

        return false;
      }

      try {
        const messageBody =
          typeof body === 'string'
            ? body
            : JSON.stringify(body);

        stompClientRef.current.publish({
          destination: destination,
          body: messageBody
        });

        console.log(
          '📤 Message sent:',
          destination
        );

        return true;
      } catch (error) {
        console.error(
          'Error sending message:',
          error
        );

        return false;
      }
    },
    []
  );

  /*
   * Send bridge call request
   */
  const sendBridgeCallRequest =
    useCallback((request) => {
      if (
        !stompClientRef.current ||
        !stompClientRef.current.connected
      ) {
        console.error(
          'Cannot send call request: WebSocket not connected'
        );

        return false;
      }

      try {
        const message = {
          type: 'bridge_call',
          data: request
        };

        stompClientRef.current.publish({
          destination:
            '/app/bridge/call',
          body: JSON.stringify(
            message
          )
        });

        console.log(
          '📤 Sent bridge call request:',
          request
        );

        return true;
      } catch (error) {
        console.error(
          'Error sending call request:',
          error
        );

        return false;
      }
    }, []);

  /*
   * Send bridge status
   */
  const sendBridgeStatus =
    useCallback((status) => {
      if (
        !stompClientRef.current ||
        !stompClientRef.current.connected
      ) {
        console.error(
          'Cannot send status: WebSocket not connected'
        );

        return false;
      }

      try {
        const message = {
          type: 'call_status',
          data: status
        };

        stompClientRef.current.publish({
          destination:
            '/app/bridge/status',
          body: JSON.stringify(
            message
          )
        });

        console.log(
          '📤 Sent bridge status:',
          status
        );

        return true;
      } catch (error) {
        console.error(
          'Error sending status:',
          error
        );

        return false;
      }
    }, []);

  /*
   * Connect on mount
   */
  useEffect(() => {
    const cleanup = connect();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [connect]);

  /*
   * Re-register device when user changes
   * and WebSocket is connected.
   */
  useEffect(() => {
    if (user && isConnected) {
      registerDevice();
    }
  }, [
    user,
    isConnected,
    registerDevice
  ]);

  /*
   * Reconnect manually
   */
  const reconnect = useCallback(() => {
    console.log(
      '🔄 Manual WebSocket reconnect requested'
    );

    if (stompClientRef.current) {
      try {
        stompClientRef.current.deactivate();
      } catch (error) {
        console.error(
          'Error deactivating previous client:',
          error
        );
      }

      stompClientRef.current =
        null;
    }

    setIsConnected(false);
    setBridgeConnected(false);
    setConnectionError(null);

    reconnectAttempts.current = 0;

    setTimeout(() => {
      connect();
    }, 500);
  }, [connect]);

  /*
   * Context value
   */
  const value = {
    isConnected,
    connectionError,

    bridgeDeviceId,
    setBridgeDeviceId,

    bridgeConnected,
    setBridgeConnected,

    connect,
    reconnect,

    registerDevice,

    subscribe,
    unsubscribe,

    sendMessage,
    sendBridgeCallRequest,
    sendBridgeStatus
  };

  return (
    <WebSocketContext.Provider
      value={value}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

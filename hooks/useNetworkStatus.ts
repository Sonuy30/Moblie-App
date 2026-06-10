import React, { createContext, useContext, useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import type { NetInfoState } from '@react-native-community/netinfo';

interface NetworkStatus {
  isOnline: boolean;
  isInternetReachable: boolean | null;
  connectionType: string;
}

const NetworkStatusContext = createContext<NetworkStatus>({
  isOnline: true,
  isInternetReachable: true,
  connectionType: 'unknown',
});

export const NetworkStatusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true,
    isInternetReachable: true,
    connectionType: 'unknown',
  });

  useEffect(() => {
    // Get initial state
    void NetInfo.fetch().then((state) => {
      setStatus({
        isOnline: !!state.isConnected,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      });
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setStatus({
        isOnline: !!state.isConnected,
        isInternetReachable: state.isInternetReachable,
        connectionType: state.type,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return React.createElement(
    NetworkStatusContext.Provider,
    { value: status },
    children
  );
};

export const useNetworkStatus = () => {
  return useContext(NetworkStatusContext);
};

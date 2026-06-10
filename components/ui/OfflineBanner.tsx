import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export const OfflineBanner = () => {
  const { isOnline } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(false);
  const [bannerType, setBannerType] = useState<'offline' | 'reconnected' | null>(null);
  const [dismissed, setDismissed] = useState(false);
  
  const [fadeAnim] = useState(() => new Animated.Value(0));
  const [prevOnline, setPrevOnline] = useState(isOnline);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    const runTransition = () => {
      if (!isOnline) {
        setDismissed(false);
        setBannerType('offline');
        setVisible(true);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else if (isOnline && prevOnline === false) {
        setBannerType('reconnected');
        setVisible(true);
        fadeAnim.setValue(1);
        
        timer = setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(({ finished }) => {
            if (finished) {
              setVisible(false);
              setBannerType(null);
            }
          });
        }, 3000);
      } else {
        setVisible(false);
        setBannerType(null);
      }
    };

    // Defer state updates to avoid synchronous setState warnings in useEffect
    const defer = setTimeout(() => {
      runTransition();
      setPrevOnline(isOnline);
    }, 0);

    return () => {
      clearTimeout(defer);
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isOnline, prevOnline, fadeAnim]);

  const handleDismiss = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setDismissed(true);
        setVisible(false);
      }
    });
  };

  if (!visible || (bannerType === 'offline' && dismissed)) {
    return null;
  }

  const isOfflineMode = bannerType === 'offline';
  const backgroundColor = isOfflineMode ? '#E53E3E' : '#38A169';
  const message = isOfflineMode ? 'No Internet Connection. Some features may be unavailable.' : 'You are back online!';

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          opacity: fadeAnim,
          paddingTop: insets.top || 12,
          backgroundColor,
        },
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={isOfflineMode ? 'cloud-offline-outline' : 'checkmark-circle-outline'}
          size={20}
          color="#FFF"
          style={styles.icon}
        />
        <Text style={styles.text}>{message}</Text>
        {isOfflineMode && (
          <TouchableOpacity onPress={handleDismiss} style={styles.dismissButton}>
            <Ionicons name="close" size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  banner: {
    left: 0,
    paddingBottom: 8,
    paddingHorizontal: 16,
    position: 'absolute',
    right: 0,
    top: 0,
    width: '100%',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dismissButton: {
    marginLeft: 8,
    padding: 4,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#FFF',
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

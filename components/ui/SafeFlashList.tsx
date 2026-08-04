/**
 * components/ui/SafeFlashList.tsx — Safe FlashList wrapper for Expo Go
 *
 * Background:
 * `@shopify/flash-list` uses native C++/Java component `AutoLayoutView`.
 * In Expo Go on Android (managed workflow without native build), `AutoLayoutView`
 * is not registered in the native view config manager, causing Expo Go to crash:
 * `Invariant Violation: View config not found for component 'AutoLayoutView'`
 *
 * Solution:
 *  1. Checks `UIManager.getViewManagerConfig('AutoLayoutView')` at runtime.
 *  2. If native module is missing (Expo Go Android / Web), seamlessly falls back
 *     to standard React Native `<FlatList />`.
 *  3. Includes a React Class ErrorBoundary as a secondary fallback shield.
 */

import React, { Component, ReactNode } from 'react';
import { FlatList, FlatListProps, UIManager, Platform } from 'react-native';
import { FlashList as ShopifyFlashList, FlashListProps as ShopifyFlashListProps } from '@shopify/flash-list';

// Check if AutoLayoutView is registered in the native UIManager
const hasAutoLayoutNativeView = (): boolean => {
  if (Platform.OS === 'web') return false;
  try {
    const config = UIManager.getViewManagerConfig ? UIManager.getViewManagerConfig('AutoLayoutView') : (UIManager as any).AutoLayoutView;
    return !!config;
  } catch {
    return false;
  }
};

interface SafeFlashListState {
  hasError: boolean;
}

class SafeFlashListBoundary<T> extends Component<ShopifyFlashListProps<T>, SafeFlashListState> {
  state: SafeFlashListState = { hasError: false };

  static getDerivedStateFromError(): SafeFlashListState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('[SafeFlashList] Native FlashList failed, falling back to FlatList:', error?.message);
  }

  render(): ReactNode {
    if (this.state.hasError || !hasAutoLayoutNativeView()) {
      return <FlatListAdapter {...this.props} />;
    }

    try {
      return <ShopifyFlashList {...this.props} />;
    } catch {
      return <FlatListAdapter {...this.props} />;
    }
  }
}

/** Converts FlashListProps to FlatListProps */
function FlatListAdapter<T>(props: ShopifyFlashListProps<T>) {
  const {
    estimatedItemSize,
    overrideItemLayout,
    onLoad,
    drawDistance,
    ...flatListProps
  } = props as any;

  return (
    <FlatList<T>
      {...flatListProps}
      // Ensure keyExtractor is present
      keyExtractor={flatListProps.keyExtractor || ((item: any, index: number) => item?._id || item?.id || String(index))}
    />
  );
}

export function SafeFlashList<T>(props: ShopifyFlashListProps<T>) {
  return <SafeFlashListBoundary {...props} />;
}

export default SafeFlashList;

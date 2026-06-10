import React, { useState } from 'react';
import { TouchableOpacity, Animated, StyleSheet, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWishlistStore } from '@/stores/wishlistStore';
import { colors } from '@/constants/colors';
import type { Product } from '@/types/product';
import Toast from 'react-native-toast-message';

interface WishlistButtonProps {
  product: Product;
  size?: number;
  style?: ViewStyle;
}

export default function WishlistButton({ product, size = 24, style }: WishlistButtonProps) {
  const isWishlisted = useWishlistStore((s) => s.isWishlisted(product._id));
  const addToWishlist = useWishlistStore((s) => s.addToWishlist);
  const removeFromWishlist = useWishlistStore((s) => s.removeFromWishlist);
  const [scale] = useState(() => new Animated.Value(1));

  const handleToggle = async () => {
    // Start animation
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.8, duration: 80, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1.2, duration: 100, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 3, useNativeDriver: true }),
    ]).start();

    if (isWishlisted) {
      await removeFromWishlist(product._id);
      Toast.show({
        type: 'info',
        text1: 'Removed from Wishlist',
        text2: product.name,
        position: 'bottom',
      });
    } else {
      await addToWishlist(product);
      Toast.show({
        type: 'success',
        text1: 'Added to Wishlist',
        text2: product.name,
        position: 'bottom',
      });
    }
  };

  return (
    <Animated.View style={[styles.container, style, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={() => {
          handleToggle().catch(() => {});
        }}
        activeOpacity={0.8}
        style={styles.button}
      >
        <Ionicons
          name={isWishlisted ? 'heart' : 'heart-outline'}
          size={size}
          color={isWishlisted ? '#FF3B30' : colors.textSecondary}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 6,
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

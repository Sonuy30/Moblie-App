import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuthModalStore } from '@/stores/authModalStore';
import { colors } from '@/constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AuthModal() {
  const { isVisible, hide } = useAuthModalStore();
  const companyName = process.env.EXPO_PUBLIC_COMPANY_NAME || 'Sudama01';

  if (!isVisible) return null;

  const handleSignIn = () => {
    hide();
    router.push('/(auth)/login');
  };

  const handleRegister = () => {
    hide();
    router.push('/(auth)/register');
  };

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="slide"
      onRequestClose={hide}
    >
      <Pressable style={styles.overlay} onPress={hide}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          {/* Top Swipe Indicator / Bar */}
          <View style={styles.swipeIndicator} />

          {/* Close Button */}
          <TouchableOpacity style={styles.closeBtn} onPress={hide} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Company Brand Logo Icon */}
          <View style={styles.logoContainer}>
            <Ionicons name="cart" size={32} color={colors.primary} />
            <Text style={styles.companyNameText}>{companyName}</Text>
          </View>

          {/* Text Content */}
          <Text style={styles.title}>Sign in to continue</Text>
          <Text style={styles.subtitle}>
            Create an account or sign in to build your cart, checkout, or track your orders.
          </Text>

          {/* Action Buttons */}
          <TouchableOpacity style={styles.primaryBtn} onPress={handleSignIn} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Sign In</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={handleRegister} activeOpacity={0.8}>
            <Text style={styles.secondaryBtnText}>Create Account</Text>
          </TouchableOpacity>

          {/* Guest helper footer */}
          <Text style={styles.guestText}>
            You can continue browsing as a guest
          </Text>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  closeBtn: {
    backgroundColor: colors.surface,
    borderRadius: 999,
    padding: 8,
    position: 'absolute',
    right: 18,
    top: 18,
  },
  companyNameText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 6,
  },
  guestText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  primaryBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    elevation: 4,
    height: 54,
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderColor: 'transparent',
    borderRadius: 14,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    marginBottom: 20,
  },
  secondaryBtnText: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    elevation: 20,
    minHeight: SCREEN_HEIGHT * 0.45,
    paddingBottom: 40,
    paddingHorizontal: 24,
    paddingTop: 14,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 30,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  swipeIndicator: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: 2.5,
    height: 5,
    marginBottom: 20,
    width: 48,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
});

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
  const companyName = process.env.EXPO_PUBLIC_COMPANY_NAME || 'Pankaj Steel Pvt Ltd';

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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 40,
    minHeight: SCREEN_HEIGHT * 0.45,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
  },
  swipeIndicator: {
    width: 48,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 20,
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    padding: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  companyNameText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
    marginBottom: 30,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  secondaryBtnText: {
    color: colors.primaryDark,
    fontSize: 16,
    fontWeight: '700',
  },
  guestText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '500',
  },
});

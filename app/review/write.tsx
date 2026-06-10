import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import Toast from 'react-native-toast-message';

import { useAuthStore } from '@/stores/authStore';
import { submitReview, verifyProductPurchase } from '@/api/reviews';
import StarRating from '@/components/reviews/StarRating';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// 5 preloaded steel/industrial images for the mock photo upload selector
const MOCK_UPLOAD_POOL = [
  'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535813547-99c456a41d4a?w=400&auto=format&fit=crop&q=80',
];

export default function WriteReviewScreen() {
  const { isOnline } = useNetworkStatus();
  const { productId, productName } = useLocalSearchParams<{
    productId: string;
    productName?: string;
  }>();

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [isVerifiedPurchaser, setIsVerifiedPurchaser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function checkEligibility() {
      if (!productId) {
        setIsVerifying(false);
        return;
      }
      try {
        const eligible = await verifyProductPurchase(productId);
        setIsVerifiedPurchaser(eligible);
      } catch (err) {
        console.warn('Failed to verify purchase eligibility:', err);
        setIsVerifiedPurchaser(false);
      } finally {
        setIsVerifying(false);
      }
    }
    void checkEligibility();
  }, [productId]);

  const handleAddPhoto = () => {
    if (selectedImages.length >= 5) {
      Toast.show({
        type: 'info',
        text1: 'Photo Limit Reached',
        text2: 'You can upload up to 5 photos.',
        position: 'bottom',
      });
      return;
    }
    // Pick next image from pool that isn't already selected
    const nextImg = MOCK_UPLOAD_POOL.find((img) => !selectedImages.includes(img));
    if (nextImg) {
      setSelectedImages((prev) => [...prev, nextImg]);
    } else {
      // If all are selected, pick a random one
      const randomImg = MOCK_UPLOAD_POOL[Math.floor(Math.random() * MOCK_UPLOAD_POOL.length)];
      setSelectedImages((prev) => [...prev, randomImg]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    if (!isOnline) {
      Alert.alert(
        'Offline Mode',
        'Submitting reviews is not available while you are offline. Please check your internet connection.'
      );
      return;
    }
    if (!productId) return;

    if (comment.trim().length < 20) {
      Toast.show({
        type: 'error',
        text1: 'Review too short',
        text2: 'Please write at least 20 characters in your comment.',
        position: 'bottom',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReview({
        productId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        images: selectedImages.length > 0 ? selectedImages : undefined,
      });

      Toast.show({
        type: 'success',
        text1: 'Review Submitted',
        text2: 'Thank you for rating our product!',
        position: 'bottom',
      });

      router.back();
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: 'Could not submit your review. Please try again.',
        position: 'bottom',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Write Review</Text>
          <View style={styles.backBtnPlaceholder} />
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="lock-closed-outline" size={64} color={colors.textMuted} />
          <Text style={styles.errorTitle}>Authentication Required</Text>
          <Text style={styles.errorSubtitle}>
            Please log in to share your review on our products.
          </Text>
          <TouchableOpacity style={styles.errorBtn} onPress={() => router.back()}>
            <Text style={styles.errorBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (isVerifying) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Verifying purchase eligibility...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isVerifiedPurchaser) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Write Review</Text>
          <View style={styles.backBtnPlaceholder} />
        </View>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={styles.errorTitle}>Not Eligible</Text>
          <Text style={styles.errorSubtitle}>
            Only users who have purchased this product can leave a verified review.
          </Text>
          <TouchableOpacity style={styles.errorBtn} onPress={() => router.back()}>
            <Text style={styles.errorBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Write Review</Text>
          <View style={styles.backBtnPlaceholder} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {productName && (
            <View style={styles.productBanner}>
              <Text style={styles.productBannerLabel}>Reviewing</Text>
              <Text style={styles.productBannerName} numberOfLines={2}>
                {productName}
              </Text>
            </View>
          )}

          {/* Interactive Stars Selection */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Overall Rating</Text>
            <View style={styles.starsWrapper}>
              <StarRating rating={rating} onChange={setRating} size={40} />
            </View>
            <Text style={styles.ratingHint}>
              {rating === 5
                ? 'Excellent'
                : rating >= 4
                ? 'Very Good'
                : rating >= 3
                ? 'Good'
                : rating >= 2
                ? 'Fair'
                : 'Poor'}
            </Text>
          </View>

          {/* Review text inputs */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Review Title (Optional)</Text>
            <TextInput
              style={styles.inputTitle}
              placeholder="e.g. High tensile strength, very satisfied"
              placeholderTextColor={colors.textMuted}
              value={title}
              onChangeText={setTitle}
              maxLength={80}
            />

            <View style={styles.bodyTitleRow}>
              <Text style={styles.sectionTitle}>Review Details</Text>
              <Text style={styles.charCount}>
                {comment.length} / 20+ chars
              </Text>
            </View>
            <TextInput
              style={styles.inputBody}
              placeholder="Tell us about the quality, weight, finish, delivery experience, etc. (Minimum 20 characters)"
              placeholderTextColor={colors.textMuted}
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={6}
              maxLength={1000}
              textAlignVertical="top"
            />
          </View>

          {/* Photo Upload mockup section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Upload Photos (Max 5)</Text>
            <Text style={styles.photoSubtitle}>
              Share real product pictures from your delivery or site inspection.
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoList}>
              {selectedImages.map((img, idx) => (
                <View key={idx} style={styles.photoContainer}>
                  <Image source={{ uri: img }} style={styles.uploadedPhoto} contentFit="cover" />
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => handleRemovePhoto(idx)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close-circle" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ))}

              {selectedImages.length < 5 && (
                <TouchableOpacity
                  style={styles.addPhotoCard}
                  onPress={handleAddPhoto}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera-outline" size={28} color={colors.primary} />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </ScrollView>

        {/* Sticky bottom submit section */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              (comment.trim().length < 20 || isSubmitting) && styles.submitBtnDisabled,
            ]}
            onPress={() => {
              void handleSubmit();
            }}
            disabled={comment.trim().length < 20 || isSubmitting}
            activeOpacity={0.8}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Review</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  addPhotoCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  addPhotoText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  backBtn: {
    padding: spacing.sm,
  },
  backBtnPlaceholder: {
    width: 40,
  },
  bodyTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  centerContainer: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  charCount: {
    color: colors.textMuted,
    fontSize: 12,
  },
  errorBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  errorBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  errorSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  errorTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  footer: {
    backgroundColor: colors.white,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 56,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  inputBody: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    height: 120,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  inputTitle: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    height: 48,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  keyboardView: {
    flex: 1,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.md,
  },
  photoContainer: {
    position: 'relative',
  },
  photoList: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  photoSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  productBanner: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  productBannerLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  productBannerName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 2,
  },
  ratingHint: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  removePhotoBtn: {
    position: 'absolute',
    right: -6,
    top: -6,
    zIndex: 10,
  },
  safe: {
    backgroundColor: colors.white,
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  starsWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  submitBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    height: 48,
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.7,
  },
  submitBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  uploadedPhoto: {
    borderRadius: borderRadius.md,
    height: 80,
    width: 80,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { postReview } from '@/api/reviews';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface WriteReviewModalProps {
  visible: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  onReviewSubmitted: (review: {
    _id: string;
    userName: string;
    userId: string;
    productId: string;
    rating: number;
    title?: string;
    comment: string;
    createdAt: string;
  }) => void;
  userName: string;
  userId?: string;
}

const STAR_LABELS = ['Terrible', 'Poor', 'Average', 'Good', 'Excellent'];

export default function WriteReviewModal({
  visible,
  onClose,
  productId,
  productName,
  onReviewSubmitted,
  userName,
  userId,
}: WriteReviewModalProps) {
  const { isOnline } = useNetworkStatus();
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [checkScale] = useState(() => new Animated.Value(0));

  const activeStar = hoveredStar || rating;

  const handleStarPress = (star: number) => {
    setRating(star);
  };

  const handleClose = () => {
    setRating(0);
    setHoveredStar(0);
    setTitle('');
    setComment('');
    setSubmitting(false);
    setSubmitted(false);
    checkScale.setValue(0);
    onClose();
  };

  const handleSubmit = async () => {
    if (!isOnline) {
      Alert.alert(
        'Offline Mode',
        'Submitting reviews is not available while you are offline. Please check your internet connection.'
      );
      return;
    }
    if (rating === 0) {
      Toast.show({ type: 'error', text1: 'Please select a star rating', position: 'bottom' });
      return;
    }
    if (comment.trim().length < 10) {
      Toast.show({ type: 'error', text1: 'Write at least 10 characters in your review', position: 'bottom' });
      return;
    }

    setSubmitting(true);
    try {
      const savedReview = await postReview({
        productId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        userName,
        userId: userId || 'me',
      });

      // Animate success check
      setSubmitted(true);
      Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();

      // Notify parent with the persisted review object
      onReviewSubmitted({
        _id: savedReview._id || `rev-new-${Date.now()}`,
        userName: savedReview.userName || userName,
        userId: savedReview.userId || userId || 'me',
        productId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        createdAt: savedReview.createdAt || new Date().toISOString(),
      });

      setTimeout(() => {
        handleClose();
      }, 1600);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to submit review', text2: 'Please try again.', position: 'bottom' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Write a Review</Text>
              <Text style={styles.headerSub} numberOfLines={1}>{productName}</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>

          {submitted ? (
            // ── Success state ──
            <View style={styles.successBox}>
              <Animated.View style={[styles.checkCircle, { transform: [{ scale: checkScale }] }]}>
                <Ionicons name="checkmark-circle" size={64} color="#10b981" />
              </Animated.View>
              <Text style={styles.successTitle}>Review Submitted!</Text>
              <Text style={styles.successSub}>Thank you for helping the community.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Star Picker */}
              <View style={styles.starSection}>
                <Text style={styles.starLabel}>
                  {activeStar > 0 ? STAR_LABELS[activeStar - 1] : 'Tap to rate'}
                </Text>
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => handleStarPress(star)}
                      activeOpacity={0.7}
                      style={styles.starBtn}
                    >
                      <Ionicons
                        name={star <= activeStar ? 'star' : 'star-outline'}
                        size={40}
                        color={star <= activeStar ? colors.star : colors.border}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Rating progress dots */}
                <View style={styles.ratingDots}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <View
                      key={s}
                      style={[styles.dot, s <= activeStar && styles.dotActive]}
                    />
                  ))}
                </View>
              </View>

              {/* Title input */}
              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Review Title <Text style={styles.optional}>(optional)</Text></Text>
                <TextInput
                  style={styles.titleInput}
                  placeholder="e.g. Great quality product!"
                  placeholderTextColor={colors.textMuted}
                  value={title}
                  onChangeText={setTitle}
                  maxLength={80}
                  returnKeyType="next"
                />
              </View>

              {/* Comment input */}
              <View style={styles.fieldSection}>
                <Text style={styles.fieldLabel}>Your Review <Text style={styles.required}>*</Text></Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Share your experience with this product (min. 10 characters)…"
                  placeholderTextColor={colors.textMuted}
                  value={comment}
                  onChangeText={setComment}
                  maxLength={500}
                  multiline
                  numberOfLines={5}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{comment.length}/500</Text>
              </View>

              {/* Tips */}
              <View style={styles.tipsBox}>
                <Ionicons name="bulb-outline" size={14} color={colors.primary} />
                <Text style={styles.tipsText}>
                  {"Mention quality, delivery speed, and whether you'd order again."}
                </Text>
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, (submitting || rating === 0) && styles.submitBtnDisabled]}
                onPress={() => { void handleSubmit(); }}
                disabled={submitting || rating === 0}
                activeOpacity={0.85}
              >
                {submitting ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color={colors.white} />
                    <Text style={styles.submitText}>Submit Review</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={{ height: 24 }} />
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  charCount: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  checkCircle: {
    marginBottom: 8,
  },
  closeBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  commentInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    minHeight: 120,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  dot: {
    backgroundColor: colors.border,
    borderRadius: 3,
    height: 6,
    width: 6,
  },
  dotActive: {
    backgroundColor: colors.star,
    width: 18,
  },
  fieldLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  fieldSection: {
    marginBottom: spacing.lg,
  },
  handle: {
    alignSelf: 'center',
    backgroundColor: colors.border,
    borderRadius: 2,
    height: 4,
    marginBottom: 16,
    width: 40,
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  headerSub: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
    maxWidth: 240,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  optional: {
    color: colors.textMuted,
    fontWeight: '500',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  ratingDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  required: {
    color: colors.error,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 20,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  starBtn: {
    padding: 4,
  },
  starLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  starRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starSection: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    paddingVertical: spacing.xl,
  },
  submitBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    elevation: 6,
    flexDirection: 'row',
    gap: 10,
    height: 52,
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitBtnDisabled: {
    elevation: 0,
    opacity: 0.55,
    shadowOpacity: 0,
  },
  submitText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  successBox: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 40,
  },
  successSub: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  successTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  tipsBox: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  tipsText: {
    color: colors.primary,
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
  },
  titleInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
});

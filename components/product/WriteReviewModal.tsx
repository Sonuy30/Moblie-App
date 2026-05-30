import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { postReview } from '@/api/reviews';
import { colors } from '@/constants/colors';
import { borderRadius, spacing } from '@/constants/config';

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
}

const STAR_LABELS = ['Terrible', 'Poor', 'Average', 'Good', 'Excellent'];

export default function WriteReviewModal({
  visible,
  onClose,
  productId,
  productName,
  onReviewSubmitted,
  userName,
}: WriteReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const checkScale = useRef(new Animated.Value(0)).current;

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
      await postReview({ productId, rating, title: title.trim() || undefined, comment: comment.trim() });

      // Animate success check
      setSubmitted(true);
      Animated.spring(checkScale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();

      // Notify parent to add the review immediately (optimistic)
      onReviewSubmitted({
        _id: `rev-new-${Date.now()}`,
        userName,
        userId: 'me',
        productId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        createdAt: new Date().toISOString(),
      });

      setTimeout(() => {
        handleClose();
        Toast.show({ type: 'success', text1: '🙏 Thank you for your feedback!', text2: 'Your review has been submitted.', position: 'bottom' });
      }, 1600);
    } catch (e: any) {
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
                  Mention quality, delivery speed, and whether you'd order again.
                </Text>
              </View>

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, (submitting || rating === 0) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
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
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
  },
  headerSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
    maxWidth: 240,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Star picker
  starSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  starLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  starRow: {
    flexDirection: 'row',
    gap: 8,
  },
  starBtn: {
    padding: 4,
  },
  ratingDots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.star,
    width: 18,
  },
  // Fields
  fieldSection: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  optional: {
    fontWeight: '500',
    color: colors.textMuted,
  },
  required: {
    color: colors.error,
  },
  titleInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  commentInput: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
    minHeight: 120,
    backgroundColor: colors.surface,
    lineHeight: 22,
  },
  charCount: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  tipsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  tipsText: {
    flex: 1,
    fontSize: 12,
    color: colors.primary,
    fontWeight: '600',
    lineHeight: 18,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitBtnDisabled: {
    opacity: 0.55,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
  },
  // Success
  successBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  checkCircle: {
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  successSub: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

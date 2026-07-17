import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useOrderDetail } from '@/hooks/useOrders';
import { generateInvoiceHtml } from '@/utils/generateInvoiceHtml';
import { colors } from '@/constants/colors';
import { spacing, borderRadius } from '@/constants/config';

export default function InvoiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isLoading } = useOrderDetail(id || '');
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!order) return;
    setDownloading(true);
    try {
      const html = generateInvoiceHtml(order);
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `Invoice – ${order.orderNumber}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert(
          'Saved',
          `Invoice PDF saved to:\n${uri}`,
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Could not generate PDF. Please try again.');
      console.warn('[Invoice] PDF generation error:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          activeOpacity={0.7}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>GST Invoice</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : order ? (
          <>
            {/* Invoice Info Card */}
            <View style={styles.invoiceCard}>
              <View style={styles.invoiceIconRow}>
                <View style={styles.invoiceIconBg}>
                  <Ionicons name="receipt-outline" size={40} color={colors.primary} />
                </View>
              </View>

              <Text style={styles.invoiceTitle}>Tax Invoice</Text>
              <Text style={styles.orderNumber}>Order: {order.orderNumber}</Text>

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Invoice Type</Text>
                  <Text style={styles.detailValue}>GST Tax Invoice</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Items</Text>
                  <Text style={styles.detailValue}>{order.items?.length || 0}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>GST</Text>
                  <Text style={styles.detailValue}>CGST 9% + SGST 9%</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Format</Text>
                  <Text style={styles.detailValue}>PDF</Text>
                </View>
              </View>

              <View style={styles.noteBox}>
                <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                <Text style={styles.noteText}>
                  This invoice includes CGST (9%) + SGST (9%) breakdown with HSN codes for all items.
                </Text>
              </View>
            </View>

            {/* Download Button */}
            <TouchableOpacity
              style={[styles.downloadBtn, downloading && styles.downloadBtnDisabled]}
              onPress={() => { void handleDownload(); }}
              activeOpacity={0.85}
              disabled={downloading}
              accessibilityLabel="Download invoice PDF"
              accessibilityRole="button"
            >
              {downloading ? (
                <>
                  <ActivityIndicator color={colors.white} size="small" />
                  <Text style={styles.downloadBtnText}>Generating PDF…</Text>
                </>
              ) : (
                <>
                  <Ionicons name="download-outline" size={22} color={colors.white} />
                  <Text style={styles.downloadBtnText}>Download PDF</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareBtn}
              onPress={() => { void handleDownload(); }}
              activeOpacity={0.8}
              disabled={downloading}
              accessibilityLabel="Share invoice"
              accessibilityRole="button"
            >
              <Ionicons name="share-outline" size={20} color={colors.primary} />
              <Text style={styles.shareBtnText}>Share Invoice</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Order not found</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backBtn: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  detailItem: {
    alignItems: 'center',
    gap: 4,
    width: '48%',
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  downloadBtn: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    elevation: 5,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginTop: spacing.xl,
    paddingVertical: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    width: '100%',
  },
  downloadBtnDisabled: {
    opacity: 0.7,
  },
  downloadBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerSpacer: {
    width: 40,
  },
  invoiceCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    elevation: 4,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    width: '100%',
  },
  invoiceIconBg: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  invoiceIconRow: {
    marginBottom: spacing.lg,
  },
  invoiceTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  noteBox: {
    alignItems: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  noteText: {
    color: colors.primary,
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  orderNumber: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  safe: {
    backgroundColor: colors.background,
    flex: 1,
  },
  shareBtn: {
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: 14,
    width: '100%',
  },
  shareBtnText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
});

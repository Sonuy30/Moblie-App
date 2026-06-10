import { useState, RefObject } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { captureMessage } from '@/utils/sentry';
import { formatINR } from '@/utils/currency';

export interface ShareProductData {
  _id: string;
  slug: string;
  name: string;
  storePrice: number;
}

export function useProductShare() {
  const [isSharing, setIsSharing] = useState(false);

  const shareProduct = async (product: ShareProductData, cardRef: RefObject<View | null>) => {
    if (!cardRef.current) {
      console.warn('[useProductShare] cardRef is not attached');
      return;
    }

    setIsSharing(true);
    try {
      // 1. Capture the visual ShareCard
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 0.9,
      });

      // 2. Track share event for analytics in Sentry
      captureMessage(`Product Shared: ${product.name} (ID: ${product._id}, Slug: ${product.slug})`, 'info');

      // 3. Trigger native sharing
      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(uri, {
          dialogTitle: `Share AITS Shop: ${product.name} - ${formatINR(product.storePrice)}`,
          mimeType: 'image/png',
        });
      } else {
        console.warn('[useProductShare] Sharing is not available on this platform');
      }
    } catch (err) {
      console.error('[useProductShare] Error sharing product:', err);
    } finally {
      setIsSharing(false);
    }
  };

  return { shareProduct, isSharing };
}

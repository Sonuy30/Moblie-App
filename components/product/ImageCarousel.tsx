import React, { useState, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  ScrollView,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/constants/colors';
import { borderRadius } from '@/constants/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ImageCarouselProps {
  images: string[];
  height?: number;
}

export default function ImageCarousel({ images, height = 350 }: ImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const imageList = images.length > 0 ? images : ['https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&auto=format&fit=crop&q=80'];


  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  return (
    <View style={[styles.container, { height }]}>
      <FlatList
        ref={flatListRef}
        data={imageList}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <ScrollView
            maximumZoomScale={3}
            minimumZoomScale={1}
            bouncesZoom
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.imageWrapper, { width: SCREEN_WIDTH, height }]}
          >
            <Image
              source={{ uri: item }}
              style={styles.image}
              contentFit="contain"
              transition={300}
            />
          </ScrollView>
        )}
      />
      {imageList.length > 1 && (
        <View style={styles.dots}>
          {imageList.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === activeIndex ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  activeDot: {
    backgroundColor: colors.primary,
    width: 24,
  },
  container: {
    backgroundColor: colors.surface,
  },
  dot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  dots: {
    alignItems: 'center',
    bottom: 0,
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    left: 0,
    paddingVertical: 12,
    position: 'absolute',
    right: 0,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  imageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveDot: {
    backgroundColor: colors.border,
  },
});

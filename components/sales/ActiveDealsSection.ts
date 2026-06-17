/**
 * ActiveDealsSection
 *
 * Renders the Flash Sale Banner on the home screen ONLY when an admin has
 * an active deal running. Returns null when there is no active sale,
 * making it completely invisible (no empty space).
 *
 * This component replaces the old Deals tab.
 * It is already imported in app/(tabs)/index.tsx as <FlashSaleBanner />
 * which already has built-in null-guard: `if (!activeSale) return null`
 *
 * This file re-exports FlashSaleBanner as a named export for clarity.
 */

export { default as ActiveDealsSection } from '@/components/sales/FlashSaleBanner';

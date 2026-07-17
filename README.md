# 📱 AITS Shop - Premium E-Commerce Mobile App

A modern, highly optimized, and beautifully designed e-commerce mobile application built using **React Native**, **Expo (v54 SDK)**, and **TypeScript**. 

AITS Shop delivers a premium, high-performance shopping experience with native animations, state-of-the-art caching, robust state management, and strict TypeScript verification. It integrates directly with the main AITS ERP backend to handle order lifecycles, payments, and customer catalog lookups.

---

## ✨ Features & Technology Stack

* **Core Framework**: React Native & Expo (v54 SDK)
* **Routing & Navigation**: `expo-router` (File-based routing with tab navigation and nested modal layouts)
* **State Management**: `zustand` (Lightweight, robust, and lightning-fast global state store)
* **Data Fetching & Caching**: `@tanstack/react-query` (Synchronized cache layers for offline availability and zero redundant requests)
* **Forms & Validation**: `react-hook-form` + `zod` schema verification
* **UI Components**: Native components utilizing `expo-linear-gradient`, `expo-image` (for fast, cached image loading), and `@shopify/flash-list` for buttery-smooth infinite-scroll feeds
* **Secure Storage**: `expo-secure-store` for credentials and auth token storage
* **Payment Gateway**: `react-native-razorpay` integration with secure signature verification on the ERP backend
* **Push Notifications**: Single source-of-truth service using `expo-notifications` for order updates and flash sale alerts

---

## 📂 Directory Structure

```text
aits-shop/
├── api/          # Axios configurations, React Query mutations, and endpoints
├── app/          # Expo Router file-based screens and navigation layouts
├── components/   # Modular, highly reusable UI components (Product, Orders, Cart, etc.)
├── constants/    # Design system, theme colors, layout dimensions, and typography
├── hooks/        # Custom React hooks (auth, local state, utility hooks)
├── stores/       # Zustand store definitions (auth, cart, notifications)
└── utils/        # Generic formatting, helpers, and validation schemas
```

---

## 🛠️ Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed and [Expo Go](https://expo.dev/go) or a physical Android/iOS device for testing.

### 1. Installation

Clone the repository and install the dependencies:

```bash
cd aits-shop
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory (based on `.env.example`). Set the following keys:

```env
# API URL — Must use your computer's local Wi-Fi IP address when testing on physical devices!
EXPO_PUBLIC_API_URL=http://192.168.0.103:3000
EXPO_PUBLIC_WS_URL=ws://192.168.0.103:3000

# Timeout in milliseconds
EXPO_PUBLIC_API_TIMEOUT=15000

# Tenant Configuration
EXPO_PUBLIC_COMPANY_SLUG=sudama01
EXPO_PUBLIC_COMPANY_NAME=Sudama Enterprises

# Payments (Razorpay Publishable Key)
EXPO_PUBLIC_RAZORPAY_KEY=rzp_test_xxxxxx
```

> [!IMPORTANT]
> **Metro Cache Warning**: When you modify `.env.local`, Metro often serves a cached bundle. You must restart the packager with the clear-cache flag:
> ```bash
> npx expo start -c
> ```

---

## 💳 Razorpay Payments Testing Guide

Because Razorpay uses native Android/iOS SDK code:
* **It will NOT work inside the standard Expo Go client app.** 
* You must compile and run a custom **Development Build** directly on your device or emulator:
  ```bash
  npx expo run:android
  # or
  npx expo run:ios
  ```

### Local Testing Setup:
1. Switch your Razorpay Dashboard to **Test Mode**.
2. Configure your test key ID (`rzp_test_...`) and secret key in `pankajalerp-git/.env.local` and restart your Next.js ERP server.
3. Configure `EXPO_PUBLIC_RAZORPAY_KEY=rzp_test_...` in `aits-shop/.env.local`.
4. Run `npx expo run:android` to boot the app.
5. Place an order, select **Online Payment**, and use the [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-details/) to trigger a successful mock transaction.

---

## 🔔 Push Notifications Testing Guide

Push notifications utilize Expo's notification dispatch servers. 

### Local Testing Setup:
1. Ensure your physical device is registered on your Expo account.
2. In `aits-shop/app.json`, verify the `projectId` and `owner` align with your Expo developer dashboard credentials.
3. **Android Configuration**: Create a project in the Google Firebase Console, register package name `com.sudama.enterprises`, download the `google-services.json` file, and upload the Cloud Messaging private key to your Expo project dashboard.
4. Run a native **Development Build** on your device.
5. Confirm that a valid push token (e.g. `ExponentPushToken[xxxxxxxxxxxx]`) is retrieved at startup and successfully persisted to your profile in the ERP database.
6. Test notification dispatch using `curl`:
   ```bash
   curl -H "Content-Type: application/json" -X POST https://exp.host/--/api/v2/push/send -d '{
     "to": "ExponentPushToken[YOUR_DEVICE_TOKEN]",
     "title": "Order Shipped!",
     "body": "Your order #1023 has been handed over to courier.",
     "data": { "type": "ORDER_UPDATE", "id": "1023" }
   }'
   ```

---

## 🧪 Running Tests & Quality Verification

Run Jest unit tests for configurations, Zustand stores, and API request mappings:

```bash
npm run test
```

Run TypeScript compilation checks:

```bash
npm run typecheck
```

Run ESLint checks:

```bash
npm run lint
```

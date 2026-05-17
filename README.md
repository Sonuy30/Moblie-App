# 📱 AITS Shop - Premium E-Commerce Mobile App

A modern, highly optimized, and beautifully designed e-commerce mobile application built using **React Native**, **Expo (v54)**, and **TypeScript**. 

AITS Shop delivers a premium, high-performance shopping experience with native animations, state-of-the-art caching, robust state management, and strict TypeScript types.

---

## ✨ Features & Technology Stack

* **Core Framework**: React Native & Expo (v54 SDK)
* **Routing & Navigation**: `expo-router` (File-based routing with tab navigation and nested modal layouts)
* **State Management**: `zustand` (Lightweight, robust, and lightning-fast global state store)
* **Data Fetching & Caching**: `@tanstack/react-query` (Synchronized cache layers for offline availability and zero redundant requests)
* **Forms & Validation**: `react-hook-form` + `zod` schema verification
* **UI Components**: Native components utilizing `expo-linear-gradient`, `expo-image` (for fast, cached image loading), and `@shopify/flash-list` for buttery-smooth infinite-scroll feeds
* **Secure Storage**: `expo-secure-store` for credentials and auth token storage
* **Styling & Aesthetics**: Vibrant HSL-customized UI palette, rich micro-animations, custom icons, and sleek layouts

---

## 🛠️ Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed and [Expo Go](https://expo.dev/go) on your mobile device.

### 1. Installation

Clone the repository and install the dependencies:

```bash
cd aits-shop
npm install
```

### 2. Running Locally

Start the Metro Bundler:

```bash
npm run start
```

* Press **`a`** to run on an Android emulator or connected device.
* Press **`i`** to run on an iOS simulator.
* Scan the QR code with your Expo Go app (Android) or Camera app (iOS) to load the application on your physical device.

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

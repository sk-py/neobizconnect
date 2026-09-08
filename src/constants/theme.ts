export const colors = {
  primary: "#DC2626",
  background: "#FFFFFF",
  surface: "#F8FAFC",
  text: "#111827",
  textSecondary: "#6B7280",
  muted: "#7e8694cb",
  border: "#E5E7EB",
  error: "#DC2626",
  success: "#16A34A",
  white: "#FFFFFF",
  black: "#000000",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
};

import { fontScale } from "@/utils/responsive";

export const txtSize = {
  heading: fontScale(32),
  title: fontScale(24),
  body: fontScale(16),
  small: fontScale(14),
  xs: fontScale(12),
};

export const typography = {
  regular: "Geist-Regular",
  medium: "Geist-Medium",
  semibold: "Geist-SemiBold",
  bold: "Geist-Bold",
};

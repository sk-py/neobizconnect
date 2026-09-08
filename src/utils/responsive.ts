import { Dimensions, PixelRatio } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Baseline design dimensions (standard reference phone size)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export const scale = (size: number) => (SCREEN_WIDTH / BASE_WIDTH) * size;
export const verticalScale = (size: number) => (SCREEN_HEIGHT / BASE_HEIGHT) * size;

// Moderate scale: blends the scaled value with the original by a "factor",
// so text/spacing doesn't grow/shrink too aggressively on very large or small screens.
export const moderateScale = (size: number, factor = 0.5) =>
  size + (scale(size) - size) * factor;

export const fontScale = (size: number) => PixelRatio.roundToNearestPixel(moderateScale(size));
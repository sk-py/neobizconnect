import { PixelRatio, useWindowDimensions } from "react-native";

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

const MAX_FONT_SCALE = 1.2;

export const scale = (size: number, width: number) => {
  return (width / BASE_WIDTH) * size;
};

export const verticalScale = (size: number, height: number) => {
  return (height / BASE_HEIGHT) * size;
};

export const moderateScale = (size: number, width: number, factor = 0.5) => {
  const scaled = scale(size, width);

  return size + (scaled - size) * factor;
};

export const responsiveFontSize = (
  size: number,
  width: number,
  factor = 0.5,
) => {
  const scaled = moderateScale(size, width, factor);

  // Prevent fonts from becoming excessively large
  const capped = Math.min(scaled, size * MAX_FONT_SCALE);

  return PixelRatio.roundToNearestPixel(capped);
};

/**
 * Responsive values for components.
 * Recalculates automatically when window dimensions change.
 */
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();

  return {
    width,
    height,

    scale: (size: number) => scale(size, width),

    verticalScale: (size: number) => verticalScale(size, height),

    moderateScale: (size: number, factor = 0.5) =>
      moderateScale(size, width, factor),

    responsiveFontSize: (size: number, factor = 0.5) =>
      responsiveFontSize(size, width, factor),
  };
};

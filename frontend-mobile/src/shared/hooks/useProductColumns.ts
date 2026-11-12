import { useWindowDimensions } from "react-native";

// Leave room for Persian names and prices on narrow screens or with larger text.
export function useProductColumns() {
  const { width, fontScale } = useWindowDimensions();
  return width < 360 || fontScale > 1.25 ? 1 : 2;
}

import React from "react";
import { Image, type ImageStyle, type StyleProp } from "react-native";

export function BrandLogo({ compact = false, style }: { compact?: boolean; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={compact ? require("../../../assets/brand/logo-mark.png") : require("../../../assets/brand/logo-full.png")}
      accessibilityLabel="الو گیاه"
      accessible
      resizeMode="contain"
      style={[compact ? { width: 40, height: 44 } : { width: "100%", maxWidth: 320, height: 218, alignSelf: "center", marginVertical: 16 }, style]}
    />
  );
}

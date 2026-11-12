import React, { useState } from "react";
import { Image, View, type StyleProp, type ViewStyle } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { theme } from "../../shared/theme";

export function ManagementPhoto({
  uri,
  label,
  style,
}: {
  uri?: string;
  label: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [failedUri, setFailedUri] = useState<string>();
  return (
    <View
      style={[
        {
          backgroundColor: theme.mint,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      {uri && uri !== failedUri ? (
        <Image
          key={uri}
          accessibilityLabel={label}
          source={{ uri }}
          resizeMode="cover"
          onError={() => setFailedUri(uri)}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <Ionicons name="leaf-outline" size={28} color={theme.green} />
      )}
    </View>
  );
}

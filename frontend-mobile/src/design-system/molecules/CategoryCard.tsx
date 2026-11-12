import React from "react";
import { Image, Pressable, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "../atoms/Text";
import { theme } from "../../shared/theme";
import { imageUrl } from "../../shared/utils/format";
import type { CategoryOption } from "../../shared/types/platform";
export function CategoryCard({
  category,
  onPress,
}: {
  category: CategoryOption;
  onPress: () => void;
}) {
  const [failed, setFailed] = React.useState(false);
  const uri = imageUrl(category.imageUrl);
  React.useEffect(() => setFailed(false), [uri]);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={category.name || category.title}
      onPress={onPress}
      style={({ pressed }) => ({
        borderWidth: 1,
        borderColor: theme.border,
        backgroundColor: "white",
        borderRadius: 16,
        overflow: "hidden",
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View
        style={{
          aspectRatio: 4 / 3,
          backgroundColor: theme.mint,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {uri && !failed ? (
          <Image
            source={{ uri }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <Ionicons name="leaf-outline" color={theme.accent} size={32} />
        )}
      </View>
      <View
        style={{
          flexDirection: "row-reverse",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 56,
          padding: 10,
          gap: 6,
        }}
      >
        <Text
          bold
          numberOfLines={2}
          style={{ flex: 1, fontSize: 12, lineHeight: 21 }}
        >
          {category.name || category.title}
        </Text>
        <Ionicons name="arrow-back" size={16} color={theme.green} />
      </View>
    </Pressable>
  );
}

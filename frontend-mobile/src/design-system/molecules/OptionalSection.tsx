import React, { useState } from "react";
import { Pressable, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "../atoms/Text";
import { theme } from "../../shared/theme";

export function OptionalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [visited, setVisited] = useState(false);
  return (
    <View style={{ gap: 12 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => {
          setVisited(true);
          setOpen(!open);
        }}
        style={{
          minHeight: 48,
          flexDirection: "row-reverse",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Text bold style={{ flex: 1, color: theme.green }}>
          {title}
        </Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color={theme.green}
        />
      </Pressable>
      <View style={!open ? { display: "none" } : undefined}>
        {visited && children}
      </View>
    </View>
  );
}

import React, { useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { theme } from "../../shared/theme";
import { imageUrl, number } from "../../shared/utils/format";
import { Text } from "../atoms/Text";

function Photo({ src }: { src?: string }) {
  const [failed, setFailed] = useState(false);
  const uri = imageUrl(src);
  return uri && !failed ? (
    <Image
      accessibilityLabel="تصویر محصول"
      source={{ uri }}
      resizeMode="cover"
      onError={() => setFailed(true)}
      style={{ width: "100%", height: "100%" }}
    />
  ) : (
    <Ionicons name="leaf-outline" size={40} color={theme.green} />
  );
}

export function ProductGallery({ images }: { images: (string | undefined)[] }) {
  const [selected, setSelected] = useState(0);
  return (
    <View
      style={{
        backgroundColor: theme.white,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: "#F1F5F9",
        padding: 12,
        marginBottom: 20,
      }}
    >
      <View
        style={{
          aspectRatio: 4 / 3,
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: theme.mint,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Photo key={images[selected]} src={images[selected]} />
      </View>
      {images.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingTop: 16 }}
        >
          {images.map((src, index) => (
            <Pressable
              key={`${src}-${index}`}
              accessibilityRole="button"
              accessibilityLabel={`تصویر ${number(index + 1)}`}
              accessibilityState={{ selected: index === selected }}
              onPress={() => setSelected(index)}
              style={{
                width: 72,
                height: 72,
                overflow: "hidden",
                borderRadius: 12,
                borderWidth: 2,
                borderColor: index === selected ? theme.green : "transparent",
                backgroundColor: theme.mint,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Photo src={src} />
            </Pressable>
          ))}
        </ScrollView>
      )}
      {images.length > 1 && (
        <Text muted style={{ fontSize: 11, marginTop: 6 }}>
          {number(selected + 1)} از {number(images.length)}
        </Text>
      )}
    </View>
  );
}

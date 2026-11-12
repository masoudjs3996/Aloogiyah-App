import { ProductPrices } from "./ProductPrices";
import { useOfferExpiry } from "../../shared/hooks/useOfferExpiry";
import React, { useEffect, useState } from "react";
import { Image, Pressable, View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "../atoms/Text";
import { theme } from "../../shared/theme";
import {
  imageUrl,
  activeOffer,
  number,
  date,
} from "../../shared/utils/format";
import type { ProductSummary } from "../../shared/types/mobile";
export function ProductCard({
  product,
  onPress,
}: {
  product: ProductSummary;
  onPress: () => void;
}) {
  useOfferExpiry(product.discountEndsAt);
  const uri = imageUrl(product.primaryImageUrl || product.imageUrl);
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [uri]);
  const offer = activeOffer(product);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}، مشاهده جزئیات`}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: theme.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#F1F5F9",
        overflow: "hidden",
        margin: 5,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <View
        style={{
          aspectRatio: 4 / 3,
          width: "100%",
          backgroundColor: theme.mint,
          justifyContent: "center",
          alignItems: "center",
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
          <Ionicons name="leaf-outline" size={42} color={theme.accent} />
        )}
      </View>
      <View style={{ flex: 1, padding: 12, gap: 10 }}>
        <Text
          bold
          numberOfLines={2}
          style={{ minHeight: 48, fontSize: 14, lineHeight: 24 }}
        >
          {product.name}
        </Text>
        {offer && (
          <View
            style={{
              flexDirection: "row-reverse",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 5,
            }}
          >
            <Text
              bold
              style={{
                backgroundColor: "#EF4444",
                color: "white",
                borderRadius: 12,
                paddingHorizontal: 7,
                fontSize: 10,
              }}
            >
              {number(product.discountPercentage ?? 0)}٪ تخفیف
            </Text>
          </View>
        )}
        <ProductPrices product={product} compact />
        {offer && product.discountEndsAt && (
          <Text muted style={{ fontSize: 10 }}>
            تا {date(product.discountEndsAt)}
          </Text>
        )}
        <Text muted style={{ fontSize: 10 }}>
          {product.stock > 0 ? `${number(product.stock)} موجود` : "ناموجود"}
        </Text>
        <View
          style={{
            marginTop: "auto",
            flexDirection: "row-reverse",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            backgroundColor: theme.green,
            borderRadius: 12,
            minHeight: 42,
            paddingHorizontal: 6,
            paddingVertical: 6,
          }}
        >
          <Text bold style={{ color: "white", fontSize: 11 }}>
            مشاهده جزئیات
          </Text>
          <Ionicons name="arrow-back" size={15} color="white" />
        </View>
      </View>
    </Pressable>
  );
}

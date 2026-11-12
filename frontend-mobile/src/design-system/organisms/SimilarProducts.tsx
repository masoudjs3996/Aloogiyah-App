import React from "react";
import { View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { paged } from "../../api/platform";
import type { Product } from "../../shared/types/mobile";
import { Text } from "../atoms/Text";
import { Button } from "../atoms/Button";
import { ProductCard } from "../molecules/ProductCard";
import { QueryState } from "../molecules/QueryState";

export function SimilarProducts({
  code,
  onSelect,
  onBrowse,
}: {
  code: string;
  onSelect: (code: string) => void;
  onBrowse: () => void;
}) {
  const query = useQuery({
    queryKey: ["similar-products", code],
    queryFn: () =>
      paged<Product>(
        "/AgriculturalListing/GetSimilar",
        { ProductCode: code, PageNumber: 1, PageSize: 4 },
        true,
      ),
  });
  const products = query.data?.items.filter((product) => product.code !== code) ?? [];
  return (
    <View style={{ marginBottom: 16 }}>
      <Text bold style={{ fontSize: 20, marginBottom: 20 }}>
        محصولات مشابه و پیشنهادی
      </Text>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={() => query.refetch()}
      />
      {query.isSuccess && !products.length && (
        <View style={{ gap: 12 }}>
          <Text muted>فعلاً آگهی دیگری برای پیشنهاد وجود ندارد.</Text>
          <Button outline title="مشاهدهٔ همهٔ آگهی‌ها" onPress={onBrowse} />
        </View>
      )}
      <View
        style={{
          flexDirection: "row-reverse",
          flexWrap: "wrap",
          marginHorizontal: -5,
        }}
      >
        {products.map((product) => (
            <View key={product.code} style={{ width: "50%" }}>
              <ProductCard
                product={product}
                onPress={() => onSelect(product.code)}
              />
            </View>
          ))}
      </View>
    </View>
  );
}

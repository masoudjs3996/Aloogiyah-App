import { useProductColumns } from "../shared/hooks/useProductColumns";
import React, { useState, useEffect, useRef } from "react";
import { View, FlatList, Pressable } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { Screen } from "../design-system/templates/Screen";
import { Field } from "../design-system/atoms/Field";
import { Text } from "../design-system/atoms/Text";
import { Button } from "../design-system/atoms/Button";
import { ProductFiltersModal } from "../design-system/organisms/ProductFiltersModal";
import {
  emptyProductFilters,
  productFilterParams,
  productFilterCount,
  productSortOptions,
  categoryFilterCodes,
  categoryOptions,
  type ProductFilters,
} from "../shared/utils/product-filters";
import { theme } from "../shared/theme";
import { QueryState } from "../design-system/molecules/QueryState";
import { ProductCard } from "../design-system/molecules/ProductCard";
import { api } from "../api/mobile";
import { platformApi } from "../api/platform";
import type { Props } from "../navigation/types";
export function ProductsScreen({ navigation, route }: Props<"Products">) {
  const columns = useProductColumns();
  const [search, setSearch] = useState(route.params?.search || "");
  const [name, setName] = useState(route.params?.search || "");
  const [applied, setApplied] = useState<ProductFilters>({
    ...emptyProductFilters,
    category: route.params?.category || "",
  });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const list = useRef<FlatList>(null);
  useEffect(() => {
    setSearch(route.params?.search || "");
    setName(route.params?.search || "");
  }, [route.params?.search]);
  useEffect(() => {
    setApplied((current) => current.category === (route.params?.category || "") ? current : ({
      ...current,
      category: route.params?.category || "",
      templateCode: "",
      specificationOptions: {},
    }));
  }, [route.params?.category]);
  useEffect(() => {
    const t = setTimeout(() => setName(search), 350);
    return () => clearTimeout(t);
  }, [search]);
  const cats = useQuery({
    queryKey: ["category-tree"],
    queryFn: platformApi.categoryTree,
  });
  const filters = {
    Name: name || undefined,
    CategoryCodes:
      applied.category &&
      !cats.data &&
      applied.category === route.params?.category
        ? route.params.categoryCodes || [applied.category]
        : categoryFilterCodes(cats.data ?? [], applied.category),
    FarmCode: route.params?.farm,
    ...productFilterParams(applied),
  };
  const query = useInfiniteQuery({
    queryKey: ["products", filters],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      api.products({ ...filters, PageNumber: pageParam, PageSize: 16 }, signal),
    getNextPageParam: (last) =>
      last.pageNumber * last.pageSize < last.totalCount
        ? last.pageNumber + 1
        : undefined,
  });
  const items = query.data?.pages.flatMap((p) => p.items) || [];
  const count = productFilterCount(applied);
  const selectedCategory = categoryOptions(cats.data ?? []).find(
    (option) => option.value === applied.category,
  )?.label;
  const applyFilters = (value: ProductFilters) => {
    setApplied(value);
    setFiltersOpen(false);
    list.current?.scrollToOffset({ offset: 0, animated: false });
  };
  return (
    <Screen scroll={false}>
      {filtersOpen && (
        <ProductFiltersModal
          value={applied}
          categories={cats.data ?? []}
          loading={cats.isLoading}
          error={cats.error}
          onRetry={() => void cats.refetch()}
          onClose={() => setFiltersOpen(false)}
          onApply={applyFilters}
        />
      )}
      <FlatList
        ref={list}
        data={items}
        key={columns}
        numColumns={columns}
        keyExtractor={(p) => p.code}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 10 }}
        onRefresh={() => query.refetch()}
        refreshing={query.isRefetching}
        ListHeaderComponent={
          <View style={{ padding: 6 }}>
            <Text
              bold
              style={{ fontSize: 23, lineHeight: 36, marginBottom: 8 }}
            >
              آگهی‌های الو گیاه
            </Text>
            <Text muted style={{ fontSize: 12, marginBottom: 22 }}>
              آگهی موردنظرتان را پیدا کنید و مستقیم با فروشنده هماهنگ شوید.
            </Text>
            <Field
              label="جست‌وجوی آگهی‌ها"
              value={search}
              onChangeText={setSearch}
            />
            <Button
              outline
              title={`فیلتر و مرتب‌سازی${count ? ` (${count.toLocaleString("fa-IR")})` : ""}`}
              icon={
                <Ionicons
                  name="options-outline"
                  size={20}
                  color={theme.green}
                />
              }
              onPress={() => setFiltersOpen(true)}
            />
            <View
              style={{
                flexDirection: "row-reverse",
                flexWrap: "wrap",
                gap: 8,
                marginVertical: 14,
                alignItems: "center",
              }}
            >
              <Text muted style={{ fontSize: 11 }}>
                مرتب‌سازی:{" "}
                {
                  productSortOptions.find(
                    (option) => option.value === applied.sort,
                  )?.label
                }
              </Text>
              {!!applied.provinceCode && (
                <Text style={{ color: theme.green, fontSize: 11 }}>
                  موقعیت انتخاب‌شده
                </Text>
              )}
              {!!applied.category && (
                <Text style={{ color: theme.green, fontSize: 11 }}>
                  {selectedCategory || "دسته انتخاب‌شده"}
                </Text>
              )}
              {(!!applied.minPrice || !!applied.maxPrice) && (
                <Text style={{ color: theme.green, fontSize: 11 }}>
                  {applied.minPrice || "۰"} تا {applied.maxPrice || "بدون سقف"}{" "}
                  تومان
                </Text>
              )}
              {applied.stockOnly && (
                <Text style={{ color: theme.green, fontSize: 11 }}>
                  فقط موجود
                </Text>
              )}
              {count > 0 && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => applyFilters({ ...emptyProductFilters })}
                  style={{
                    minHeight: 44,
                    justifyContent: "center",
                    paddingHorizontal: 8,
                  }}
                >
                  <Text bold style={{ color: theme.danger, fontSize: 11 }}>
                    پاک کردن فیلترها
                  </Text>
                </Pressable>
              )}
            </View>
            <QueryState
              loading={query.isLoading}
              error={query.error}
              retry={() => query.refetch()}
            />
          </View>
        }
        ListEmptyComponent={
          !query.isLoading && !query.error ? (
            <QueryState
              empty
              emptyText={name || count ? "آگهی مطابق جست‌وجوی شما پیدا نشد." : "هنوز آگهی‌ای ثبت نشده است."}
              emptyHint={name || count ? "عبارت جست‌وجو یا فیلترها را تغییر دهید." : undefined}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <View style={{ width: columns === 1 ? "100%" : "50%" }}>
            <ProductCard
              product={item}
              onPress={() =>
                navigation.navigate("Product", { code: item.code })
              }
            />
          </View>
        )}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage)
            query.fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          <View style={{ padding: 10 }}>
            {query.hasNextPage && (
              <Button
                outline
                title="آگهی‌های بیشتر"
                busy={query.isFetchingNextPage}
                onPress={() => query.fetchNextPage()}
              />
            )}
          </View>
        }
      />
    </Screen>
  );
}

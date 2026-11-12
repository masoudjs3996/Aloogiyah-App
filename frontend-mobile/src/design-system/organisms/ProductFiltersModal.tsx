import { AppModal as Modal } from "../molecules/AppModal";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { platformApi, request } from "../../api/platform";
import {

  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "../atoms/Text";
import { PriceRangeField } from "../molecules/PriceRangeField";
import { Button } from "../atoms/Button";
import { Select } from "../molecules/Select";
import SpecificationMark from "../molecules/SpecificationMark";
import { QueryState } from "../molecules/QueryState";
import { theme } from "../../shared/theme";
import type { AgriculturalProductTemplate, CategoryOption } from "../../shared/types/platform";
import {
  emptyProductFilters,
  productSortOptions,
  categoryOptions,
  categoryFilterCodes,
  validateProductFilters,
  type ProductFilters,
} from "../../shared/utils/product-filters";

export function ProductFiltersModal({
  value,
  categories,
  loading,
  error,
  onRetry,
  onApply,
  onClose,
}: {
  value: ProductFilters;
  categories: CategoryOption[];
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  onApply: (value: ProductFilters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(value);
  const [validationError, setValidationError] = useState("");
  const [sliding, setSliding] = useState(false);
  const categoryCodes = categoryFilterCodes(categories, draft.category);
  const provinces = useQuery({ queryKey: ["provinces"], queryFn: platformApi.provinces });
  const counties = useQuery({
    queryKey: ["counties", draft.provinceCode],
    queryFn: () => platformApi.counties(draft.provinceCode),
    enabled: !!draft.provinceCode,
  });
  const locations = useQuery({
    queryKey: ["locations", draft.countyCode],
    queryFn: () => platformApi.countyLocations(draft.countyCode),
    enabled: !!draft.countyCode,
  });
  const retryLocations = () => {
    for (const query of [provinces, counties, locations]) {
      if (query.isError) void query.refetch();
    }
  };
  const templates = useQuery({
    queryKey: ["listing-filter-templates", categoryCodes],
    queryFn: ({ signal }) => request<AgriculturalProductTemplate[]>("/AgriculturalProductTemplate", {
      params: { categoryCodes }, paramsSerializer: { indexes: null }, signal,
    }),
    enabled: !!categoryCodes?.length,
  });
  const choices = templates.data ?? [];
  const template = choices.find(item => item.code === draft.templateCode) ?? (choices.length === 1 ? choices[0] : undefined);
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View
            style={{
              flexDirection: "row-reverse",
              alignItems: "center",
              gap: 12,
              padding: 16,
              backgroundColor: "white",
              borderBottomWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Ionicons name="options-outline" size={24} color={theme.green} />
            <Text bold style={{ flex: 1, fontSize: 18 }}>
              فیلتر و مرتب‌سازی
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="بستن فیلترها"
              onPress={onClose}
              style={{ padding: 10 }}
            >
              <Ionicons name="close" size={24} color={theme.muted} />
            </Pressable>
          </View>
          <ScrollView
            scrollEnabled={!sliding}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, gap: 20 }}
          >
            <View style={{ gap: 12 }}>
            <Text bold>مرتب‌سازی بر اساس</Text>
              <View
                accessibilityRole="radiogroup"
                style={{
                  flexDirection: "row-reverse",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {productSortOptions.map((option) => (
                  <Pressable
                    key={option.value}
                    accessibilityRole="radio"
                    accessibilityState={{
                      checked: draft.sort === option.value,
                    }}
                    onPress={() => setDraft({ ...draft, sort: option.value })}
                    style={{
                      minHeight: 44,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor:
                        draft.sort === option.value
                          ? theme.green
                          : theme.border,
                      backgroundColor:
                        draft.sort === option.value ? theme.mint : "white",
                    }}
                  >
                    <Text
                      bold={draft.sort === option.value}
                      style={{
                        color:
                          draft.sort === option.value
                            ? theme.green
                            : theme.muted,
                        fontSize: 12,
                      }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
            <View
              style={{
                backgroundColor: "white",
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: theme.border,
              }}
            >
              <QueryState loading={loading} error={error} retry={onRetry} />
              <Select
                label="دسته‌بندی"
                value={draft.category}
                onChange={(category) => setDraft({ ...draft, category, templateCode: "", specificationOptions: {} })}
                disabled={loading}
                options={[
                  { value: "", label: "همه دسته‌ها" },
                  ...categoryOptions(categories),
                ]}
              />
            </View>
            <QueryState loading={!!draft.category && templates.isLoading} error={templates.error} retry={() => void templates.refetch()} />
            {choices.length > 1 && (
              <Select label="نوع آگهی" value={draft.templateCode}
                onChange={templateCode => setDraft({ ...draft, templateCode, specificationOptions: {} })}
                options={[{ value: "", label: "همهٔ نوع‌ها" }, ...choices.map(item => ({
                  value: item.code,
                  label: choices.some(other => other.code !== item.code && other.name === item.name) ? item.name + " — " + item.categoryName : item.name,
                }))]}
              />
            )}
            {template?.specifications.filter(field => field.options.length > 0).map(field => (
              <Select key={field.code} label={field.name} value={draft.specificationOptions[field.code] ?? ""}
                onChange={optionCode => setDraft({ ...draft, specificationOptions: { ...draft.specificationOptions, [field.code]: optionCode } })}
                options={[{ value: "", label: "همهٔ گزینه‌ها" }, ...field.options.map(option => ({
                  value: option.code, label: option.label,
                  leading: option.colorHex || option.icon ? <SpecificationMark {...option} /> : undefined,
                }))]}
              />
            ))}
            <View style={{ gap: 12 }}>
              <Text bold>موقعیت مزرعه</Text>
              <Select label="استان" value={draft.provinceCode}
                disabled={provinces.isLoading}
                onChange={code => setDraft({ ...draft, provinceCode: code, countyCode: "", localityCode: "" })}
                options={[{ value: "", label: "همهٔ استان‌ها" }, ...(provinces.data ?? []).map(option => ({ value: option.code, label: option.name }))]}
              />
              {draft.provinceCode && <Select label="شهرستان" value={draft.countyCode}
                disabled={counties.isLoading}
                onChange={code => setDraft({ ...draft, countyCode: code, localityCode: "" })}
                options={[{ value: "", label: "همهٔ شهرستان‌ها" }, ...(counties.data ?? []).map(option => ({ value: option.code, label: option.name }))]}
              />}
              {draft.countyCode && <Select label="شهر یا روستا" value={draft.localityCode}
                disabled={locations.isLoading}
                onChange={code => setDraft({ ...draft, localityCode: code })}
                options={[{ value: "", label: "همهٔ شهرها و روستاها" }, ...(locations.data ?? []).map(option => ({ value: option.code, label: option.name }))]}
              />}
              <QueryState loading={provinces.isLoading || counties.isLoading || locations.isLoading}
                error={provinces.error ?? counties.error ?? locations.error} retry={retryLocations} />
            </View>
            <View style={{ gap: 12 }}>
              <Text bold>بازه قیمت (تومان)</Text>
              <PriceRangeField
                minPrice={draft.minPrice}
                maxPrice={draft.maxPrice}
                onChange={(prices) => setDraft({ ...draft, ...prices })}
                onSlidingChange={setSliding}
              />
            </View>
            <View
              style={{
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.border,
                backgroundColor: "white",
                paddingHorizontal: 16,
              }}
            >
              {(
                [
                  { key: "stockOnly", title: "فقط آگهی‌های موجود" },
                ] as const
              ).map((option) => (
                <View
                  key={option.key}
                  style={{
                    flexDirection: "row-reverse",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 14,
                  }}
                >
                  <Text bold style={{ fontSize: 13 }}>
                    {option.title}
                  </Text>
                  <Switch
                    accessibilityLabel={option.title}
                    value={draft[option.key]}
                    onValueChange={(checked) =>
                      setDraft({ ...draft, [option.key]: checked })
                    }
                    trackColor={{ false: theme.border, true: theme.green }}
                    thumbColor="white"
                    ios_backgroundColor={theme.border}
                  />
                </View>
              ))}
            </View>
            {!!validationError && (
              <Text accessibilityRole="alert" style={{ color: theme.danger }}>
                {validationError}
              </Text>
            )}
          </ScrollView>
          <View
            style={{
              flexDirection: "row-reverse",
              gap: 12,
              padding: 16,
              backgroundColor: "white",
              borderTopWidth: 1,
              borderColor: theme.border,
            }}
          >
            <Button
              title="اعمال و نمایش آگهی‌ها"
              style={{ flex: 1 }}
              onPress={() => {
                const message = validateProductFilters(draft);
                setValidationError(message);
                if (!message) onApply(draft);
              }}
            />
            <Button
              title="پاک‌کردن"
              outline
              onPress={() => {
                setDraft({ ...emptyProductFilters });
                setValidationError("");
              }}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

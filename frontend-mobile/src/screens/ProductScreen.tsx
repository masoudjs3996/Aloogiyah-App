import { saleUnitLabel, saleDigits } from "../shared/utils/sale-units";
import React, { useState } from "react";
import {
  TextInput,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import RenderHTML from "react-native-render-html";
import { useQuery } from "@tanstack/react-query";
import type { Props } from "../navigation/types";
import { Screen } from "../design-system/templates/Screen";
import { Text } from "../design-system/atoms/Text";
import { Button } from "../design-system/atoms/Button";
import { ProductReviews } from "../design-system/organisms/ProductReviews";
import { ProductReportForm } from "../design-system/organisms/ProductReportForm";
import { SimilarProducts } from "../design-system/organisms/SimilarProducts";
import { QueryState } from "../design-system/molecules/QueryState";
import { ProductGallery } from "../design-system/molecules/ProductGallery";
import SpecificationMark from "../design-system/molecules/SpecificationMark";
import { api } from "../api/mobile";
import { platformApi, request } from "../api/platform";
import { useAction } from "../shared/hooks/useAction";
import { useAuth, useProfile } from "../shared/providers/AuthProvider";
import { number, money, imageUrl } from "../shared/utils/format";
import { theme } from "../shared/theme";

export function ProductScreen({ route, navigation }: Props<"Product">) {
  const code = route.params.code;
  const { width } = useWindowDimensions();
  const { signedIn } = useAuth();
  const myCode = useProfile().data?.user?.code;
  const product = useQuery({
    queryKey: ["product", code],
    queryFn: () => api.product(code),
  });
  const saved = useQuery({
    queryKey: ["saved"],
    queryFn: api.saved,
    enabled: signedIn,
  });
  const p = product.data;
  const summary = useQuery({
    queryKey: ["product-rating-summary", p?.code],
    enabled: !!p?.code,
    queryFn: () =>
      request<{ averageRating: number; ratingCount: number }>(
        "/Comment/GetRatingSummary",
        { params: { entityCode: p?.code, entityComment: "AgriculturalListing" } },
      ),
  });
  const farm = useQuery({
    queryKey: ["farm", p?.farmCode],
    queryFn: () => api.farm(p!.farmCode),
    enabled: !!p?.farmCode,
  });
  const { busy, run } = useAction();
  const { busy: openingChat, run: runChat } = useAction();
  const [count, setCount] = useState(1);
  const [failedFarmImage, setFailedFarmImage] = useState<string>();
  const farmImage = imageUrl(farm.data?.imageUrl);
  const sellerCode = farm.data?.ownerCode;
  const isOwnListing = !!myCode && sellerCode === myCode;
  const images = p?.imageUrls?.length ? p.imageUrls : [p?.primaryImageUrl];
  const isSaved = saved.data?.some((x) => x.code === p?.code);
  const requestInquiry = () =>
    run(async () => {
      if (!p || !Number.isSafeInteger(count) || count < 1 || count > p.stock)
        throw new Error("مقدار خرید باید بین ۱ و موجودی آگهی باشد");
      await platformApi.createProductInquiry({ productCode: p.code, quantity: count });
    }, "درخواست خرید ثبت شد؛ حالا با فروشنده هماهنگ کنید");
  const openSellerChat = () => {
    if (!sellerCode || isOwnListing) return;
    if (!signedIn) {
      navigation.navigate("Login");
      return;
    }
    void runChat(async () => {
      const room = await platformApi.getOrCreateConversation(sellerCode);
      navigation.navigate("ChatRoom", { code: room.code, title: farm.data?.name });
    });
  };

  return (
    <Screen
      onRefresh={() => {
        void product.refetch();
        if (p) void summary.refetch();
        if (p?.farmCode) void farm.refetch();
      }}
      refreshing={product.isRefetching}
    >
      <QueryState
        loading={product.isLoading}
        error={product.error}
        retry={() => product.refetch()}
      />
      {p && (
        <>
          <ProductGallery key={code} images={images} />
          <View style={styles.details}>
            <Text bold style={styles.title}>
              {p.name}
            </Text>
            {summary.data && (
              <View style={[styles.row, { marginBottom: 12 }]}>
                <View style={styles.row}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={
                        star <= Math.round(summary.data.averageRating)
                          ? "star"
                          : "star-outline"
                      }
                      size={18}
                      color={theme.gold}
                    />
                  ))}
                </View>
                <Text muted style={{ fontSize: 12 }}>
                  {summary.data.ratingCount
                    ? `${number(summary.data.averageRating)} از ۵ (${number(summary.data.ratingCount)} امتیاز)`
                    : "بدون امتیاز"}
                </Text>
              </View>
            )}
            <View style={{ gap: 4, paddingVertical: 16 }}>
              <Text muted style={{ fontSize: 12 }}>قیمت هر {saleUnitLabel(p.saleUnit)}</Text>
              <Text bold style={{ color: theme.green, fontSize: 24, lineHeight: 38 }}>
                {money(p.retailPrice)}
              </Text>
            </View>
            <Text muted style={{ fontSize: 12 }}>
              {p.stock > 0 ? `موجودی: ${number(p.stock)} ${saleUnitLabel(p.saleUnit)}` : "ناموجود"}
            </Text>
            <View style={[styles.row, { flexDirection: "row", marginTop: 8 }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isSaved ? "حذف آگهی از ذخیره‌ها" : "ذخیره آگهی"}
                accessibilityState={{ selected: !!isSaved, disabled: busy }}
                disabled={busy}
                onPress={() =>
                  signedIn
                    ? run(() => api.save(p.code, !isSaved))
                    : navigation.navigate("Login")
                }
                style={styles.iconButton}
              >
                <Ionicons
                  name={isSaved ? "bookmark" : "bookmark-outline"}
                  size={23}
                  color={theme.green}
                />
              </Pressable>
              <ProductReportForm key={p.code} code={p.code} signedIn={signedIn} onLogin={() => navigation.navigate("Login")} />
            </View>
            {!isOwnListing && p.stock > 0 && <View style={styles.dock}>
              <Text bold style={{ color: theme.green, marginBottom: 6 }}>درخواست خرید مستقیم</Text>
              <Text muted style={{ fontSize: 11, lineHeight: 21, marginBottom: 12 }}>مقدار موردنیاز را وارد کنید تا کشاورز بتواند با شما هماهنگ کند.</Text>
              <View style={styles.dockContent}>
                <View style={styles.stepper}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="افزایش تعداد"
                    disabled={p.stock <= 0 || count >= p.stock}
                    onPress={() => setCount((value) => value + 1)}
                    style={[
                      styles.stepButton,
                      count >= p.stock && styles.disabled,
                    ]}
                  >
                    <Ionicons name="add" size={16} color={theme.green} />
                  </Pressable>
                  <TextInput
                    accessibilityLabel="مقدار خرید"
                    keyboardType="number-pad"
                    editable={p.stock > 0}
                    maxLength={10}
                    selectTextOnFocus
                    value={count ? String(count) : ""}
                    onChangeText={value => {
                      const raw = saleDigits(value);
                      if (/^\d*$/.test(raw)) setCount(Number(raw));
                    }}
                    style={{ flex: 1, minWidth: 56, textAlign: "center", fontFamily: "Vazir", color: theme.ink, padding: 8 }}
                  />
                  <Text style={{ fontSize: 11 }}>{saleUnitLabel(p.saleUnit)}</Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="کاهش تعداد"
                    disabled={p.stock <= 0 || count <= 1}
                    onPress={() => setCount((value) => Math.max(1, value - 1))}
                    style={[styles.stepButton, count <= 1 && styles.disabled]}
                  >
                    <Ionicons name="remove" size={16} color={theme.green} />
                  </Pressable>
                </View>
                <Button
                  title="ثبت درخواست خرید"
                  busy={busy}
                  disabled={p.stock <= 0 || count < 1 || !Number.isSafeInteger(count) || count > p.stock}
                  onPress={() => signedIn ? requestInquiry() : navigation.navigate("Login")}
                  style={{ flexGrow: 1, flexBasis: 160, paddingHorizontal: 8 }}
                />
              </View>
              {p.stock > 0 && (count > p.stock || count < 1) && (
                <Text style={{ color: theme.danger, fontSize: 12, marginTop: 8, lineHeight: 22 }}>
                  {count > p.stock ? "مقدار انتخابی بیشتر از موجودی است." : "حداقل مقدار خرید ۱ است."}
                </Text>
              )}
            </View>}
            {!!(p.productTemplateName || p.specifications?.length) && (
              <View style={styles.specifications}>
                <Text bold>مشخصات آگهی</Text>
                {!!p.productTemplateName && (
                  <Text muted style={{ fontSize: 12 }}>نوع محصول · {p.productTemplateName}</Text>
                )}
                {p.specifications?.map(specification => (
                  <View key={specification.specificationCode} style={styles.specificationRow}>
                    <Text muted style={{ fontSize: 12, lineHeight: 20 }}>{specification.name}</Text>
                    <View style={{ flexDirection: "row-reverse", alignItems: "center", gap: 7 }}>
                      <SpecificationMark {...specification} />
                      <Text bold style={{ lineHeight: 23, flexShrink: 1 }}>{specification.value}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
            <RenderHTML
              contentWidth={Math.min(width, 768) - 72}
              source={{
                html: p.description || "توضیحی برای این محصول ثبت نشده است.",
              }}
              ignoredDomTags={[
                "script",
                "iframe",
                "object",
                "embed",
                "style",
                "form",
                "input",
              ]}
              baseStyle={{
                fontFamily: "Vazir",
                color: theme.ink,
                textAlign: "right",
                fontSize: 14,
                lineHeight: 28,
              }}
              systemFonts={["Vazir", "VazirBold"]}
              renderersProps={{
                a: {
                  onPress: (_, href) => {
                    if (/^https?:\/\//i.test(href)) void Linking.openURL(href);
                  },
                },
              }}
            />
            <View style={styles.seller}>
              <View style={styles.row}>
                <Ionicons
                  name="storefront-outline"
                  size={20}
                  color={theme.green}
                />
                <Text bold>مزرعه و فروشنده</Text>
              </View>
              <QueryState
                loading={farm.isLoading}
                error={farm.error}
                retry={() => farm.refetch()}
              />
              {farm.data && (
                <View style={[styles.row, { flexWrap: "nowrap" }]}>
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      overflow: "hidden",
                      backgroundColor: "#D1FAE5",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {farmImage && failedFarmImage !== farmImage ? (
                      <Image
                        accessibilityLabel={`تصویر ${farm.data.name}`}
                        source={{ uri: farmImage }}
                        resizeMode="cover"
                        onError={() => setFailedFarmImage(farmImage)}
                        style={{ width: 48, height: 48 }}
                      />
                    ) : (
                      <Ionicons
                        name="storefront-outline"
                        size={24}
                        color={theme.green}
                      />
                    )}
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                    <Text bold>{farm.data.name}</Text>
                    <View style={styles.row}>
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color={theme.green}
                      />
                      <Text muted style={{ fontSize: 12, flex: 1 }}>
                        {[
                          farm.data.address?.provinceName && `استان ${farm.data.address.provinceName}`,
                          farm.data.address?.countyName && `شهرستان ${farm.data.address.countyName}`,
                        ]
                          .filter(Boolean)
                          .join("، ") || "موقعیت ثبت‌نشده"}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
              <View style={styles.row}>
                {!!sellerCode && !isOwnListing && (
                  <Button
                    title="گفت‌وگو با فروشنده"
                    icon={<Ionicons name="chatbubble-outline" size={18} color={theme.white} />}
                    busy={openingChat}
                    onPress={openSellerChat}
                  />
                )}
                <Button
                  outline
                  title="صفحه مزرعه"
                  disabled={!p.farmCode}
                  onPress={() =>
                    navigation.navigate("Farm", { code: p.farmCode })
                  }
                />
              </View>
            </View>
          </View>
          <ProductReviews
            code={p.code}
            onLogin={() => navigation.navigate("Login")}
          />
          <SimilarProducts
            code={p.code}
            onBrowse={() => navigation.navigate("Products")}
            onSelect={(productCode) =>
              navigation.push("Product", { code: productCode })
            }
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row-reverse",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  details: {
    backgroundColor: theme.white,
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 24,
  },
  title: { fontSize: 24, lineHeight: 40, marginBottom: 12 },
  seller: {
    borderWidth: 1,
    borderColor: "#D1FAE5",
    backgroundColor: "#ECFDF5",
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: theme.mint,
  },
  reviews: { paddingVertical: 12 },
  review: {
    borderBottomWidth: 1,
    borderColor: theme.border,
    paddingVertical: 16,
    gap: 8,
  },
  reviewButton: {
    borderWidth: 1,
    borderColor: "#D1FAE5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.white,
  },
  dock: {
    marginTop: 24,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#ECFDF5",
  },
  specifications: {
    marginTop: 18,
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: "#F8FAFC",
    gap: 8,
  },
  specificationRow: {
    gap: 2,
    backgroundColor: theme.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  dockContent: {
    width: "100%",
    maxWidth: 736,
    alignSelf: "center",
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  stepper: {
    flexGrow: 1,
    flexBasis: 176,
    flexDirection: "row-reverse",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
  },
  stepButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.35 },
});

import { useProductColumns } from "../shared/hooks/useProductColumns";
import React, { useEffect, useState } from "react";
import {
  Image,
  Linking,
  StyleSheet,
  Switch,
  View,
  useWindowDimensions,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import RenderHTML from "react-native-render-html";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import type { Props } from "../navigation/types";
import { api } from "../api/mobile";
import { errorMessage, paged, platformApi } from "../api/platform";
import { Screen } from "../design-system/templates/Screen";
import { Text } from "../design-system/atoms/Text";
import { Button } from "../design-system/atoms/Button";
import { Field } from "../design-system/atoms/Field";
import { QueryState } from "../design-system/molecules/QueryState";
import { ProductCard } from "../design-system/molecules/ProductCard";
import { Select } from "../design-system/molecules/Select";
import { LocationMap } from "../design-system/organisms/LocationMap";
import { validPoint } from "../shared/utils/mapHtml";
import { useAuth, useProfile } from "../shared/providers/AuthProvider";
import { useAction } from "../shared/hooks/useAction";
import { appAlert } from "../shared/alerts";
import { imageUrl, money, number, date } from "../shared/utils/format";
import { theme } from "../shared/theme";

type SellerFarm = {
  farmCode: string;
  userFullName: string;
  userImageUrl?: string;
};

function FarmPhoto({
  uri,
  name,
  avatar = false,
}: {
  uri?: string;
  name: string;
  avatar?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <View style={avatar ? styles.avatar : styles.photo}>
      {uri && !failed ? (
        <Image
          accessibilityLabel={name}
          source={{ uri }}
          resizeMode="cover"
          onError={() => setFailed(true)}
          style={{ width: "100%", height: "100%" }}
        />
      ) : (
        <Ionicons
          name={avatar ? "person-outline" : "leaf-outline"}
          size={avatar ? 26 : 64}
          color={theme.green}
        />
      )}
    </View>
  );
}

export function FarmScreen({ route, navigation }: Props<"Farm">) {
  const columns = useProductColumns();
  const code = route.params.code;
  const { width } = useWindowDimensions();
  const { signedIn } = useAuth();
  const myCode = useProfile().data?.user?.code;
  const { busy, run } = useAction();
  const contact = useMutation({ mutationFn: api.farmContact });
  const contactRequested = signedIn && contact.variables === code;
  const phone = contactRequested ? contact.data?.phoneNumber : null;
  const query = useQuery({
    queryKey: ["farm", code],
    queryFn: () => api.farm(code),
  });
  const f = query.data;
  const address = f?.address;
  const fullAddress = [address?.provinceName, address?.countyName, address?.villageName || address?.cityName, address?.street]
    .map(part => part?.trim()).filter(Boolean).join("، ");
  const sellerQuery = useQuery({
    queryKey: ["farm-owner", code, f?.ownerCode],
    queryFn: () =>
      paged<SellerFarm>(
        "/Farm/GetByFilter",
        { UserCode: f!.ownerCode, PageSize: 100 },
        true,
      ),
    enabled: !!f?.ownerCode,
  });
  const seller = sellerQuery.data?.items.find((item) => item.farmCode === code);
  const [search, setSearch] = useState("");
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState("");
  const [stockOnly, setStockOnly] = useState(false);
  const [discountOnly, setDiscountOnly] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setTerm(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: platformApi.categories,
  });
  const filters = {
    FarmCode: code,
    Name: term || undefined,
    CategoryCodes: category ? [category] : undefined,
    MinStock: stockOnly ? 1 : undefined,
    DiscountedOnly: discountOnly || undefined,
  };
  const products = useInfiniteQuery({
    queryKey: ["farm-products", filters],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      api.products({ ...filters, PageNumber: pageParam, PageSize: 12 }, signal),
    getNextPageParam: (last) =>
      last.pageNumber * last.pageSize < last.totalCount
        ? last.pageNumber + 1
        : undefined,
    enabled: !!f,
  });
  const items = [
    ...new Map(
      products.data?.pages
        .flatMap((page) => page.items)
        .map((item) => [item.code, item]) || [],
    ).values(),
  ];
  const point = f?.address
    ? { latitude: f.address.latitude!, longitude: f.address.longitude! }
    : undefined;
  const refresh = () => {
    void query.refetch();
    void sellerQuery.refetch();
    void products.refetch();
  };
  return (
    <Screen onRefresh={refresh} refreshing={query.isRefetching}>
      <QueryState
        loading={query.isLoading}
        error={query.error}
        retry={() => query.refetch()}
      />
      {f && (
        <>
          <View style={styles.profile}>
            <FarmPhoto
              key={f.imageUrl}
              uri={imageUrl(f.imageUrl)}
              name={`تصویر ${f.name}`}
            />
            <View style={styles.information}>
              <Text bold style={{ fontSize: 12, color: theme.green }}>
                آشنایی با مزرعه
              </Text>
              <Text
                bold
                style={{
                  fontSize: 24,
                  lineHeight: 36,
                  marginTop: 8,
                  marginBottom: 16,
                }}
              >
                {f.name}
              </Text>
              <View style={[styles.row, { marginBottom: 20 }]}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={theme.green}
                />
                <Text muted style={{ flex: 1 }}>
                  {[
                    f.address?.provinceName,
                    f.address?.countyName,
                    f.address?.cityName,
                  ]
                    .filter(Boolean)
                    .join("، ") || "موقعیت ثبت‌نشده"}
                </Text>
              </View>
              <RenderHTML
                contentWidth={Math.min(width, 768) - 72}
                source={{
                  html: f.description || "توضیحی برای این مزرعه ثبت نشده است.",
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
                  textAlign: "right",
                  fontSize: 14,
                  lineHeight: 28,
                  color: "#475569",
                }}
                systemFonts={["Vazir", "VazirBold"]}
                renderersProps={{
                  a: {
                    onPress: (_, href) => {
                      if (/^https?:\/\//i.test(href))
                        void Linking.openURL(href);
                    },
                  },
                }}
              />
              <View
                style={[styles.row, { alignItems: "stretch", marginTop: 24 }]}
              >
                <View style={[styles.stat, { backgroundColor: "#ECFDF5" }]}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={theme.green}
                  />
                  <Text muted style={styles.label}>
                    تاریخ ثبت
                  </Text>
                  <Text bold style={styles.value}>
                    {date(f.createdAt)}
                  </Text>
                </View>
                <View style={[styles.stat, { backgroundColor: "#FFFBEB" }]}>
                  <Ionicons name="bag-outline" size={20} color="#B45309" />
                  <Text muted style={styles.label}>
                    حداقل خرید
                  </Text>
                  <Text bold style={styles.value}>
                    {money(f.minPurchase)}
                  </Text>
                </View>
              </View>
              {f.capacity != null && (
                <View style={[styles.row, styles.capacity]}>
                  <Ionicons name="grid-outline" size={20} color={theme.muted} />
                  <View style={{ flex: 1 }}>
                    <Text muted style={styles.label}>
                      ظرفیت مزرعه
                    </Text>
                    <Text bold style={styles.value}>
                      {number(f.capacity)}
                    </Text>
                  </View>
                </View>
              )}
              <View style={styles.seller}>
                <View style={[styles.row, { marginBottom: 12 }]}>
                  <Ionicons
                    name="person-circle-outline"
                    size={20}
                    color={theme.green}
                  />
                  <Text bold style={{ fontSize: 12 }}>
                    فروشنده‌ی این مزرعه
                  </Text>
                </View>
                <QueryState
                  loading={sellerQuery.isLoading}
                  error={sellerQuery.error}
                  retry={() => sellerQuery.refetch()}
                />
                {seller ? (
                  <View style={styles.row}>
                    <FarmPhoto
                      key={seller.userImageUrl}
                      avatar
                      uri={imageUrl(seller.userImageUrl)}
                      name={`تصویر ${seller.userFullName || "فروشنده"}`}
                    />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text bold>
                        {seller.userFullName || "فروشنده الو گیاه"}
                      </Text>
                      <Text
                        muted
                        style={{ fontSize: 11, lineHeight: 20, marginTop: 4 }}
                      >
                        مدیریت و عرضه آگهی‌های این مزرعه
                      </Text>
                    </View>
                  </View>
                ) : (
                  !sellerQuery.isLoading &&
                  !sellerQuery.error && (
                    <Text muted style={{ fontSize: 12 }}>
                      اطلاعات فروشنده در دسترس نیست.
                    </Text>
                  )
                )}
                <View style={{ marginTop: 14, gap: 8 }}>
                  {phone ? (
                    <>
                      <Text bold style={{ writingDirection: "ltr" }}>{phone}</Text>
                      <Button outline title="تماس با مزرعه‌دار" onPress={() => {
                        void Linking.openURL(`tel:${phone}`).catch(() => {
                          appAlert.alert("تماس با مزرعه‌دار", "شماره‌گیر روی این دستگاه باز نشد.");
                        });
                      }} />
                    </>
                  ) : contactRequested && contact.isSuccess ? (
                    <Text muted style={{ fontSize: 12 }}>شمارهٔ تماسی ثبت نشده است.</Text>
                  ) : (
                    <>
                      <Button outline title="نمایش شماره تماس" busy={contact.isPending}
                        onPress={() => signedIn ? contact.mutate(code) : navigation.navigate("Login")} />
                      {contactRequested && contact.isError && (
                        <Text style={{ color: theme.danger, fontSize: 12 }}>{errorMessage(contact.error)}</Text>
                      )}
                    </>
                  )}
                </View>
              </View>
              {!!f.ownerCode && f.ownerCode !== myCode && (
                <Button
                  title="گفت‌وگو با فروشنده"
                  busy={busy}
                  style={{ alignSelf: "flex-end", marginTop: 24 }}
                  onPress={() =>
                    signedIn
                      ? run(async () => {
                          const room =
                            await platformApi.getOrCreateConversation(
                              f.ownerCode,
                            );
                          navigation.navigate("ChatRoom", {
                            code: room.code,
                            title: seller?.userFullName || f.name,
                          });
                        })
                      : navigation.navigate("Login")
                  }
                />
              )}
            </View>
          </View>
          <View style={styles.map}>
            <View style={[styles.row, { marginBottom: 16 }]}>
              <Ionicons name="location-outline" size={24} color={theme.green} />
              <View style={{ flex: 1 }}>
                <Text bold>موقعیت مزرعه</Text>
                <Text muted style={{ fontSize: 12 }}>
                  نمایش موقعیت ثبت‌شده روی نقشه
                </Text>
              </View>
            </View>
            {validPoint(point) ? (
              <LocationMap value={point} height={220} />
            ) : (
              <Text muted style={{ paddingVertical: 24, textAlign: "center" }}>
                موقعیت جغرافیایی این مزرعه ثبت نشده است.
              </Text>
            )}
            {!!fullAddress && (
              <View style={{ gap: 6, marginTop: 12 }}>
                <Text bold>نشانی مزرعه</Text>
                <Text muted style={{ fontSize: 13, lineHeight: 24 }}>{fullAddress}</Text>
              </View>
            )}
          </View>
          <View style={{ marginBottom: 24 }}>
            <Text bold style={{ fontSize: 20, marginBottom: 20 }}>
              آگهی‌های این مزرعه
            </Text>
            <Field
              label="جست‌وجوی آگهی‌های مزرعه"
              placeholder="نام آگهی"
              value={search}
              onChangeText={setSearch}
            />
            <Select
              label="دسته‌بندی"
              value={category}
              onChange={setCategory}
              options={[
                { value: "", label: "همه دسته‌ها" },
                ...(categories.data?.items.map((item) => ({
                  value: item.code,
                  label: item.name,
                })) || []),
              ]}
            />
            <View style={styles.filter}>
              <Text style={{ flex: 1 }}>فقط آگهی‌های موجود</Text>
              <Switch
                accessibilityLabel="فقط آگهی‌های موجود"
                value={stockOnly}
                onValueChange={setStockOnly}
                trackColor={{ true: theme.green }}
              />
            </View>
            <View style={styles.filter}>
              <Text style={{ flex: 1 }}>فقط آگهی‌های تخفیف‌دار</Text>
              <Switch
                accessibilityLabel="فقط آگهی‌های تخفیف‌دار"
                value={discountOnly}
                onValueChange={setDiscountOnly}
                trackColor={{ true: theme.green }}
              />
            </View>
            <QueryState
              loading={products.isLoading}
              error={products.error}
              retry={() => products.refetch()}
            />
            {!products.isLoading && !products.error && !items.length && (
              <Text muted style={{ textAlign: "center", padding: 24 }}>
                آگهی‌ای با این شرایط پیدا نشد.
              </Text>
            )}
            <View style={styles.grid}>
              {items.map((product) => (
                <View
                  key={product.code}
                  style={{ width: columns === 1 ? "100%" : "50%" }}
                >
                  <ProductCard
                    product={product}
                    onPress={() =>
                      navigation.navigate("Product", { code: product.code })
                    }
                  />
                </View>
              ))}
            </View>
            {products.hasNextPage && (
              <Button
                outline
                title="آگهی‌های بیشتر"
                busy={products.isFetchingNextPage}
                onPress={() => {
                  void products.fetchNextPage();
                }}
                style={{ marginTop: 16 }}
              />
            )}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: {
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 28,
  },
  photo: {
    width: "100%",
    aspectRatio: 4 / 3,
    minHeight: 240,
    backgroundColor: theme.mint,
    alignItems: "center",
    justifyContent: "center",
  },
  information: { padding: 20 },
  row: { flexDirection: "row-reverse", alignItems: "center", gap: 12 },
  stat: {
    flex: 1,
    minWidth: 0,
    alignItems: "flex-end",
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  label: { fontSize: 11, lineHeight: 20 },
  value: { fontSize: 12, lineHeight: 22 },
  capacity: {
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    padding: 16,
    marginTop: 12,
  },
  seller: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#F1F5F9",
    borderRadius: 16,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#D1FAE5",
    alignItems: "center",
    justifyContent: "center",
  },
  map: {
    backgroundColor: theme.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.border,
    padding: 12,
    marginBottom: 28,
  },
  filter: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  grid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    marginHorizontal: -5,
    marginTop: 16,
  },
});

import React, { useState, useRef, useEffect } from "react";
import { FlatList, View, Image } from "react-native";
import { imageUrl } from "../../shared/utils/format";
type Banner = { code: string; imageUrl?: string | null; description: string };

function BannerSlide({ item, size }: { item: Banner; size: number }) {
  const uri = imageUrl(item.imageUrl);
  if (!uri) return null;
  return (
    <View
      style={{
        width: size,
        height: 290,
        borderRadius: 24,
        overflow: "hidden",
        backgroundColor: "#ECFDF5",
      }}
    >
      <Image
        source={{ uri }}
        accessibilityLabel={item.description || undefined}
        resizeMode="cover"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: size,
          height: 290,
        }}
      />
    </View>
  );
}
export function BannerCarousel({ items }: { items?: Banner[] }) {
  const [size, setSize] = useState(0);
  const [active, setActive] = useState(0);
  const ref = useRef<FlatList>(null);
  const banners =
    items?.filter((item) => item.imageUrl?.trim() && imageUrl(item.imageUrl)) ??
    [];
  useEffect(() => {
    if (banners.length < 2 || size <= 0) return;
    const t = setInterval(() => {
      setActive((i) => {
        const next = (i + 1) % banners.length;
        ref.current?.scrollToOffset({ offset: next * size, animated: true });
        return next;
      });
    }, 5000);
    return () => clearInterval(t);
  }, [banners.length, size]);
  if (!banners.length) return null;
  return (
    <View
      onLayout={(event) => setSize(event.nativeEvent.layout.width)}
      style={{ marginBottom: 24 }}
    >
      {size > 0 && (
        <FlatList
          ref={ref}
          horizontal
          style={{ direction: "ltr" }}
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={banners}
          keyExtractor={(b) => b.code}
          onMomentumScrollEnd={(e) =>
            setActive(
              Math.max(
                0,
                Math.min(
                  banners.length - 1,
                  Math.round(e.nativeEvent.contentOffset.x / size),
                ),
              ),
            )
          }
          renderItem={({ item }) => <BannerSlide item={item} size={size} />}
        />
      )}
      {banners.length > 1 && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            gap: 5,
            marginTop: 10,
          }}
        >
          {banners.map((b, i) => (
            <View
              key={b.code}
              style={{
                height: 5,
                width: i === active ? 20 : 6,
                borderRadius: 5,
                backgroundColor: i === active ? "#2C6041" : "#CBD5E1",
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

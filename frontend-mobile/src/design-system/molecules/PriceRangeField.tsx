import React, { useRef, useState } from "react";
import { View, PanResponder } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/mobile";
import {
  catalogPrice,
  formatPriceInput,
  movePriceThumb,
  priceRange,
} from "../../shared/utils/price-range";
import { Field } from "../atoms/Field";
import { Text } from "../atoms/Text";
import { theme } from "../../shared/theme";

function PriceThumb({
  thumb,
  range,
  width,
  onChange,
  onSlidingChange,
}: {
  thumb: "min" | "max";
  range: ReturnType<typeof priceRange>;
  width: number;
  onChange: (thumb: "min" | "max", value: number) => void;
  onSlidingChange: (sliding: boolean) => void;
}) {
  const value = thumb === "min" ? range.lower : range.upper;
  const latest = useRef({ range, width, onChange, onSlidingChange, value });
  latest.current = { range, width, onChange, onSlidingChange, value };
  const start = useRef({ range, width, value });
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => latest.current.width > 0,
      onPanResponderGrant: () => {
        start.current = latest.current;
        latest.current.onSlidingChange(true);
      },
      onPanResponderMove: (_, gesture) => {
        const snapshot = start.current;
        const next = movePriceThumb(
          snapshot.value -
            (gesture.dx / Math.max(1, snapshot.width)) * snapshot.range.ceiling,
          thumb,
          snapshot.range,
        );
        latest.current.onChange(thumb, next);
      },
      onPanResponderRelease: () => latest.current.onSlidingChange(false),
      onPanResponderTerminate: () => latest.current.onSlidingChange(false),
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;
  return (
    <View
      {...responder.panHandlers}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={thumb === "min" ? "حداقل قیمت" : "حداکثر قیمت"}
      accessibilityValue={{
        min: thumb === "min" ? 0 : range.lower,
        max: thumb === "max" ? range.ceiling : range.upper,
        now: value,
        text: `${formatPriceInput(String(value))} تومان`,
      }}
      accessibilityActions={[
        { name: "increment", label: "افزایش قیمت" },
        { name: "decrement", label: "کاهش قیمت" },
      ]}
      onAccessibilityAction={(event) => {
        const direction =
          event.nativeEvent.actionName === "increment"
            ? 1
            : event.nativeEvent.actionName === "decrement"
              ? -1
              : 0;
        if (direction)
          onChange(
            thumb,
            movePriceThumb(value + direction * range.step, thumb, range),
          );
      }}
      style={{
        position: "absolute",
        left: (1 - value / range.ceiling) * width,
        top: 4,
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        zIndex:
          thumb === "min" && range.lower === range.ceiling
            ? 3
            : thumb === "max"
              ? 2
              : 1,
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          borderWidth: 3,
          borderColor: theme.green,
          backgroundColor: "white",
          boxShadow: "0 2px 5px #0F172A26",
        }}
      />
    </View>
  );
}

export function PriceRangeField({
  minPrice,
  maxPrice,
  onChange,
  onSlidingChange,
}: {
  minPrice: string;
  maxPrice: string;
  onChange: (value: { minPrice: string; maxPrice: string }) => void;
  onSlidingChange: (sliding: boolean) => void;
}) {
  const [width, setWidth] = useState(0);
  const maximum = useQuery({
    queryKey: ["price-range-maximum"],
    queryFn: ({ signal }) =>
      api.products(
        {
          SortColumn: "price",
          SortDescending: true,
          PageSize: 1,
          PageNumber: 1,
        },
        signal,
      ),
    staleTime: 300000,
    retry: false,
  });
  const range = priceRange(
    minPrice,
    maxPrice,
    catalogPrice(maximum.data?.items[0]),
  );
  const update = (thumb: "min" | "max", value: number) => {
    onChange(
      thumb === "min"
        ? { minPrice: formatPriceInput(String(value)), maxPrice }
        : {
            minPrice,
          maxPrice: formatPriceInput(String(value)),
          },
    );
  };
  return (
    <View>
      <View style={{ flexDirection: "row-reverse", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Field
            label="از قیمت"
            keyboardType="decimal-pad"
            value={formatPriceInput(minPrice)}
            placeholder="بدون حداقل"
            onChangeText={(value) =>
              onChange({ minPrice: formatPriceInput(value), maxPrice })
            }
          />
        </View>
        <View style={{ flex: 1 }}>
          <Field
            label="تا قیمت"
            keyboardType="decimal-pad"
            value={formatPriceInput(maxPrice)}
            placeholder="بدون حداکثر"
            onChangeText={(value) =>
              onChange({ minPrice, maxPrice: formatPriceInput(value) })
            }
          />
        </View>
      </View>
      <View
        style={{ height: 52, direction: "ltr" }}
        onLayout={(event) =>
          setWidth(Math.max(0, event.nativeEvent.layout.width - 44))
        }
      >
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 23,
            left: 22,
            right: 22,
            height: 6,
            borderRadius: 3,
            backgroundColor: theme.border,
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 23,
            left: 22 + (1 - range.upper / range.ceiling) * width,
            width: ((range.upper - range.lower) / range.ceiling) * width,
            height: 6,
            borderRadius: 3,
            backgroundColor: theme.green,
          }}
        />
        <PriceThumb
          thumb="min"
          range={range}
          width={width}
          onChange={update}
          onSlidingChange={onSlidingChange}
        />
        <PriceThumb
          thumb="max"
          range={range}
          width={width}
          onChange={update}
          onSlidingChange={onSlidingChange}
        />
      </View>
      <View
        style={{
          flexDirection: "row-reverse",
          justifyContent: "space-between",
          paddingHorizontal: 12,
        }}
      >
        <Text muted style={{ fontSize: 11 }}>
          0
        </Text>
        <Text muted style={{ fontSize: 11 }}>
          {formatPriceInput(String(range.ceiling))}
        </Text>
      </View>
    </View>
  );
}

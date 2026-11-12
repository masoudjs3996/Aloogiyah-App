import React from "react";
import { View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Text } from "../atoms/Text";
import { theme } from "../../shared/theme";
import {
  orderTrackingState,
  orderProgressSteps,
  orderStatusLabel,
} from "../../shared/order-statuses";
const icons = [
  "clipboard-outline",
  "time-outline",
  "checkmark-circle-outline",
  "car-outline",
  "home-outline",
] as const;
export function OrderProgress({
  statusCode,
  statusTitle,
  history = [],
  orderItems,
}: {
  statusCode: string;
  statusTitle?: string;
  history?: { action: string }[];
  orderItems?: { quantity: number; receivedAtHubQuantity?: number }[];
}) {
  const { stopped, current, reached, delivered } = orderTrackingState({ statusCode, statusTitle, history, orderItems });
  return (
    <View
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#F1F5F9",
        backgroundColor: "#F8FAFC",
        padding: 12,
      }}
    >
      <View
        accessibilityLabel="مراحل سفارش"
        style={{ flexDirection: "row-reverse" }}
      >
        {orderProgressSteps.map((step, index) => {
          const active = !stopped && current === index;
          const complete =
            index === 0 ||
            (stopped ? index <= reached : index < reached || delivered);
          return (
            <View
              key={step.code}
              accessibilityLabel={`${step.label}، ${complete ? "انجام‌شده" : active ? "مرحله فعلی" : "انجام‌نشده"}`}
              style={{ flex: 1, minWidth: 0, alignItems: "center", gap: 8 }}
            >
              {index < orderProgressSteps.length - 1 && (
                <View
                  style={{
                    position: "absolute",
                    right: "50%",
                    top: 13,
                    height: 2,
                    width: "100%",
                    backgroundColor: index < reached ? "#10B981" : "#E2E8F0",
                  }}
                />
              )}
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  borderWidth: 2,
                  borderColor: complete || active ? theme.green : "#E2E8F0",
                  backgroundColor: complete ? theme.green : "white",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={icons[index]}
                  size={16}
                  color={complete ? "white" : active ? theme.green : "#94A3B8"}
                />
              </View>
              <Text
                bold={complete || active}
                style={{
                  width: "100%",
                  textAlign: "center",
                  fontSize: 9,
                  lineHeight: 18,
                  color: complete || active ? "#065F46" : "#94A3B8",
                }}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
      {stopped && (
        <View
          style={{
            flexDirection: "row-reverse",
            gap: 6,
            backgroundColor: "#FEF2F2",
            padding: 10,
            borderRadius: 12,
            marginTop: 12,
          }}
        >
          <Ionicons
            name="close-circle-outline"
            size={18}
            color={theme.danger}
          />
          <Text bold style={{ flex: 1, color: theme.danger, fontSize: 12 }}>
            {orderStatusLabel(statusCode, statusTitle)}
          </Text>
        </View>
      )}
    </View>
  );
}

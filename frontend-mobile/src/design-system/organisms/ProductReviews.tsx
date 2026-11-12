import { AppModal as Modal } from "../molecules/AppModal";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,

  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/mobile";
import { request } from "../../api/platform";
import type { Review } from "../../shared/types/mobile";
import { useAuth } from "../../shared/providers/AuthProvider";
import { useAction } from "../../shared/hooks/useAction";
import { theme } from "../../shared/theme";
import { number } from "../../shared/utils/format";
import { Text } from "../atoms/Text";
import { Button } from "../atoms/Button";
import { Field } from "../atoms/Field";
import { QueryState } from "../molecules/QueryState";

type OwnReview = {
  code: string;
  content: string;
  rating?: number;
  statusCode: string;
};

function Comment({
  review,
  reply = false,
  ownCode,
  onReply,
}: {
  review: Review;
  reply?: boolean;
  ownCode?: string;
  onReply: (parentCode: string | null) => void;
}) {
  return (
    <View style={{ gap: 12 }}>
      <View style={[styles.comment, reply && styles.reply]}>
        {reply && <View style={styles.connector} />}
        <Text
          bold
          style={{ fontSize: 12, color: reply ? theme.green : theme.muted }}
        >
          {review.name ||
            review.userFullName ||
            review.userName ||
            (reply ? "فروشگاه" : "کاربر الو گیاه")}
        </Text>
        <Text style={{ lineHeight: 28, color: "#334155" }}>
          {review.content}
        </Text>
        {!!review.rating && (
          <View
            style={{ flexDirection: "row", gap: 3 }}
            accessibilityLabel={`امتیاز ${number(review.rating)} از ۵`}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= review.rating! ? "star" : "star-outline"}
                size={16}
                color={theme.gold}
              />
            ))}
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={() => onReply(review.code === ownCode ? null : review.code)}
          style={{ alignSelf: "flex-end", paddingVertical: 6 }}
        >
          <Text bold style={{ fontSize: 12, color: theme.green }}>
            {review.code === ownCode ? "ویرایش دیدگاه من" : "پاسخ به دیدگاه"}
          </Text>
        </Pressable>
      </View>
      {(review.subComments || review.replies)?.map((child) => (
        <Comment
          key={child.code}
          review={child}
          reply
          ownCode={ownCode}
          onReply={onReply}
        />
      ))}
    </View>
  );
}

export function ProductReviews({
  code,
  onLogin,
}: {
  code: string;
  onLogin: () => void;
}) {
  const { signedIn } = useAuth();
  const insets = useSafeAreaInsets();
  const reviews = useQuery({
    queryKey: ["reviews", code],
    queryFn: () => api.reviews(code, 6),
  });
  const own = useQuery({
    queryKey: ["my-product-review", code],
    queryFn: () =>
      request<OwnReview | null>("/Comment/GetMyProductReview", {
        params: { entityCode: code, entityComment: "AgriculturalListing" },
      }),
    enabled: signedIn,
  });
  const [open, setOpen] = useState(false);
  const [parent, setParent] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [error, setError] = useState("");
  const { busy, run } = useAction();
  const show = (parentCode: string | null) => {
    if (!signedIn) return onLogin();
    setParent(parentCode);
    setContent(parentCode ? "" : own.data?.content || "");
    setRating(parentCode ? 5 : own.data?.rating || 5);
    setError("");
    setOpen(true);
  };
  const close = () => {
    if (!busy) setOpen(false);
  };
  const submit = () => {
    if (!signedIn) return onLogin();
    const text = content.trim();
    if (text.length < 3 || text.length > 500)
      return setError("متن دیدگاه باید بین ۳ تا ۵۰۰ کاراکتر باشد.");
    void run(async () => {
      if (!parent && own.data) {
        await request("/Comment/Update", {
          method: "PUT",
          data: {
            code: own.data.code,
            content: text,
            rating,
            statusCode: own.data.statusCode,
          },
        });
      } else {
        await request("/Comment/Create", {
          method: "POST",
          data: {
            entityCode: code,
            entityComment: "AgriculturalListing",
            parentCode: parent || "",
            content: text,
            ...(!parent ? { rating } : {}),
          },
        });
      }
      setOpen(false);
    }, "دیدگاه شما ثبت شد و پس از بررسی منتشر می‌شود.");
  };
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text bold style={{ fontSize: 20 }}>
          دیدگاه کاربران
        </Text>
        <Button
          outline
          title={own.data ? "ویرایش دیدگاه من" : "ثبت دیدگاه"}
          disabled={signedIn && own.isLoading}
          onPress={() => show(null)}
          style={{ paddingHorizontal: 12 }}
        />
      </View>
      <QueryState
        loading={reviews.isLoading}
        error={reviews.error}
        retry={() => reviews.refetch()}
      />
      {reviews.data?.items.length === 0 && (
        <Text muted style={{ textAlign: "center", paddingVertical: 24 }}>
          هنوز دیدگاهی برای این محصول منتشر نشده است
        </Text>
      )}
      <View style={{ gap: 24 }}>
        {reviews.data?.items.map((review) => (
          <Comment
            key={review.code}
            review={review}
            ownCode={own.data?.code}
            onReply={show}
          />
        ))}
      </View>
      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={close}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.overlay}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="بستن دیدگاه"
            onPress={close}
            style={StyleSheet.absoluteFill}
          />
          <View
            accessibilityViewIsModal
            style={[
              styles.sheet,
              { paddingBottom: Math.max(20, insets.bottom) },
            ]}
          >
            <View style={styles.handle} />
            <View style={styles.heading}>
              <Text bold style={{ fontSize: 20 }}>
                {parent
                  ? "پاسخ به دیدگاه"
                  : own.data
                    ? "ویرایش دیدگاه من"
                    : "ثبت دیدگاه"}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="بستن"
                disabled={busy}
                onPress={close}
                style={styles.close}
              >
                <Ionicons name="close" size={22} color={theme.ink} />
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: 16 }}
            >
              {!parent && (
                <QueryState error={own.error} retry={() => own.refetch()} />
              )}
              <Field
                label={parent ? "متن پاسخ" : "متن دیدگاه"}
                placeholder={
                  parent ? "پاسخ خود را بنویسید..." : "نظر خود را بنویسید..."
                }
                multiline
                maxLength={500}
                value={content}
                onChangeText={(value) => {
                  setContent(value);
                  setError("");
                }}
                error={error}
              />
              {!parent && (
                <View style={{ gap: 8 }}>
                  <Text>امتیاز شما به محصول</Text>
                  <View style={{ flexDirection: "row", alignSelf: "flex-end" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Pressable
                        key={star}
                        accessibilityRole="radio"
                        accessibilityLabel={`${number(star)} ستاره`}
                        accessibilityState={{ checked: rating === star }}
                        onPress={() => setRating(star)}
                        style={styles.star}
                      >
                        <Ionicons
                          name={star <= rating ? "star" : "star-outline"}
                          size={30}
                          color={theme.gold}
                        />
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
              <Button
                title={
                  parent
                    ? "ارسال پاسخ"
                    : own.data
                      ? "ویرایش دیدگاه و امتیاز"
                      : "ارسال دیدگاه"
                }
                busy={busy}
                disabled={!parent && (own.isLoading || own.isError)}
                onPress={submit}
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginVertical: 8,
    marginBottom: 24,
    backgroundColor: theme.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    padding: 16,
  },
  heading: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  comment: {
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  reply: {
    backgroundColor: theme.white,
    borderWidth: 1,
    borderColor: "#6EE7B7",
    marginRight: 28,
  },
  connector: {
    position: "absolute",
    right: -28,
    top: 0,
    width: 27,
    height: 20,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderBottomRightRadius: 12,
    borderColor: "#6EE7B7",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(2,6,23,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "85%",
    width: "100%",
    maxWidth: 672,
    alignSelf: "center",
    backgroundColor: theme.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.border,
    alignSelf: "center",
    marginBottom: 16,
  },
  close: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  star: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});

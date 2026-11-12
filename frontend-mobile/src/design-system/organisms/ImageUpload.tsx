import { appAlert as Alert } from "../../shared/alerts";
import React from "react";
import { View, Pressable } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Text } from "../atoms/Text";
import { imageUrl } from "../../shared/utils/format";
import { theme } from "../../shared/theme";
import { Button } from "../atoms/Button";
import { ManagementPhoto } from "../molecules/ManagementPhoto";
import type { PickedImage } from "../../shared/types/mobile";

export function appendImage(body: FormData, key: string, image: PickedImage) {
  const { uri, name, type, file } = image;
  if (file) body.append(key, file, name);
  else body.append(key, { uri, name, type } as unknown as Blob);
}

export function ImageUpload({
  files,
  onChange,
  multiple = false,
  existingUrls = [],
}: {
  files: PickedImage[];
  onChange: (f: PickedImage[]) => void;
  multiple?: boolean;
  existingUrls?: string[];
}) {
  const existing = existingUrls.map(imageUrl).filter(Boolean);
  return (
    <View style={{ gap: 10, marginBottom: 16 }}>
      {!!existing.length && (multiple || !files.length) && (
        <>
          <Text muted>تصاویر فعلی</Text>
          <View
            style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}
          >
            {existing.map((url, index) => (
              <ManagementPhoto
                key={`${url}-${index}`}
                uri={url}
                label={`تصویر فعلی ${index + 1}`}
                style={{
                  width: multiple ? 96 : "100%",
                  height: multiple ? 96 : 224,
                  borderRadius: 12,
                }}
              />
            ))}
          </View>
        </>
      )}
      {!!files.length && (
        <Text muted>{multiple ? "تصاویر جدید" : "تصویر انتخاب‌شده"}</Text>
      )}
      <View style={{ flexDirection: "row-reverse", gap: 8, flexWrap: "wrap" }}>
        {files.map((f, i) => (
          <View
            key={`${f.uri}-${i}`}
            style={{ width: multiple ? 96 : "100%", gap: 4 }}
          >
            <ManagementPhoto
              uri={f.uri}
              label={`تصویر انتخاب‌شده ${i + 1}`}
              style={{
                width: "100%",
                height: multiple ? 96 : 224,
                borderRadius: 12,
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`حذف تصویر انتخاب‌شده ${i + 1}`}
              onPress={() => onChange(files.filter((_, index) => index !== i))}
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Text
                style={{
                  color: theme.danger,
                  textAlign: "center",
                  fontSize: 12,
                }}
              >
                حذف تصویر
              </Text>
            </Pressable>
          </View>
        ))}
      </View>
      <Button
        outline
        title={
          multiple
            ? "انتخاب تصاویر محصول"
            : files.length || existing.length
              ? "تغییر تصویر"
              : "انتخاب تصویر"
        }
        onPress={async () => {
          try {
            const r = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              allowsMultipleSelection: multiple,
              selectionLimit: 8,
              quality: 0.85,
            });
            if (!r.canceled)
              onChange(
                r.assets.map((p, i) => ({
                  uri: p.uri,
                  name: p.fileName || `image-${i}.jpg`,
                  type: p.mimeType || "image/jpeg",
                  file: p.file,
                })),
              );
          } catch {
            Alert.alert("خطا", "تصویر انتخاب نشد", undefined, {
              tone: "error",
            });
          }
        }}
      />
      {!!files.length && (
        <Button
          outline
          title="پاک کردن تصاویر انتخاب‌شده"
          onPress={() => onChange([])}
        />
      )}
    </View>
  );
}

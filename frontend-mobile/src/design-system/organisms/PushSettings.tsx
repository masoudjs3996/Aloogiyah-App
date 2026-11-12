import React, { useState } from "react";
import { View, Linking } from "react-native";
import { Text } from "../atoms/Text";
import { Button } from "../atoms/Button";
import { registerPush, unregisterPush } from "../../shared/notifications";
import { errorMessage } from "../../api/platform";
import { theme } from "../../shared/theme";

export function PushSettings() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <View
      style={{
        padding: 16,
        borderRadius: 16,
        backgroundColor: "white",
        borderWidth: 1,
        borderColor: theme.border,
        gap: 12,
        marginBottom: 16,
      }}
    >
      <Text bold>اعلان پیام روی گوشی</Text>
      <Text muted style={{ fontSize: 12 }}>
        برای دریافت اعلان وقتی اپ باز نیست، اعلان این گوشی را فعال کنید.
      </Text>
      {!!status && (
        <Text accessibilityLiveRegion="polite" style={{ fontSize: 12 }}>
          {status}
        </Text>
      )}
      <Button
        title="فعال‌کردن اعلان گوشی"
        busy={busy}
        onPress={async () => {
          setBusy(true);
          try {
            setStatus(await registerPush(true));
          } catch (error) {
            setStatus(errorMessage(error));
          } finally {
            setBusy(false);
          }
        }}
      />
      <Button
        title="غیرفعال‌کردن روی این گوشی"
        outline
        disabled={busy}
        onPress={async () => {
          setBusy(true);
          try {
            await unregisterPush(true);
            setStatus("اعلان روی این گوشی غیرفعال شد");
          } catch (error) {
            setStatus(errorMessage(error));
          } finally {
            setBusy(false);
          }
        }}
      />
      <Button
        compact
        outline
        title="تنظیمات اعلان گوشی"
        onPress={() => {
          void Linking.openSettings();
        }}
      />
    </View>
  );
}

import { AppModal as Modal } from "../molecules/AppModal";
import { ScrollView, View, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { TermsEnvelope } from "../../shared/types/legal";
import { Text } from "../atoms/Text";
import { Button } from "../atoms/Button";

export function MarketplaceTermsModal({ terms, visible, onClose }: { terms?: TermsEnvelope; visible: boolean; onClose: () => void }) {
  return <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFC" }}>
      <View style={{ padding: 16, borderBottomWidth: 1, borderColor: "#E2E8F0" }}><Button title="بستن قوانین و بازگشت به درخواست" onPress={onClose} /></View>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
        {terms && <><Text bold style={{ fontSize: 22, lineHeight: 36 }} accessibilityRole="header">{terms.document.title}</Text><Text muted>نسخه {terms.document.version}</Text><Text>{terms.document.introduction}</Text>
          <View style={{ padding: 16, backgroundColor: "#FEF3C7", borderRadius: 16, gap: 8 }}><Text bold>مشخصات بهره‌بردار و ارتباط رسمی</Text>{terms.operator.name && <Text>{terms.operator.name}</Text>}{terms.operator.address && <Text>{terms.operator.address}</Text>}{terms.operator.email && <Text>{terms.operator.email}</Text>}{terms.operator.phone && <Text>{terms.operator.phone}</Text>}{(!terms.operator.name || !terms.operator.address || (!terms.operator.email && !terms.operator.phone)) && <Text>مشخصات رسمی بهره‌بردار یا راه ارتباطی هنوز کامل نشده است.</Text>}</View>
          {terms.document.sections.map(s => <View key={s.id} style={{ backgroundColor: "white", borderRadius: 16, padding: 16, gap: 12 }}><Text bold accessibilityRole="header">{s.title}</Text>{s.audience !== "All" && <Text muted>{s.audience === "Farmer" ? "ویژه کشاورز و فروشنده" : "ویژه خریدار همکار"}</Text>}{s.paragraphs.map((p, i) => <Text key={i} style={{ lineHeight: 30 }}>{p}</Text>)}</View>)}
          <Text bold>منابع تدوین</Text>{terms.document.sources.map(s => <Text key={s.url} accessibilityRole="link" onPress={() => void Linking.openURL(s.url)} style={{ color: "#047857", textDecorationLine: "underline" }}>{s.title}</Text>)}
          <Text muted>شرایط سامانه حقوق الزامی قانونی را محدود نمی‌کند.</Text>
        </>}
      </ScrollView>
    </SafeAreaView>
  </Modal>;
}

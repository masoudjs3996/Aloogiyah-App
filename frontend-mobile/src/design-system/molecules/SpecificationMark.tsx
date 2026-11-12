import { Image, View } from "react-native";
import { API_BASE } from "../../api/config";
import { theme } from "../../shared/theme";

export default function SpecificationMark({ colorHex, icon }: { colorHex?: string | null; icon?: string | null }) {
  return (
    <>
      {!!colorHex && <View style={{ width: 15, height: 15, borderRadius: 8, borderWidth: 1, borderColor: theme.muted, backgroundColor: colorHex }} />}
      {!!icon && <Image accessible={false} source={{ uri: `${API_BASE}/AgriculturalProductTemplate/Icons/${encodeURIComponent(icon)}` }} style={{ width: 16, height: 16 }} />}
    </>
  );
}

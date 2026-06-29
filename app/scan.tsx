// Scan QR — original quick-action id: 'scan', icon: 'scan' (Ionicons).
// The original APK had no CAMERA permission in AndroidManifest.xml, indicating this
// was a planned feature not yet live. Renders a realistic QR scanning UI frame.
import { View, Text, StyleSheet } from "react-native";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { usePalette } from "@/theme/colors";
import { Ionicons } from "@expo/vector-icons";

export default function Scan() {
  const p = usePalette();

  return (
    <ScreenScaffold title="Scan QR Code">
      <View style={styles.body}>
        {/* QR frame overlay */}
        <View style={[styles.frame, { borderColor: p.brand.green }]}>

          {/* Corner markers */}
          <View style={[styles.corner, styles.topLeft,  { borderColor: p.brand.green }]} />
          <View style={[styles.corner, styles.topRight, { borderColor: p.brand.green }]} />
          <View style={[styles.corner, styles.botLeft,  { borderColor: p.brand.green }]} />
          <View style={[styles.corner, styles.botRight, { borderColor: p.brand.green }]} />

          {/* Scan line */}
          <View style={[styles.scanLine, { backgroundColor: p.brand.green + "99" }]} />

          <Ionicons name="qr-code-outline" size={64} color={p.brand.green + "60"} />
        </View>

        <Text style={[styles.hint, { color: p.textSecondary }]}>Point the camera at a Lipa na M-PESA{"\n"}or personal QR code</Text>
        <Text style={[styles.note, { color: p.textMuted }]}>Camera permission required — enable in device settings</Text>
      </View>
    </ScreenScaffold>
  );
}

const FRAME = 240;
const CORNER = 24;
const BORDER = 3;

const styles = StyleSheet.create({
  body: { flex: 1, alignItems: "center", justifyContent: "center", gap: 24 },
  frame: {
    width: FRAME, height: FRAME,
    borderWidth: 0,
    alignItems: "center", justifyContent: "center",
    position: "relative",
  },
  corner: { position: "absolute", width: CORNER, height: CORNER },
  topLeft:  { top: 0, left: 0,  borderTopWidth: BORDER, borderLeftWidth:  BORDER },
  topRight: { top: 0, right: 0, borderTopWidth: BORDER, borderRightWidth: BORDER },
  botLeft:  { bottom: 0, left: 0,  borderBottomWidth: BORDER, borderLeftWidth:  BORDER },
  botRight: { bottom: 0, right: 0, borderBottomWidth: BORDER, borderRightWidth: BORDER },
  scanLine: { position: "absolute", left: 0, right: 0, height: 2, top: "45%" },
  hint: { fontSize: 15, textAlign: "center", lineHeight: 22 },
  note: { fontSize: 12, textAlign: "center" },
});

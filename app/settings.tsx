// Settings — recovered from the bundle. Original string: 'Settings' (strings.xml).
// Implements: Change PIN, Notification toggle (SecureStore preference).
// NOTE: The original APK bundle contains no LocalAuthentication usage, so no
// biometric toggle is shipped here — kept faithful to the decompiled bundle.
import { useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Switch, Alert } from "react-native";
import * as SecureStore from "expo-secure-store";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { usePalette } from "@/theme/colors";
import { Ionicons } from "@expo/vector-icons";

const KEYS = {
  notifications: "mpesa_notifications_enabled",
};

export default function Settings() {
  const p = usePalette();
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    (async () => {
      const notif = await SecureStore.getItemAsync(KEYS.notifications);
      setNotifications(notif !== "false");
    })();
  }, []);


  async function toggleNotifications(val: boolean) {
    setNotifications(val);
    await SecureStore.setItemAsync(KEYS.notifications, String(val));
  }

  function onChangePin() {
    Alert.alert(
      "Change PIN",
      "To change your M-PESA PIN, log out and re-register with a new PIN, or contact support.",
      [{ text: "OK" }]
    );
  }

  return (
    <ScreenScaffold title="Settings">
      <View style={[styles.section, { borderColor: p.border }]}>
        <Text style={[styles.sectionTitle, { color: p.textMuted }]}>SECURITY</Text>

        <Pressable
          style={[styles.row, { borderBottomColor: p.border }]}
          onPress={onChangePin}
        >
          <Ionicons name="key-outline" size={20} color={p.brand.green} style={styles.icon} />
          <Text style={[styles.rowLabel, { color: p.textPrimary }]}>Change PIN</Text>
          <Ionicons name="chevron-forward" size={18} color={p.textMuted} />
        </Pressable>
      </View>

      <View style={[styles.section, { borderColor: p.border, marginTop: 20 }]}>
        <Text style={[styles.sectionTitle, { color: p.textMuted }]}>NOTIFICATIONS</Text>
        <View style={[styles.row, { borderBottomColor: p.border }]}>
          <Ionicons name="notifications-outline" size={20} color={p.brand.green} style={styles.icon} />
          <Text style={[styles.rowLabel, { color: p.textPrimary, flex: 1 }]}>Transaction Alerts</Text>
          <Switch
            value={notifications}
            onValueChange={toggleNotifications}
            trackColor={{ true: p.brand.green }}
          />
        </View>
      </View>

      <View style={[styles.section, { borderColor: p.border, marginTop: 20 }]}>
        <Text style={[styles.sectionTitle, { color: p.textMuted }]}>ABOUT</Text>
        <View style={[styles.row, { borderBottomColor: p.border }]}>
          <Ionicons name="information-circle-outline" size={20} color={p.brand.green} style={styles.icon} />
          <Text style={[styles.rowLabel, { color: p.textPrimary }]}>Version</Text>
          <Text style={[styles.rowValue, { color: p.textMuted }]}>1.0.0</Text>
        </View>
        <View style={[styles.row, { borderBottomColor: p.border }]}>
          <Ionicons name="server-outline" size={20} color={p.brand.green} style={styles.icon} />
          <Text style={[styles.rowLabel, { color: p.textPrimary }]}>Backend</Text>
          <Text style={[styles.rowValue, { color: p.textMuted }]}>invest254-api.fly.dev</Text>
        </View>
      </View>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  section: { borderTopWidth: StyleSheet.hairlineWidth },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, paddingHorizontal: 16, paddingVertical: 10 },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  icon: { marginRight: 12 },
  rowLabel: { fontSize: 16, flex: 1 },
  rowSub: { fontSize: 12, marginTop: 2 },
  rowValue: { fontSize: 14 },
});

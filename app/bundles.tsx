// Buy Bundles — original quick-action id: 'bundles', icon: 'import-export' (MaterialIcons).
import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { usePalette } from "@/theme/colors";
import { getSession } from "@/auth/session";
import { normalizePhone } from "@/api/client";
import { bundlePacks, type BundlePack } from "@/data/mock";

export default function Bundles() {
  const p = usePalette();
  const [phone, setPhone] = useState("");
  const [selected, setSelected] = useState<BundlePack | null>(null);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    getSession().then((s) => { if (s.phone) setPhone(s.phone); });
  }, []);

  function submit() {
    if (phone.replace(/\D/g, "").length < 9) return setError("Enter a valid phone number.");
    if (!selected) return setError("Select a bundle to continue.");
    setError("");
    setDone(true);
  }

  if (done && selected) {
    return (
      <ScreenScaffold title="Buy Bundles">
        <View style={styles.center}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={[styles.successTitle, { color: p.brand.green }]}>Bundle Activated!</Text>
          <Text style={[styles.successNote, { color: p.textSecondary }]}>
            {selected.data} ({selected.validity}) activated on{"\n"}{normalizePhone(phone)}
          </Text>
          <Pressable style={[styles.cta, { backgroundColor: p.brand.green }]} onPress={() => { setDone(false); setSelected(null); }}>
            <Text style={styles.ctaText}>Buy Another</Text>
          </Pressable>
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold title="Buy Bundles">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: p.textSecondary }]}>Phone number</Text>
        <TextInput
          placeholder="07XX XXX XXX"
          placeholderTextColor={p.textMuted}
          value={phone}
          onChangeText={(v) => { setPhone(v); setError(""); }}
          keyboardType="phone-pad"
          style={[styles.input, { color: p.textPrimary, borderColor: p.border, backgroundColor: p.surface }]}>
        </TextInput>
        <Text style={[styles.label, { color: p.textSecondary, marginTop: 16 }]}>Choose a bundle</Text>
        {bundlePacks.map((b) => {
          const sel = selected?.id === b.id;
          return (
            <Pressable
              key={b.id}
              onPress={() => { setSelected(b); setError(""); }}
              style={[
                styles.bundleRow,
                { borderColor: sel ? p.brand.green : p.border, backgroundColor: sel ? p.brand.greenTintLight : p.surface },
              ]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.bundleName, { color: p.textPrimary }]}>{b.label}</Text>
                <Text style={[styles.bundleSub, { color: p.textMuted }]}>{b.validity}</Text>
              </View>
              <Text style={[styles.bundlePrice, { color: sel ? p.brand.greenDark : p.brand.green }]}>Ksh {b.price.toLocaleString()}</Text>
            </Pressable>
          );
        })}
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Pressable style={[styles.cta, { backgroundColor: p.brand.green }]} onPress={submit}>
          <Text style={styles.ctaText}>
            {selected ? `Buy ${selected.label} — Ksh ${selected.price.toLocaleString()}` : "Select a Bundle"}
          </Text>
        </Pressable>
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 4 },
  bundleRow: { borderWidth: 1.5, borderRadius: 12, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center" },
  bundleName: { fontSize: 15, fontWeight: "700" },
  bundleSub: { fontSize: 12, marginTop: 2 },
  bundlePrice: { fontSize: 15, fontWeight: "700" },
  error: { color: "#E53935", marginTop: 4, marginBottom: 4 },
  cta: { borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 20, marginBottom: 32 },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  successIcon: { fontSize: 56, color: "#4CAF50" },
  successTitle: { fontSize: 22, fontWeight: "800" },
  successNote: { fontSize: 14, textAlign: "center", lineHeight: 22 },
});

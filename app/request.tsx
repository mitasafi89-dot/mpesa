// Request Money — recovered from the bundle (id: 'request').
import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { usePalette } from "@/theme/colors";
import { normalizePhone } from "@/api/client";

const MIN = 10;
const MAX = 250000;

export default function Request() {
  const p = usePalette();
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function submit() {
    const amt = Number(amount);
    if (phone.replace(/\D/g, "").length < 9) return setError("Enter a valid phone number.");
    if (!amt || amt < MIN || amt > MAX)
      return setError(`Amount must be between Ksh ${MIN} and Ksh ${MAX.toLocaleString()}.`);
    setError("");
    setDone(true);
  }

  if (done) {
    return (
      <ScreenScaffold title="Request Money">
        <View style={styles.center}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={[styles.successTitle, { color: p.brand.green }]}>Request Sent!</Text>
          <Text style={[styles.successNote, { color: p.textSecondary }]}>
            Requested Ksh {Number(amount).toLocaleString()} from{"\n"}{normalizePhone(phone)}
          </Text>
          <Pressable
            style={[styles.cta, { backgroundColor: p.brand.green }]}
            onPress={() => { setDone(false); setPhone(""); setAmount(""); setNote(""); }}
          >
            <Text style={styles.ctaText}>New Request</Text>
          </Pressable>
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold title="Request Money">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: p.textSecondary }]}>From (phone number)</Text>
        <TextInput
          placeholder="07XX XXX XXX"
          placeholderTextColor={p.textMuted}
          value={phone}
          onChangeText={(v) => { setPhone(v); setError(""); }}
          keyboardType="phone-pad"
          style={[styles.input, { color: p.textPrimary, borderColor: p.border, backgroundColor: p.surface }]}
        />
        <Text style={[styles.label, { color: p.textSecondary }]}>Amount (Ksh)</Text>
        <TextInput
          placeholder={`Min ${MIN} – Max ${MAX.toLocaleString()}`}
          placeholderTextColor={p.textMuted}
          value={amount}
          onChangeText={(v) => { setAmount(v); setError(""); }}
          keyboardType="number-pad"
          style={[styles.input, { color: p.textPrimary, borderColor: p.border, backgroundColor: p.surface }]}
        />
        <Text style={[styles.label, { color: p.textSecondary }]}>Note (optional)</Text>
        <TextInput
          placeholder="e.g. For lunch"
          placeholderTextColor={p.textMuted}
          value={note}
          onChangeText={setNote}
          style={[styles.input, { color: p.textPrimary, borderColor: p.border, backgroundColor: p.surface }]}
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Pressable style={[styles.cta, { backgroundColor: p.brand.green }]} onPress={submit}>
          <Text style={styles.ctaText}>Request</Text>
        </Pressable>
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 14 },
  error: { color: "#E53935", marginTop: -4 },
  cta: { borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 20, marginBottom: 32 },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  successIcon: { fontSize: 56, color: "#4CAF50" },
  successTitle: { fontSize: 22, fontWeight: "800" },
  successNote: { fontSize: 14, textAlign: "center", lineHeight: 22 },
});

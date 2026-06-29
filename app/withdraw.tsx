// Withdraw Cash — original quick-action id: 'withdraw', icon: 'receipt' (MaterialIcons).
import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Switch, ScrollView } from "react-native";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { usePalette } from "@/theme/colors";
import { normalizePhone } from "@/api/client";

const MIN = 50;
const MAX = 150000;

export default function Withdraw() {
  const p = usePalette();
  const [agent, setAgent] = useState("");
  const [amount, setAmount] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function submit() {
    const amt = Number(amount);
    if (agent.replace(/\D/g, "").length < 5) return setError("Enter a valid agent number.");
    if (!amt || amt < MIN || amt > MAX)
      return setError(`Amount must be between Ksh ${MIN} and Ksh ${MAX.toLocaleString()}.`);
    if (!consent) return setError("Please confirm agent details to continue.");
    setError("");
    setDone(true);
  }

  if (done) {
    return (
      <ScreenScaffold title="Withdraw Cash">
        <View style={styles.center}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={[styles.successTitle, { color: p.brand.green }]}>Withdrawal Requested</Text>
          <Text style={[styles.successNote, { color: p.textSecondary }]}>
            Ksh {Number(amount).toLocaleString()} from Agent {agent}
          </Text>
          <Pressable
            style={[styles.cta, { backgroundColor: p.brand.green }]}
            onPress={() => { setDone(false); setAgent(""); setAmount(""); setConsent(false); }}
          >
            <Text style={styles.ctaText}>New Withdrawal</Text>
          </Pressable>
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold title="Withdraw Cash">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: p.textSecondary }]}>Agent number</Text>
        <TextInput
          placeholder="e.g. 246810"
          placeholderTextColor={p.textMuted}
          value={agent}
          onChangeText={(v) => { setAgent(v); setError(""); }}
          keyboardType="number-pad"
          style={[styles.input, { color: p.textPrimary, borderColor: p.border, backgroundColor: p.surface }]}
        />
        <Text style={[styles.label, { color: p.textSecondary, marginTop: 12 }]}>Amount (Ksh)</Text>
        <TextInput
          placeholder={`Min ${MIN} – Max ${MAX.toLocaleString()}`}
          placeholderTextColor={p.textMuted}
          value={amount}
          onChangeText={(v) => { setAmount(v); setError(""); }}
          keyboardType="number-pad"
          style={[styles.input, { color: p.textPrimary, borderColor: p.border, backgroundColor: p.surface }]}
        />
        <View style={styles.consentRow}>
          <Switch value={consent} onValueChange={setConsent} trackColor={{ true: p.brand.green }} />
          <Text style={[styles.consentText, { color: p.textSecondary }]}>I confirm the agent number and amount are correct</Text>
        </View>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Pressable style={[styles.cta, { backgroundColor: p.brand.green }]} onPress={submit}>
          <Text style={styles.ctaText}>Withdraw</Text>
        </Pressable>
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 4 },
  consentRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 18 },
  consentText: { flex: 1, fontSize: 14 },
  error: { color: "#E53935", marginTop: 10 },
  cta: { borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 24, marginBottom: 32 },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  successIcon: { fontSize: 56, color: "#4CAF50" },
  successTitle: { fontSize: 22, fontWeight: "800" },
  successNote: { fontSize: 14, textAlign: "center", lineHeight: 22 },
});

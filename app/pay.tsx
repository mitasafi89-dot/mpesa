// Lipa na M-PESA (Pay) — original quick-action id: 'lipa', icon: 'shopping-basket' (MaterialIcons).
// Two modes: Till Number (Buy Goods) and Paybill.
import { useState } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, Switch, ScrollView } from "react-native";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { usePalette } from "@/theme/colors";

const MIN = 1;
const MAX = 300000;
type Mode = "till" | "paybill";

export default function Pay() {
  const p = usePalette();
  const [mode, setMode] = useState<Mode>("till");
  const [number, setNumber] = useState("");
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function reset() { setNumber(""); setAccount(""); setAmount(""); setConsent(false); setError(""); setDone(false); }

  function submit() {
    const amt = Number(amount);
    if (number.replace(/\D/g, "").length < 5) return setError(`Enter a valid ${mode === "till" ? "till" : "paybill"} number.`);
    if (mode === "paybill" && account.trim().length < 1) return setError("Enter an account number.");
    if (!amt || amt < MIN || amt > MAX) return setError(`Amount must be between Ksh ${MIN} and Ksh ${MAX.toLocaleString()}.`);
    if (!consent) return setError("Please confirm payment details to continue.");
    setError("");
    setDone(true);
  }

  if (done) {
    return (
      <ScreenScaffold title="Lipa na M-PESA">
        <View style={styles.center}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={[styles.successTitle, { color: p.brand.green }]}>Payment Sent!</Text>
          <Text style={[styles.successNote, { color: p.textSecondary }]}>
            Ksh {Number(amount).toLocaleString()} to {mode === "till" ? `Till ${number}` : `${number} / Acc ${account}`}
          </Text>
          <Pressable style={[styles.cta, { backgroundColor: p.brand.green }]} onPress={reset}>
            <Text style={styles.ctaText}>New Payment</Text>
          </Pressable>
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold title="Lipa na M-PESA">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Mode tabs */}
        <View style={[styles.tabs, { backgroundColor: p.surfaceAlt, borderColor: p.border }]}>
          {(["till", "paybill"] as Mode[]).map((m) => (
            <Pressable
              key={m}
              style={[styles.tab, mode === m && { backgroundColor: p.brand.green }]}
              onPress={() => { setMode(m); setError(""); setNumber(""); setAccount(""); }}
            >
              <Text style={[styles.tabText, { color: mode === m ? "#fff" : p.textSecondary }]}>
                {m === "till" ? "Till Number" : "Paybill"}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: p.textSecondary, marginTop: 16 }]}>
          {mode === "till" ? "Till number" : "Paybill number"}
        </Text>
        <TextInput
          placeholder={mode === "till" ? "e.g. 123456" : "e.g. 200200"}
          placeholderTextColor={p.textMuted}
          value={number}
          onChangeText={(v) => { setNumber(v); setError(""); }}
          keyboardType="number-pad"
          style={[styles.input, { color: p.textPrimary, borderColor: p.border, backgroundColor: p.surface }]}
        />

        {mode === "paybill" && (
          <>
            <Text style={[styles.label, { color: p.textSecondary }]}>Account number</Text>
            <TextInput
              placeholder="e.g. your phone number"
              placeholderTextColor={p.textMuted}
              value={account}
              onChangeText={(v) => { setAccount(v); setError(""); }}
              style={[styles.input, { color: p.textPrimary, borderColor: p.border, backgroundColor: p.surface }]}
            />
          </>
        )}

        <Text style={[styles.label, { color: p.textSecondary }]}>Amount (Ksh)</Text>
        <TextInput
          placeholder="Amount"
          placeholderTextColor={p.textMuted}
          value={amount}
          onChangeText={(v) => { setAmount(v); setError(""); }}
          keyboardType="number-pad"
          style={[styles.input, { color: p.textPrimary, borderColor: p.border, backgroundColor: p.surface }]}
        />
        <View style={styles.consentRow}>
          <Switch value={consent} onValueChange={setConsent} trackColor={{ true: p.brand.green }} />
          <Text style={[styles.consentText, { color: p.textSecondary }]}>I confirm the payment details are correct</Text>
        </View>
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Pressable style={[styles.cta, { backgroundColor: p.brand.red }]} onPress={submit}>
          <Text style={styles.ctaText}>Pay Now</Text>
        </Pressable>
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", borderRadius: 10, borderWidth: 1, padding: 4, marginBottom: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  tabText: { fontSize: 14, fontWeight: "600" },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 14 },
  consentRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  consentText: { flex: 1, fontSize: 14 },
  error: { color: "#E53935", marginTop: 10 },
  cta: { borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 24, marginBottom: 32 },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  successIcon: { fontSize: 56, color: "#4CAF50" },
  successTitle: { fontSize: 22, fontWeight: "800" },
  successNote: { fontSize: 14, textAlign: "center", lineHeight: 22 },
});

// Airtime Top up — reconstructed from the original bundle.
// Original quick-action id: 'airtime', icon: 'phone-in-talk' (MaterialIcons).
import { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from "react-native";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { usePalette } from "@/theme/colors";
import { getSession } from "@/auth/session";
import { normalizePhone } from "@/api/client";

const QUICK_AMOUNTS = [10, 20, 50, 100, 200, 500];
const MIN = 5;
const MAX = 10000;

export default function Airtime() {
  const p = usePalette();
  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    getSession().then((s) => { if (s.phone) setPhone(s.phone); });
  }, []);

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
      <ScreenScaffold title="Airtime Top up">
        <View style={styles.center}>
          <Text style={[styles.successIcon]}>✓</Text>
          <Text style={[styles.successTitle, { color: p.brand.green }]}>Airtime Sent!</Text>
          <Text style={[styles.successNote, { color: p.textSecondary }]}>
            Ksh {Number(amount).toLocaleString()} airtime sent to{"\n"}{normalizePhone(phone)}
          </Text>
          <Pressable
            style={[styles.cta, { backgroundColor: p.brand.green }]} onPress={() => { setDone(false); setAmount(""); }}
          >
            <Text style={styles.ctaText}>Top up Again</Text>
          </Pressable>
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold title="Airtime Top up">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={[styles.label, { color: p.textSecondary }]}>Phone number</Text>
        <TextInput
          placeholder="07XX XXX XXX"
          placeholderTextColor={p.textMuted}
          value={phone}
          onChangeText={(v) => { setPhone(v); setError(""); }}
          keyboardType="phone-pad"
          style={[styles.input, { color: p.textPrimary, borderColor: p.border, backgroundColor: p.surface }]}
        />
        <Text style={[styles.label, { color: p.textSecondary, marginTop: 16 }]}>Select amount</Text>
        <View style={styles.chips}>
          {QUICK_AMOUNTS.map((a) => {
            const selected = String(a) === amount;
            return (
              <Pressable
                key={a}
                style={[styles.chip, { borderColor: selected ? p.brand.green : p.border, backgroundColor: selected ? p.brand.greenTintLight : p.surface }]}
                onPress={() => { setAmount(String(a)); setError(""); }}
              >
                <Text style={[styles.chipText, { color: selected ? p.brand.greenDark : p.textPrimary }]}>Ksh {a}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.label, { color: p.textSecondary, marginTop: 16 }]}>Or enter custom amount</Text>
        <TextInput
          placeholder="Amount (Ksh)"
          placeholderTextColor={p.textMuted}
          value={amount}
          onChangeText={(v) => { setAmount(v); setError(""); }}
          keyboardType="number-pad"
          style={[styles.input, { color: p.textPrimary, borderColor: p.border, backgroundColor: p.surface }]}
        />
        {!!error && <Text style={styles.error}>{error}</Text>}
        <Pressable style={[styles.cta, { backgroundColor: p.brand.green }]} onPress={submit}>
          <Text style={styles.ctaText}>Buy Airtime</Text>
        </Pressable>
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontSize: 14, fontWeight: "600" },
  error: { color: "#E53935", marginTop: 8, marginBottom: 4 },
  cta: { borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 24, marginBottom: 32 },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  successIcon: { fontSize: 56, color: "#4CAF50" },
  successTitle: { fontSize: 22, fontWeight: "800" },
  successNote: { fontSize: 14, textAlign: "center", lineHeight: 22 },
});

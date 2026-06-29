// Registration: 3 steps — details -> set PIN -> confirm PIN -> POST /api/register.
// Reconstructed from the decompiled register component. The set/confirm step
// compares the two entered PINs client-side and only submits when they match.
import { useState, useRef } from "react";
import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { PinPad, PinDots } from "@/components/PinPad";
import { register, PIN_LENGTH } from "@/api/client";
import { saveSession as persist } from "@/auth/session";
import { usePalette } from "@/theme/colors";

type Step = "details" | "pin" | "confirm";

export default function Register() {
  const p = usePalette();
  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function goBack() {
    setError("");
    if (step === "pin") setStep("details");
    else if (step === "confirm") { setConfirm(""); setStep("pin"); }
    else router.back();
  }

  function onDetailsNext() {
    if (name.trim().length < 2) return setError("Please enter your name.");
    if (phone.replace(/\D/g, "").length < 9) return setError("Please enter a valid phone number.");
    setError("");
    setStep("pin");
  }

  function onDigit(d: string) {
    setError("");
    if (step === "pin") {
      if (pin.length >= PIN_LENGTH) return;
      const next = pin + d;
      setPin(next);
      if (next.length === PIN_LENGTH) setStep("confirm");
    } else if (step === "confirm") {
      if (confirm.length >= PIN_LENGTH) return;
      const next = confirm + d;
      setConfirm(next);
      if (next.length === PIN_LENGTH) {
        if (next === pin) submit(next);
        else {
          setError("PINs do not match. Try again.");
          setTimeout(() => setConfirm(""), 700);
        }
      }
    }
  }

  function onBackspace() {
    if (step === "pin") setPin((s) => s.slice(0, -1));
    else if (step === "confirm") setConfirm((s) => s.slice(0, -1));
  }

  async function submit(finalPin: string) {
    setSubmitting(true);
    const res = await register(phone, finalPin, name);
    setSubmitting(false);
    if (res.kind === "ok") {
      await persist({ phone, name, token: res.token, role: res.role });
      router.replace("/pin");
    } else if (res.kind === "already_exists") {
      await persist({ phone, name });
      router.replace("/pin");
    } else {
      setError(res.message);
      setStep("pin");
      setPin("");
      setConfirm("");
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.background }]}>
      <View style={styles.header}>
        <Pressable onPress={goBack} style={[styles.backBtn, { backgroundColor: p.surfaceAlt }]} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={p.textPrimary} />
        </Pressable>
      </View>

      {step === "details" ? (
        <View style={styles.body}>
          <Text style={[styles.title, { color: p.textPrimary }]}>Create your account</Text>
          <Text style={[styles.subtitle, { color: p.textSecondary }]}>Enter your details to get started</Text>
          <TextInput
            placeholder="Full name"
            placeholderTextColor={p.textMuted}
            value={name}
            onChangeText={setName}
            style={[styles.input, { color: p.textPrimary, borderColor: p.border, backgroundColor: p.surface }]}
          />
          <TextInput
            placeholder="Phone number (07XX XXX XXX)"
            placeholderTextColor={p.textMuted}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            style={[styles.input, { color: p.textPrimary, borderColor: p.border, backgroundColor: p.surface }]}
          />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Pressable onPress={onDetailsNext} style={[styles.cta, { backgroundColor: p.brand.green }]}>
            <Text style={styles.ctaText}>Continue</Text>
          </Pressable>
          <Pressable onPress={() => router.replace("/pin")}>
            <Text style={[styles.link, { color: p.brand.green }]}>Already have an account? Sign in</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.body}>
          <Text style={[styles.title, { color: p.textPrimary }]}>
            {step === "pin" ? "Set your PIN" : "Confirm your PIN"}
          </Text>
          <Text style={[styles.subtitle, { color: p.textSecondary }]}>
            {step === "pin" ? `Choose a ${PIN_LENGTH}-digit M-PESA PIN` : "Re-enter your PIN to confirm"}
          </Text>
          <PinDots filled={(step === "pin" ? pin : confirm).length} total={PIN_LENGTH} />
          {!!error && <Text style={styles.error}>{error}</Text>}
          {submitting ? (
            <ActivityIndicator color={p.brand.green} style={{ marginVertical: 24 }} />
          ) : (
            <PinPad onDigit={onDigit} onBackspace={onBackspace} disabled={submitting} />
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { height: 56, justifyContent: "center", paddingHorizontal: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, paddingHorizontal: 24, alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", marginTop: 12, textAlign: "center" },
  subtitle: { fontSize: 15, marginTop: 6, marginBottom: 24, textAlign: "center" },
  input: { width: "100%", borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 14 },
  error: { color: "#E53935", marginVertical: 8, textAlign: "center" },
  cta: { width: "100%", borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  link: { marginTop: 18, fontSize: 14, fontWeight: "600" },
});

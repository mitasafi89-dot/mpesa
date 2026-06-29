// PIN unlock / login screen.
//
// THIS SCREEN CONTAINS THE FIX for the reported bug (docs/AUDIT.md §1):
// the original only checked res.ok and showed EVERY failure as "Wrong PIN" while
// counting toward a 3-strike lockout. A correct PIN on a not-yet-approved account
// (server 403) was therefore mislabeled and the account got locked.
//
// Here we branch on the typed LoginOutcome from the API client:
//   success          -> go home
//   wrong_pin (401)   -> count attempt, show attempts left, lock at MAX
//   pending_approval  -> show the real message, DO NOT strike or lock
//   not_registered    -> route to /register
//   network/server    -> friendly retry message, DO NOT strike or lock
import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, StyleSheet, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { PinPad, PinDots } from "@/components/PinPad";
import { login, PIN_LENGTH, MAX_PIN_ATTEMPTS } from "@/api/client";
import { getSession, saveSession, clearSession } from "@/auth/session";
import { usePalette } from "@/theme/colors";

export default function PinScreen() {
  const p = usePalette();
  const [phone, setPhone] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getSession().then((s) => {
      if (!s.registered || !s.phone) router.replace("/register");
      else setPhone(s.phone);
    });
  }, []);

  function doShake() {
    Animated.sequence([
      Animated.timing(shake, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function onBackspace() {
    if (!busy && !locked) setPin((s) => s.slice(0, -1));
  }

  async function onDigit(d: string) {
    if (busy || locked || pin.length >= PIN_LENGTH || !phone) return;
    setError("");
    const next = pin + d;
    setPin(next);
    if (next.length !== PIN_LENGTH) return;

    setBusy(true);
    const outcome = await login(phone, next);
    setBusy(false);

    switch (outcome.kind) {
      case "success":
        await saveSession({ phone, name: outcome.user.name || undefined, token: outcome.token });
        router.replace("/home");
        return;

      case "wrong_pin": {
        const n = attempts + 1;
        setAttempts(n);
        doShake();
        if (n >= MAX_PIN_ATTEMPTS) {
          setLocked(true);
          setError("Account locked. Too many wrong attempts.");
        } else {
          const left = MAX_PIN_ATTEMPTS - n;
          setError(`Wrong PIN, try again. ${left} attempt${left === 1 ? "" : "s"} left.`);
        }
        setTimeout(() => setPin(""), 700);
        return;
      }

      case "pending_approval": // CORRECT pin — never a strike, never a lock
        setError(outcome.message);
        setTimeout(() => setPin(""), 900);
        return;

      case "not_registered":
        await clearSession();
        router.replace("/register");
        return;

      case "network_error":
      case "server_error": // not a wrong PIN — do not strike
        setError(outcome.message);
        setTimeout(() => setPin(""), 700);
        return;
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.background }]}>
      <View style={styles.body}>
        <Text style={[styles.title, { color: p.textPrimary }]}>Enter your M-PESA PIN</Text>
        <Text style={[styles.subtitle, { color: p.textSecondary }]}>
          {phone ? maskPhone(phone) : ""}
        </Text>

        <PinDots filled={pin.length} total={PIN_LENGTH} shake={shake} />

        {!!error && (
          <Text style={[styles.error, locked && { fontWeight: "700" }]}>{error}</Text>
        )}

        <PinPad onDigit={onDigit} onBackspace={onBackspace} disabled={busy || locked} />

        <Pressable
          style={{ marginTop: 18 }}
          onPress={() => setError("PIN reset isn't available yet. Please contact support — Stuck? Ask Zuri.")}
        >
          <Text style={[styles.link, { color: p.brand.green }]}>Forgot PIN?</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function maskPhone(p: string) {
  if (p.length < 6) return p;
  return p.slice(0, 6) + "***" + p.slice(-3);
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flex: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  subtitle: { fontSize: 15, marginTop: 6, textAlign: "center" },
  error: { color: "#E53935", marginBottom: 10, textAlign: "center", paddingHorizontal: 16 },
  link: { fontSize: 14, fontWeight: "600" },
});

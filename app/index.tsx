// Entry gate: decide where to send the user based on local session.
//   - registered (phone stored) -> /pin (unlock)
//   - otherwise                 -> /register
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { getSession } from "@/auth/session";
import { isMpesaAppRole } from "@/api/client";
import { usePalette } from "@/theme/colors";

export default function Index() {
  const p = usePalette();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getSession();
      const canUseApp = !s.role || isMpesaAppRole(s.role);
      router.replace(s.registered && s.phone && canUseApp ? "/pin" : "/register");
      setReady(true);
    })();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: p.background }}>
      {!ready && <ActivityIndicator color={p.brand.green} size="large" />}
    </View>
  );
}

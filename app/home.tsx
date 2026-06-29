// Dashboard: balance card, Fuliza, quick-action grid, recent transactions.
// Balance is polled from /api/balance every 10s (matching the original).
import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getBalance, setAuthToken } from "@/api/client";
import { getSession } from "@/auth/session";
import { quickActions, sampleTransactions } from "@/data/mock";
import { usePalette } from "@/theme/colors";

export default function Home() {
  const p = usePalette();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [fuliza, setFuliza] = useState<number>(0);
  const [hidden, setHidden] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (tok?: string | null) => {
    const target = tok ?? token;
    if (!target) return;
    const r = await getBalance(target);
    if (r.kind === "ok") {
      setBalance(r.balance);
      setFuliza(r.fuliza);
      if (r.name) setName(r.name);
    }
  }, [token]);

  useEffect(() => {
    getSession().then((s) => {
      if (!s.registered || !s.phone) return router.replace("/register");
      setPhone(s.phone);
      setName(s.name ?? "");
      setToken(s.token);
      setAuthToken(s.token);
      load(s.token);
    });
  }, []);

  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => load(token), 10000);
    return () => clearInterval(id);
  }, [token, load]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const fmt = (n: number) => "Ksh " + n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={p.brand.green} />}
      >
        {/* Greeting */}
        <View style={styles.topRow}>
          <Text style={[styles.greeting, { color: p.textPrimary }]}>Karibu{name ? `, ${name.split(" ")[0]}` : ""}</Text>
          <Pressable onPress={() => router.push("/profile")} hitSlop={10}>
            <Ionicons name="person-circle-outline" size={32} color={p.textPrimary} />
          </Pressable>
        </View>

        {/* Balance card */}
        <View style={[styles.card, { backgroundColor: p.brand.green }]}>
          <Text style={styles.cardLabel}>Available Balance</Text>
          <Text style={styles.cardBalance}>
            {balance == null ? "—" : hidden ? "Ksh ••••••" : fmt(balance)}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardFuliza}>Fuliza limit: {fmt(fuliza)}</Text>
            <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
              <Ionicons name={hidden ? "eye-off-outline" : "eye-outline"} size={20} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Quick actions */}
        <View style={styles.grid}>
          {quickActions.map((a) => (
            <Pressable key={a.key} style={styles.action} onPress={() => router.push(a.route as any)}>
              <View style={[styles.actionIcon, { backgroundColor: p.brand.greenTintLight }]}>
                <Ionicons name={a.icon as any} size={24} color={p.brand.greenDark} />
              </View>
              <Text style={[styles.actionLabel, { color: p.textSecondary }]} numberOfLines={1}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Recents */}
        <Text style={[styles.sectionTitle, { color: p.textPrimary }]}>Recent transactions</Text>
        {sampleTransactions.map((t) => (
          <View key={t.id} style={[styles.txn, { borderBottomColor: p.border }]}>
            <View style={[styles.avatar, { backgroundColor: t.avatarColor }]}>
              <Text style={styles.avatarText}>{t.initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.txnName, { color: p.textPrimary }]}>{t.name}</Text>
              <Text style={[styles.txnMeta, { color: p.textMuted }]}>{t.date} · {t.time}</Text>
            </View>
            <Text style={[styles.txnAmt, { color: t.amount < 0 ? p.textPrimary : p.brand.green }]}>
              {t.amount < 0 ? "-" : "+"}{fmt(Math.abs(t.amount)).replace("Ksh ", "")}
            </Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20 },
  greeting: { fontSize: 22, fontWeight: "700" },
  card: { marginHorizontal: 20, borderRadius: 18, padding: 20 },
  cardLabel: { color: "#E8F5E9", fontSize: 13 },
  cardBalance: { color: "#fff", fontSize: 30, fontWeight: "800", marginTop: 6 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
  cardFuliza: { color: "#E8F5E9", fontSize: 13 },
  grid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, marginTop: 22 },
  action: { width: "25%", alignItems: "center", marginBottom: 18 },
  actionIcon: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  actionLabel: { fontSize: 11, textAlign: "center" },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginTop: 8, marginBottom: 4, paddingHorizontal: 20 },
  txn: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { fontWeight: "700", color: "#333" },
  txnName: { fontSize: 15, fontWeight: "600" },
  txnMeta: { fontSize: 12, marginTop: 2 },
  txnAmt: { fontSize: 15, fontWeight: "700" },
});

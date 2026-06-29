import { View, Text, ScrollView, StyleSheet } from "react-native";
import { ScreenScaffold } from "@/components/ScreenScaffold";
import { usePalette } from "@/theme/colors";
import { sampleTransactions, formatDateHeader, type Transaction } from "@/data/mock";

function fmt(n: number) {
  return "Ksh " + Math.abs(n).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Statements() {
  const p = usePalette();

  // Group by date (preserving order)
  const groups: { header: string; items: Transaction[] }[] = [];
  const seen = new Map<string, Transaction[]>();
  for (const t of sampleTransactions) {
    if (!seen.has(t.date)) { seen.set(t.date, []); }
    seen.get(t.date)!.push(t);
  }
  seen.forEach((items, date) => groups.push({ header: formatDateHeader(date), items }));

  return (
    <ScreenScaffold title="Statements">
      <ScrollView showsVerticalScrollIndicator={false}>
        {groups.map(({ header, items }) => (
          <View key={header}>
            <Text style={[styles.dateHeader, { color: p.textMuted, backgroundColor: p.surfaceAlt }]}>{header}</Text>
            {items.map((t) => (
              <View key={t.id} style={[styles.row, { borderBottomColor: p.border }]}>

                <View style={[styles.avatar, { backgroundColor: t.avatarColor }]}>

                  <Text style={styles.avatarText}>{t.initials}</Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: p.textPrimary }]}>{t.name}</Text>
                  <Text style={[styles.meta, { color: p.textMuted }]}>{t.time} · {t.phone}</Text>
                </View>

                <Text style={[styles.amount, { color: t.amount < 0 ? "#E53935" : p.brand.green }]}>

                  {t.amount < 0 ? "-" : "+"}{fmt(t.amount).replace("Ksh ", "")}
                </Text>
              </View>
            ))}
          </View>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  dateHeader: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 12, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  row: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { fontWeight: "700", color: "#333", fontSize: 13 },
  name: { fontSize: 15, fontWeight: "600" },
  meta: { fontSize: 12, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: "700" },
});

// Admin user management — lists every user and lets an admin/superadmin act on them.
// Wires the mobile app to the Invest254 admin REST API (/api/v1/admin/*):
//   • GET  /admin/users            list (search by username/phone, role/status filters)
//   • GET  /admin/users/:id        detail (phone + balances)
//   • POST /admin/users/:id/{suspend|ban|reactivate}
//   • POST /admin/users/:id/role   (superadmin only)
//   • POST /admin/wallets/:id/adjust  (credit/debit; reason required)
// The server enforces all authorization; this screen only gates the UI to match.
import { useCallback, useEffect, useState } from "react";
import {
  View, Text, TextInput, Pressable, StyleSheet, FlatList,
  ActivityIndicator, Modal, Alert, RefreshControl, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  adminListUsers, adminGetUser, adminSetUserStatus, adminSetUserRole, adminAdjustBalance,
  canManageRoles, isMpesaAppRole, setAuthToken, ASSIGNABLE_ROLES,
  type AdminUser, type AdminUserDetail, type AdminResult,
} from "@/api/client";
import { getSession } from "@/auth/session";
import { usePalette } from "@/theme/colors";

const STATUS_COLORS: Record<string, string> = { active: "#4CAF50", suspended: "#FF9800", banned: "#E53935" };
const ROLE_COLORS: Record<string, string> = { superadmin: "#7E57C2", admin: "#2196F3", marketer: "#009688", player: "#9E9E9E" };

const fmtKes = (cents: number) =>
  "Ksh " + (cents / 100).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function Admin() {
  const p = usePalette();
  const [myRole, setMyRole] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<AdminUserDetail | null>(null);

  const handleResult = useCallback(<T,>(r: AdminResult<T>): T | null => {
    if (r.kind === "ok") return r.data;
    setError(r.message);
    return null;
  }, []);

  const load = useCallback(async (q?: string) => {
    setError("");
    const r = await adminListUsers({ q: q?.trim() || undefined, limit: 50 });
    const data = handleResult(r);
    if (data) setUsers(data.items);
  }, [handleResult]);

  useEffect(() => {
    (async () => {
      const s = await getSession();
      if (!s.token || !isMpesaAppRole(s.role)) return router.replace("/pin");
      setAuthToken(s.token);
      setMyRole(s.role);
      await load();
      setLoading(false);
    })();
  }, [load]);

  const onRefresh = async () => { setRefreshing(true); await load(query); setRefreshing(false); };

  async function openUser(u: AdminUser) {
    setError("");
    const r = await adminGetUser(u.userId);
    const data = handleResult(r);
    if (data) setSelected(data);
  }

  async function refreshSelected(id: string) {
    const r = await adminGetUser(id);
    if (r.kind === "ok") setSelected(r.data);
    await load(query);
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: p.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.iconBtn, { backgroundColor: p.surfaceAlt }]} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={p.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: p.textPrimary }]}>Manage users</Text>
        <Pressable onPress={onRefresh} style={[styles.iconBtn, { backgroundColor: p.surfaceAlt }]} hitSlop={10}>
          <Ionicons name="refresh" size={20} color={p.textPrimary} />
        </Pressable>
      </View>

      <View style={[styles.searchRow, { backgroundColor: p.surface, borderColor: p.border }]}>
        <Ionicons name="search" size={18} color={p.textMuted} />
        <TextInput
          placeholder="Search name or phone"
          placeholderTextColor={p.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => load(query)}
          returnKeyType="search"
          autoCapitalize="none"
          style={[styles.searchInput, { color: p.textPrimary }]}
        />
        {query.length > 0 && (
          <Pressable onPress={() => { setQuery(""); load(""); }} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={p.textMuted} />
          </Pressable>
        )}
      </View>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {loading ? (
        <ActivityIndicator color={p.brand.green} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={users}
          keyExtractor={(u) => u.userId}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={p.brand.green} />}
          ListEmptyComponent={<Text style={[styles.empty, { color: p.textMuted }]}>No users found.</Text>}
          renderItem={({ item }) => (
            <Pressable onPress={() => openUser(item)} style={[styles.userRow, { borderBottomColor: p.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.userName, { color: p.textPrimary }]} numberOfLines={1}>{item.username}</Text>
                <View style={styles.badges}>
                  <Badge label={item.role} color={ROLE_COLORS[item.role] ?? p.textMuted} />
                  <Badge label={item.status} color={STATUS_COLORS[item.status] ?? p.textMuted} />
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={p.textMuted} />
            </Pressable>
          )}
        />
      )}

      <UserModal
        user={selected}
        myRole={myRole}
        onClose={() => setSelected(null)}
        onChanged={refreshSelected}
        onError={setError}
      />
    </SafeAreaView>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: color + "22", borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function UserModal({
  user, myRole, onClose, onChanged, onError,
}: {
  user: AdminUserDetail | null;
  myRole: string | null;
  onClose: () => void;
  onChanged: (id: string) => Promise<void>;
  onError: (msg: string) => void;
}) {
  const p = usePalette();
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => { setAmount(""); setReason(""); }, [user?.userId]);

  if (!user) return null;
  const isProtected = user.role === "superadmin" || user.role === "super_admin";

  async function run(label: string, fn: () => Promise<AdminResult<unknown>>) {
    setBusy(true);
    const r = await fn();
    setBusy(false);
    if (r.kind === "ok") { await onChanged(user!.userId); Alert.alert("Done", `${label} succeeded.`); }
    else { onError(r.message); Alert.alert(label + " failed", r.message); }
  }

  function confirmStatus(action: "suspend" | "ban" | "reactivate") {
    Alert.alert(`${action[0].toUpperCase()}${action.slice(1)} user`, `${action} ${user!.username}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Confirm", style: action === "reactivate" ? "default" : "destructive",
        onPress: () => run(`${action}`, () => adminSetUserStatus(user!.userId, action)) },
    ]);
  }

  function submitAdjust(direction: "credit" | "debit") {
    const kes = Number(amount);
    if (!Number.isFinite(kes) || kes <= 0) return onError("Enter a valid amount (KES).");
    if (reason.trim() === "") return onError("A reason is required for balance changes.");
    run(`${direction === "credit" ? "Credit" : "Debit"}`, () =>
      adminAdjustBalance(user!.userId, Math.round(kes * 100), direction, reason.trim()));
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalWrap}>
        <View style={[styles.sheet, { backgroundColor: p.background }]}>
          <View style={styles.sheetHandleRow}>
            <View style={[styles.handle, { backgroundColor: p.border }]} />
          </View>
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sheetName, { color: p.textPrimary }]}>{user.username}</Text>
              <Text style={[styles.sheetMeta, { color: p.textSecondary }]}>{user.phone ?? "—"}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10}><Ionicons name="close" size={24} color={p.textPrimary} /></Pressable>
          </View>

          <View style={styles.badges}>
            <Badge label={user.role} color={ROLE_COLORS[user.role] ?? p.textMuted} />
            <Badge label={user.status} color={STATUS_COLORS[user.status] ?? p.textMuted} />
          </View>

          <View style={[styles.balCard, { backgroundColor: p.surface, borderColor: p.border }]}>
            <Text style={[styles.balLabel, { color: p.textSecondary }]}>Real balance</Text>
            <Text style={[styles.balValue, { color: p.textPrimary }]}>{fmtKes(user.realBalanceCents)}</Text>
            <Text style={[styles.balSub, { color: p.textMuted }]}>Bonus {fmtKes(user.bonusBalanceCents)}</Text>
          </View>

          {isProtected ? (
            <Text style={[styles.protectedNote, { color: p.textMuted }]}>
              The superadmin account is protected and cannot be modified.
            </Text>
          ) : busy ? (
            <ActivityIndicator color={p.brand.green} style={{ marginVertical: 24 }} />
          ) : (
            <>
              {/* Status actions */}
              <Text style={[styles.section, { color: p.textSecondary }]}>Account status</Text>
              <View style={styles.actionRow}>
                {user.status !== "active" && <ActionBtn label="Reactivate" color="#4CAF50" onPress={() => confirmStatus("reactivate")} />}
                {user.status !== "suspended" && <ActionBtn label="Suspend" color="#FF9800" onPress={() => confirmStatus("suspend")} />}
                {user.status !== "banned" && <ActionBtn label="Ban" color="#E53935" onPress={() => confirmStatus("ban")} />}
              </View>

              {/* Role (superadmin only) */}
              {canManageRoles(myRole) && (
                <>
                  <Text style={[styles.section, { color: p.textSecondary }]}>Role</Text>
                  <View style={styles.actionRow}>
                    {ASSIGNABLE_ROLES.map((r) => (
                      <ActionBtn
                        key={r}
                        label={r}
                        color={r === user.role ? p.textMuted : (ROLE_COLORS[r] ?? "#2196F3")}
                        disabled={r === user.role}
                        onPress={() => run(`Set role ${r}`, () => adminSetUserRole(user.userId, r))}
                      />
                    ))}
                  </View>
                </>
              )}

              {/* Balance adjust */}
              <Text style={[styles.section, { color: p.textSecondary }]}>Adjust balance</Text>
              <TextInput
                placeholder="Amount (KES)"
                placeholderTextColor={p.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                style={[styles.input, { color: p.textPrimary, borderColor: p.border, backgroundColor: p.surface }]}
              />
              <TextInput
                placeholder="Reason (required)"
                placeholderTextColor={p.textMuted}
                value={reason}
                onChangeText={setReason}
                style={[styles.input, { color: p.textPrimary, borderColor: p.border, backgroundColor: p.surface }]}
              />
              <View style={styles.actionRow}>
                <ActionBtn label="Credit" color="#4CAF50" onPress={() => submitAdjust("credit")} />
                <ActionBtn label="Debit" color="#E53935" onPress={() => submitAdjust("debit")} />
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ActionBtn({ label, color, onPress, disabled }: { label: string; color: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={[styles.actionBtn, { borderColor: color, opacity: disabled ? 0.4 : 1 }]}
    >
      <Text style={[styles.actionBtnText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700" },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, paddingHorizontal: 12, borderWidth: 1, borderRadius: 12, height: 44 },
  searchInput: { flex: 1, fontSize: 15 },
  error: { color: "#E53935", textAlign: "center", marginTop: 10, paddingHorizontal: 16 },
  empty: { textAlign: "center", marginTop: 40 },
  userRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth },
  userName: { fontSize: 16, fontWeight: "600" },
  badges: { flexDirection: "row", gap: 8, marginTop: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  // modal
  modalWrap: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingBottom: 32 },
  sheetHandleRow: { alignItems: "center", paddingVertical: 8 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  sheetHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  sheetName: { fontSize: 20, fontWeight: "700" },
  sheetMeta: { fontSize: 14, marginTop: 2 },
  balCard: { borderWidth: 1, borderRadius: 14, padding: 16, marginTop: 12 },
  balLabel: { fontSize: 12 },
  balValue: { fontSize: 22, fontWeight: "800", marginTop: 4 },
  balSub: { fontSize: 12, marginTop: 4 },
  section: { fontSize: 13, fontWeight: "700", marginTop: 20, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 },
  actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionBtn: { borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, minWidth: 88, alignItems: "center" },
  actionBtnText: { fontSize: 14, fontWeight: "700", textTransform: "capitalize" },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, marginBottom: 10 },
  protectedNote: { fontSize: 13, textAlign: "center", marginVertical: 24, lineHeight: 18 },
});


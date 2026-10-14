import { colors, radius, spacing, txtSize, typography } from "@/constants/theme";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { createDealerLogin, updateDealerLogin } from "../services/dealers.api";
import { Dealer } from "../types";

type Props = {
  dealer: Dealer | null;
  visible: boolean;
  brandOptions: string[];
  login?: { username: string; password: string; active: boolean; brands: string[] } | null;
  onClose: () => void;
  onCreated: () => void;
};

const generatePassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
};

const apiError = (err: any, fallback: string) => {
  const data = err?.response?.data;
  if (typeof data === "string" && data.trim()) return data.trim();
  if (data && typeof data === "object") {
    const msg = data.message ?? data.Message ?? data.detail ?? data.error ?? data.msg;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
  }
  return err?.message && !err?.response ? err.message : fallback;
};

export function CreateDealerLoginModal({ dealer, visible, brandOptions, login, onClose, onCreated }: Props) {
  const isEdit = !!login;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [active, setActive] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [brandOpen, setBrandOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (visible) {
      setUsername(login?.username ?? dealer?.emailAddress ?? "");
      setPassword(login?.password ?? "");
      setShowPassword(false);
      setActive(login?.active ?? false);
      setBrands(login?.brands ?? []);
      setBrandOpen(false);
      setError(null);
      setSaving(false);
      setDone(false);
    }
  }, [visible, dealer]);

  const allSelected = brandOptions.length > 0 && brandOptions.every((b) => brands.includes(b));
  const toggleAll = () => setBrands(allSelected ? [] : [...brandOptions]);

  const toggleBrand = (b: string) =>
    setBrands((cur) => (cur.includes(b) ? cur.filter((x) => x !== b) : [...cur, b]));

  const submit = async () => {
    if (!dealer) return;
    setError(null);
    if (!username.trim()) return setError("Username is required.");
    if (!password.trim()) return setError("Password is required.");
    try {
      setSaving(true);
      await (isEdit ? updateDealerLogin : createDealerLogin)({
        dealerId: dealer.id,
        cardCode: dealer.cardCode,
        username: username.trim(),
        password: password.trim(),
        status: active ? 1 : 0,
        brandTypes: brands,
      });
      setDone(true);
    } catch (e: any) {
      setError(apiError(e, "Failed to save login."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.card}>
          {done ? (
            <View style={styles.doneWrap}>
              <View style={styles.doneIcon}>
                <Feather name="check" size={28} color={colors.white} />
              </View>
              <Text style={styles.title}>Success</Text>
              <Text style={styles.doneText}>{isEdit ? "Login updated successfully." : "Login created successfully."}</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={onCreated}>
                <Text style={styles.primaryBtnText}>OK</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={styles.headerRow}>
                <Text style={styles.title}>{isEdit ? "Manage Login" : "Create Login"}</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name="x" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Username</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                editable={!isEdit}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="Username"
                placeholderTextColor={colors.muted}
              />

              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordRow}>
                <View style={styles.passwordWrap}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    placeholder="Enter password"
                    placeholderTextColor={colors.muted}
                  />
                  <TouchableOpacity style={styles.eye} onPress={() => setShowPassword((s) => !s)}>
                    <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={colors.muted} />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.generateBtn}
                  onPress={() => {
                    setPassword(generatePassword());
                    setShowPassword(true);
                  }}
                >
                  <Feather name="refresh-cw" size={14} color={colors.text} />
                  <Text style={styles.generateText}>Generate</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Status</Text>
              <View style={styles.statusRow}>
                <Switch
                  value={active}
                  onValueChange={setActive}
                  trackColor={{ false: colors.border, true: colors.success }}
                  thumbColor={colors.white}
                />
                <View style={[styles.badge, { backgroundColor: active ? "#DCFCE7" : "#FEE2E2" }]}>
                  <Text style={[styles.badgeText, { color: active ? colors.success : colors.error }]}>
                    {active ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>

              <Text style={styles.label}>Brand Type</Text>
              <TouchableOpacity style={styles.select} onPress={() => setBrandOpen((o) => !o)}>
                <Text style={[styles.selectText, !brands.length && { color: colors.muted }]} numberOfLines={1}>
                  {allSelected ? "All" : brands.length ? brands.join(", ") : "Select Brand Types"}
                </Text>
                <Feather name={brandOpen ? "chevron-up" : "chevron-down"} size={16} color={colors.muted} />
              </TouchableOpacity>
              {brandOpen ? (
                <View style={styles.options}>
                  {brandOptions.length > 0 ? (
                    <TouchableOpacity style={styles.optionRow} onPress={toggleAll}>
                      <Feather
                        name={allSelected ? "check-square" : "square"}
                        size={16}
                        color={allSelected ? colors.primary : colors.muted}
                      />
                      <Text style={[styles.optionText, { fontFamily: typography.bold }]}>All</Text>
                    </TouchableOpacity>
                  ) : null}
                  {brandOptions.length === 0 ? (
                    <Text style={styles.noOptions}>No brand types available</Text>
                  ) : (
                    brandOptions.map((b) => {
                      const on = brands.includes(b);
                      return (
                        <TouchableOpacity key={b} style={styles.optionRow} onPress={() => toggleBrand(b)}>
                          <Feather name={on ? "check-square" : "square"} size={16} color={on ? colors.primary : colors.muted} />
                          <Text style={styles.optionText}>{b}</Text>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </View>
              ) : null}

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.actions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={saving}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryBtn, styles.createBtn, saving && { opacity: 0.6 }]}
                  onPress={submit}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.primaryBtnText}>{isEdit ? "Update Login" : "Create Login"}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", padding: spacing.lg },
  card: { width: "100%", maxWidth: 420, maxHeight: "90%", backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  title: { fontSize: 18, fontFamily: typography.bold, color: colors.text },
  label: { fontSize: txtSize.xs, fontFamily: typography.semibold, color: colors.text, marginTop: spacing.md, marginBottom: 6 },
  input: { height: 44, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 12, fontSize: txtSize.small, fontFamily: typography.medium, color: colors.text, backgroundColor: colors.white },
  passwordRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  passwordWrap: { flex: 1, justifyContent: "center" },
  passwordInput: { paddingRight: 40 },
  eye: { position: "absolute", right: 12, height: "100%", justifyContent: "center" },
  generateBtn: { flexDirection: "row", alignItems: "center", gap: 6, height: 44, paddingHorizontal: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface },
  generateText: { fontSize: txtSize.xs, fontFamily: typography.semibold, color: colors.text },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: txtSize.xs, fontFamily: typography.bold },
  select: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: 12, backgroundColor: colors.white },
  selectText: { flex: 1, fontSize: txtSize.small, fontFamily: typography.medium, color: colors.text, marginRight: 8 },
  options: { marginTop: 6, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.white },
  optionRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  optionText: { fontSize: txtSize.small, fontFamily: typography.medium, color: colors.text },
  noOptions: { padding: 12, fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.textSecondary },
  error: { marginTop: spacing.md, fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.error },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: spacing.lg },
  cancelBtn: { paddingHorizontal: 18, height: 44, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.white },
  cancelText: { fontSize: txtSize.small, fontFamily: typography.semibold, color: colors.text },
  primaryBtn: { alignSelf: "stretch", paddingVertical: 12, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  createBtn: { alignSelf: "auto", paddingHorizontal: 18, height: 44, paddingVertical: 0 },
  primaryBtnText: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.white },
  doneWrap: { alignItems: "center", paddingVertical: spacing.md },
  doneIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.success, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  doneText: { fontSize: txtSize.small, fontFamily: typography.medium, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.lg },
});
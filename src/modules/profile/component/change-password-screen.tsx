import { colors, radius, spacing, typography } from "@/constants/theme";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { changeDealerPassword } from "../service/profile.api";

export const ChangePasswordScreen = () => {
  const router = useRouter();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => changeDealerPassword(oldPassword.trim(), newPassword.trim()),
    onSuccess: () => {
      Alert.alert("Success", "Your password has been changed.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    },
        onError: (err: any) => {
      setError("Current password entered is incorrect.");
    },
  });

  const handleSubmit = () => {
    setError(null);

    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError("All fields are required.");
      return;
    }
            <View style={styles.hintRow}>
              <Feather name="info" size={12} color={colors.muted} />
              <Text style={styles.hintText}>Use at least 6 characters.</Text>
            </View>
    if (newPassword.trim() !== confirmPassword.trim()) {
      setError("New password and confirm password do not match.");
      return;
    }

    mutation.mutate();
  };

  const PasswordField = ({
    label,
    value,
    onChangeText,
    visible,
    onToggleVisible,
    placeholder,
  }: {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    visible: boolean;
    onToggleVisible: () => void;
    placeholder: string;
  }) => (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Feather name="lock" size={16} color={colors.muted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
        />
        <TouchableOpacity
          onPress={onToggleVisible}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.eyeBtn}
        >
            <Feather name={visible ? "eye" : "eye-off"} size={16} color={colors.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.iconCircle}>
            <Feather name="shield" size={26} color={colors.primary} />
          </View>

          <View style={styles.card}>
            <PasswordField
              label="Current Password"
              value={oldPassword}
              onChangeText={setOldPassword}
              visible={showOld}
                onToggleVisible={() => setShowOld((v) => !v)}
              placeholder="Current password"
            />

            <View style={styles.divider} />

            <PasswordField
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              visible={showNew}
                onToggleVisible={() => setShowNew((v) => !v)}
              placeholder="New password"
            />

            <PasswordField
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              visible={showConfirm}
                onToggleVisible={() => setShowConfirm((v) => !v)}
              placeholder="Confirm new password"
            />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Feather name="alert-triangle" size={14} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, mutation.isPending && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={mutation.isPending}
            activeOpacity={0.85}
          >
            <Feather name="check" size={16} color={colors.white} />
            <Text style={styles.submitBtnText}>
              {mutation.isPending ? "Updating..." : "Update Password"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
    scrollContent: { padding: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.xxl },

  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },

  fieldGroup: { marginBottom: spacing.md },
  label: {
    fontSize: 11,
    fontFamily: typography.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: typography.medium,
    color: colors.text,
    letterSpacing: 1,
  },
  eyeBtn: { padding: 4 },

  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },

  hintRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  hintText: { fontSize: 11, fontFamily: typography.medium, color: colors.muted },

  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#FEF2F2",
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  errorText: { fontSize: 12, fontFamily: typography.medium, color: colors.error, flex: 1 },

  submitBtn: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 14, fontFamily: typography.bold, color: colors.white },
});
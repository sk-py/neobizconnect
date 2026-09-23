import { colors, radius, spacing, txtSize, typography } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  const { clearSession } = useAuth();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const mutation = useMutation({
    mutationFn: () => changeDealerPassword(oldPassword.trim(), newPassword.trim()),
    onSuccess: () => {
      setShowSuccessModal(true);
    },
            onError: (err: any) => {
      if (err?.response) {
        setError("Current password entered is incorrect.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    },
  });

  const handleLoginRedirect = () => {
    setShowSuccessModal(false);
    clearSession();
  };

  const handleSubmit = () => {
    setError(null);

    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError("All fields are required.");
      return;
    }
    if (newPassword.trim() !== confirmPassword.trim()) {
      setError("New password and confirm password do not match.");
      return;
    }

    mutation.mutate();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
            <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.iconCircle}>
            <Feather name="lock" size={28} color={colors.primary} />
          </View>
          <Text style={styles.title}>Change Password</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.inputWithIcon}
                placeholder="Enter current password"
                placeholderTextColor={colors.muted}
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry={!showOld}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowOld((v) => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name={showOld ? "eye" : "eye-off"} size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.inputWithIcon}
                placeholder="Enter new password"
                placeholderTextColor={colors.muted}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNew}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowNew((v) => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name={showNew ? "eye" : "eye-off"} size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.inputWithIcon}
                placeholder="Re-enter new password"
                placeholderTextColor={colors.muted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowConfirm((v) => !v)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name={showConfirm ? "eye" : "eye-off"} size={18} color={colors.muted} />
              </TouchableOpacity>
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
            >
              <Text style={styles.submitBtnText}>
                {mutation.isPending ? "Updating..." : "Update Password"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showSuccessModal} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Feather name="check-circle" size={32} color={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Password Changed Successfully</Text>
            <Text style={styles.modalMessage}>Login with your new password</Text>
            <TouchableOpacity style={styles.modalLoginBtn} onPress={handleLoginRedirect}>
              <Text style={styles.modalLoginBtnText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
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
    title: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.text, textAlign: "center" },
  subtitle: {
    fontSize: txtSize.xs,
    fontFamily: typography.medium,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  form: { width: "100%" },
  label: {
    fontSize: 11,
    fontFamily: typography.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
    fontFamily: typography.medium,
    color: colors.text,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingRight: 8,
  },
  inputWithIcon: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
    fontFamily: typography.medium,
    color: colors.text,
  },
  eyeBtn: { padding: 6 },
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
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 14, fontFamily: typography.bold, color: colors.white },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.xl,
    alignItems: "center",
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: txtSize.small,
    fontFamily: typography.bold,
    color: colors.text,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: txtSize.xs,
    fontFamily: typography.medium,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  modalLoginBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
  },
  modalLoginBtnText: { fontSize: 14, fontFamily: typography.bold, color: colors.white },
});

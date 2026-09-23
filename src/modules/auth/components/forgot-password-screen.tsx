import { colors, radius, spacing, typography, txtSize } from "@/constants/theme";
import {
  generateOtp,
  verifyOtp,
  resetPassword,
} from "@/modules/auth/services/forgot-password-api";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
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

type Step = "email" | "otp" | "password";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const sendOtpMutation = useMutation({
    mutationFn: () => generateOtp(username.trim()),
    onSuccess: () => {
      setError(null);
      setStep("otp");
    },
    onError: (err: any) => {
      setError(
        err?.response?.data?.message || "Couldn't find an account with that email.",
      );
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: () => verifyOtp(username.trim(), otp.trim()),
    onSuccess: () => {
      setError(null);
      setStep("password");
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || "Invalid or expired OTP.");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => resetPassword(username.trim(), newPassword),
    onSuccess: () => {
      setError(null);
      setShowSuccessModal(true);
    },
    onError: (err: any) => {
      setError(err?.response?.data?.message || "Couldn't reset password. Please try again.");
    },
  });

  const handleBack = () => {
    setError(null);
    if (step === "email") {
      router.back();
    } else if (step === "otp") {
      setStep("email");
    } else {
      setStep("otp");
    }
  };

  const handleSendOtp = () => {
    setError(null);
    if (!username.trim()) {
      setError("Please enter your registered email.");
      return;
    }
    sendOtpMutation.mutate();
  };

  const handleVerifyOtp = () => {
    setError(null);
    if (!otp.trim()) {
      setError("Please enter the OTP sent to your email.");
      return;
    }
    verifyOtpMutation.mutate();
  };

  const handleResetPassword = () => {
    setError(null);
    if (!newPassword || newPassword.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    resetPasswordMutation.mutate();
  };

  const handleLoginRedirect = () => {
    setShowSuccessModal(false);
    router.back();
  };

  const stepSubtitle =
    step === "email"
      ? "Enter your registered email to receive an OTP."
      : step === "otp"
        ? `Enter the OTP sent to ${username.trim()}.`
        : "Set a new password for your account.";

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Forgot Password</Text>
          <Text style={styles.headerSubtitle}>{stepSubtitle}</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {step === "email" && (
            <>
              <Text style={styles.label}>Registered Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={colors.muted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </>
          )}

          {step === "otp" && (
            <>
              <Text style={styles.label}>OTP</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor={colors.muted}
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
              <TouchableOpacity
                style={styles.resendLink}
                onPress={() => sendOtpMutation.mutate()}
                disabled={sendOtpMutation.isPending}
              >
                <Text style={styles.resendLinkText}>
                  {sendOtpMutation.isPending ? "Resending..." : "Resend OTP"}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {step === "password" && (
            <>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.muted}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity onPress={() => setShowNewPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name={showNewPassword ? "eye-off" : "eye"} size={18} color={colors.muted} />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordRow}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Re-enter new password"
                  placeholderTextColor={colors.muted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Feather name={showConfirmPassword ? "eye-off" : "eye"} size={18} color={colors.muted} />
                </TouchableOpacity>
              </View>
            </>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Feather name="alert-triangle" size={14} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {step === "email" && (
            <TouchableOpacity
              style={[styles.submitBtn, sendOtpMutation.isPending && styles.submitBtnDisabled]}
              onPress={handleSendOtp}
              disabled={sendOtpMutation.isPending}
            >
              {sendOtpMutation.isPending ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          )}

          {step === "otp" && (
            <TouchableOpacity
              style={[styles.submitBtn, verifyOtpMutation.isPending && styles.submitBtnDisabled]}
              onPress={handleVerifyOtp}
              disabled={verifyOtpMutation.isPending}
            >
              {verifyOtpMutation.isPending ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Verify OTP</Text>
              )}
            </TouchableOpacity>
          )}

          {step === "password" && (
            <TouchableOpacity
              style={[styles.submitBtn, resetPasswordMutation.isPending && styles.submitBtnDisabled]}
              onPress={handleResetPassword}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showSuccessModal} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Feather name="check-circle" size={32} color={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Password Reset Successfully</Text>
            <Text style={styles.modalMessage}>Login with your new password.</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={handleLoginRedirect}>
              <Text style={styles.modalBtnText}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: txtSize.body, fontFamily: typography.bold, color: colors.text },
  headerSubtitle: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.textSecondary, marginTop: 2 },

  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },

  label: {
    fontSize: txtSize.xs,
    fontFamily: typography.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: txtSize.small,
    fontFamily: typography.medium,
    color: colors.text,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: txtSize.small,
    fontFamily: typography.medium,
    color: colors.text,
  },

  resendLink: { alignSelf: "flex-start", marginTop: spacing.sm },
  resendLinkText: { fontSize: 12, fontFamily: typography.bold, color: colors.primary },

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
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 14,
    marginTop: spacing.xl,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 14, fontFamily: typography.bold, color: colors.white },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: spacing.lg },
  modalCard: { width: "100%", maxWidth: 340, backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.xl, alignItems: "center" },
  modalIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  modalTitle: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.text, textAlign: "center" },
  modalMessage: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.textSecondary, textAlign: "center", marginTop: 4, marginBottom: spacing.xl },
  modalBtn: { backgroundColor: colors.primary, borderRadius: radius.sm, paddingVertical: 12, width: "100%", alignItems: "center" },
  modalBtnText: { fontSize: 14, fontFamily: typography.bold, color: colors.white },
});
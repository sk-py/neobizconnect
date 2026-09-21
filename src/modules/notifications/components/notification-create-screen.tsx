import { colors, radius, spacing, typography, txtSize } from "@/constants/theme";
import { sendNotification } from "@/modules/notifications/services/notifications-api";
import { Feather } from "@react-native-vector-icons/feather/static";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
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
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation } from "@tanstack/react-query";

export default function NotificationCreateScreen() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUri, setImageUri] = useState<string | undefined>();
  const [imageName, setImageName] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      sendNotification({
        title: title.trim(),
        message: message.trim(),
        imageUri,
        imageName,
      }),
    onSuccess: () => {
      setShowSuccessModal(true);
    },
    onError: (err: any) => {
      setError(
        err?.response?.data?.message ||
          "Failed to send notification. Please try again.",
      );
    },
  });

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setImageUri(asset.uri);
      setImageName(asset.fileName || "attachment.jpg");
    }
  };

  const removeImage = () => {
    setImageUri(undefined);
    setImageName(undefined);
  };

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setImageUri(undefined);
    setImageName(undefined);
    setError(null);
  };

  const handleSubmit = () => {
    setError(null);

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    if (!message.trim()) {
      setError("Message is required.");
      return;
    }

    mutation.mutate();
  };

  const handleDismissSuccess = () => {
    setShowSuccessModal(false);
    resetForm();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Send Notification</Text>
        <Text style={styles.headerSubtitle}>
          This will be sent to all dealers, sales managers, and other users.
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>
            Title<Text style={styles.required}> *</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Enter notification title"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>
            Message<Text style={styles.required}> *</Text>
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter notification message"
            placeholderTextColor={colors.muted}
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
          />

          <Text style={styles.label}>Attachment</Text>
          {imageUri ? (
            <View style={styles.previewWrap}>
              <Image
                source={{ uri: imageUri }}
                style={styles.previewImage}
                contentFit="cover"
              />
              <TouchableOpacity
                style={styles.previewRemoveBtn}
                onPress={removeImage}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={14} color={colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
              <Feather name="image" size={20} color={colors.primary} />
              <Text style={styles.uploadText}>Tap to upload an image</Text>
            </TouchableOpacity>
          )}

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
            {mutation.isPending ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <>
                <Feather name="send" size={16} color={colors.white} />
                <Text style={styles.submitBtnText}>Send Notification</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showSuccessModal} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Feather name="check-circle" size={32} color={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Notification Sent</Text>
            <Text style={styles.modalMessage}>
              Your notification has been sent to all users.
            </Text>
            <TouchableOpacity style={styles.modalBtn} onPress={handleDismissSuccess}>
              <Text style={styles.modalBtnText}>Done</Text>
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
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: txtSize.body, fontFamily: typography.bold, color: colors.text },
  headerSubtitle: {
    fontSize: txtSize.xs,
    fontFamily: typography.medium,
    color: colors.textSecondary,
    marginTop: 2,
  },

  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },

  label: {
    fontSize: txtSize.xs,
    fontFamily: typography.semibold,
    color: colors.textSecondary,
    marginBottom: 6,
    marginTop: spacing.sm,
  },
  required: { color: colors.error },
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
  textArea: { height: 100 },

  uploadBox: {
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  uploadText: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.muted },

  previewWrap: { position: "relative", height: 140 },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  previewRemoveBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },

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
  modalBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
  },
  modalBtnText: { fontSize: 14, fontFamily: typography.bold, color: colors.white },
});
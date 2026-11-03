import { colors, radius, spacing, typography } from "@/constants/theme";
import Feather from "@react-native-vector-icons/feather/static";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

interface PushPermissionModalProps {
  visible: boolean;
  onAccept: () => void;
  onReject: () => void;
  onSkip: () => void;
}

export const PushPermissionModal = ({
  visible,
  onAccept,
  onReject,
  onSkip,
}: PushPermissionModalProps) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <Feather name="bell" size={28} color={colors.primary} />
          </View>

          <Text style={styles.title}>Enable Notifications</Text>
          <Text style={styles.description}>
            We need permission to send you instant alerts for new sales orders, stock updates, dealer queries, and critical account activity.
          </Text>

          <Pressable
            style={({ pressed }) => [styles.acceptButton, pressed && { opacity: 0.85 }]}
            onPress={onAccept}
          >
            <Text style={styles.acceptText}>Accept</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.rejectButton, pressed && { opacity: 0.7 }]}
            onPress={onReject}
          >
            <Text style={styles.rejectText}>Reject</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.skipButton, pressed && { opacity: 0.5 }]}
            onPress={onSkip}
            hitSlop={10}
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 18,
    fontFamily: typography.bold,
    color: colors.text,
    marginBottom: spacing.xs,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    fontFamily: typography.medium,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  acceptButton: {
    width: "100%",
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radius.md,
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  acceptText: {
    color: colors.white,
    fontFamily: typography.bold,
    fontSize: 15,
  },
  rejectButton: {
    width: "100%",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  rejectText: {
    color: colors.text,
    fontFamily: typography.semibold,
    fontSize: 14,
  },
  skipButton: {
    paddingVertical: 4,
  },
  skipText: {
    color: colors.muted,
    fontFamily: typography.medium,
    fontSize: 12,
  },
});
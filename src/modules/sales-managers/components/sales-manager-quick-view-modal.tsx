import {
  colors,
  radius,
  spacing,
  typography,
  txtSize,
} from "@/constants/theme";
import { SalesManager } from "@/modules/sales-managers/types";
import { Feather } from "@react-native-vector-icons/feather/static";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SalesManagerQuickViewModalProps {
  manager: SalesManager | null;
  visible: boolean;
  onClose: () => void;
}

const NOT_AVAILABLE = "Not Available";

function InfoCard({
  label,
  value,
  style,
}: {
  label: string;
  value: string;
  style?: object;
}) {
  return (
    <View style={[styles.infoCard, style]}>
      <Text style={styles.infoCardLabel}>{label}</Text>
      <Text style={styles.infoCardValue}>{value}</Text>
    </View>
  );
}

export function SalesManagerQuickViewModal({
  manager,
  visible,
  onClose,
}: SalesManagerQuickViewModalProps) {
  if (!manager) {
    return null;
  }

  const mobile =
    manager.mobile || manager.employeeDetails?.number || "";
  const email =
    manager.email || manager.employeeDetails?.email || "";

  const initial = (manager.salesEmployeeName || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Feather name="x" size={18} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>

            <View style={styles.headerText}>
              <Text style={styles.managerName} numberOfLines={2}>
                {manager.salesEmployeeName || NOT_AVAILABLE}
              </Text>
              <Text style={styles.managerCode}>
                Employee Code:{" "}
                {manager.salesEmployeeCode || NOT_AVAILABLE}
              </Text>
            </View>
          </View>

          <View style={styles.body}>
            <View style={styles.row}>
              <InfoCard
                label="Mobile Number"
                value={mobile || NOT_AVAILABLE}
                style={styles.halfCard}
              />

              <InfoCard
                label="Telephone"
                value={manager.telephone || NOT_AVAILABLE}
                style={styles.halfCard}
              />
            </View>

            <InfoCard
              label="Email Address"
              value={email || NOT_AVAILABLE}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: spacing.lg,
  },

  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },

  closeButton: {
    position: "absolute",
    top: spacing.md,
    right: spacing.md,
    zIndex: 1,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingRight: spacing.xl,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },

  avatarText: {
    fontSize: txtSize.small,
    fontFamily: typography.bold,
    color: colors.textSecondary,
  },

  headerText: {
    flex: 1,
    gap: 2,
  },

  managerName: {
    fontSize: txtSize.small,
    fontFamily: typography.bold,
    color: colors.text,
  },

  managerCode: {
    fontSize: txtSize.xs,
    fontFamily: typography.medium,
    color: colors.textSecondary,
  },

  body: {
    marginTop: spacing.md,
    gap: spacing.md,
  },

  row: {
    flexDirection: "row",
    gap: spacing.md,
  },

  halfCard: {
    flex: 1,
  },

  infoCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: 4,
  },

  infoCardLabel: {
    fontSize: txtSize.xs,
    fontFamily: typography.medium,
    color: colors.textSecondary,
  },

  infoCardValue: {
    fontSize: txtSize.small,
    fontFamily: typography.bold,
    color: colors.text,
  },
});
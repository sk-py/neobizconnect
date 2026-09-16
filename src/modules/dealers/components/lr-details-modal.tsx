import {
  colors,
  radius,
  spacing,
  typography,
  txtSize,
} from "@/constants/theme";
import { ArInvoice } from "@/modules/dealers/types";
import { Feather } from "@react-native-vector-icons/feather/static";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface LrDetailsModalProps {
  invoice: ArInvoice | null;
  visible: boolean;
  onClose: () => void;
}

const FALLBACK = "-";

const formatDate = (raw: string) => {
  if (!raw) return FALLBACK;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockLabel}>{label}</Text>
      <Text style={styles.blockValue}>{value || FALLBACK}</Text>
    </View>
  );
}

export function LrDetailsModal({
  invoice,
  visible,
  onClose,
}: LrDetailsModalProps) {
  if (!invoice) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.topRow}>
            <Text style={styles.title}>LR Details</Text>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="x" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
          >
            <DetailBlock label="Invoice No." value={invoice.invoice_number} />
            <DetailBlock
              label="Invoice Date"
              value={formatDate(invoice.posting_date)}
            />
            <DetailBlock
              label="Date of Dispatch"
              value={formatDate(invoice.lr_date)}
            />
            <DetailBlock
              label="Service Provider"
              value={invoice.transport_name}
            />
            <DetailBlock label="LR No." value={invoice.lrno} />
          </ScrollView>
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
    maxHeight: "80%",
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  title: {
    fontSize: txtSize.small,
    fontFamily: typography.bold,
    color: colors.text,
  },

  closeButton: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },

  body: {
    marginTop: spacing.md,
  },

  block: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 4,
  },

  blockLabel: {
    fontSize: txtSize.xs,
    fontFamily: typography.medium,
    color: colors.textSecondary,
  },

  blockValue: {
    fontSize: txtSize.small,
    fontFamily: typography.bold,
    color: colors.text,
  },
});
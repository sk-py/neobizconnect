import {
  colors,
  radius,
  spacing,
  typography,
  txtSize,
} from "@/constants/theme";
import { PendingOrder } from "@/modules/dealers/types";
import { Feather } from "@react-native-vector-icons/feather/static";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface PendingOrderDetailModalProps {
  order: PendingOrder | null;
  visible: boolean;
  onClose: () => void;
}

const FALLBACK = "-";

const formatCurrency = (val: number | string | null | undefined) => {
  const num = Number(val);
  return (isNaN(num) ? 0 : num).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

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

// API returns \r as the line separator within address blocks.
const formatAddressBlock = (value: string) => {
  if (!value) return FALLBACK;
  return value
    .split("\r")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(", ");
};

const getStatusStyle = (status: string) => {
  const normalized = (status || "").toLowerCase();
  if (normalized.includes("open") || normalized.includes("pending")) {
    return { bg: "#EFF6FF", text: "#2563EB" };
  }
  if (normalized.includes("close") || normalized.includes("approved")) {
    return { bg: "#F0FDF4", text: colors.success };
  }
  if (normalized.includes("cancel") || normalized.includes("reject")) {
    return { bg: "#FEF2F2", text: colors.error };
  }
  return { bg: colors.surface, text: colors.textSecondary };
};

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoCell}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || FALLBACK}</Text>
    </View>
  );
}

export function PendingOrderDetailModal({
  order,
  visible,
  onClose,
}: PendingOrderDetailModalProps) {
  if (!order) {
    return null;
  }

  // Prefer portal_status for the badge - it's what the web UI shows, and
  // can disagree with doc_status (e.g. "Pending" vs "Open").
  const displayStatus = order.portal_status || order.doc_status;
  const statusStyle = getStatusStyle(displayStatus);
  const items = order.items ?? [];
  const totalQty = items.reduce((sum, item) => sum + (Number(item.Quantity) || 0), 0);

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
            <View style={styles.titleBlock}>
              <Text style={styles.title}>Pending Order Details</Text>
              <Text style={styles.subtitle}>
                Order #{order.salesorderno || FALLBACK}
              </Text>
            </View>

            <View style={styles.topRowRight}>
              {displayStatus ? (
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: statusStyle.bg },
                  ]}
                >
                  <Text
                    style={[styles.statusPillText, { color: statusStyle.text }]}
                  >
                    {displayStatus}
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="x" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, styles.summaryCardBlue]}>
                <Text style={styles.summaryLabel}>Customer</Text>
                <Text style={styles.summaryValue} numberOfLines={2}>
                  {order.customer_name || FALLBACK}
                </Text>
                <Text style={styles.summarySubtext}>
                  Customer Code: {order.customer_code || FALLBACK}
                </Text>
              </View>

              <View style={[styles.summaryCard, styles.summaryCardGreen]}>
                <Text style={styles.summaryLabel}>Order Date</Text>
                <Text style={styles.summaryValue}>
                  {formatDate(order.document_date)}
                </Text>
              </View>

              <View style={[styles.summaryCard, styles.summaryCardOrange]}>
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <Text style={styles.summaryValuePrimary}>
                  Rs. {formatCurrency(order.doc_total)}
                </Text>
                <Text style={styles.summarySubtext}>
                  Payment Terms: {order.payment_terms || FALLBACK}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Information</Text>

              <View style={styles.infoGrid}>
                <InfoField label="Sales Manager" value={order.sales_manager} />
                <InfoField label="Contact Person" value={order.contact_person} />

                <InfoField label="Branch" value={order.branch} />
                <InfoField label="GSTIN" value={order.gstin} />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Ship To Address</Text>
              <Text style={styles.addressText}>
                {formatAddressBlock(order.ship_to_address)}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Bill To Address</Text>
              <Text style={styles.addressText}>
                {formatAddressBlock(order.bill_to_address)}
              </Text>
            </View>

            {order.remarks ? (
              <View style={styles.section}>
                <Text style={styles.fieldLabel}>Remarks</Text>
                <Text style={styles.addressText}>{order.remarks}</Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <View style={styles.productHeaderRow}>
                <Text style={styles.sectionTitle}>Product Details</Text>
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyBadgeText}>
                    Total Qty: {totalQty || FALLBACK}
                  </Text>
                </View>
              </View>

              {items.length === 0 ? (
                <Text style={styles.emptyText}>No line items</Text>
              ) : (
                <View style={styles.productTable}>
                  <View style={styles.productTableHeader}>
                    <Text style={[styles.productHeaderText, styles.srCol]}>
                      #
                    </Text>
                    <Text
                      style={[styles.productHeaderText, styles.nameCol]}
                    >
                      Item Description
                    </Text>
                    <Text style={[styles.productHeaderText, styles.qtyCol]}>
                      Qty
                    </Text>
                    <Text
                      style={[styles.productHeaderText, styles.priceCol]}
                    >
                      Price (Pre GST)
                    </Text>
                  </View>

                  {items.map((item, index) => (
                    <View
                      key={`${item.ItemCode}-${item.LineNo}-${index}`}
                      style={styles.productRow}
                    >
                      <Text style={[styles.productCellText, styles.srCol]}>
                        {index + 1}
                      </Text>
                      <Text
                        style={[styles.productCellText, styles.nameCol]}
                        numberOfLines={2}
                      >
                        {item.ItemDescription || FALLBACK}
                      </Text>
                      <Text style={[styles.productCellText, styles.qtyCol]}>
                        {item.Quantity ?? 0}
                      </Text>
                      <Text
                        style={[styles.productCellText, styles.priceCol]}
                      >
                        Rs. {formatCurrency(item.Price)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
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
    maxHeight: "88%",
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  titleBlock: {
    flex: 1,
    gap: 2,
  },

  title: {
    fontSize: txtSize.small,
    fontFamily: typography.bold,
    color: colors.text,
  },

  subtitle: {
    fontSize: txtSize.xs,
    fontFamily: typography.medium,
    color: colors.textSecondary,
  },

  topRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.xl ?? 999,
  },

  statusPillText: {
    fontSize: txtSize.xs,
    fontFamily: typography.bold,
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

  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },

  summaryCard: {
    flexGrow: 1,
    flexBasis: "30%",
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: 3,
  },

  summaryCardBlue: { backgroundColor: "#EFF6FF" },
  summaryCardGreen: { backgroundColor: "#F0FDF4" },
  summaryCardOrange: { backgroundColor: "#FFF7ED" },

  summaryLabel: {
    fontSize: txtSize.xs,
    fontFamily: typography.medium,
    color: colors.textSecondary,
  },

  summaryValue: {
    fontSize: txtSize.small,
    fontFamily: typography.bold,
    color: colors.text,
  },

  summaryValuePrimary: {
    fontSize: txtSize.small,
    fontFamily: typography.bold,
    color: colors.primary,
  },

  summarySubtext: {
    fontSize: txtSize.xs,
    fontFamily: typography.medium,
    color: colors.textSecondary,
  },

  section: {
    marginBottom: spacing.lg,
  },

  sectionTitle: {
    fontSize: txtSize.small,
    fontFamily: typography.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },

  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  infoCell: {
    minWidth: "45%",
    gap: 2,
  },

  fieldLabel: {
    fontSize: txtSize.xs,
    fontFamily: typography.medium,
    color: colors.textSecondary,
    marginBottom: 2,
  },

  fieldValue: {
    fontSize: txtSize.xs,
    fontFamily: typography.semibold,
    color: colors.text,
  },

  addressText: {
    fontSize: txtSize.xs,
    fontFamily: typography.semibold,
    color: colors.text,
    lineHeight: 18,
  },

  productHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },

  qtyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: "#EFF6FF",
  },

  qtyBadgeText: {
    fontSize: txtSize.xs,
    fontFamily: typography.bold,
    color: "#2563EB",
  },

  productTable: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    overflow: "hidden",
  },

  productTableHeader: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },

  productHeaderText: {
    fontSize: txtSize.xs,
    fontFamily: typography.bold,
    color: colors.textSecondary,
  },

  productRow: {
    flexDirection: "row",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  productCellText: {
    fontSize: txtSize.xs,
    fontFamily: typography.semibold,
    color: colors.text,
  },

  srCol: {
    width: 24,
  },

  nameCol: {
    flex: 1,
    paddingRight: spacing.xs,
  },

  qtyCol: {
    width: 40,
    textAlign: "center",
  },

  priceCol: {
    width: 80,
    textAlign: "right",
  },

  emptyText: {
    fontSize: txtSize.xs,
    fontFamily: typography.medium,
    color: colors.textSecondary,
  },
});
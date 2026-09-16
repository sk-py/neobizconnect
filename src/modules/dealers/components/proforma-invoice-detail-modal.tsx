import {
  colors,
  radius,
  spacing,
  typography,
  txtSize,
} from "@/constants/theme";
import { ProformaInvoice } from "@/modules/dealers/types";
import { Feather } from "@react-native-vector-icons/feather/static";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ProformaInvoiceDetailModalProps {
  proforma: ProformaInvoice | null;
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

const formatAddressBlock = (value: string) => {
  if (!value) return FALLBACK;
  return value
    .split("\r")
    .map((line) => line.trim())
    .filter(Boolean)
    .join(", ");
};

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoCell}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || FALLBACK}</Text>
    </View>
  );
}

export function ProformaInvoiceDetailModal({
  proforma,
  visible,
  onClose,
}: ProformaInvoiceDetailModalProps) {
  if (!proforma) {
    return null;
  }

  const items = proforma.items ?? [];
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
              <Text style={styles.title}>Proforma Invoice Details</Text>
              <Text style={styles.subtitle}>
                Proforma #{proforma.salesorderno || FALLBACK}
              </Text>
            </View>

            <View style={styles.topRowRight}>
              {proforma.portal_status ? (
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>
                    {proforma.portal_status}
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
                  {proforma.customer_name || FALLBACK}
                </Text>
                <Text style={styles.summarySubtext}>
                  Customer Code: {proforma.customer_code || FALLBACK}
                </Text>
              </View>

              <View style={[styles.summaryCard, styles.summaryCardOrange]}>
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <Text style={styles.summaryValuePrimary}>
                  Rs. {formatCurrency(proforma.doc_total)}
                </Text>
                <Text style={styles.summarySubtext}>
                  Payment Terms: {proforma.payment_terms || FALLBACK}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Proforma Information</Text>

              <View style={styles.infoGrid}>
                <InfoField label="Sales Manager" value={proforma.sales_manager} />
                <InfoField label="Contact Person" value={proforma.contact_person} />

                <InfoField label="Branch" value={proforma.branch} />
                <InfoField label="GSTIN" value={proforma.gstin} />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Ship To Address</Text>
              <Text style={styles.addressText}>
                {formatAddressBlock(proforma.ship_to_address)}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Bill To Address</Text>
              <Text style={styles.addressText}>
                {formatAddressBlock(proforma.bill_to_address)}
              </Text>
            </View>

            {proforma.remarks ? (
              <View style={styles.section}>
                <Text style={styles.fieldLabel}>Remarks</Text>
                <Text style={styles.addressText}>{proforma.remarks}</Text>
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
                      Quantity
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
    backgroundColor: "#EFF6FF",
  },

  statusPillText: {
    fontSize: txtSize.xs,
    fontFamily: typography.bold,
    color: "#2563EB",
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
    flexBasis: "45%",
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: 3,
  },

  summaryCardBlue: { backgroundColor: "#EFF6FF" },
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
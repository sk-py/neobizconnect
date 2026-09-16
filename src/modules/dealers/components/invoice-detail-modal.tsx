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

interface InvoiceDetailModalProps {
  invoice: ArInvoice | null;
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

// API returns \r as the line separator within address blocks
// (e.g. "Street\rCity-Pin\rCountry"). Flatten to a single readable line.
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
    return { bg: "#FFFBEB", text: "#B45309" };
  }
  if (normalized.includes("close")) {
    return { bg: "#EFF6FF", text: "#2563EB" };
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

export function InvoiceDetailModal({
  invoice,
  visible,
  onClose,
}: InvoiceDetailModalProps) {
  if (!invoice) {
    return null;
  }

  const statusStyle = getStatusStyle(invoice.invoice_status);
  const items = invoice.items ?? [];

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
              <Text style={styles.title}>Invoice Details</Text>
              <Text style={styles.subtitle}>
                Invoice #{invoice.invoice_number || FALLBACK}
              </Text>
            </View>

            <View style={styles.topRowRight}>
              {invoice.invoice_status ? (
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: statusStyle.bg },
                  ]}
                >
                  <Text
                    style={[styles.statusPillText, { color: statusStyle.text }]}
                  >
                    {invoice.invoice_status}
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
                  {invoice.customer_name || FALLBACK}
                </Text>
                <Text style={styles.summarySubtext}>
                  Customer Code: {invoice.customer_code || FALLBACK}
                </Text>
              </View>

              <View style={[styles.summaryCard, styles.summaryCardGreen]}>
                <Text style={styles.summaryLabel}>Posting Date</Text>
                <Text style={styles.summaryValue}>
                  {formatDate(invoice.posting_date)}
                </Text>
              </View>

              <View style={[styles.summaryCard, styles.summaryCardOrange]}>
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <Text style={styles.summaryValuePrimary}>
                  Rs. {formatCurrency(invoice.doc_total)}
                </Text>
                <Text style={styles.summarySubtext}>
                  Payment Terms: {invoice.payment_terms || FALLBACK}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Invoice Information</Text>

              <View style={styles.infoGrid}>
                <InfoField label="Sales Manager" value={invoice.sales_manager} />
                <InfoField label="Contact Person" value={invoice.contact_person} />

                <InfoField label="Branch" value={invoice.branch} />
                <InfoField label="GSTIN" value={invoice.gstin} />

                <InfoField label="Eway Bill No" value={invoice.eway_bill_no} />
                <InfoField label="IRN No" value={invoice.irn_no} />

                <InfoField label="Ack No" value={invoice.ack_no} />
                <InfoField label="Ack Date" value={formatDate(invoice.ack_date)} />

                <InfoField
                  label="Freight"
                  value={`Rs. ${formatCurrency(invoice.freight)}`}
                />
                <InfoField
                  label="Round Off"
                  value={`Rs. ${formatCurrency(invoice.round_off)}`}
                />

                {invoice.lrno ? (
                  <InfoField label="Lr No" value={invoice.lrno} />
                ) : null}

                {invoice.transport_name ? (
                  <InfoField
                    label="Transport"
                    value={invoice.transport_name}
                  />
                ) : null}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Ship To Address</Text>
              <Text style={styles.addressText}>
                {formatAddressBlock(invoice.ship_to_address)}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Bill To Address</Text>
              <Text style={styles.addressText}>
                {formatAddressBlock(invoice.bill_to_address)}
              </Text>
            </View>

            {invoice.remarks ? (
              <View style={styles.section}>
                <Text style={styles.fieldLabel}>Remarks</Text>
                <Text style={styles.addressText}>{invoice.remarks}</Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <View style={styles.productHeaderRow}>
                <Text style={styles.sectionTitle}>Product Details</Text>
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyBadgeText}>
                    Total Qty: {invoice.items_quantity ?? FALLBACK}
                  </Text>
                </View>
              </View>

              {items.length === 0 ? (
                <Text style={styles.emptyText}>No line items</Text>
              ) : (
                <View style={styles.productTable}>
                  <View style={styles.productTableHeader}>
                    <Text style={[styles.productHeaderText, styles.srCol]}>
                      Sr
                    </Text>
                    <Text
                      style={[styles.productHeaderText, styles.nameCol]}
                    >
                      Item Name
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
                      key={`${item.ItemNo}-${item.LineNo}-${index}`}
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
                        {Number(item.Quantity) || 0}
                      </Text>
                      <Text
                        style={[styles.productCellText, styles.priceCol]}
                      >
                        Rs. {formatCurrency(item.UnitPrice)}
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
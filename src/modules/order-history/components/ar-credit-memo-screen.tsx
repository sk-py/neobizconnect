import {
  colors,
  radius,
  spacing,
  typography,
  txtSize,
} from "@/constants/theme";
import { ArCreditMemo } from "@/modules/dealers/types";
import { Feather } from "@react-native-vector-icons/feather/static";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface ArCreditMemoDetailModalProps {
  memo: ArCreditMemo | null;
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


const MONTH_NAMES = [
  "jan", "feb", "mar", "apr", "may", "jun",
  "jul", "aug", "sept", "oct", "nov", "dec",
];

const formatDateFromParts = (year: number, monthIndex: number, day: number) => {
  if (!year || monthIndex < 0 || monthIndex > 11 || !day || day < 1 || day > 31) {
    return FALLBACK;
  }
  return `${day} ${MONTH_NAMES[monthIndex]} ${year}`;
};

const formatDate = (value: string | null | undefined) => {
  const text = String(value ?? "").trim();
  if (!text) return FALLBACK;

  const withoutTime = text
    .split("T")[0]
    .replace(/\s+\d{1,2}:\d{2}(:\d{2})?(\.\d+)?(\s?(AM|PM))?$/i, "")
    .trim();

    const ymd = withoutTime.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (ymd) {
    const [, year, month, day] = ymd;
    return formatDateFromParts(Number(year), Number(month) - 1, Number(day));
  }

  const mdy = withoutTime.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const [, month, day, year] = mdy;
    return formatDateFromParts(Number(year), Number(month) - 1, Number(day));
  }

  const d = new Date(withoutTime);
  if (isNaN(d.getTime())) return withoutTime;

  return formatDateFromParts(d.getFullYear(), d.getMonth(), d.getDate());
};

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

export function ArCreditMemoDetailModal({
  memo,
  visible,
  onClose,
}: ArCreditMemoDetailModalProps) {
  if (!memo) {
    return null;
  }

  const statusStyle = getStatusStyle(memo.status);
  const items = memo.items ?? [];

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
              <Text style={styles.title}>Credit Memo Details</Text>
              <Text style={styles.subtitle}>
                Credit Memo #{memo.arcreditmemono || FALLBACK}
              </Text>
            </View>

            <View style={styles.topRowRight}>
              {memo.status ? (
                <View
                  style={[
                    styles.statusPill,
                    { backgroundColor: statusStyle.bg },
                  ]}
                >
                  <Text
                    style={[styles.statusPillText, { color: statusStyle.text }]}
                  >
                    {memo.status}
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
                  {memo.customer_name || FALLBACK}
                </Text>
                <Text style={styles.summarySubtext}>
                  Customer Code: {memo.customer_code || FALLBACK}
                </Text>
              </View>

              <View style={[styles.summaryCard, styles.summaryCardGreen]}>
                <Text style={styles.summaryLabel}>Posting Date</Text>
                <Text style={styles.summaryValue}>
                  {formatDate(memo.posting_date)}
                </Text>
              </View>

              <View style={[styles.summaryCard, styles.summaryCardOrange]}>
                <Text style={styles.summaryLabel}>Total Amount</Text>
                <Text style={styles.summaryValuePrimary}>
                  Rs. {formatCurrency(memo.doc_total)}
                </Text>
                <Text style={styles.summarySubtext}>
                  Payment Terms: {memo.payment_terms || FALLBACK}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Order Information</Text>

              <View style={styles.infoGrid}>
                <InfoField label="Sales Manager" value={memo.sales_manager} />
                <InfoField label="Contact Person" value={memo.contact_person} />

                <InfoField label="Branch" value={memo.branch} />
                <InfoField label="GSTIN" value={memo.gstin} />
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Ship To Address</Text>
              <Text style={styles.addressText}>
                {formatAddressBlock(memo.ship_to_address)}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.fieldLabel}>Bill To Address</Text>
              <Text style={styles.addressText}>
                {formatAddressBlock(memo.bill_to_address)}
              </Text>
            </View>

            {memo.remarks ? (
              <View style={styles.section}>
                <Text style={styles.fieldLabel}>Remarks</Text>
                <Text style={styles.addressText}>{memo.remarks}</Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <View style={styles.productHeaderRow}>
                <Text style={styles.sectionTitle}>Product Details</Text>
                <View style={styles.qtyBadge}>
                  <Text style={styles.qtyBadgeText}>
                    Total Qty: {memo.items_quantity ?? FALLBACK}
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
                      Description
                    </Text>
                    <Text style={[styles.productHeaderText, styles.qtyCol]}>
                      Qty
                    </Text>
                    <Text
                      style={[styles.productHeaderText, styles.priceCol]}
                    >
                      Unit Price (Pre GST)
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
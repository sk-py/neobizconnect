import {
  colors,
  radius,
  spacing,
  typography,
  txtSize,
} from "@/constants/theme";
import { Dealer, DealerAddress } from "@/modules/dealers/types";
import { Feather } from "@react-native-vector-icons/feather/static";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface DealerQuickViewModalProps {
  dealer: Dealer | null;
  visible: boolean;
  onClose: () => void;
}

const NOT_AVAILABLE = "Not Available";

const formatAddressLine = (address: DealerAddress): string => {
  const parts = [
    address.Street,
    address.City,
    address.State,
    address.Country,
  ].filter((part) => Boolean(part && part.trim().length > 0));

  let line = parts.join(", ");

  if (address.ZipCode) {
    line = line ? `${line} - ${address.ZipCode}` : address.ZipCode;
  }

  return line || NOT_AVAILABLE;
};

function AddressCard({ address }: { address: DealerAddress }) {
  return (
    <View style={styles.addressCard}>
      <Text style={styles.addressCardTitle}>
        {address.Address || NOT_AVAILABLE}
      </Text>

      <View style={styles.addressField}>
        <Text style={styles.fieldLabel}>Address Name</Text>
        <Text style={styles.fieldValue}>
          {address.Address || NOT_AVAILABLE}
        </Text>
      </View>

      {address.Block ? (
        <View style={styles.addressField}>
          <Text style={styles.fieldLabel}>Building / Floor</Text>
          <Text style={styles.fieldValue}>{address.Block}</Text>
        </View>
      ) : null}

      <View style={styles.addressField}>
        <Text style={styles.fieldLabel}>Address</Text>
        <Text style={styles.fieldValue}>
          {formatAddressLine(address)}
        </Text>
      </View>

      {address.GSTIN ? (
        <View style={styles.gstinBadge}>
          <Text style={styles.gstinText}>
            GSTIN: {address.GSTIN}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function AddressSection({
  title,
  addresses,
}: {
  title: string;
  addresses: DealerAddress[];
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {addresses.length === 0 ? (
        <Text style={styles.emptyAddressText}>
          No addresses available
        </Text>
      ) : (
        <View style={styles.addressGrid}>
          {addresses.map((address, index) => (
            <AddressCard
              key={`${address.AdresType}-${address.RowNum}-${index}`}
              address={address}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export function DealerQuickViewModal({
  dealer,
  visible,
  onClose,
}: DealerQuickViewModalProps) {
  if (!dealer) {
    return null;
  }

  const billAddresses = (dealer.bpaddresses ?? []).filter(
    (address) => address.AdresType === "B",
  );

  const shipAddresses = (dealer.bpaddresses ?? []).filter(
    (address) => address.AdresType === "S",
  );

  const brandType =
    dealer.brand_type && dealer.brand_type.length > 0
      ? dealer.brand_type.join(", ")
      : NOT_AVAILABLE;

  const initial = (dealer.cardName || "?").charAt(0).toUpperCase();

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
              <Text style={styles.dealerName} numberOfLines={2}>
                {dealer.cardName || NOT_AVAILABLE}
              </Text>
              <Text style={styles.dealerCode}>
                Dealer Code: {dealer.cardCode || NOT_AVAILABLE}
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                Dealer Information
              </Text>

              <View style={styles.infoGrid}>
                <View style={styles.infoCell}>
                  <Text style={styles.fieldLabel}>
                    Contact Person
                  </Text>
                  <Text style={styles.fieldValue}>
                    {dealer.contactPerson || NOT_AVAILABLE}
                  </Text>
                </View>

                <View style={styles.infoCell}>
                  <Text style={styles.fieldLabel}>Email</Text>
                  <Text style={styles.fieldValue}>
                    {dealer.emailAddress || NOT_AVAILABLE}
                  </Text>
                </View>

                <View style={styles.infoCell}>
                  <Text style={styles.fieldLabel}>Phone</Text>
                  <Text style={styles.fieldValue}>
                    {dealer.phone1 || NOT_AVAILABLE}
                  </Text>
                </View>

                <View style={styles.infoCell}>
                  <Text style={styles.fieldLabel}>
                    Alternate Phone
                  </Text>
                  <Text style={styles.fieldValue}>
                    {dealer.phone2 || NOT_AVAILABLE}
                  </Text>
                </View>

                <View style={styles.infoCell}>
                  <Text style={styles.fieldLabel}>
                    Brand Type
                  </Text>
                  <Text style={styles.fieldValue}>{brandType}</Text>
                </View>
              </View>
            </View>

            <AddressSection
              title="Bill To Addresses"
              addresses={billAddresses}
            />

            <AddressSection
              title="Ship To Addresses"
              addresses={shipAddresses}
            />
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
    maxHeight: "85%",
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
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

  dealerName: {
    fontSize: txtSize.small,
    fontFamily: typography.bold,
    color: colors.text,
  },

  dealerCode: {
    fontSize: txtSize.xs,
    fontFamily: typography.medium,
    color: colors.textSecondary,
  },

  body: {
    marginTop: spacing.md,
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
  },

  fieldValue: {
    fontSize: txtSize.xs,
    fontFamily: typography.semibold,
    color: colors.text,
  },

  addressGrid: {
    gap: spacing.sm,
  },

  addressCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    gap: spacing.xs,
  },

  addressCardTitle: {
    fontSize: txtSize.small,
    fontFamily: typography.bold,
    color: colors.text,
    marginBottom: 2,
  },

  addressField: {
    gap: 1,
  },

  gstinBadge: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },

  gstinText: {
    fontSize: txtSize.xs,
    fontFamily: typography.semibold,
    color: colors.textSecondary,
  },

  emptyAddressText: {
    fontSize: txtSize.xs,
    fontFamily: typography.medium,
    color: colors.textSecondary,
  },
});
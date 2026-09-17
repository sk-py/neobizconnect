import { SkeletonList } from "@/components/custom/skeleton";
import {
  colors,
  radius,
  spacing,
  txtSize,
  typography,
} from "@/constants/theme";
import { fetchSalesManagers } from "@/modules/sales-managers/services/sales-managers.api";
import { SalesManagerQuickViewModal } from "@/modules/sales-managers/components/sales-manager-quick-view-modal";
import { SalesManager } from "@/modules/sales-managers/types";
import { LegendList } from "@legendapp/list/react-native";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAGE_SIZE = 10;

const isActiveStatus = (status: string | null | undefined) =>
  (status ?? "").trim().toUpperCase() === "TYES";

// A record only represents a real portal-login sales manager account when
// employeeDetails exists and its lock_status is 1. Inferred from comparing
// a raw 17-record UAT response against the production web table, which
// showed exactly the subset matching this condition. Confirm this still
// holds if the count here ever drifts from the web list's count.
const hasPortalLogin = (manager: SalesManager) =>
  manager.employeeDetails !== null &&
  manager.employeeDetails.lock_status === 1;

const getMobile = (manager: SalesManager) =>
  manager.mobile || manager.employeeDetails?.number || null;

const getEmail = (manager: SalesManager) =>
  manager.email || manager.employeeDetails?.email || null;

export default function SalesManagersListScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [quickViewManager, setQuickViewManager] =
    useState<SalesManager | null>(null);

  const {
    data = [],
    isLoading,
    isError,
    error,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["sales-managers"],
    queryFn: fetchSalesManagers,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const portalManagers = useMemo(
    () => data.filter(hasPortalLogin),
    [data],
  );

  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return portalManagers;
    }

    return portalManagers.filter((manager) =>
      [
        manager.salesEmployeeName,
        getMobile(manager),
        getEmail(manager),
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      ),
    );
  }, [portalManagers, searchQuery]);


  const totalItems = filteredData.length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / PAGE_SIZE),
  );

  const safePage = Math.min(page, totalPages - 1);

  const paginatedData = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return filteredData.slice(start, start + PAGE_SIZE);
  }, [filteredData, safePage]);

  const rangeStart =
    totalItems === 0 ? 0 : safePage * PAGE_SIZE + 1;

  const rangeEnd = Math.min(
    totalItems,
    (safePage + 1) * PAGE_SIZE,
  );

  const errorMessage =
    error instanceof Error
      ? error.message
      : "Something went wrong.";

  const renderRow = ({ item }: { item: SalesManager }) => {
    const active = isActiveStatus(item.active);
    const mobile = getMobile(item);
    const email = getEmail(item);
    // Every row here has already passed hasPortalLogin (lock_status === 1),
    // so a portal account definitionally exists for it — this mirrors the
    // web table, which shows the constant "Created" label on every row
    // rather than the account's separate Active/Inactive state
    // (employeeDetails.login_status, which is a different field).
    const loginStatus = "Created";
    const liveLogin = true;

    return (
      <View style={styles.row}>
        <View style={styles.rowMain}>
          <View style={styles.nameRow}>
            <TouchableOpacity
              onPress={() => setQuickViewManager(item)}
              hitSlop={{ top: 6, bottom: 6, left: 0, right: 6 }}
            >
              <Text style={styles.managerName} numberOfLines={1}>
                {item.salesEmployeeName || "-"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.contactGroup}>
            {mobile ? (
              <TouchableOpacity
                style={styles.contactChip}
                onPress={() => void Linking.openURL(`tel:${mobile}`)}
              >
                <Feather
                  name="phone"
                  size={11}
                  color={colors.textSecondary}
                />
                <Text style={styles.contactText}>{mobile}</Text>
              </TouchableOpacity>
            ) : null}

            {email ? (
              <TouchableOpacity
                style={styles.contactChip}
                onPress={() =>
                  void Linking.openURL(`mailto:${email}`)
                }
              >
                <Feather
                  name="mail"
                  size={11}
                  color={colors.textSecondary}
                />
                <Text style={styles.contactText} numberOfLines={1}>
                  {email}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.badgeGroup}>
            <View
              style={[
                styles.statusBadge,
                active
                  ? styles.statusBadgeActive
                  : styles.statusBadgeInactive,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  {
                    color: active
                      ? colors.success
                      : colors.textSecondary,
                  },
                ]}
              >
                {active ? "Active" : "Inactive"}
              </Text>
            </View>

            <View style={styles.loginStatusRow}>
              <View
                style={[
                  styles.loginStatusDot,
                  {
                    backgroundColor: liveLogin
                      ? colors.success
                      : colors.muted,
                  },
                ]}
              />
              <Text style={styles.loginStatusText}>
                {loginStatus}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right"]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>Sales Manager</Text>
          <Text style={styles.headerSubtitle}>
            View and manage your sales managers
          </Text>
        </View>

        <View style={styles.searchContainer}>
          <Feather
            name="search"
            size={13}
            color={colors.muted}
            style={styles.searchIcon}
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Search name, mobile, email..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setPage(0);
            }}
          />

          {searchQuery.length > 0 ? (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery("");
                setPage(0);
              }}
            >
              <Feather
                name="x-circle"
                size={13}
                color={colors.muted}
              />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {isLoading ? (
        <SkeletonList count={7} />
      ) : isError ? (
        <View style={styles.stateBox}>
          <Feather
            name="alert-triangle"
            size={32}
            color={colors.error}
          />

          <Text style={styles.errorTitle}>
            Couldn't load sales managers
          </Text>

          <Text style={styles.errorSubtitle}>{errorMessage}</Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.stateBox}>
          <Feather name="users" size={32} color={colors.muted} />
          <Text style={styles.emptyText}>
            No sales managers found
          </Text>
        </View>
      ) : (
        <>
          <LegendList
            data={paginatedData}
            keyExtractor={(item: SalesManager, index) =>
              item.salesEmployeeCode || `${item.id}-${index}`
            }
            renderItem={renderRow}
            contentContainerStyle={styles.listContent}
            estimatedItemSize={90}
            onRefresh={refetch}
            refreshing={isRefetching}
            recycleItems
          />

          <View style={styles.paginationBar}>
            <Text style={styles.paginationText}>
              Showing {rangeStart} to {rangeEnd} of {totalItems}{" "}
              entries
            </Text>

            <View style={styles.paginationControls}>
              <TouchableOpacity
                style={[
                  styles.pageButton,
                  safePage === 0 && styles.pageButtonDisabled,
                ]}
                disabled={safePage === 0}
                onPress={() => setPage(0)}
              >
                <Feather
                  name="chevrons-left"
                  size={15}
                  color={
                    safePage === 0 ? colors.muted : colors.text
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pageButton,
                  safePage === 0 && styles.pageButtonDisabled,
                ]}
                disabled={safePage === 0}
                onPress={() =>
                  setPage((current) => Math.max(0, current - 1))
                }
              >
                <Feather
                  name="chevron-left"
                  size={15}
                  color={
                    safePage === 0 ? colors.muted : colors.text
                  }
                />
              </TouchableOpacity>

              <Text style={styles.pageText}>
                {safePage + 1} / {totalPages}
              </Text>

              <TouchableOpacity
                style={[
                  styles.pageButton,
                  safePage >= totalPages - 1 &&
                    styles.pageButtonDisabled,
                ]}
                disabled={safePage >= totalPages - 1}
                onPress={() =>
                  setPage((current) =>
                    Math.min(totalPages - 1, current + 1),
                  )
                }
              >
                <Feather
                  name="chevron-right"
                  size={15}
                  color={
                    safePage >= totalPages - 1
                      ? colors.muted
                      : colors.text
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pageButton,
                  safePage >= totalPages - 1 &&
                    styles.pageButtonDisabled,
                ]}
                disabled={safePage >= totalPages - 1}
                onPress={() => setPage(totalPages - 1)}
              >
                <Feather
                  name="chevrons-right"
                  size={15}
                  color={
                    safePage >= totalPages - 1
                      ? colors.muted
                      : colors.text
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      <SalesManagerQuickViewModal
        manager={quickViewManager}
        visible={quickViewManager !== null}
        onClose={() => setQuickViewManager(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },

  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: {
    flexDirection: "column",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: typography.bold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: txtSize.small,
    fontFamily: typography.medium,
    color: colors.textSecondary,
    marginTop: 2,
  },

  searchContainer: {
    height: 34,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },

  searchIcon: {
    marginRight: 6,
  },

  searchInput: {
    flex: 1,
    height: "100%",
    padding: 0,
    fontSize: txtSize.xs,
    fontFamily: typography.medium,
    color: colors.text,
  },

  listContent: {
    paddingBottom: spacing.md,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  rowMain: {
    flex: 1,
    gap: 6,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  managerName: {
    flexShrink: 1,
    fontSize: txtSize.small,
    fontFamily: typography.bold,
    color: colors.text,
  },

  contactGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  contactChip: {
    maxWidth: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },

  contactText: {
    maxWidth: 220,
    fontSize: txtSize.xs,
    fontFamily: typography.semibold,
    color: colors.textSecondary,
  },

  badgeGroup: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },

  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },

  statusBadgeActive: {
    backgroundColor: "#DCFCE7",
  },

  statusBadgeInactive: {
    backgroundColor: colors.surface,
  },

  statusBadgeText: {
    fontSize: txtSize.xs,
    fontFamily: typography.semibold,
  },

  loginStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  loginStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  loginStatusText: {
    fontSize: txtSize.xs,
    fontFamily: typography.medium,
    color: colors.textSecondary,
  },

  stateBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: spacing.xl,
  },

  emptyText: {
    fontSize: txtSize.small,
    fontFamily: typography.semibold,
    color: colors.text,
  },

  errorTitle: {
    fontSize: txtSize.small,
    fontFamily: typography.bold,
    color: colors.error,
  },

  errorSubtitle: {
    fontSize: txtSize.xs,
    fontFamily: typography.medium,
    color: colors.textSecondary,
    textAlign: "center",
  },

  retryButton: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
  },

  retryButtonText: {
    fontSize: txtSize.small,
    fontFamily: typography.bold,
    color: colors.white,
  },

  paginationBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  paginationText: {
    flex: 1,
    fontSize: txtSize.xs,
    fontFamily: typography.medium,
    color: colors.textSecondary,
  },

  paginationControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  pageButton: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },

  pageButtonDisabled: {
    opacity: 0.45,
  },

  pageText: {
    minWidth: 32,
    textAlign: "center",
    fontSize: txtSize.xs,
    fontFamily: typography.semibold,
    color: colors.text,
  },
});
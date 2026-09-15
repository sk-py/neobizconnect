import {
  colors,
  radius,
  spacing,
  typography,
  txtSize,
} from "@/constants/theme";
import { SkeletonList } from "@/components/custom/skeleton";
import { fetchDealers } from "@/modules/dealers/services/dealers.api";
import { Dealer } from "@/modules/dealers/types";
import { Feather } from "@react-native-vector-icons/feather/static";
import { LegendList } from "@legendapp/list/react-native";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  BackHandler,
  Linking,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const PAGE_SIZE = 10;

export default function DealersListScreen() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.push("/sales-manager-modules");
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      return () => subscription.remove();
    }, [router]),
  );

  const {
    data = [],
    isLoading,
    isError,
    error,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["dealers"],
    queryFn: fetchDealers,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const filteredData = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return data;
    }

    return data.filter((dealer) =>
      [
        dealer.cardCode,
        dealer.cardName,
        dealer.phone1,
        dealer.phone2,
        dealer.emailAddress,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query),
      ),
    );
  }, [data, searchQuery]);

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

  const openDealerDetails = (dealer: Dealer) => {
    router.push(
      `/dealer-details/${encodeURIComponent(dealer.cardCode)}`,
    );
  };

  const renderRow = ({ item }: { item: Dealer }) => {
    const phone = item.phone1 || item.phone2;
    const email = item.emailAddress;

    return (
      <TouchableOpacity
        style={styles.row}
        activeOpacity={0.7}
        onPress={() => openDealerDetails(item)}
      >
        <View style={styles.rowMain}>
          <View style={styles.nameRow}>
            <Text
              style={styles.dealerName}
              numberOfLines={1}
            >
              {item.cardName || "-"}
            </Text>
          </View>

          <Text style={styles.dealerCode}>
            {item.cardCode || "-"}
          </Text>

          <View style={styles.contactGroup}>
            {phone ? (
              <TouchableOpacity
                style={styles.contactChip}
                onPress={(event) => {
                  event.stopPropagation();
                  void Linking.openURL(`tel:${phone}`);
                }}
              >
                <Feather
                  name="phone"
                  size={11}
                  color={colors.textSecondary}
                />

                <Text style={styles.contactText}>
                  {phone}
                </Text>
              </TouchableOpacity>
            ) : null}

            {email ? (
              <TouchableOpacity
                style={styles.contactChip}
                onPress={(event) => {
                  event.stopPropagation();
                  void Linking.openURL(`mailto:${email}`);
                }}
              >
                <Feather
                  name="mail"
                  size={11}
                  color={colors.textSecondary}
                />

                <Text
                  style={styles.contactText}
                  numberOfLines={1}
                >
                  {email}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <Feather
          name="chevron-right"
          size={18}
          color={colors.muted}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right"]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity
            onPress={() =>
              router.push("/sales-manager-modules")
            }
            hitSlop={{
              top: 8,
              bottom: 8,
              left: 8,
              right: 8,
            }}
          >
            <Feather
              name="arrow-left"
              size={20}
              color={colors.text}
            />
          </TouchableOpacity>

          <Text style={styles.title}>Dealers</Text>
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
            placeholder="Search name, code, phone, email..."
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
            Couldn't load dealers
          </Text>

          <Text style={styles.errorSubtitle}>
            {errorMessage}
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : filteredData.length === 0 ? (
        <View style={styles.stateBox}>
          <Feather
            name="users"
            size={32}
            color={colors.muted}
          />

          <Text style={styles.emptyText}>
            No dealers found
          </Text>
        </View>
      ) : (
        <>
          <LegendList
            data={paginatedData}
            keyExtractor={(item: Dealer, index) =>
              item.cardCode || `${item.id}-${index}`
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
              Showing {rangeStart} to {rangeEnd} of{" "}
              {totalItems} entries
            </Text>

            <View style={styles.paginationControls}>
              <TouchableOpacity
                style={[
                  styles.pageButton,
                  safePage === 0 &&
                    styles.pageButtonDisabled,
                ]}
                disabled={safePage === 0}
                onPress={() => setPage(0)}
              >
                <Feather
                  name="chevrons-left"
                  size={15}
                  color={
                    safePage === 0
                      ? colors.muted
                      : colors.text
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.pageButton,
                  safePage === 0 &&
                    styles.pageButtonDisabled,
                ]}
                disabled={safePage === 0}
                onPress={() =>
                  setPage((current) =>
                    Math.max(0, current - 1),
                  )
                }
              >
                <Feather
                  name="chevron-left"
                  size={15}
                  color={
                    safePage === 0
                      ? colors.muted
                      : colors.text
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
                    Math.min(
                      totalPages - 1,
                      current + 1,
                    ),
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: 6,
  },

  title: {
    fontSize: txtSize.small,
    fontFamily: typography.bold,
    color: colors.text,
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
    gap: 4,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  dealerName: {
    flexShrink: 1,
    fontSize: txtSize.small,
    fontFamily: typography.bold,
    color: colors.text,
  },

  dealerCode: {
    fontSize: txtSize.xs,
    fontFamily: typography.medium,
    color: colors.textSecondary,
  },

  contactGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
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
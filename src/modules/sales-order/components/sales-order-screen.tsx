// Component data dikhata hai
import { colors, radius, spacing, txtSize, typography } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { useCartStore } from "@/store/cart.store";
import { LegendList } from "@legendapp/list/react-native";
import { Feather } from "@react-native-vector-icons/feather";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDealerProducts } from "../hooks/use-products";
import { SapProduct, StockFilterType, ViewMode } from "../types";

const SIZES = [
    { label: "All Sizes", value: "all" },
    { label: "12 Inch", value: "12" },
    { label: "13 Inch", value: "13" },
    { label: "14 Inch", value: "14" },
    { label: "15 Inch", value: "15" },
    { label: "16 Inch", value: "16" },
    { label: "17 Inch", value: "17" },
    { label: "18 Inch", value: "18" },
    { label: "20 Inch", value: "20" },
    { label: "22 Inch", value: "22" },
];

const STOCK_OPTIONS: { label: string; value: StockFilterType }[] = [
    { label: "In Stock", value: "inStock" },
    { label: "Out Of Stock", value: "outOfStock" },
    { label: "Offer Price", value: "offerPrice" },
];

export const DealerProductsScreen = () => {
    const router = useRouter();
    const { items: cartItems, addToCart, updateQuantity, selectedBrand, setSelectedBrand } = useCartStore();
    const [stockType, setStockType] = useState<StockFilterType>("inStock");
    const [wheelSize, setWheelSize] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<ViewMode>("table");

    const [brandModalVisible, setBrandModalVisible] = useState(false);
    const [stockModalVisible, setStockModalVisible] = useState(false);
    const [sizeModalVisible, setSizeModalVisible] = useState(false);

    const { user } = useAuth();

    useEffect(() => {
        if (user?.dealer_brand_type?.length && !selectedBrand) {
            setSelectedBrand(user.dealer_brand_type[0]);
        }
    }, [user]);

    const { data: products = [], isLoading, isRefetching, refetch } = useDealerProducts({
        stockType,
        wheelSize,
        brand: selectedBrand || "Neo",
    });

    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return products;
        const query = searchQuery.toLowerCase().trim();
        return products.filter(
            (item) =>
                item.itemName.toLowerCase().includes(query) ||
                item.itemCode.toLowerCase().includes(query)
        );
    }, [products, searchQuery]);

    const handleReset = () => {
        setStockType("inStock");
        setWheelSize("all");
        setSearchQuery("");
    };

    const selectedStockLabel = STOCK_OPTIONS.find((s) => s.value === stockType)?.label;
    const selectedSizeLabel = SIZES.find((s) => s.value === wheelSize)?.label;
    const dealerBrands = user?.dealer_brand_type ?? [];
    const hasMultipleBrands = dealerBrands.length > 1;
    const selectedBrandLabel = selectedBrand || dealerBrands[0] || "—";

    const showSkeleton = isLoading;

    const renderTableRow = ({ item }: { item: SapProduct }) => {
        const cartItem = cartItems.find((i) => i.id === item.id);

        return (
            <View style={styles.tableRow}>
                <View style={styles.imagePlaceholder}>
                    <Feather name="disc" size={28} color={colors.textSecondary} />
                </View>

                <View style={styles.rowContent}>
                    <View style={styles.rowLineOne}>
                        <Text style={styles.productName} numberOfLines={1}>
                            {item.itemName}
                        </Text>
                        <Text style={styles.priceText}>
                            ₹{item.price.toLocaleString("en-IN")}
                        </Text>
                    </View>

                    <View style={styles.rowLineTwo}>
                        <View style={styles.badgesContainer}>
                            <Text style={styles.productCode}>{item.itemCode}</Text>
                            <View style={styles.sizeBadge}>
                                <Text style={styles.sizeBadgeText}>{item.wheelSize}</Text>
                            </View>
                            <View style={styles.stockBadge}>
                                <View style={styles.stockDot} />
                                <Text style={styles.stockBadgeText}>
                                    {item.inStockQty} in stock
                                </Text>
                            </View>
                        </View>

                        {cartItem ? (
                            <View style={styles.inlineStepper}>
                                <TouchableOpacity
                                    onPress={() => updateQuantity(item.id, cartItem.quantity - 1)}
                                    style={styles.inlineStepperBtn}
                                >
                                    <Feather name="minus" size={14} color={colors.white} />
                                </TouchableOpacity>
                                <Text style={styles.inlineStepperText}>{cartItem.quantity}</Text>
                                <TouchableOpacity
                                    onPress={() => updateQuantity(item.id, cartItem.quantity + 1)}
                                    style={styles.inlineStepperBtn}
                                >
                                    <Feather name="plus" size={14} color={colors.white} />
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                style={styles.actionButton}
                                activeOpacity={0.8}
                                onPress={() => addToCart(item)}
                            >
                                <Text style={styles.actionButtonText}>Add</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };

    const renderGridCard = ({ item }: { item: SapProduct }) => {
        const cartItem = cartItems.find((i) => i.id === item.id);

        return (
            <View style={styles.gridCard}>
                <View style={styles.cardHeader}>
                    <View style={styles.sizeBadge}>
                        <Text style={styles.sizeBadgeText}>{item.wheelSize}</Text>
                    </View>
                </View>

                <View style={styles.gridImageContainer}>
                    <Feather name="disc" size={48} color={colors.textSecondary} />
                </View>

                <Text style={styles.gridProductName} numberOfLines={2}>
                    {item.itemName}
                </Text>
                <Text style={styles.gridProductCode}>{item.itemCode}</Text>

                <View style={[styles.stockBadge, styles.gridStockBadge]}>
                    <View style={styles.stockDot} />
                    <Text style={styles.stockBadgeText}>{item.inStockQty} in stock</Text>
                </View>

                <Text style={styles.gridPriceText}>₹{item.price.toLocaleString("en-IN")}</Text>

                {cartItem ? (
                    <View style={styles.gridInlineStepper}>
                        <TouchableOpacity
                            onPress={() => updateQuantity(item.id, cartItem.quantity - 1)}
                            style={styles.gridInlineStepperBtn}
                        >
                            <Feather name="minus" size={16} color={colors.white} />
                        </TouchableOpacity>
                        <Text style={styles.inlineStepperText}>{cartItem.quantity}</Text>
                        <TouchableOpacity
                            onPress={() => updateQuantity(item.id, cartItem.quantity + 1)}
                            style={styles.gridInlineStepperBtn}
                        >
                            <Feather name="plus" size={16} color={colors.white} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.gridActionButton}
                        activeOpacity={0.8}
                        onPress={() => addToCart(item)}
                    >
                        <Text style={styles.actionButtonText}>Add to Order</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
            {/* Compact Top Filter Bar */}
            <View style={styles.filterSection}>
                {/* Row 1: Search and Cart */}
                <View style={styles.searchAndCartRow}>
                    <View style={styles.searchInputWrapper}>
                        <Feather name="search" size={16} color={colors.muted} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search by product or code..."
                            placeholderTextColor={colors.muted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={12}>
                                <Feather name="x-circle" size={16} color={colors.muted} />
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.cartButton}
                        activeOpacity={0.8}
                        onPress={() => router.push("/cart")}
                    >
                        <Feather name="shopping-cart" size={18} color={colors.white} />
                        {cartItems.length > 0 && (
                            <View style={styles.cartBadge}>
                                <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Row 2: Toggles and Filters */}
                <View style={styles.filtersRow}>
                    <View style={styles.viewToggleGroup}>
                        <TouchableOpacity
                            style={[styles.toggleBtn, viewMode === "table" && styles.toggleBtnActive]}
                            onPress={() => setViewMode("table")}
                        >
                            <Feather
                                name="list"
                                size={14}
                                color={viewMode === "table" ? colors.white : colors.textSecondary}
                            />
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.toggleBtn, viewMode === "grid" && styles.toggleBtnActive]}
                            onPress={() => setViewMode("grid")}
                        >
                            <Feather
                                name="grid"
                                size={14}
                                color={viewMode === "grid" ? colors.white : colors.textSecondary}
                            />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.compactDropdown, !hasMultipleBrands && styles.compactDropdownDisabled]}
                        onPress={() => hasMultipleBrands && setBrandModalVisible(true)}
                        activeOpacity={hasMultipleBrands ? 0.7 : 1}
                    >
                        <Text style={styles.compactDropdownText} numberOfLines={1}>
                            {selectedBrandLabel}
                        </Text>
                        {hasMultipleBrands && <Feather name="chevron-down" size={12} color={colors.muted} />}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.compactDropdown}
                        onPress={() => setStockModalVisible(true)}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.compactDropdownText} numberOfLines={1}>
                            {selectedStockLabel === "In Stock" ? "Stock" : selectedStockLabel}
                        </Text>
                        <Feather name="chevron-down" size={12} color={colors.muted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.compactDropdown}
                        onPress={() => setSizeModalVisible(true)}
                        activeOpacity={0.7}
                    >
                        <Feather name="tag" size={10} color={colors.primary} />
                        <Text style={styles.compactDropdownText} numberOfLines={1}>
                            {selectedSizeLabel === "All Sizes" ? "Size" : selectedSizeLabel}
                        </Text>
                        <Feather name="chevron-down" size={12} color={colors.muted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.resetButtonIcon}
                        onPress={handleReset}
                        activeOpacity={0.7}
                    >
                        <Feather name="rotate-ccw" size={14} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Main Content */}
            {showSkeleton ? (
                <SkeletonProductList viewMode={viewMode} />
            ) : filteredProducts.length === 0 ? (
                <View style={styles.centerBox}>
                    <Feather name="inbox" size={48} color={colors.muted} />
                    <Text style={styles.emptyTitle}>No products found</Text>
                    <Text style={styles.emptySubtitle}>Try changing your search or filters.</Text>
                </View>
            ) : (
                <LegendList
                    key={viewMode}
                    data={filteredProducts}
                    keyExtractor={(item: any) => item.id.toString()}
                    estimatedItemSize={viewMode === "grid" ? 250 : 80}
                    numColumns={viewMode === "grid" ? 2 : 1}
                    renderItem={viewMode === "grid" ? renderGridCard : renderTableRow}
                    contentContainerStyle={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    onRefresh={refetch}
                    recycleItems={true}
                    refreshing={isRefetching}
                    extraData={cartItems}
                />
            )}

            {/* Modals remain exactly the same */}
            <Modal visible={stockModalVisible} transparent animationType="fade">
                <Pressable style={styles.modalOverlay} onPress={() => setStockModalVisible(false)}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Select Stock Type</Text>
                        {STOCK_OPTIONS.map((item) => (
                            <TouchableOpacity
                                key={item.value}
                                style={[
                                    styles.modalOption,
                                    stockType === item.value && styles.modalOptionSelected,
                                ]}
                                onPress={() => {
                                    setStockType(item.value);
                                    setStockModalVisible(false);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.modalOptionText,
                                        stockType === item.value && styles.modalOptionTextSelected,
                                    ]}
                                >
                                    {item.label}
                                </Text>
                                {stockType === item.value && (
                                    <Feather name="check" size={16} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>

            <Modal visible={brandModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Select Brand</Text>
                        {user?.dealer_brand_type?.map((brandOption) => (
                            <TouchableOpacity
                                key={brandOption}
                                style={[
                                    styles.modalOption,
                                    selectedBrand === brandOption && styles.modalOptionSelected,
                                ]}
                                onPress={() => {
                                    setSelectedBrand(brandOption);
                                    setBrandModalVisible(false);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.modalOptionText,
                                        selectedBrand === brandOption && styles.modalOptionTextSelected,
                                    ]}
                                >
                                    {brandOption}
                                </Text>
                                {selectedBrand === brandOption && (
                                    <Feather name="check" size={16} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </Modal>

            <Modal visible={sizeModalVisible} transparent animationType="fade">
                <Pressable style={styles.modalOverlay} onPress={() => setSizeModalVisible(false)}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Select Wheel Size</Text>
                        {SIZES.map((item) => (
                            <TouchableOpacity
                                key={item.value}
                                style={[
                                    styles.modalOption,
                                    wheelSize === item.value && styles.modalOptionSelected,
                                ]}
                                onPress={() => {
                                    setWheelSize(item.value);
                                    setSizeModalVisible(false);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.modalOptionText,
                                        wheelSize === item.value && styles.modalOptionTextSelected,
                                    ]}
                                >
                                    {item.label}
                                </Text>
                                {wheelSize === item.value && (
                                    <Feather name="check" size={16} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
};

// ---- Skeleton loading state (initial fetch + pull-to-refresh) ----

const SkeletonBlock = ({ style }: { style?: any }) => {
    const pulse = useSharedValue(0.55);

    useEffect(() => {
        pulse.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 750 }),
                withTiming(0.55, { duration: 750 })
            ),
            -1,
            true
        );
    }, []);

    const rStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

    return <Animated.View style={[styles.skeletonBlock, style, rStyle]} />;
};

const SkeletonTableRow = () => (
    <View style={styles.tableRow}>
        <SkeletonBlock style={{ width: 48, height: 48, borderRadius: radius.sm }} />
        <View style={styles.rowContent}>
            <View style={styles.rowLineOne}>
                <SkeletonBlock style={{ flex: 1, height: 14, borderRadius: 4, marginRight: spacing.sm }} />
                <SkeletonBlock style={{ width: 55, height: 14, borderRadius: 4 }} />
            </View>
            <View style={styles.rowLineTwo}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1, paddingRight: 8 }}>
                    <SkeletonBlock style={{ width: 45, height: 14, borderRadius: 4 }} />
                    <SkeletonBlock style={{ width: 34, height: 16, borderRadius: radius.sm }} />
                    <SkeletonBlock style={{ width: 72, height: 16, borderRadius: radius.xl }} />
                </View>
                <SkeletonBlock style={{ width: 60, height: 30, borderRadius: radius.sm }} />
            </View>
        </View>
    </View>
);

const SkeletonGridCard = () => (
    <View style={styles.gridCard}>
        <View style={styles.cardHeader}>
            <SkeletonBlock style={{ width: 36, height: 16, borderRadius: radius.sm }} />
        </View>

        <SkeletonBlock style={{ height: 90, borderRadius: radius.md, marginVertical: spacing.xs }} />

        <SkeletonBlock style={{ width: "90%", height: 12, borderRadius: 4, marginTop: 4 }} />
        <SkeletonBlock style={{ width: "55%", height: 10, borderRadius: 4, marginTop: 6, marginBottom: 8 }} />

        <SkeletonBlock style={{ width: 76, height: 16, borderRadius: radius.xl, marginBottom: 8 }} />

        <SkeletonBlock style={{ width: "45%", height: 14, borderRadius: 4, marginBottom: 10 }} />

        <SkeletonBlock style={{ height: 38, borderRadius: radius.md }} />
    </View>
);

const SkeletonProductList = ({ viewMode, count = 6 }: { viewMode: ViewMode; count?: number }) => {
    if (viewMode === "grid") {
        const pairs: number[][] = [];
        for (let i = 0; i < count; i += 2) pairs.push([i, i + 1]);

        return (
            <View style={styles.listContainer}>
                {pairs.map((pair, idx) => (
                    <View key={idx} style={{ flexDirection: "row" }}>
                        <View style={{ flex: 1 }}>
                            <SkeletonGridCard />
                        </View>
                        <View style={{ flex: 1 }}>
                            {pair[1] < count && <SkeletonGridCard />}
                        </View>
                    </View>
                ))}
            </View>
        );
    }

    return (
        <View style={styles.listContainer}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonTableRow key={i} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background,
    },
    filterSection: {
        padding: spacing.md,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: spacing.sm,
    },
    // --- New Compact Layout Styles ---
    searchAndCartRow: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    searchInputWrapper: {
        flex: 1,
        height: 40,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        gap: spacing.xs,
    },
    searchInput: {
        flex: 1,
        fontSize: txtSize.small,
        fontFamily: typography.regular,
        color: colors.text,
        padding: 0,
    },
    cartButton: {
        width: 44,
        height: 40,
        borderRadius: radius.md,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    cartBadge: {
        position: "absolute",
        top: -6,
        right: -6,
        backgroundColor: "#EF4444", // Red badge
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 2,
        borderColor: colors.white,
    },
    cartBadgeText: {
        color: colors.white,
        fontSize: 9,
        fontFamily: typography.bold,
    },
    filtersRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    viewToggleGroup: {
        flexDirection: "row",
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.sm,
        overflow: "hidden",
    },
    toggleBtn: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: colors.surface,
    },
    toggleBtnActive: {
        backgroundColor: colors.primary,
    },
    compactDropdown: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        height: 32,
        paddingHorizontal: 4,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.sm,
    },
    compactDropdownDisabled: {
        opacity: 0.6,
        backgroundColor: colors.background,
    },
    compactDropdownText: {
        fontSize: 11,
        fontFamily: typography.medium,
        color: colors.text,
    },
    resetButtonIcon: {
        height: 32,
        width: 32,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.sm,
    },
    // ---------------------------------
    listContainer: {
        padding: spacing.md,
        gap: spacing.sm,
    },
    tableRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: spacing.md,
        backgroundColor: colors.white,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.md,
    },
    imagePlaceholder: {
        width: 48,
        height: 48,
        borderRadius: radius.sm,
        backgroundColor: colors.surface,
        alignItems: "center",
        justifyContent: "center",
    },
    rowContent: {
        flex: 1,
        gap: 8,
    },
    rowLineOne: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: spacing.sm,
    },
    rowLineTwo: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    badgesContainer: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 6,
        flex: 1,
        paddingRight: 8,
    },
    productName: {
        flex: 1,
        fontSize: txtSize.small,
        fontFamily: typography.bold,
        color: colors.text,
    },
    productCode: {
        fontSize: 11,
        fontFamily: typography.medium,
        color: colors.muted,
    },
    priceText: {
        fontSize: txtSize.small,
        fontFamily: typography.bold,
        color: colors.text,
    },
    sizeBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: colors.surface,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sizeBadgeText: {
        fontSize: 10,
        fontFamily: typography.medium,
        color: colors.textSecondary,
    },
    stockBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 6,
        paddingVertical: 2,
        backgroundColor: "#DCFCE7",
        borderRadius: radius.xl,
        gap: 4,
    },
    stockDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.success,
    },
    stockBadgeText: {
        fontSize: 10,
        fontFamily: typography.medium,
        color: colors.success,
    },
    actionButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.primary,
        borderRadius: radius.sm,
        minWidth: 70,
        alignItems: "center",
    },
    inlineStepper: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.primary,
        borderRadius: radius.sm,
        height: 32,
        minWidth: 70,
    },
    inlineStepperBtn: {
        paddingHorizontal: 8,
        height: "100%",
        justifyContent: "center",
    },
    inlineStepperText: {
        fontSize: txtSize.xs,
        fontFamily: typography.bold,
        color: colors.white,
        paddingHorizontal: 6,
    },
    gridActionButton: {
        paddingVertical: 12.5,
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        alignItems: "center",
    },
    gridInlineStepper: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        height: 40,
    },
    gridInlineStepperBtn: {
        paddingHorizontal: 16,
        height: "100%",
        justifyContent: "center",
    },
    actionButtonText: {
        fontSize: txtSize.xs,
        fontFamily: typography.bold,
        color: colors.white,
    },
    gridCard: {
        flex: 1,
        margin: spacing.xs,
        padding: spacing.sm,
        backgroundColor: colors.white,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "flex-end",
    },
    gridImageContainer: {
        height: 90,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        marginVertical: spacing.xs,
    },
    gridProductName: {
        fontSize: txtSize.xs,
        fontFamily: typography.bold,
        color: colors.text,
        minHeight: 32,
    },
    gridProductCode: {
        fontSize: 10,
        fontFamily: typography.regular,
        color: colors.muted,
        marginBottom: 4,
    },
    gridStockBadge: {
        alignSelf: "flex-start",
        marginBottom: 4,
    },
    gridPriceText: {
        fontSize: txtSize.small,
        fontFamily: typography.bold,
        color: colors.text,
        marginBottom: 6,
    },
    centerBox: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: spacing.xl,
    },
    emptyTitle: {
        fontSize: txtSize.body,
        fontFamily: typography.bold,
        color: colors.text,
        marginTop: spacing.md,
    },
    emptySubtitle: {
        fontSize: txtSize.small,
        fontFamily: typography.regular,
        color: colors.muted,
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.xl,
    },
    modalCard: {
        width: "100%",
        backgroundColor: colors.white,
        borderRadius: radius.lg,
        padding: spacing.md,
        gap: 4,
    },
    modalTitle: {
        fontSize: txtSize.body,
        fontFamily: typography.bold,
        color: colors.text,
        marginBottom: spacing.xs,
    },
    modalOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: radius.sm,
    },
    modalOptionSelected: {
        backgroundColor: colors.surface,
    },
    modalOptionText: {
        fontSize: txtSize.small,
        fontFamily: typography.regular,
        color: colors.text,
    },
    modalOptionTextSelected: {
        fontFamily: typography.bold,
        color: colors.primary,
    },
    skeletonBlock: {
        backgroundColor: colors.border,
    },
});

export default DealerProductsScreen;
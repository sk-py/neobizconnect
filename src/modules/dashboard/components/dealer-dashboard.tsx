import { colors, radius, spacing, txtSize, typography } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { Feather } from "@react-native-vector-icons/feather/static";
import { Text as SkiaText, useFont } from "@shopify/react-native-skia";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { BarGroup, CartesianChart } from "victory-native";
import { fetchDashboardData } from "../services/dashboard.api";

// ---------------------------------------------------------------------------
// Payload shape
//
// Every field is optional because a given role's payload may omit any of
// these. Sections are rendered only when their backing field is present
// (see DASHBOARD_SECTIONS + getValue below) — this is what lets the same
// component serve Dealer / Sales Manager / Super Admin / future roles
// without branching on role anywhere in this file.
// ---------------------------------------------------------------------------

interface TargetSeriesItem {
    year?: string;
    month: string;
    target_quantity: number;
    achieved_quantity: number;
    // CartesianChart's generic constrains data to Record<string, unknown> —
    // without an index signature here, TS can't unify TargetSeriesItem with
    // that constraint and silently infers `{}` for the chart's data type,
    // which is why points.achieved_quantity etc. throws TS2339.
    [key: string]: unknown;
}

interface DealerTargetItem {
    name: string;
    year?: string;
    month: string;
    target_quantity: number;
    achieved_quantity: number;
}

interface DashboardData {
    // KPI-style scalars
    total_pending_quantity?: number;
    total_pi_oip_quantity?: number;
    total_invoice_quantity?: number;
    total_outstanding?: number;
    total_sales?: number;
    target_sales?: number;
    achieved_sales?: number;
    credit_limit?: number;
    total_dealers?: number;
    total_dealer?: number; // TODO: backend sends both total_dealers and total_dealer across roles — flag for consolidation
    total_sales_manager?: number;
    total_arcreditmemo?: number;
    annual_target_distribution?: {
        dealer_quantity?: number;
        salesmanager_quantity?: number;
    };

    // Chart-shaped series
    target_vs_achievement?: TargetSeriesItem[];
    monthly_target_vs_collection_of_quantity?: TargetSeriesItem[];

    // Bar-list-shaped series
    top_selling_design?: Array<{ design: string; total_quantity: number }>;
    top_selling_sku?: Array<{ item_description: string; total_quantity: number }>;
    sales_mix_by_wheel_size?: Array<{ wheel_size: string; total_quantity: number; sales_mix_percentage: number }>;

    // Custom-shaped series
    dealers_target_vs_achieved_quantity?: DealerTargetItem[];
}

// ---------------------------------------------------------------------------
// Section config
//
// One ordered list drives the whole dashboard body. Each entry knows how to
// pull its own value out of DashboardData (typed accessor, not a string
// path — a renamed/removed backend field breaks the build here instead of
// silently dropping a section at runtime) and how it wants to render.
//
// Adding a field for a new role = one entry in this array. No JSX changes.
// ---------------------------------------------------------------------------

type KPISection = {
    kind: "kpi";
    id: string;
    title: string;
    isCurrency?: boolean;
    getValue: (d: DashboardData) => number | undefined;
};

type ChartSection = {
    kind: "chart";
    id: string;
    title: string;
    getValue: (d: DashboardData) => TargetSeriesItem[] | undefined;
};

type BarListSection = {
    kind: "barlist";
    id: string;
    title: string;
    labelKey: string;
    valueKey: string;
    secondaryKey?: string;
    secondaryLabel?: string;
    secondarySuffix?: string;
    icon?: string;
    getValue: (d: DashboardData) => any[] | undefined;
};

type CustomSection = {
    kind: "custom";
    id: string;
    getValue: (d: DashboardData) => any;
    render: (value: any) => React.ReactNode;
};

type SectionConfig = KPISection | ChartSection | BarListSection | CustomSection;

const DASHBOARD_SECTIONS: SectionConfig[] = [
    // --- KPIs ---
    { kind: "kpi", id: "total_pending_quantity", title: "Total Pending Qty", getValue: (d) => d.total_pending_quantity },
    { kind: "kpi", id: "total_pi_oip_quantity", title: "Total PI/OIP Qty", getValue: (d) => d.total_pi_oip_quantity },
    { kind: "kpi", id: "total_invoice_quantity", title: "Total Invoice Qty", getValue: (d) => d.total_invoice_quantity },
    { kind: "kpi", id: "total_outstanding", title: "Total Outstanding (₹)", isCurrency: true, getValue: (d) => d.total_outstanding },
    { kind: "kpi", id: "total_sales", title: "Total Sales (₹)", isCurrency: true, getValue: (d) => d.total_sales },
    { kind: "kpi", id: "target_sales", title: "Target Sales (Nos.)", getValue: (d) => d.target_sales },
    { kind: "kpi", id: "achieved_sales", title: "Achieved Sales (Nos.)", getValue: (d) => d.achieved_sales },
    { kind: "kpi", id: "credit_limit", title: "Credit Limit (₹)", isCurrency: true, getValue: (d) => d.credit_limit },
    { kind: "kpi", id: "total_dealers", title: "Total Dealers", getValue: (d) => d.total_dealers ?? d.total_dealer },
    { kind: "kpi", id: "total_sales_manager", title: "Total Sales Managers", getValue: (d) => d.total_sales_manager },
    { kind: "kpi", id: "total_arcreditmemo", title: "Total AR Credit Memos", getValue: (d) => d.total_arcreditmemo },
    { kind: "kpi", id: "annual_target_dealer", title: "Annual Dealer Target", getValue: (d) => d.annual_target_distribution?.dealer_quantity },
    { kind: "kpi", id: "annual_target_sm", title: "Annual SM Target", getValue: (d) => d.annual_target_distribution?.salesmanager_quantity },

    // --- Charts ---
    { kind: "chart", id: "target_vs_achievement", title: "Target vs Achievement", getValue: (d) => d.target_vs_achievement },
    { kind: "chart", id: "monthly_target_vs_collection_of_quantity", title: "Monthly Target vs Collection", getValue: (d) => d.monthly_target_vs_collection_of_quantity },

    // --- Bar lists ---
    { kind: "barlist", id: "top_selling_design", title: "Top Selling Design", labelKey: "design", valueKey: "total_quantity", icon: "layers", getValue: (d) => d.top_selling_design },
    { kind: "barlist", id: "top_selling_sku", title: "Top Selling SKU's", labelKey: "item_description", valueKey: "total_quantity", icon: "box", getValue: (d) => d.top_selling_sku },
    { kind: "barlist", id: "sales_mix_by_wheel_size", title: "Sales Mix by Wheel Size", labelKey: "wheel_size", valueKey: "total_quantity", secondaryKey: "sales_mix_percentage", secondaryLabel: "% MIX", secondarySuffix: "%", icon: "pie-chart", getValue: (d) => d.sales_mix_by_wheel_size },

    // --- Custom ---
    {
        kind: "custom",
        id: "dealers_target_vs_achieved_quantity",
        getValue: (d) => d.dealers_target_vs_achieved_quantity,
        render: (value: DealerTargetItem[]) => <DealersSummaryTable data={value} />,
    },
];

const BAR_COLORS = ["#60A5FA", "#34D399", "#FB923C", "#A78BFA", "#38BDF8", "#F472B6", "#2DD4BF"];
const MONTHS = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];
const YEARS = ["2024-2025", "2025-2026", "2026-2027"];

const formatNumber = (num: number) => {
    return num?.toLocaleString("en-IN") || "0";
};

const AnimatedBarCell = ({ targetPercent, barColor, text, index, flexValue, marginLeft = 0 }: any) => {
    const widthAnim = useSharedValue(0);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            widthAnim.value = withDelay(index * 100, withTiming(targetPercent, { duration: 600 }));
        }, 50);

        return () => clearTimeout(timer);
    }, [targetPercent, index]);

    const rStyle = useAnimatedStyle(() => ({
        width: `${widthAnim.value}%`,
    }));

    return (
        <View style={[styles.barCellContainer, { flex: flexValue, marginLeft }]}>
            <Animated.View style={[styles.tableBackgroundBar, { backgroundColor: barColor }, rStyle]} />
            <Text style={styles.barValueText}>{text}</Text>
        </View>
    );
};

const EmptyChartState = ({ icon = "bar-chart-2" }: { icon?: string }) => (
    <View style={styles.emptyStateContainer}>
        <Feather name={icon as any} size={32} color={colors.surface} />
        <Text style={styles.emptyStateText}>No data available</Text>
    </View>
);

// ---- Skeleton loading state ----

const SkeletonBlock = ({ style }: { style?: any }) => {
    const pulse = useSharedValue(0.4);

    React.useEffect(() => {
        pulse.value = withRepeat(withSequence(withTiming(1, { duration: 750 }), withTiming(0.4, { duration: 750 })), -1, true);
    }, []);

    const rStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

    return <Animated.View style={[styles.skeletonBlock, style, rStyle]} />;
};

const SkeletonKPICard = () => (
    <View style={styles.kpiCard}>
        <SkeletonBlock style={{ width: "65%", height: 11, borderRadius: 4, marginBottom: 10 }} />
        <SkeletonBlock style={{ width: "45%", height: 18, borderRadius: 4 }} />
    </View>
);

const SKELETON_BAR_HEIGHTS = [70, 130, 55, 95, 35, 120, 65];

const SkeletonBarChartCard = () => (
    <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
            <SkeletonBlock style={{ width: 150, height: 14, borderRadius: 4 }} />
            <SkeletonBlock style={{ width: 90, height: 12, borderRadius: 4 }} />
        </View>
        <View style={styles.skeletonChartArea}>
            {SKELETON_BAR_HEIGHTS.map((h, i) => (
                <View key={i} style={styles.skeletonBarPair}>
                    <SkeletonBlock style={{ width: 12, height: h, borderRadius: 3 }} />
                    <SkeletonBlock style={{ width: 12, height: h * 0.75, borderRadius: 3 }} />
                </View>
            ))}
        </View>
    </View>
);

const SkeletonBarListRow = () => (
    <View style={styles.tableRow}>
        <SkeletonBlock style={{ flex: 2, height: 12, borderRadius: 4, marginRight: 8 }} />
        <SkeletonBlock style={{ flex: 1.5, height: 20, borderRadius: 4 }} />
    </View>
);

const SkeletonBarListCard = ({ rows = 4 }: { rows?: number }) => (
    <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
            <SkeletonBlock style={{ width: 140, height: 14, borderRadius: 4 }} />
        </View>
        <View style={[styles.tableHeaderRow, { gap: 8 }]}>
            <SkeletonBlock style={{ flex: 2, height: 9, borderRadius: 3 }} />
            <SkeletonBlock style={{ flex: 1, height: 9, borderRadius: 3 }} />
        </View>
        {Array.from({ length: rows }).map((_, i) => (
            <SkeletonBarListRow key={i} />
        ))}
    </View>
);

// Skeleton is shown before we know which fields the payload has, so it stays
// a generic approximation rather than being data-driven.
const DashboardBodySkeleton = () => (
    <>
        <View style={styles.kpiGrid}>
            {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonKPICard key={i} />
            ))}
        </View>

        <SkeletonBarChartCard />
        <SkeletonBarListCard rows={4} />
        <SkeletonBarListCard rows={4} />
        <SkeletonBarListCard rows={3} />
    </>
);

// Helper to calculate dynamic initial filters
const getInitialFilters = () => {
    const today = new Date();
    const currentMonth = format(today, "MMMM");
    const year = today.getFullYear();
    const isJanToMar = today.getMonth() < 3; // 0 = Jan, 1 = Feb, 2 = Mar
    const currentFY = isJanToMar ? `${year - 1}-${year}` : `${year}-${year + 1}`;

    return {
        financial_year: currentFY,
        month: "", // Default to no month filter
    };
};

const KPICard = ({ title, value, isCurrency = false }: { title: string; value: number; isCurrency?: boolean }) => (
    <View style={styles.kpiCard}>
        <Text style={styles.kpiTitle}>{title}</Text>
        <Text style={styles.kpiValue}>
            {isCurrency ? "₹" : ""}
            {formatNumber(value)}
        </Text>
    </View>
);

const BarListTable = ({ title, data, labelKey, valueKey, secondaryKey, secondaryLabel, secondarySuffix = "", icon = "pie-chart" }: any) => {
    return (
        <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>{title}</Text>
            </View>

            {!data || data.length === 0 ? (
                <EmptyChartState icon={icon} />
            ) : (
                <>
                    <View style={styles.tableHeaderRow}>
                        <Text style={[styles.tableHeaderText, { flex: 2 }]}>{labelKey.replace(/_/g, " ").toUpperCase()}</Text>
                        <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>SUM(QTY)</Text>
                        {secondaryKey && <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>{secondaryLabel ?? secondaryKey.toUpperCase()}</Text>}
                    </View>

                    {data.map((item: any, index: number) => {
                        const maxValue = Math.max(...data.map((d: any) => d[valueKey]));
                        const widthPercent = maxValue === 0 ? 0 : (item[valueKey] / maxValue) * 100;
                        const maxSecondary = secondaryKey ? Math.max(...data.map((d: any) => d[secondaryKey])) : 0;
                        // A "%" secondary (e.g. sales-mix %) is already a 0-100
                        // fill value, so use it directly as bar width. A raw-sum
                        // secondary (e.g. a target total) isn't on a 0-100 scale,
                        // so scale it relative to the largest value in the list.
                        const secondaryWidthPercent = !secondaryKey ? 0 : secondarySuffix === "%" ? item[secondaryKey] : maxSecondary !== 0 ? (item[secondaryKey] / maxSecondary) * 100 : 0;
                        const barColor = BAR_COLORS[index % BAR_COLORS.length];

                        return (
                            <View key={index} style={styles.tableRow}>
                                <Text style={[styles.tableCellText, { flex: 2 }]} numberOfLines={1}>
                                    {item[labelKey]}
                                </Text>

                                <AnimatedBarCell
                                    targetPercent={widthPercent}
                                    barColor={barColor}
                                    text={formatNumber(item[valueKey])}
                                    index={index}
                                    flexValue={secondaryKey ? 1 : 1.5}
                                />

                                {secondaryKey && (
                                    <AnimatedBarCell
                                        targetPercent={secondaryWidthPercent}
                                        barColor={barColor}
                                        text={`${formatNumber(item[secondaryKey])}${secondarySuffix}`}
                                        index={index}
                                        flexValue={1}
                                        marginLeft={8}
                                    />
                                )}
                            </View>
                        );
                    })}
                </>
            )}
        </View>
    );
};

// Reusable target-vs-achieved bar chart. Both target_vs_achievement and
// monthly_target_vs_collection_of_quantity share this exact shape
// (month / achieved_quantity / target_quantity), so one component serves
// both instead of duplicating the CartesianChart block per field.
const TargetChart = ({ title, data, animatedData, font }: { title: string; data: TargetSeriesItem[]; animatedData: TargetSeriesItem[]; font: any }) => (
    <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{title}</Text>
            <View style={styles.chartLegendRow}>
                <View style={[styles.legendDot, { backgroundColor: "#F97316" }]} />
                <Text style={styles.legendText}>SUM(qty)</Text>
                <View style={[styles.legendDot, { backgroundColor: "#3B82F6", marginLeft: 12 }]} />
                <Text style={styles.legendText}>SUM(target)</Text>
            </View>
        </View>

        {data.length === 0 || !font ? (
            <EmptyChartState icon="bar-chart-2" />
        ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ height: 300, width: Math.max(350, animatedData.length * 55) }}>
                    <CartesianChart
                        data={animatedData}
                        xKey="month"
                        yKeys={["achieved_quantity", "target_quantity"]}
                        domainPadding={{ left: 30, right: 30, top: 40 }}
                        axisOptions={{
                            font,
                            tickCount: 12,
                            lineColor: colors.border,
                            labelColor: colors.textSecondary,
                            formatYLabel: (val) => `${val}`,
                        }}
                    >
                        {({ points, chartBounds }) => {
                            const barOffset = 10;

                            return (
                                <>
                                    <BarGroup chartBounds={chartBounds} betweenGroupPadding={0.3} withinGroupPadding={0.1}>
                                        <BarGroup.Bar points={points.achieved_quantity} color="#F97316" animate={{ type: "timing", duration: 600 }} />
                                        <BarGroup.Bar points={points.target_quantity} color="#3B82F6" animate={{ type: "timing", duration: 600 }} />
                                    </BarGroup>

                                    {points.achieved_quantity.map((p, i) => {
                                        if (typeof p.y !== "number" || typeof p.yValue !== "number") return null;
                                        const valStr = p.yValue.toString();
                                        const textWidth = font.measureText(valStr).width;
                                        return (
                                            <SkiaText key={`qty-${i}`} x={p.x - barOffset - textWidth / 2} y={p.y - 8} text={valStr} font={font} color={colors.textSecondary} />
                                        );
                                    })}

                                    {points.target_quantity.map((p, i) => {
                                        if (typeof p.y !== "number" || typeof p.yValue !== "number") return null;
                                        const valStr = p.yValue.toString();
                                        const textWidth = font.measureText(valStr).width;
                                        return (
                                            <SkiaText key={`tgt-${i}`} x={p.x + barOffset - textWidth / 2} y={p.y - 8} text={valStr} font={font} color={colors.textSecondary} />
                                        );
                                    })}
                                </>
                            );
                        }}
                    </CartesianChart>
                </View>
            </ScrollView>
        )}
    </View>
);

// Sums achieved and target quantity per dealer across all the months the
// backend sent — no percentage, no filtering by date. Each dealer gets one
// row: total achieved and total target side by side, so multiple dealers
// fit in one compact list instead of a chart per dealer.
const DealersSummaryTable = ({ data }: { data: DealerTargetItem[] }) => {
    if (!data || data.length === 0) {
        return (
            <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                    <Text style={styles.chartTitle}>Dealer Target vs Achieved</Text>
                </View>
                <EmptyChartState icon="users" />
            </View>
        );
    }

    const totalsByDealer = data.reduce<Record<string, { achieved: number; target: number }>>((acc, item) => {
        const bucket = acc[item.name] ?? { achieved: 0, target: 0 };
        bucket.achieved += item.achieved_quantity;
        bucket.target += item.target_quantity;
        acc[item.name] = bucket;
        return acc;
    }, {});

    const rows = Object.entries(totalsByDealer).map(([name, totals]) => ({
        name,
        total_achieved: totals.achieved,
        total_target: totals.target,
    }));

    return (
        <BarListTable
            title="Dealer Target vs Achieved"
            data={rows}
            labelKey="name"
            valueKey="total_achieved"
            secondaryKey="total_target"
            secondaryLabel="TARGET"
            icon="users"
        />
    );
};

export const DashboardScreen = () => {
    const [animatedCharts, setAnimatedCharts] = useState<Record<string, TargetSeriesItem[]>>({});
    const { user, clearSession } = useAuth();

    const groupCompanyName = user?.group_company_name || "Neo";
    const router = useRouter();

    const font = useFont(require("../../../../assets/fonts/Geist/static/Geist-Regular.ttf"), 10);

    const [filters, setFilters] = useState(getInitialFilters());
    const [isFilterVisible, setFilterVisible] = useState(false);
    const [tempFilters, setTempFilters] = useState(filters);

    const { data, isLoading, isRefetching, refetch } = useQuery<DashboardData>({
        queryKey: ["dashboard", groupCompanyName, filters],
        queryFn: () => fetchDashboardData(groupCompanyName, filters),
        enabled: Boolean(groupCompanyName),
    });

    const chartSections = DASHBOARD_SECTIONS.filter((s): s is ChartSection => s.kind === "chart");

    React.useEffect(() => {
        if (!data) return;
        const timers: ReturnType<typeof setTimeout>[] = [];

        chartSections.forEach((cfg) => {
            const raw = cfg.getValue(data);
            if (!raw || raw.length === 0) {
                setAnimatedCharts((prev) => ({ ...prev, [cfg.id]: [] }));
                return;
            }

            setAnimatedCharts((prev) => ({
                ...prev,
                [cfg.id]: raw.map((d) => ({ ...d, achieved_quantity: 0, target_quantity: 0 })),
            }));

            const timer = setTimeout(() => {
                setAnimatedCharts((prev) => ({ ...prev, [cfg.id]: raw }));
            }, 100);
            timers.push(timer);
        });

        return () => timers.forEach(clearTimeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data]);

    const applyFilters = () => {
        setFilters(tempFilters);
        setFilterVisible(false);
    };

    const resetFilters = () => {
        const emptyFilters = { financial_year: "", month: "" };
        setTempFilters(emptyFilters);
        setFilters(emptyFilters);
        setFilterVisible(false);
    };

    const getSubtitle = () => {
        if (!filters.month && !filters.financial_year) return "All Time";
        if (filters.month && filters.financial_year) return `${filters.month} | ${filters.financial_year}`;
        return filters.month || filters.financial_year;
    };

    const showSkeleton = isLoading || !data || !font;

    const kpiSections = data ? DASHBOARD_SECTIONS.filter((s): s is KPISection => s.kind === "kpi" && s.getValue(data) != null) : [];
    const bodySections = data ? DASHBOARD_SECTIONS.filter((s) => s.kind !== "kpi" && (s as any).getValue(data) != null) : [];

    return (
        <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />}
            >
                <View style={styles.header}>
                    <View>
                        <Text style={styles.headerTitle}>Dashboard</Text>
                        <Text style={styles.headerSubtitle}>{getSubtitle()}</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            onPress={() => {
                                setTempFilters(filters);
                                setFilterVisible(true);
                            }}
                            style={styles.headerBtn}
                        >
                            <Feather name="filter" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => router.push("/profile")} style={styles.headerBtn}>
                            <Feather name="user" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>

                {showSkeleton ? (
                    <DashboardBodySkeleton />
                ) : (
                    <>
                        {kpiSections.length > 0 && (
                            <View style={styles.kpiGrid}>
                                {kpiSections.map((cfg) => (
                                    <KPICard key={cfg.id} title={cfg.title} value={cfg.getValue(data!) as number} isCurrency={cfg.isCurrency} />
                                ))}
                            </View>
                        )}

                        {bodySections.map((cfg) => {
                            switch (cfg.kind) {
                                case "chart":
                                    return (
                                        <TargetChart
                                            key={cfg.id}
                                            title={cfg.title}
                                            data={cfg.getValue(data!) ?? []}
                                            animatedData={animatedCharts[cfg.id] ?? []}
                                            font={font}
                                        />
                                    );
                                case "barlist":
                                    return (
                                        <BarListTable
                                            key={cfg.id}
                                            title={cfg.title}
                                            data={cfg.getValue(data!)}
                                            labelKey={cfg.labelKey}
                                            valueKey={cfg.valueKey}
                                            secondaryKey={cfg.secondaryKey}
                                            secondaryLabel={cfg.secondaryLabel}
                                            secondarySuffix={cfg.secondarySuffix}
                                            icon={cfg.icon}
                                        />
                                    );
                                case "custom":
                                    return <React.Fragment key={cfg.id}>{cfg.render(cfg.getValue(data!))}</React.Fragment>;
                                default:
                                    return null;
                            }
                        })}
                    </>
                )}
            </ScrollView>

            <Modal visible={isFilterVisible} animationType="slide" transparent={true} backdropColor={"transparent"}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter Dashboard</Text>
                            <TouchableOpacity onPress={() => setFilterVisible(false)}>
                                <Feather name="x" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.filterSectionTitle}>Financial Year</Text>
                        <View style={styles.chipContainer}>
                            {YEARS.map((year) => (
                                <TouchableOpacity
                                    key={year}
                                    style={[styles.chip, tempFilters.financial_year === year && styles.chipActive]}
                                    onPress={() =>
                                        setTempFilters((prev) => ({
                                            ...prev,
                                            financial_year: prev.financial_year === year ? "" : year,
                                        }))
                                    }
                                >
                                    <Text style={[styles.chipText, tempFilters.financial_year === year && styles.chipTextActive]}>{year}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.filterSectionTitle}>Month</Text>
                        <View style={styles.chipContainer}>
                            {MONTHS.map((month) => (
                                <TouchableOpacity
                                    key={month}
                                    style={[styles.chip, tempFilters.month === month && styles.chipActive]}
                                    onPress={() =>
                                        setTempFilters((prev) => ({
                                            ...prev,
                                            month: prev.month === month ? "" : month,
                                        }))
                                    }
                                >
                                    <Text style={[styles.chipText, tempFilters.month === month && styles.chipTextActive]}>{month}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalActionRow}>
                            <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                                <Text style={styles.resetBtnText}>Reset</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.applyBtn} onPress={applyFilters}>
                                <Text style={styles.applyBtnText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: spacing.md, paddingBottom: spacing.xxl },

    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
    headerTitle: { fontSize: 24, fontFamily: typography.bold, color: colors.text },
    headerSubtitle: { fontSize: txtSize.small, fontFamily: typography.medium, color: colors.textSecondary, marginTop: 2 },
    headerActions: { flexDirection: "row", gap: spacing.sm },
    headerBtn: { padding: 10, backgroundColor: colors.white, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border },

    kpiGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    kpiCard: { width: "48%", backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
    kpiTitle: { fontSize: 11, fontFamily: typography.medium, color: colors.textSecondary, marginBottom: 8 },
    kpiValue: { fontSize: 18, fontFamily: typography.bold, color: colors.text },

    chartCard: { backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg, minHeight: 200 },
    chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg },
    chartTitle: { fontSize: 14, fontFamily: typography.bold, color: colors.text },
    chartLegendRow: { flexDirection: "row", alignItems: "center" },
    legendDot: { width: 10, height: 10, borderRadius: 2, marginRight: 6 },
    legendText: { fontSize: 10, fontFamily: typography.medium, color: colors.textSecondary },

    emptyStateContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: spacing.xxl },
    emptyStateText: { marginTop: 12, fontSize: 13, fontFamily: typography.medium, color: colors.muted },

    tableHeaderRow: { flexDirection: "row", paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 8 },
    tableHeaderText: { fontSize: 10, fontFamily: typography.bold, color: colors.muted },
    tableRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.surface },
    tableCellText: { fontSize: 11, fontFamily: typography.medium, color: colors.text, paddingRight: 8 },

    barCellContainer: { height: 24, justifyContent: "center", position: "relative" },
    tableBackgroundBar: { position: "absolute", left: 0, top: 0, bottom: 0, borderRadius: 2, opacity: 0.8 },
    barValueText: {
        fontSize: 11,
        fontFamily: typography.bold,
        color: colors.black,
        textAlign: "center",
        zIndex: 1,
        textShadowColor: "rgba(0, 0, 0, 0.3)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },

    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modalContent: { backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing.lg, maxHeight: "80%" },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg },
    modalTitle: { fontSize: 18, fontFamily: typography.bold, color: colors.text },
    filterSectionTitle: { fontSize: 14, fontFamily: typography.bold, color: colors.text, marginBottom: spacing.sm, marginTop: spacing.sm },
    chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.md },
    chip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: 13, fontFamily: typography.medium, color: colors.textSecondary },
    chipTextActive: { color: colors.white },

    modalActionRow: { flexDirection: "row", gap: spacing.md, marginTop: spacing.lg },
    resetBtn: { flex: 1, paddingVertical: 14, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: "center" },
    resetBtnText: { color: colors.text, fontSize: 16, fontFamily: typography.medium },
    applyBtn: { flex: 1, backgroundColor: colors.primary, paddingVertical: 14, borderRadius: radius.md, alignItems: "center" },
    applyBtnText: { color: colors.white, fontSize: 16, fontFamily: typography.bold },

    skeletonBlock: { backgroundColor: colors.border },
    skeletonChartArea: { height: 300, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", paddingHorizontal: spacing.sm, paddingBottom: spacing.lg },
    skeletonBarPair: { flexDirection: "row", alignItems: "flex-end", gap: 4 },
});
import { colors, radius, spacing, txtSize, typography } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { Feather } from "@react-native-vector-icons/feather/static";
import { Text as SkiaText, useFont } from "@shopify/react-native-skia";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BarGroup, CartesianChart, Pie, PolarChart } from "victory-native";
import { fetchDashboardData } from "../services/dashboard.api";

export interface StatusOfQuery {
    lead_status: string;
    count: number;
}
export interface LeadQueryDetail {
    lead_status: string;
    city: string;
    customer_name: string;
    source?: string;
}
export interface MonthLeadCount {
    month_name: string;
    financial_year: string;
    lead_type: string;
    lead_count: number;
}
export interface SalesManagerLeadCount {
    month_name: string;
    financial_year: string;
    employee_name: string;
    financial_month: number;
    lead_count: number;
    employeeid: number;
}
export interface DealersMonthlyTargetAndQuantityTable {
    name: string;
    month_date: string;
    target_quantity: number;
    quantity: number;
}

interface TargetSeriesItem {
    year?: string;
    month: string;
    target_quantity: number;
    achieved_quantity: number;
    name?: string;
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
    total_pending_quantity?: number;
    total_pi_oip_quantity?: number;
    total_invoice_quantity?: number;
    total_outstanding?: number;
    total_sales?: number;
    target_sales?: number;
    achieved_sales?: number;
    credit_limit?: number;
    total_dealers?: number;
    total_dealer?: number;
    total_sales_manager?: number;
    total_arcreditmemo?: number;
    annual_target_distribution?: {
        dealer_quantity?: number;
        salesmanager_quantity?: number;
    };

    total_online_lead_query?: number;
    total_lead_query?: number;
    Status_of_online_query?: StatusOfQuery[];
    status_of_lead_query?: StatusOfQuery[];
    online_lead_query_detail?: LeadQueryDetail[];
    lead_query_detail?: LeadQueryDetail[];
    sales_manager_lead_count?: SalesManagerLeadCount[];
    month_lead_count?: MonthLeadCount[];

    dealers_monthly_target_and_quantity_table?: DealersMonthlyTargetAndQuantityTable[];
    assigned_amount_and_achieved_amount?: TargetSeriesItem[];
    assigned_quantity_and_achieved_quantity?: TargetSeriesItem[];
    salesmanager_target_vs_achieved_quantity?: TargetSeriesItem[];

    target_vs_achievement?: TargetSeriesItem[];
    monthly_target_vs_collection_of_quantity?: TargetSeriesItem[];

    top_selling_design?: Array<{ design: string; total_quantity: number }>;
    top_selling_sku?: Array<{ item_description: string; total_quantity: number }>;
    sales_mix_by_wheel_size?: Array<{ wheel_size: string; total_quantity: number; sales_mix_percentage: number }>;

    dealers_target_vs_achieved_quantity?: DealerTargetItem[];
}

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
    render: (value: any, font?: any) => React.ReactNode;
};

type SectionConfig = KPISection | ChartSection | BarListSection | CustomSection;

const DASHBOARD_SECTIONS: SectionConfig[] = [
    { kind: "kpi", id: "total_online_lead_query", title: "TOTAL ONLINE LEAD QUERIES", getValue: (d) => d.total_online_lead_query },
    { kind: "kpi", id: "total_lead_query", title: "TOTAL LEAD QUERIES", getValue: (d) => d.total_lead_query },
    { kind: "kpi", id: "total_pending_quantity", title: "Total Pending Qty", getValue: (d) => d.total_pending_quantity },
    { kind: "kpi", id: "total_pi_oip_quantity", title: "Total PI/OIP Qty", getValue: (d) => d.total_pi_oip_quantity },
    // { kind: "kpi", id: "total_invoice_quantity", title: "Total Invoice Qty", getValue: (d) => d.total_invoice_quantity },
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

    {
        kind: "custom",
        id: "Status_of_online_query",
        getValue: (d) => d.Status_of_online_query,
        render: (value: any) => <DonutChartCard title="Online Query Status" data={value} labelKey="lead_status" valueKey="count" />
    },
    {
        kind: "custom",
        id: "status_of_lead_query",
        getValue: (d) => d.status_of_lead_query,
        render: (value: any) => <DonutChartCard title="Lead Query Status" data={value} labelKey="lead_status" valueKey="count" />
    },

    {
        kind: "custom",
        id: "month_lead_count",
        getValue: (d) => {
            if (!d.month_lead_count) return undefined;
            const grouped = d.month_lead_count.reduce((acc: any, curr) => {
                const m = curr.month_name;
                if (!acc[m]) acc[m] = { month_name: m, lead_query: 0, online_lead_query: 0 };
                if (curr.lead_type === "Lead Query") acc[m].lead_query += curr.lead_count;
                if (curr.lead_type === "Online Lead Query") acc[m].online_lead_query += curr.lead_count;
                return acc;
            }, {});
            return Object.values(grouped);
        },
        render: (value: any, font: any) => <GroupedTrendChart title="Monthly Lead Queries Trend" data={value} font={font} />
    },

    {
        kind: "custom",
        id: "sales_manager_lead_count",
        getValue: (d) => d.sales_manager_lead_count,
        render: (value: any) => (
            <FilteredSalesManagerLeadTable data={value} />
        )
    },
    // {
    //     kind: "custom",
    //     id: "online_lead_query_detail",
    //     getValue: (d) => d.online_lead_query_detail,
    //     render: (value: any) => (
    //         <FlatDataTable
    //             title="Online Lead Query Details"
    //             data={value}
    //             columns={[
    //                 { key: "customer_name", label: "CUSTOMER NAME", flex: 1.5 },
    //                 { key: "lead_status", label: "STATUS", flex: 1 },
    //                 { key: "city", label: "CITY", flex: 1 },
    //                 { key: "source", label: "SOURCE", flex: 1 }
    //             ]}
    //         />
    //     )
    // },
    // {
    //     kind: "custom",
    //     id: "lead_query_detail",
    //     getValue: (d) => d.lead_query_detail,
    //     render: (value: any) => (
    //         <FlatDataTable
    //             title="Lead Query Details"
    //             data={value}
    //             columns={[
    //                 { key: "customer_name", label: "CUSTOMER NAME", flex: 1.5 },
    //                 { key: "lead_status", label: "STATUS", flex: 1 },
    //                 { key: "city", label: "CITY", flex: 1 }
    //             ]}
    //         />
    //     )
    // },

    { kind: "chart", id: "target_vs_achievement", title: "Target vs Achievement", getValue: (d) => d.target_vs_achievement },
    { kind: "chart", id: "monthly_target_vs_collection_of_quantity", title: "Monthly Target vs Collection", getValue: (d) => d.monthly_target_vs_collection_of_quantity },
    // { kind: "chart", id: "assigned_amount_and_achieved_amount", title: "Assigned vs Achieved Amount", getValue: (d) => d.assigned_amount_and_achieved_amount },
    // { kind: "chart", id: "assigned_quantity_and_achieved_quantity", title: "Assigned vs Achieved Qty", getValue: (d) => d.assigned_quantity_and_achieved_quantity },

    { kind: "barlist", id: "top_selling_design", title: "Top Selling Design", labelKey: "design", valueKey: "total_quantity", icon: "layers", getValue: (d) => d.top_selling_design },
    { kind: "barlist", id: "top_selling_sku", title: "Top Selling SKU's", labelKey: "item_description", valueKey: "total_quantity", icon: "box", getValue: (d) => d.top_selling_sku },
    { kind: "barlist", id: "sales_mix_by_wheel_size", title: "Sales Mix by Wheel Size", labelKey: "wheel_size", valueKey: "total_quantity", secondaryKey: "sales_mix_percentage", secondaryLabel: "% MIX", secondarySuffix: "%", icon: "pie-chart", getValue: (d) => d.sales_mix_by_wheel_size },

    {
        kind: "custom",
        id: "salesmanager_target_vs_achieved_quantity",
        getValue: (d) => d.salesmanager_target_vs_achieved_quantity,
        render: (value: TargetSeriesItem[], font: any) => <SalesManagerDetailedTargetChart data={value} font={font} />
    },
    {
        kind: "custom",
        id: "dealers_monthly_target_and_quantity",
        getValue: (d) => {
            if (!d.dealers_monthly_target_and_quantity_table) return undefined;
            return d.dealers_monthly_target_and_quantity_table.map(x => ({
                name: x.name,
                month: x.month_date,
                target_quantity: x.target_quantity,
                achieved_quantity: x.quantity
            }));
        },
        render: (value: DealerTargetItem[], font: any) => <DealersDetailedTargetChart data={value} font={font} />
    },
    {
        kind: "custom",
        id: "dealers_target_vs_achieved_quantity",
        getValue: (d) => d.dealers_target_vs_achieved_quantity,
        render: (value: DealerTargetItem[], font: any) => <DealersDetailedTargetChart data={value} font={font} />,
    },
];

const BAR_COLORS = ["#60A5FA", "#34D399", "#FB923C", "#A78BFA", "#38BDF8", "#F472B6", "#2DD4BF"];
const EXTENDED_PIE_COLORS = [
    "#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", 
    "#14B8A6", "#F43F5E", "#6366F1", "#84CC16", "#06B6D4", 
    "#D946EF", "#F97316", "#64748B", "#22C55E", "#A855F7"
];
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

const getInitialFilters = () => {
    const today = new Date();
    const year = today.getFullYear();
    const isJanToMar = today.getMonth() < 3;
    const currentFY = isJanToMar ? `${year - 1}-${year}` : `${year}-${year + 1}`;

    return {
        financial_year: currentFY,
        month: "",
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

const DonutChartCard = ({ title, data, labelKey, valueKey }: any) => {
    const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

    if (!data || data.length === 0) {
        return (
            <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                    <Text style={styles.chartTitle}>{title}</Text>
                </View>
                <EmptyChartState icon="pie-chart" />
            </View>
        );
    }

    const total = data.reduce((sum: number, item: any) => sum + (item[valueKey] || 0), 0);

    const pieData = data.map((item: any, i: number) => {
        const label = item[labelKey] || "Unknown";
        const isFaded = selectedStatus !== null && selectedStatus !== label;
        const baseColor = EXTENDED_PIE_COLORS[i % EXTENDED_PIE_COLORS.length];
        
        return {
            value: item[valueKey] || 0,
            label: label,
            originalColor: baseColor,
            color: isFaded ? "#E2E8F0" : baseColor, 
            percentage: total > 0 ? ((item[valueKey] / total) * 100).toFixed(1) : "0.0",
        };
    });

    // Dynamically calculate center display values based on selection
    const displayValue = selectedStatus ? pieData.find(d => d.label === selectedStatus)?.value : total;
    const displayLabel = selectedStatus ? "COUNT" : "TOTAL";

    return (
        <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>{title}</Text>
                {selectedStatus && (
                    <TouchableOpacity onPress={() => setSelectedStatus(null)}>
                        <Text style={{ fontSize: 11, fontFamily: typography.bold, color: colors.primary }}>Clear Selection</Text>
                    </TouchableOpacity>
                )}
            </View>
            
            <View style={{ flexDirection: "row", alignItems: "flex-start", minHeight: 200 }}>
                
                <View style={{ flex: 1, alignItems: "center" }}>
                    <View style={{ width: "100%", height: 200, position: "relative" }}>
                        <PolarChart data={pieData} colorKey="color" valueKey="value" labelKey="label">
                            <Pie.Chart innerRadius={50} />
                        </PolarChart>
                        <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, alignItems: "center", justifyContent: "center" }}>
                            <Text style={{ fontSize: 10, fontFamily: typography.medium, color: colors.textSecondary }}>{displayLabel}</Text>
                            <Text style={{ fontSize: 20, fontFamily: typography.bold, color: colors.text }}>{displayValue}</Text>
                        </View>
                    </View>
                    
                    {selectedStatus && (
                        <Text style={{ fontSize: 11, fontFamily: typography.bold, color: colors.text, textAlign: "center" }} numberOfLines={2}>
                            {selectedStatus}
                        </Text>
                    )}
                </View>

                <View style={{ flex: 1.2, paddingLeft: 10 }}>
                    <View style={styles.tableHeaderRow}>
                        <Text style={[styles.tableHeaderText, { flex: 2 }]}>STATUS</Text>
                        <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>COUNT</Text>
                        <Text style={[styles.tableHeaderText, { flex: 1, textAlign: "right" }]}>%</Text>
                    </View>
                    {pieData.map((d: any, i: number) => {
                        const isSelected = selectedStatus === d.label;
                        const isFaded = selectedStatus !== null && !isSelected;
                        
                        return (
                            <TouchableOpacity 
                                key={i} 
                                style={[
                                    styles.tableRow, 
                                    isSelected && { backgroundColor: colors.surface, borderRadius: radius.sm, marginHorizontal: -4, paddingHorizontal: 4 }
                                ]}
                                onPress={() => setSelectedStatus(isSelected ? null : d.label)}
                                activeOpacity={0.7}
                            >
                                <View style={{ flexDirection: "row", alignItems: "center", flex: 2 }}>
                                    <View style={{ 
                                        width: 8, height: 8, borderRadius: 4, marginRight: 6,
                                        backgroundColor: d.originalColor, 
                                        opacity: isFaded ? 0.3 : 1
                                    }} />
                                    <Text style={[styles.tableCellText, { flex: 1, color: isFaded ? colors.textSecondary : colors.text }]} numberOfLines={1}>{d.label}</Text>
                                </View>
                                <Text style={[styles.tableCellText, { flex: 1, textAlign: "right", fontFamily: typography.bold, color: isFaded ? colors.textSecondary : colors.text }]}>{d.value}</Text>
                                <Text style={[styles.tableCellText, { flex: 1, textAlign: "right", color: isFaded ? colors.textSecondary : colors.text }]}>{d.percentage}%</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );
};

const GroupedTrendChart = ({ title, data, font }: any) => {
    if (!data || data.length === 0 || !font) {
        return (
            <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                    <Text style={styles.chartTitle}>{title}</Text>
                </View>
                <EmptyChartState icon="bar-chart-2" />
            </View>
        );
    }

    return (
        <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>{title}</Text>
                <View style={styles.chartLegendRow}>
                    <View style={[styles.legendDot, { backgroundColor: "#8B5CF6" }]} />
                    <Text style={styles.legendText}>Lead Query</Text>
                    <View style={[styles.legendDot, { backgroundColor: "#3B82F6", marginLeft: 12 }]} />
                    <Text style={styles.legendText}>Online Lead Query</Text>
                </View>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{ height: 300, width: Math.max(350, data.length * 60) }}>
                    <CartesianChart
                        data={data}
                        xKey="month_name"
                        yKeys={["lead_query", "online_lead_query"]}
                        domainPadding={{ left: 30, right: 30, top: 40 }}
                        axisOptions={{
                            font,
                            tickCount: data.length,
                            lineColor: colors.border,
                            labelColor: colors.textSecondary,
                        }}
                    >
                        {({ points, chartBounds }) => (
                            <>
                                <BarGroup chartBounds={chartBounds} betweenGroupPadding={0.3} withinGroupPadding={0.1}>
                                    <BarGroup.Bar points={points.lead_query} color="#8B5CF6" animate={{ type: "timing", duration: 600 }} />
                                    <BarGroup.Bar points={points.online_lead_query} color="#3B82F6" animate={{ type: "timing", duration: 600 }} />
                                </BarGroup>

                                {points.lead_query.map((p, i) => (
                                    p.yValue > 0 && <SkiaText key={`lq-${i}`} x={p.x - 12} y={p.y - 8} text={p.yValue.toString()} font={font} color={colors.textSecondary} />
                                ))}
                                {points.online_lead_query.map((p, i) => (
                                    p.yValue > 0 && <SkiaText key={`olq-${i}`} x={p.x + 4} y={p.y - 8} text={p.yValue.toString()} font={font} color={colors.textSecondary} />
                                ))}
                            </>
                        )}
                    </CartesianChart>
                </View>
            </ScrollView>
        </View>
    );
};

const FlatDataTable = ({ title, columns, data }: { title: string, columns: { key: string, label: string, flex?: number }[], data: any[] }) => {
    if (!data || data.length === 0) {
        return (
            <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                    <Text allowFontScaling={false} style={styles.chartTitle}>{title}</Text>
                </View>
                <EmptyChartState icon="list" />
            </View>
        );
    }

    return (
        <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>{title}</Text>
            </View>
            <View style={styles.tableHeaderRow}>
                {columns.map((col, i) => (
                    <Text key={i} style={[styles.tableHeaderText, { flex: col.flex || 1 }]}>{col.label}</Text>
                ))}
            </View>
            {data.slice(0, 10).map((item, rowIndex) => (
                <View key={rowIndex} style={styles.tableRow}>
                    {columns.map((col, colIndex) => (
                        <Text key={colIndex} style={[styles.tableCellText, { flex: col.flex || 1 }]} numberOfLines={1}>
                            {item[col.key] ?? "-"}
                        </Text>
                    ))}
                </View>
            ))}
        </View>
    );
};

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
                            tickCount: animatedData.length > 0 ? animatedData.length : 1,
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

const DealersDetailedTargetChart = ({ data, font }: { data: DealerTargetItem[], font: any }) => {
    const uniqueDealers = React.useMemo(() => {
        return Array.from(new Set((data || []).map(d => d.name).filter(Boolean)));
    }, [data]);

    const [selectedDealer, setSelectedDealer] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    React.useEffect(() => {
        if (uniqueDealers.length > 0 && (!selectedDealer || !uniqueDealers.includes(selectedDealer))) {
            setSelectedDealer(uniqueDealers[0]);
        }
    }, [uniqueDealers, selectedDealer]);

    if (!data || data.length === 0 || !font) {
        return (
            <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                    <Text style={styles.chartTitle}>Dealer Monthly Target vs Achieved</Text>
                </View>
                <EmptyChartState icon="users" />
            </View>
        );
    }

    const chartData = data.filter(d => d.name === selectedDealer);
    const filteredDealers = uniqueDealers.filter(d => d.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Dealer Monthly Target vs Achieved</Text>
                <View style={styles.chartLegendRow}>
                    <View style={[styles.legendDot, { backgroundColor: "#F97316" }]} />
                    <Text style={styles.legendText}>Achieved</Text>
                    <View style={[styles.legendDot, { backgroundColor: "#3B82F6", marginLeft: 12 }]} />
                    <Text style={styles.legendText}>Target</Text>
                </View>
            </View>

            {/* Dropdown Trigger */}
            {uniqueDealers.length > 0 && (
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, marginBottom: 16 }}
                    onPress={() => setIsDropdownOpen(true)}
                >
                    <Text style={{ fontSize: 13, fontFamily: typography.medium, color: colors.text }} numberOfLines={1}>
                        {selectedDealer || "Select Dealer"}
                    </Text>
                    <Feather name="chevron-down" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
            )}

            {chartData.length === 0 ? (
                <EmptyChartState icon="bar-chart-2" />
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ height: 300, width: Math.max(350, chartData.length * 80) }}>
                        <CartesianChart
                            data={chartData}
                            xKey="month"
                            yKeys={["achieved_quantity", "target_quantity"]}
                            domainPadding={{ left: 30, right: 20, top: 40 }}
                            axisOptions={{
                                font,
                                tickCount: chartData.length,
                                lineColor: colors.border,
                                labelColor: colors.textSecondary,
                            }}
                        >
                            {({ points, chartBounds }) => (
                                <>
                                    <BarGroup chartBounds={chartBounds} betweenGroupPadding={0.3} withinGroupPadding={0.1}>
                                        <BarGroup.Bar points={points.achieved_quantity} color="#F97316" animate={{ type: "timing", duration: 600 }} />
                                        <BarGroup.Bar points={points.target_quantity} color="#3B82F6" animate={{ type: "timing", duration: 600 }} />
                                    </BarGroup>

                                    {points.achieved_quantity.map((p, i) => (
                                        p.yValue > 0 && <SkiaText key={`ach-${i}`} x={p.x - 20} y={p.y - 8} text={p.yValue.toString()} font={font} color={colors.textSecondary} />
                                    ))}
                                    {points.target_quantity.map((p, i) => (
                                        p.yValue > 0 && <SkiaText key={`tgt-${i}`} x={p.x + 4} y={p.y - 8} text={p.yValue.toString()} font={font} color={colors.textSecondary} />
                                    ))}
                                </>
                            )}
                        </CartesianChart>
                    </View>
                </ScrollView>
            )}

            {/* Searchable Dealer Modal */}
            <Modal visible={isDropdownOpen} animationType="slide" transparent={true} onRequestClose={() => setIsDropdownOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '75%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Dealer</Text>
                            <TouchableOpacity onPress={() => setIsDropdownOpen(false)}>
                                <Feather name="x" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16 }}>
                            <Feather name="search" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                            <TextInput
                                placeholder="Search dealer..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                style={{ flex: 1, fontSize: 14, fontFamily: typography.medium, color: colors.text, padding: 0 }}
                                placeholderTextColor={colors.muted}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery("")}>
                                    <Feather name="x-circle" size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {filteredDealers.map(dealer => (
                                <TouchableOpacity
                                    key={dealer}
                                    style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                                    onPress={() => {
                                        setSelectedDealer(dealer);
                                        setIsDropdownOpen(false);
                                        setSearchQuery("");
                                    }}
                                >
                                    <Text style={{ fontSize: 14, fontFamily: typography.medium, color: selectedDealer === dealer ? colors.primary : colors.text }}>
                                        {dealer}
                                    </Text>
                                    {selectedDealer === dealer && <Feather name="check" size={18} color={colors.primary} />}
                                </TouchableOpacity>
                            ))}
                            {filteredDealers.length === 0 && (
                                <Text style={{ textAlign: 'center', marginTop: 20, color: colors.muted, fontFamily: typography.medium }}>No dealers found</Text>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const SalesManagerDetailedTargetChart = ({ data, font }: { data: TargetSeriesItem[], font: any }) => {
    const uniqueManagers = React.useMemo(() => {
        return Array.from(new Set((data || []).map(d => d.name).filter(Boolean))) as string[];
    }, [data]);

    const [selectedManager, setSelectedManager] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    React.useEffect(() => {
        if (uniqueManagers.length > 0 && (!selectedManager || !uniqueManagers.includes(selectedManager))) {
            setSelectedManager(uniqueManagers[0]);
        }
    }, [uniqueManagers, selectedManager]);

    if (!data || data.length === 0 || !font) {
        return (
            <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                    <Text allowFontScaling={false} style={styles.chartTitle}>SM Monthly Target vs Achieved</Text>
                </View>
                <EmptyChartState icon="users" />
            </View>
        );
    }

    const chartData = data.filter(d => d.name === selectedManager);
    const filteredManagers = uniqueManagers.filter(d => d.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
                <Text allowFontScaling={false} style={styles.chartTitle}>SM Monthly Target vs Achieved</Text>
                <View style={styles.chartLegendRow}>
                    <View style={[styles.legendDot, { backgroundColor: "#F97316" }]} />
                    <Text style={styles.legendText}>Achieved</Text>
                    <View style={[styles.legendDot, { backgroundColor: "#3B82F6", marginLeft: 12 }]} />
                    <Text style={styles.legendText}>Target</Text>
                </View>
            </View>

            {/* Dropdown Trigger */}
            {uniqueManagers.length > 0 && (
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, marginBottom: 16 }}
                    onPress={() => setIsDropdownOpen(true)}
                >
                    <Text style={{ fontSize: 13, fontFamily: typography.medium, color: colors.text }} numberOfLines={1}>
                        {selectedManager || "Select Sales Manager"}
                    </Text>
                    <Feather name="chevron-down" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
            )}

            {chartData.length === 0 ? (
                <EmptyChartState icon="bar-chart-2" />
            ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{ height: 300, width: Math.max(350, chartData.length * 80) }}>
                        <CartesianChart
                            data={chartData}
                            xKey="month"
                            yKeys={["achieved_quantity", "target_quantity"]}
                            domainPadding={{ left: 30, right: 30, top: 40 }}
                            axisOptions={{
                                font,
                                tickCount: chartData.length > 0 ? chartData.length : 1, // Fixes the skipping months issue
                                lineColor: colors.border,
                                labelColor: colors.textSecondary,
                            }}
                        >
                            {({ points, chartBounds }) => (
                                <>
                                    <BarGroup chartBounds={chartBounds} betweenGroupPadding={0.3} withinGroupPadding={0.1}>
                                        <BarGroup.Bar points={points.achieved_quantity} color="#F97316" animate={{ type: "timing", duration: 600 }} />
                                        <BarGroup.Bar points={points.target_quantity} color="#3B82F6" animate={{ type: "timing", duration: 600 }} />
                                    </BarGroup>

                                    {points.achieved_quantity.map((p, i) => (
                                        p.yValue > 0 && <SkiaText key={`ach-${i}`} x={p.x - 12} y={p.y - 8} text={p.yValue.toString()} font={font} color={colors.textSecondary} />
                                    ))}
                                    {points.target_quantity.map((p, i) => (
                                        p.yValue > 0 && <SkiaText key={`tgt-${i}`} x={p.x + 4} y={p.y - 8} text={p.yValue.toString()} font={font} color={colors.textSecondary} />
                                    ))}
                                </>
                            )}
                        </CartesianChart>
                    </View>
                </ScrollView>
            )}

            {/* Searchable Sales Manager Modal */}
            <Modal visible={isDropdownOpen} animationType="slide" transparent={true} onRequestClose={() => setIsDropdownOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '75%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Sales Manager</Text>
                            <TouchableOpacity onPress={() => setIsDropdownOpen(false)}>
                                <Feather name="x" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16 }}>
                            <Feather name="search" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                            <TextInput
                                placeholder="Search manager..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                style={{ flex: 1, fontSize: 14, fontFamily: typography.medium, color: colors.text, padding: 0 }}
                                placeholderTextColor={colors.muted}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery("")}>
                                    <Feather name="x-circle" size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {filteredManagers.map(manager => (
                                <TouchableOpacity
                                    key={manager}
                                    style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                                    onPress={() => {
                                        setSelectedManager(manager);
                                        setIsDropdownOpen(false);
                                        setSearchQuery("");
                                    }}
                                >
                                    <Text style={{ fontSize: 14, fontFamily: typography.medium, color: selectedManager === manager ? colors.primary : colors.text }}>
                                        {manager}
                                    </Text>
                                    {selectedManager === manager && <Feather name="check" size={18} color={colors.primary} />}
                                </TouchableOpacity>
                            ))}
                            {filteredManagers.length === 0 && (
                                <Text style={{ textAlign: 'center', marginTop: 20, color: colors.muted, fontFamily: typography.medium }}>No managers found</Text>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};


const FilteredSalesManagerLeadTable = ({ data }: { data: SalesManagerLeadCount[] }) => {
    const uniqueManagers = React.useMemo(() => {
        return Array.from(new Set((data || []).map(d => d.employee_name).filter(Boolean))) as string[];
    }, [data]);

    const [selectedManager, setSelectedManager] = useState<string | null>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const insets = useSafeAreaInsets()

    React.useEffect(() => {
        if (uniqueManagers.length > 0 && (!selectedManager || !uniqueManagers.includes(selectedManager))) {
            setSelectedManager(uniqueManagers[0]);
        }
    }, [uniqueManagers, selectedManager]);

    if (!data || data.length === 0) {
        return (
            <View style={styles.chartCard}>
                <View style={styles.chartHeader}>
                    <Text allowFontScaling={false} style={styles.chartTitle}>Lead Queries by Sales Manager</Text>
                </View>
                <EmptyChartState icon="list" />
            </View>
        );
    }

    const tableData = data.filter(d => d.employee_name === selectedManager);
    const filteredManagers = uniqueManagers.filter(d => d.toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
                <Text allowFontScaling={false} style={styles.chartTitle}>Lead Queries by Sales Manager</Text>
            </View>

            {/* Dropdown Trigger */}
            {uniqueManagers.length > 0 && (
                <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, marginBottom: 16 }}
                    onPress={() => setIsDropdownOpen(true)}
                >
                    <Text style={{ fontSize: 13, fontFamily: typography.medium, color: colors.text }} numberOfLines={1}>
                        {selectedManager || "Select Sales Manager"}
                    </Text>
                    <Feather name="chevron-down" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
            )}

            {/* Filtered Data Table */}
            {tableData.length === 0 ? (
                <EmptyChartState icon="list" />
            ) : (
                <View>
                    <View style={styles.tableHeaderRow}>
                        <Text style={[styles.tableHeaderText, { flex: 1 }]}>MONTH</Text>
                        <Text style={[styles.tableHeaderText, { flex: 1.2 }]}>FINANCIAL YEAR</Text>
                        <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>LEAD COUNT</Text>
                    </View>
                    {tableData.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={[styles.tableCellText, { flex: 1 }]} numberOfLines={1}>{item.month_name}</Text>
                            <Text style={[styles.tableCellText, { flex: 1.2 }]} numberOfLines={1}>{item.financial_year}</Text>
                            <Text style={[styles.tableCellText, { flex: 1, textAlign: 'right' }]} numberOfLines={1}>{item.lead_count ?? "-"}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Searchable Sales Manager Modal */}
            <Modal visible={isDropdownOpen} animationType="slide" transparent={true} onRequestClose={() => setIsDropdownOpen(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { height: '75%', paddingBottom: insets.bottom }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Select Sales Manager</Text>
                            <TouchableOpacity onPress={() => setIsDropdownOpen(false)}>
                                <Feather name="x" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16 }}>
                            <Feather name="search" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                            <TextInput
                                placeholder="Search manager..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                style={{ flex: 1, fontSize: 14, fontFamily: typography.medium, color: colors.text, padding: 0 }}
                                placeholderTextColor={colors.muted}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery("")}>
                                    <Feather name="x-circle" size={16} color={colors.textSecondary} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {filteredManagers.map(manager => (
                                <TouchableOpacity
                                    key={manager}
                                    style={{ paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                                    onPress={() => {
                                        setSelectedManager(manager);
                                        setIsDropdownOpen(false);
                                        setSearchQuery("");
                                    }}
                                >
                                    <Text style={{ fontSize: 14, fontFamily: typography.medium, color: selectedManager === manager ? colors.primary : colors.text }}>
                                        {manager}
                                    </Text>
                                    {selectedManager === manager && <Feather name="check" size={18} color={colors.primary} />}
                                </TouchableOpacity>
                            ))}
                            {filteredManagers.length === 0 && (
                                <Text style={{ textAlign: 'center', marginTop: 20, color: colors.muted, fontFamily: typography.medium }}>No managers found</Text>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export const DashboardScreen = () => {
    const [animatedCharts, setAnimatedCharts] = useState<Record<string, TargetSeriesItem[]>>({});
    const { user } = useAuth();

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
                        <Text style={styles.headerTitle}>Welcome, {user?.name}</Text>
                        <Text style={styles.headerSubtitle}>{user?.authority}</Text>
                        <Text style={styles.currentYear}>{getSubtitle()}</Text>
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
                        <TouchableOpacity onPress={() => router.push("/profile")} style={[styles.headerBtn, { borderColor: colors.primary, borderWidth: 1.5 }]}>
                            <Feather name="user" size={16} color={colors.primary} />
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
                                    return <React.Fragment key={cfg.id}>{cfg.render(cfg.getValue(data!), font)}</React.Fragment>;
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

    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.md },
    headerTitle: { fontSize: txtSize.body, fontFamily: typography.bold, color: colors.text },
    headerSubtitle: { fontSize: txtSize.small, fontFamily: typography.semibold, color: colors.textSecondary, marginTop: 2 },
    currentYear: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.textSecondary, marginTop: 2 },
    headerActions: { flexDirection: "row", gap: spacing.sm },
    headerBtn: { padding: 10, backgroundColor: colors.white, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.border },

    kpiGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
    kpiCard: { width: "48%", backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
    kpiTitle: { fontSize: 11, fontFamily: typography.medium, color: colors.textSecondary, marginBottom: 8 },
    kpiValue: { fontSize: 18, fontFamily: typography.bold, color: colors.text },

    chartCard: { backgroundColor: colors.white, padding: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg, minHeight: 200 },
    chartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg },
    chartTitle: { fontSize: txtSize.xs, fontFamily: typography.bold, color: colors.text },
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

    modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.16)", justifyContent: "flex-end" },
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
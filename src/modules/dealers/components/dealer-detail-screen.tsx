import { PdfViewerModal } from "@/components/shared/pdf-viewer-modal";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { ArCreditMemoDetailModal } from "@/modules/dealers/components/ar-credit-memo-detail-modal";
import { InvoiceDetailModal } from "@/modules/dealers/components/invoice-detail-modal";
import { LrDetailsModal } from "@/modules/dealers/components/lr-details-modal";
import { PendingOrderDetailModal } from "@/modules/dealers/components/pending-order-detail-modal";
import { ProformaInvoiceDetailModal } from "@/modules/dealers/components/proforma-invoice-detail-modal";
import { fetchDealerArCreditMemos } from "@/modules/dealers/services/dealer-ar-credit-memo.api";
import { fetchDealerArInvoices } from "@/modules/dealers/services/dealer-ar-invoice.api";
import { fetchDealerLedger } from "@/modules/dealers/services/dealer-ledger.api";
import { fetchDealerPendingOrders } from "@/modules/dealers/services/dealer-pending-orders.api";
import { fetchDealerProformaInvoices } from "@/modules/dealers/services/dealer-proforma-invoice.api";
import { fetchDealerTargetAchievement } from "@/modules/dealers/services/dealer-target-achievement.api";
import { fetchDealers } from "@/modules/dealers/services/dealers.api";
import { ArCreditMemo, ArInvoice, PendingOrder, ProformaInvoice } from "@/modules/dealers/types";
import { openInvoicePdf } from "@/modules/dealers/utils/open-invoice-pdf";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const TABS = [
  { key: "pendingOrders", label: "Pending Orders" },
  { key: "proformaInvoice", label: "Proforma Invoice" },
  { key: "arInvoice", label: "AR Invoice" },
  { key: "arCreditMemo", label: "AR Credit Memo" },
  { key: "ledgerSummary", label: "Ledger Summary" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

type LedgerEntry = {
  Origin: string;
  OriginDocEntry: string;
  Ref3: string;
  OriginNo: string;
  CreditLC: number;
  OffsetAccount: string;
  Details: string;
  DebitLC: number;
  PostingDate: string;
  CumulativeBalanceLC: number;
  Branch: string;
  Ref1: string;
  Ref2: string;
  BalanceDueLC: number;
};

type LedgerResponse = {
  TotalDebitLC: number;
  CardName: string;
  TotalCumulativeBalanceLC: number;
  AccountBalance: LedgerEntry[];
  CardCode: string;
  AccBalance: string | number;
  TotalBalanceDueLC: number;
  TotalCreditLC: number;
};

const PAGE_SIZE = 10;

const MONTH_NAMES = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sept",
  "oct",
  "nov",
  "dec",
];

const formatDateFromParts = (year: number, monthIndex: number, day: number) => {
  if (!year || monthIndex < 0 || monthIndex > 11 || !day || day < 1 || day > 31) {
    return "-";
  }
  return `${day} ${MONTH_NAMES[monthIndex]} ${year}`;
};

const formatDate = (value: string | null | undefined) => {
  const text = String(value ?? "").trim();
  if (!text) return "-";

  const withoutTime = text
    .split("T")[0]
    .replace(/\s+\d{1,2}:\d{2}(:\d{2})?(\.\d+)?(\s?(AM|PM))?$/i, "")
    .trim();

  const ymd = withoutTime.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (ymd) {
    const [, year, month, day] = ymd;
    return formatDateFromParts(Number(year), Number(month) - 1, Number(day));
  }

  const d = new Date(withoutTime);
  if (isNaN(d.getTime())) return withoutTime;

  return formatDateFromParts(d.getFullYear(), d.getMonth(), d.getDate());
};

const formatPickerDate = (d: Date) => {
  return formatDateFromParts(d.getFullYear(), d.getMonth(), d.getDate());
};

const toApiDateString = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatCurrency = (val: number | string | null | undefined) => {
  if (val === null || val === undefined) return "0.00";
  
  // Remove commas if it's a string, then convert to a Number
  const cleanValue = typeof val === "string" ? val.replace(/,/g, "") : val;
  const num = Number(cleanValue);
  
  return (isNaN(num) ? 0 : num).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const pick = (obj: any, keys: string[]): any => {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null && obj?.[k] !== "") {
      return obj[k];
    }
  }
  return undefined;
};

const DOC_NO_KEYS = [
  "salesorderno",
  "arcreditmemono",
  "proformano",
  "invoiceno",
  "invoice_number",
  "creditno",
  "DocNum",
  "docNum",
  "OrderNo",
  "ProformaNo",
  "InvoiceNo",
  "CreditNo",
  "DocEntry",
];

const CARD_CODE_KEYS = ["customer_code", "CardCode", "cardCode", "ClientCode"];
const CARD_NAME_KEYS = ["customer_name", "CardName", "cardName", "ClientName"];
const DATE_KEYS = [
  "document_date",
  "posting_date",
  "delivery_date",
  "DocDate",
  "docDate",
  "OrderDate",
  "ProformaDate",
  "InvoiceDate",
  "PostingDate",
];
const STATUS_KEYS = [
  "portal_status",
  "doc_status",
  "status",
  "invoice_status",
  "DocumentStatus",
  "Status",
  "u_DealerStatus",
  "U_DealerStatus",
  "DealerStatus",
];
const AMOUNT_KEYS = ["doc_total", "DocTotal", "docTotal", "Amount", "TotalAmount"];
const ITEMS_ARRAY_KEYS = ["items", "documentLines", "DocumentLines"];

const getStatusStyle = (status: string) => {
  const normalized = (status || "").toLowerCase();
  if (normalized.includes("open") || normalized.includes("pending")) {
    return { bg: "#FFFBEB", text: "#B45309" };
  }
  if (normalized.includes("close") || normalized.includes("approved") || normalized.includes("paid")) {
    return { bg: "#F0FDF4", text: colors.success };
  }
  if (normalized.includes("cancel") || normalized.includes("reject")) {
    return { bg: "#FEF2F2", text: colors.error };
  }
  return { bg: colors.surface, text: colors.textSecondary };
};

const getQtyFromItems = (obj: any): number | undefined => {
  for (const key of ITEMS_ARRAY_KEYS) {
    const arr = obj?.[key];
    if (Array.isArray(arr) && arr.length > 0) {
      return arr.reduce((sum: number, line: any) => sum + (Number(line.Quantity) || 0), 0);
    }
  }
  return undefined;
};

const matchesDocSearch = (item: any, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const docNo = String(pick(item, DOC_NO_KEYS) ?? "").toLowerCase();
  const cardName = String(pick(item, CARD_NAME_KEYS) ?? "").toLowerCase();
  const cardCode = String(pick(item, CARD_CODE_KEYS) ?? "").toLowerCase();
  return docNo.includes(q) || cardName.includes(q) || cardCode.includes(q);
};

const paginateClientArray = <T,>(items: T[], page: number, size: number) => {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / size));
  const safePage = Math.min(page, totalPages - 1);
  const start = safePage * size;
  const pageItems = items.slice(start, start + size);
  const rangeStart = totalItems === 0 ? 0 : start + 1;
  const rangeEnd = Math.min(totalItems, start + pageItems.length);
  return { pageItems, totalItems, totalPages, safePage, rangeStart, rangeEnd };
};

const TabSearchBox = ({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}) => (
  <View style={styles.docSearchBox}>
    <Feather name="search" size={14} color={colors.muted} />
    <TextInput
      style={styles.docSearchInput}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      value={value}
      onChangeText={onChangeText}
      returnKeyType="search"
    />
    {value.length > 0 && (
      <TouchableOpacity onPress={() => onChangeText("")} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
        <Feather name="x" size={14} color={colors.muted} />
      </TouchableOpacity>
    )}
  </View>
);

type GenericDocCardProps = {
  item: any;
  docPrefix: string;
  onView?: (item: any) => void;
  onViewLR?: (item: any) => void;
  onViewPdf?: (item: any) => void;
  pdfLoading?: boolean;
};

const GenericDocCard = ({ item, docPrefix, onView, onViewLR, onViewPdf, pdfLoading }: GenericDocCardProps) => {
  const docNo = pick(item, DOC_NO_KEYS);
  const cardName = pick(item, CARD_NAME_KEYS);
  const cardCode = pick(item, CARD_CODE_KEYS);
  const date = pick(item, DATE_KEYS);
  const status = pick(item, STATUS_KEYS);
  const rawAmount = pick(item, AMOUNT_KEYS);
  const amount = rawAmount !== undefined ? Number(rawAmount) : undefined;
  const qty = getQtyFromItems(item);
  const statusStyle = getStatusStyle(status);

  return (
    <View style={styles.ledgerCard}>
      <View style={styles.ledgerCardTop}>
        <Text style={styles.ledgerDocName} numberOfLines={1}>
          {docPrefix}
          {docNo ?? "-"}
        </Text>
        <View style={styles.ledgerCardTopRight}>
          {status && (
            <View style={[styles.ledgerTypeBadge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.ledgerTypeBadgeText, { color: statusStyle.text }]}>{status}</Text>
            </View>
          )}
          {onView && (
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => onView(item)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Feather name="eye" size={15} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          {onViewPdf && (
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => onViewPdf(item)}
              disabled={pdfLoading}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              {pdfLoading ? (
                <ActivityIndicator size="small" color={colors.textSecondary} />
              ) : (
                <Feather name="file-text" size={15} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          )}
          {onViewLR && (
            <TouchableOpacity
              style={styles.viewButton}
              onPress={() => onViewLR(item)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Feather name="truck" size={15} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {(cardName || cardCode) && (
        <Text style={styles.ledgerDetails} numberOfLines={1}>
          {cardName}
          {cardCode ? ` (${cardCode})` : ""}
        </Text>
      )}

      <View style={styles.ledgerDivider} />

      <View style={styles.ledgerInfoRow}>
        <View style={styles.ledgerInfoBlock}>
          <Text style={styles.ledgerInfoLabel}>Date</Text>
          <Text style={styles.ledgerInfoValue}>{date ? formatDate(date) : "-"}</Text>
        </View>
        {qty !== undefined && (
          <View style={styles.ledgerInfoBlock}>
            <Text style={styles.ledgerInfoLabel}>Qty</Text>
            <Text style={styles.ledgerInfoValue}>{qty}</Text>
          </View>
        )}
      </View>

      {amount !== undefined && !isNaN(amount) && (
        <View style={styles.ledgerBalanceRow}>
          <Text style={styles.ledgerBalanceLabel}>Amount</Text>
          <Text style={styles.ledgerBalanceValue}>Rs. {formatCurrency(amount)}</Text>
        </View>
      )}
    </View>
  );
};

export default function DealerDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { cardCode } = useLocalSearchParams<{ cardCode: string }>();

  const [activeTab, setActiveTab] = useState<TabKey>("pendingOrders");
  const [selectedInvoice, setSelectedInvoice] = useState<ArInvoice | null>(null);
  const [selectedLrInvoice, setSelectedLrInvoice] = useState<ArInvoice | null>(null);
  const [selectedPendingOrder, setSelectedPendingOrder] = useState<PendingOrder | null>(null);
  const [selectedProforma, setSelectedProforma] = useState<ProformaInvoice | null>(null);
  const [selectedCreditMemo, setSelectedCreditMemo] = useState<ArCreditMemo | null>(null);
  const [pdfLoadingId, setPdfLoadingId] = useState<number | null>(null);
  const [pdfUri, setPdfUri] = useState<string | null>(null);

    const [invoicePage, setInvoicePage] = useState(0);
  const [pendingOrdersPage, setPendingOrdersPage] = useState(0);
  const [proformaPage, setProformaPage] = useState(0);
  const [creditMemoPage, setCreditMemoPage] = useState(0);
  const [ledgerPage, setLedgerPage] = useState(0);

  const [pendingOrdersSearch, setPendingOrdersSearch] = useState("");
  const [proformaSearch, setProformaSearch] = useState("");
  const [arInvoiceSearch, setArInvoiceSearch] = useState("");
  const [creditMemoSearch, setCreditMemoSearch] = useState("");

  const [ledgerFromDate, setLedgerFromDate] = useState<Date | null>(null);
  const [ledgerToDate, setLedgerToDate] = useState<Date | null>(null);
  const [appliedLedgerFromDate, setAppliedLedgerFromDate] = useState<string | undefined>(undefined);
  const [appliedLedgerToDate, setAppliedLedgerToDate] = useState<string | undefined>(undefined);
  const [activeDatePicker, setActiveDatePicker] =
    useState<"from" | "to" | null>(null);
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState("");
  const [ledgerPdfLoadingIdx, setLedgerPdfLoadingIdx] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["dealers"],
    queryFn: fetchDealers,
  });

  const dealer = data?.find((d) => d.cardCode === cardCode);

  const ledgerQuery = useQuery<LedgerResponse>({
    queryKey: ["dealer-ledger", cardCode, appliedLedgerFromDate, appliedLedgerToDate],
    queryFn: () => fetchDealerLedger(cardCode, appliedLedgerFromDate, appliedLedgerToDate),
    enabled: !!cardCode,
  });

  const pendingOrdersQuery = useQuery({
    queryKey: ["dealer-pending-orders", cardCode],
    queryFn: () => fetchDealerPendingOrders(cardCode),
    enabled: !!cardCode,
  });

  const proformaInvoiceQuery = useQuery({
    queryKey: ["dealer-proforma-invoice", cardCode],
    queryFn: () => fetchDealerProformaInvoices(cardCode),
    enabled: !!cardCode,
  });

  const arInvoiceQuery = useQuery({
    queryKey: ["dealer-ar-invoice", cardCode, invoicePage, PAGE_SIZE],
    queryFn: () => fetchDealerArInvoices(cardCode, invoicePage, PAGE_SIZE),
    enabled: !!cardCode,
  });

  const arCreditMemoQuery = useQuery({
    queryKey: ["dealer-ar-credit-memo", cardCode],
    queryFn: () => fetchDealerArCreditMemos(cardCode),
    enabled: !!cardCode,
  });

  const summaryQuery = useQuery({
    queryKey: ["dealer-target-achievement", cardCode],
    queryFn: () => fetchDealerTargetAchievement(cardCode),
    enabled: !!cardCode,
  });

  const summary = summaryQuery.data;
  const summaryLoading = summaryQuery.isLoading;

  const handleViewPdf = async (invoice: ArInvoice) => {
    try {
      setPdfLoadingId(invoice.id);
      const uri = await openInvoicePdf(invoice.invoice_doc_entry, invoice.invoice_number);
      setPdfUri(uri);
    } catch (err) {
      Alert.alert("Couldn't open invoice", "The invoice PDF couldn't be downloaded. Please try again.");
    } finally {
      setPdfLoadingId(null);
    }
  };

    const handleLedgerViewPdf = async (entry: LedgerEntry, idx: number) => {
    if (!entry.OriginDocEntry) {
      Alert.alert("Invoice unavailable", "No invoice is linked to this entry.");
      return;
    }
    try {
      setLedgerPdfLoadingIdx(idx);
      const uri = await openInvoicePdf(entry.OriginDocEntry, entry.OriginNo);
      setPdfUri(uri);
    } catch (err) {
      Alert.alert("Couldn't open invoice", "The invoice PDF couldn't be downloaded. Please try again.");
    } finally {
      setLedgerPdfLoadingIdx(null);
    }
  };

  const handleLedgerSearch = () => {
    setAppliedLedgerFromDate(ledgerFromDate ? toApiDateString(ledgerFromDate) : undefined);
    setAppliedLedgerToDate(ledgerToDate ? toApiDateString(ledgerToDate) : undefined);
    setLedgerPage(0);
  };

    const handleLedgerReset = () => {
    setLedgerFromDate(null);
    setLedgerToDate(null);
    setAppliedLedgerFromDate(undefined);
    setAppliedLedgerToDate(undefined);
    setLedgerSearchQuery("");
    setLedgerPage(0);
  };

   const STAT_CARDS = [
    { key: "pendingOrders", label: "Pending Orders", icon: "shopping-cart", bg: "#DBEAFE", iconColor: "#2563EB", value: summary ? summary.pending_order_count : null, amount: summary ? summary.pending_order_amount : null },
    { key: "proformaInvoices", label: "Proforma Invoices", icon: "file-text", bg: "#EDE9FE", iconColor: "#7C3AED", value: summary ? summary.performa_invoice_count : null, amount: summary ? summary.performa_invoice_amount : null },
    { key: "arInvoices", label: "AR Invoices", icon: "check-circle", bg: "#DCFCE7", iconColor: "#16A34A", value: summary ? summary.ar_invoice_count : null, amount: summary ? summary.ar_invoice_amount : null },
    { key: "arCreditMemos", label: "AR Credit Memos", icon: "rotate-ccw", bg: "#FEE2E2", iconColor: "#DC2626", value: summary ? summary.ar_credit_count : null, amount: summary ? summary.ar_credit_amount : null },
    { key: "targetAssigned", label: "Target Assigned", icon: "target", bg: "#FEF3C7", iconColor: "#D97706", value: summary ? summary.target_assigned_quantity : null, amount: null },
    { key: "achievement", label: "Achievement", icon: "award", bg: "#FFEDD5", iconColor: "#EA580C", value: summary ? summary.achievement_quantity : null, amount: null },
  ] as const;

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.centerBox}>
          <Text style={styles.text}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!dealer) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
        <View style={styles.centerBox}>
          <Feather name="alert-circle" size={40} color={colors.muted} />
          <Text style={styles.text}>Dealer not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isActive = dealer.portalStatus === "Yes" && dealer.lock_status !== 0;
  const arInvoicePageData = arInvoiceQuery.data;
  const arInvoiceItems = arInvoicePageData?.content ?? [];

  const renderArInvoiceTab = () => {
    if (arInvoiceQuery.isLoading) {
      return (
        <View style={styles.tabContentBox}>
          <Text style={styles.tabContentTitle}>Loading...</Text>
        </View>
      );
    }
    if (arInvoiceQuery.isError) {
      return (
        <View style={styles.tabContentBox}>
          <Feather name="alert-triangle" size={26} color={colors.error} />
          <Text style={styles.tabContentTitle}>Couldn't load data</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => arInvoiceQuery.refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
        if (arInvoiceItems.length === 0) {
      return (
        <View style={styles.tabContentBox}>
          <View style={styles.tabContentIconCircle}>
            <Feather name="inbox" size={26} color={colors.muted} />
          </View>
          <Text style={styles.tabContentTitle}>No AR invoices</Text>
        </View>
      );
    }
    const filteredInvoiceItems = arInvoiceItems.filter((item) => matchesDocSearch(item, arInvoiceSearch));
    return (
      <View>
        <TabSearchBox
          value={arInvoiceSearch}
          onChangeText={setArInvoiceSearch}
          placeholder="Search by invoice no, customer name..."
        />
        {filteredInvoiceItems.length === 0 ? (
          <View style={styles.tabContentBox}>
            <View style={styles.tabContentIconCircle}>
              <Feather name="search" size={26} color={colors.muted} />
            </View>
            <Text style={styles.tabContentTitle}>No matching results</Text>
          </View>
        ) : (
          filteredInvoiceItems.map((item, idx) => (
            <GenericDocCard
              key={item.id ?? idx}
              item={item}
              docPrefix="INV-"
              onView={(inv) => setSelectedInvoice(inv as ArInvoice)}
              onViewLR={(inv) => setSelectedLrInvoice(inv as ArInvoice)}
              onViewPdf={(inv) => handleViewPdf(inv as ArInvoice)}
              pdfLoading={pdfLoadingId === (item as ArInvoice).id}
            />
          ))
        )}
      </View>
    );
  };

    const renderClientPaginatedList = (
    query: UseQueryResult<any>,
    docPrefix: string,
    emptyLabel: string,
    page: number,
    onView?: (item: any) => void,
    searchProps?: { value: string; onChangeText: (text: string) => void; placeholder: string },
  ) => {
    if (query.isLoading) {
      return (
        <View style={styles.tabContentBox}>
          <Text style={styles.tabContentTitle}>Loading...</Text>
        </View>
      );
    }
    if (query.isError) {
      return (
        <View style={styles.tabContentBox}>
          <Feather name="alert-triangle" size={26} color={colors.error} />
          <Text style={styles.tabContentTitle}>Couldn't load data</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => query.refetch()}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    const allItems = Array.isArray(query.data) ? query.data : [];
    if (allItems.length === 0) {
      return (
        <View style={styles.tabContentBox}>
          <View style={styles.tabContentIconCircle}>
            <Feather name="inbox" size={26} color={colors.muted} />
          </View>
          <Text style={styles.tabContentTitle}>{emptyLabel}</Text>
        </View>
      );
    }
    const filteredItems = searchProps ? allItems.filter((item) => matchesDocSearch(item, searchProps.value)) : allItems;
    const { pageItems } = paginateClientArray(filteredItems, page, PAGE_SIZE);
    return (
      <View>
        {searchProps && <TabSearchBox {...searchProps} />}
        {filteredItems.length === 0 ? (
          <View style={styles.tabContentBox}>
            <View style={styles.tabContentIconCircle}>
              <Feather name="search" size={26} color={colors.muted} />
            </View>
            <Text style={styles.tabContentTitle}>No matching results</Text>
          </View>
        ) : (
          pageItems.map((item, idx) => (
            <GenericDocCard key={item.id ?? idx} item={item} docPrefix={docPrefix} onView={onView} />
          ))
        )}
      </View>
    );
  };

    const ledgerEntriesAll: LedgerEntry[] = ledgerQuery.data?.AccountBalance ?? [];

  const ledgerEntriesFiltered: LedgerEntry[] = (() => {
    const q = ledgerSearchQuery.trim().toLowerCase();
    if (!q) return ledgerEntriesAll;
    return ledgerEntriesAll.filter((entry) => {
      return (
        String(entry.Details ?? "").toLowerCase().includes(q) ||
        String(entry.Origin ?? "").toLowerCase().includes(q) ||
        String(entry.OriginNo ?? "").toLowerCase().includes(q) ||
        String(entry.Ref1 ?? "").toLowerCase().includes(q) ||
        String(entry.Ref2 ?? "").toLowerCase().includes(q) ||
        String(entry.Ref3 ?? "").toLowerCase().includes(q)
      );
    });
  })();

    const renderLedgerFilterRow = () => (
    <View style={styles.ledgerFilterCard}>
      <View style={styles.ledgerSearchBox}>
        <Feather name="search" size={14} color={colors.muted} />
        <TextInput
          style={styles.ledgerSearchInput}
          placeholder="Search by details, origin or invoice no."
          placeholderTextColor={colors.muted}
          value={ledgerSearchQuery}
          onChangeText={(text) => {
            setLedgerSearchQuery(text);
            setLedgerPage(0);
          }}
          returnKeyType="search"
        />
        {ledgerSearchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setLedgerSearchQuery("");
              setLedgerPage(0);
            }}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Feather name="x" size={14} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.ledgerFilterRow}>
        <TouchableOpacity
          style={styles.dateField}
          onPress={() => setActiveDatePicker("from")}
        >
          <Text style={styles.dateFieldLabel}>From Date</Text>
          <Text style={styles.dateFieldValue}>
            {ledgerFromDate ? formatPickerDate(ledgerFromDate) : "Select date"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dateField}
          onPress={() => setActiveDatePicker("to")}
        >
          <Text style={styles.dateFieldLabel}>To Date</Text>
          <Text style={styles.dateFieldValue}>
            {ledgerToDate ? formatPickerDate(ledgerToDate) : "Select date"}
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.ledgerFilterButtonRow}>
        <TouchableOpacity style={styles.searchButton} onPress={handleLedgerSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resetButton} onPress={handleLedgerReset}>
          <Text style={styles.resetButtonText}>Reset</Text>
        </TouchableOpacity>
      </View>
      {activeDatePicker && (
        <DateTimePicker
          value={
            activeDatePicker === "from"
              ? ledgerFromDate ?? new Date()
              : ledgerToDate ?? new Date()
          }
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          maximumDate={new Date()}
          themeVariant="light"
          onChange={(event, selectedDate) => {
            if (event.type === "dismissed") {
              setActiveDatePicker(null);
              return;
            }

            if (!selectedDate) return;

            if (activeDatePicker === "from") {
              setLedgerFromDate(selectedDate);
            } else {
              setLedgerToDate(selectedDate);
            }

            setActiveDatePicker(null);
          }}
        />
      )}
    </View>
  );

  const renderLedgerTab = () => {
    if (ledgerQuery.isLoading) {
      return (
        <View>
          {renderLedgerFilterRow()}
          <View style={styles.tabContentBox}>
            <Text style={styles.tabContentTitle}>Loading ledger...</Text>
          </View>
        </View>
      );
    }
    if (ledgerQuery.isError) {
      return (
        <View>
          {renderLedgerFilterRow()}
          <View style={styles.tabContentBox}>
            <Feather name="alert-triangle" size={26} color={colors.error} />
            <Text style={styles.tabContentTitle}>Couldn't load ledger</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => ledgerQuery.refetch()}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
       if (ledgerEntriesAll.length === 0) {
      return (
        <View>
          {renderLedgerFilterRow()}
          <View style={styles.tabContentBox}>
            <View style={styles.tabContentIconCircle}>
              <Feather name="inbox" size={26} color={colors.muted} />
            </View>
            <Text style={styles.tabContentTitle}>No ledger entries</Text>
          </View>
        </View>
      );
    }
    if (ledgerEntriesFiltered.length === 0) {
      return (
        <View>
          {renderLedgerFilterRow()}
          <View style={styles.tabContentBox}>
            <View style={styles.tabContentIconCircle}>
              <Feather name="search" size={26} color={colors.muted} />
            </View>
            <Text style={styles.tabContentTitle}>No matching entries</Text>
          </View>
        </View>
      );
    }
    const { pageItems } = paginateClientArray(ledgerEntriesFiltered, ledgerPage, PAGE_SIZE);
    return (
      <View>
        {renderLedgerFilterRow()}
        
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Account Balance</Text>
          <Text style={styles.balanceValue}>
            Rs. {formatCurrency(ledgerQuery.data?.AccBalance ?? 0)}
          </Text>
        </View>

        {pageItems.map((entry, idx) => {
          const invoiceNo = entry.OriginNo || entry.Ref1 || entry.Ref2 || entry.Ref3 || "-";
          const hasInvoice = Boolean(entry.OriginDocEntry);
          return (
            <View key={idx} style={styles.ledgerCard}>
              <View style={styles.ledgerCardTop}>
                <Text style={styles.ledgerDocName} numberOfLines={1}>
                  {entry.Origin || "Entry"}
                </Text>
                <Text style={styles.ledgerDateText}>{formatDate(entry.PostingDate)}</Text>
              </View>
              <Text style={styles.ledgerDetails} numberOfLines={2}>
                {entry.Details}
              </Text>
              <View style={styles.ledgerDivider} />
                            <View style={styles.ledgerAmountsRow}>
                <View style={styles.ledgerAmountBox}>
                  <Text style={styles.ledgerInfoLabel}>Debit</Text>
                  <Text style={styles.ledgerAmountValue} numberOfLines={1} adjustsFontSizeToFit>
                    Rs. {formatCurrency(entry.DebitLC)}
                  </Text>
                </View>
                <View style={styles.ledgerAmountDivider} />
                <View style={styles.ledgerAmountBox}>
                  <Text style={styles.ledgerInfoLabel}>Credit</Text>
                  <Text style={styles.ledgerAmountValue} numberOfLines={1} adjustsFontSizeToFit>
                    Rs. {formatCurrency(entry.CreditLC)}
                  </Text>
                </View>
              </View>
              <View style={styles.ledgerBalanceRow}>
                <Text style={styles.ledgerBalanceLabel}>Cumulative Balance</Text>
                <Text style={styles.ledgerBalanceValue}>
                  Rs. {formatCurrency(entry.CumulativeBalanceLC)}
                </Text>
              </View>
              <View style={styles.ledgerInvoiceRow}>
                    <View style={{ flex: 1 }}>
                  <Text style={styles.ledgerInfoLabel}>Document Number</Text>
                  <Text style={styles.ledgerInfoValue} numberOfLines={1}>
                    {invoiceNo}
                  </Text>
                </View>
                {hasInvoice && (
                  <TouchableOpacity
                    style={styles.viewButton}
                    onPress={() => handleLedgerViewPdf(entry, idx)}
                    disabled={ledgerPdfLoadingIdx === idx}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    {ledgerPdfLoadingIdx === idx ? (
                      <ActivityIndicator size="small" color={colors.textSecondary} />
                    ) : (
                      <Feather name="file-text" size={15} color={colors.textSecondary} />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

    const renderTabContent = () => {
    if (activeTab === "ledgerSummary") return renderLedgerTab();
    if (activeTab === "pendingOrders") {
      return renderClientPaginatedList(
        pendingOrdersQuery,
        "SO-",
        "No pending orders",
        pendingOrdersPage,
        (item) => setSelectedPendingOrder(item as PendingOrder),
        {
          value: pendingOrdersSearch,
          onChangeText: setPendingOrdersSearch,
          placeholder: "Search by order no, customer name...",
        },
      );
    }
    if (activeTab === "proformaInvoice") {
      return renderClientPaginatedList(
        proformaInvoiceQuery,
        "PI-",
        "No proforma invoices",
        proformaPage,
        (item) => setSelectedProforma(item as ProformaInvoice),
        {
          value: proformaSearch,
          onChangeText: setProformaSearch,
          placeholder: "Search by proforma no, customer name...",
        },
      );
    }
    if (activeTab === "arInvoice") return renderArInvoiceTab();
    if (activeTab === "arCreditMemo") {
      return renderClientPaginatedList(
        arCreditMemoQuery,
        "CM-",
        "No AR credit memos",
        creditMemoPage,
        (item) => setSelectedCreditMemo(item as ArCreditMemo),
        {
          value: creditMemoSearch,
          onChangeText: setCreditMemoSearch,
          placeholder: "Search by memo no, customer name...",
        },
      );
    }
    return null;
  };

  type PaginationMeta = {
    page: number;
    setPage: (updater: number | ((p: number) => number)) => void;
    totalItems: number;
    totalPages: number;
    rangeStart: number;
    rangeEnd: number;
  };

    const getActivePaginationMeta = (): PaginationMeta | null => {
    if (activeTab === "pendingOrders") {
      if (pendingOrdersQuery.isLoading || pendingOrdersQuery.isError) return null;
      const items = Array.isArray(pendingOrdersQuery.data) ? pendingOrdersQuery.data : [];
      const filtered = items.filter((item) => matchesDocSearch(item, pendingOrdersSearch));
      if (filtered.length === 0) return null;
      const meta = paginateClientArray(filtered, pendingOrdersPage, PAGE_SIZE);
      return { page: pendingOrdersPage, setPage: setPendingOrdersPage, ...meta };
    }
    if (activeTab === "proformaInvoice") {
      if (proformaInvoiceQuery.isLoading || proformaInvoiceQuery.isError) return null;
      const items = Array.isArray(proformaInvoiceQuery.data) ? proformaInvoiceQuery.data : [];
      const filtered = items.filter((item) => matchesDocSearch(item, proformaSearch));
      if (filtered.length === 0) return null;
      const meta = paginateClientArray(filtered, proformaPage, PAGE_SIZE);
      return { page: proformaPage, setPage: setProformaPage, ...meta };
    }
    if (activeTab === "arCreditMemo") {
      if (arCreditMemoQuery.isLoading || arCreditMemoQuery.isError) return null;
      const items = Array.isArray(arCreditMemoQuery.data) ? arCreditMemoQuery.data : [];
      const filtered = items.filter((item) => matchesDocSearch(item, creditMemoSearch));
      if (filtered.length === 0) return null;
      const meta = paginateClientArray(filtered, creditMemoPage, PAGE_SIZE);
      return { page: creditMemoPage, setPage: setCreditMemoPage, ...meta };
    }
        if (activeTab === "ledgerSummary") {
      if (ledgerQuery.isLoading || ledgerQuery.isError) return null;
      if (ledgerEntriesFiltered.length === 0) return null;
      const meta = paginateClientArray(ledgerEntriesFiltered, ledgerPage, PAGE_SIZE);
      return { page: ledgerPage, setPage: setLedgerPage, ...meta };
    }
    if (activeTab === "arInvoice") {
      if (arInvoiceQuery.isLoading || arInvoiceQuery.isError) return null;
      const filteredInvoiceItems = arInvoiceItems.filter((item) => matchesDocSearch(item, arInvoiceSearch));
      if (filteredInvoiceItems.length === 0) return null;
      const totalPages = arInvoicePageData?.totalPages ?? 1;
      const totalItems = arInvoicePageData?.totalItems ?? arInvoiceItems.length;
      const size = arInvoicePageData?.size || arInvoiceItems.length || PAGE_SIZE;
      const rangeStart = invoicePage * size + 1;
      const rangeEnd = Math.min(totalItems, rangeStart + filteredInvoiceItems.length - 1);
      return { page: invoicePage, setPage: setInvoicePage, totalItems, totalPages, rangeStart, rangeEnd };
    }
    return null;
  };

  const paginationMeta = getActivePaginationMeta();

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock}>
          <View style={styles.nameRow}>
            <Text style={styles.dealerName}>{dealer.cardName}</Text>
            <View style={[styles.statusPill, isActive ? styles.statusPillActive : styles.statusPillInactive]}>
              <Text style={[styles.statusPillText, isActive ? styles.statusTextActive : styles.statusTextInactive]}>
                {isActive ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Feather name="hash" size={12} color={colors.muted} />
              <Text style={styles.infoText}>{dealer.cardCode}</Text>
            </View>
            <TouchableOpacity style={styles.infoItem} onPress={() => Linking.openURL(`tel:${dealer.phone1}`)}>
              <Feather name="phone" size={12} color={colors.muted} />
              <Text style={[styles.infoText, styles.infoTextLink]}>{dealer.phone1}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.infoItem} onPress={() => Linking.openURL(`mailto:${dealer.emailAddress}`)}>
              <Feather name="mail" size={12} color={colors.muted} />
              <Text style={[styles.infoText, styles.infoTextLink]} numberOfLines={1}>
                {dealer.emailAddress}
              </Text>
            </TouchableOpacity>
            <View style={styles.infoItem}>
              <Feather name="user" size={12} color={colors.muted} />
              <Text style={styles.infoText} numberOfLines={1}>
                {dealer.salesManager}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          paginationMeta && { paddingBottom: spacing.xl * 2 },
        ]}
      >
        <View style={styles.statsGrid}>
          {STAT_CARDS.map((stat) => {
            const tabKeyForStat: TabKey | null =
              stat.key === "pendingOrders"
                ? "pendingOrders"
                : stat.key === "proformaInvoices"
                  ? "proformaInvoice"
                  : stat.key === "arInvoices"
                    ? "arInvoice"
                    : stat.key === "arCreditMemos"
                      ? "arCreditMemo"
                      : null;
            const CardWrapper = tabKeyForStat ? TouchableOpacity : View;
            return (
              <CardWrapper
                key={stat.key}
                style={styles.statCard}
                {...(tabKeyForStat
                  ? { onPress: () => setActiveTab(tabKeyForStat), activeOpacity: 0.7 }
                  : {})}
              >
                <View style={[styles.statIconCircle, { backgroundColor: stat.bg }]}>
                  <Feather name={stat.icon as any} size={14} color={stat.iconColor} />
                </View>
                                <Text style={styles.statValue}>
                  {stat.value === null ? (summaryLoading ? "..." : "--") : stat.value}
                </Text>
                <Text style={styles.statLabel} numberOfLines={1}>
                  {stat.label}
                </Text>
                                {stat.amount !== null && (
                  <View style={styles.statAmountBlock}>
                    <Text style={styles.statAmountLabel} numberOfLines={1}>
                      Amount
                    </Text>
                    <Text style={styles.statAmount} numberOfLines={1}>
                      Rs. {formatCurrency(stat.amount)}
                    </Text>
                  </View>
                )}
              </CardWrapper>
            );
          })}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabBar}
          contentContainerStyle={styles.tabBarContent}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, active && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {renderTabContent()}
      </ScrollView>

      {paginationMeta && (
        <View style={[styles.fixedPaginationBar, { paddingBottom: spacing.sm + insets.bottom }]}>
          <Text style={styles.paginationText}>
            Showing {paginationMeta.rangeStart} to {paginationMeta.rangeEnd} of {paginationMeta.totalItems}
          </Text>
          <View style={styles.paginationControls}>
            <TouchableOpacity
              style={[styles.pageButton, paginationMeta.page === 0 && styles.pageButtonDisabled]}
              disabled={paginationMeta.page === 0}
              onPress={() => paginationMeta.setPage(0)}
            >
              <Feather name="chevrons-left" size={15} color={paginationMeta.page === 0 ? colors.muted : colors.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.pageButton, paginationMeta.page === 0 && styles.pageButtonDisabled]}
              disabled={paginationMeta.page === 0}
              onPress={() => paginationMeta.setPage((p) => Math.max(0, p - 1))}
            >
              <Feather name="chevron-left" size={15} color={paginationMeta.page === 0 ? colors.muted : colors.text} />
            </TouchableOpacity>
            <Text style={styles.pageText}>
              {paginationMeta.page + 1} / {paginationMeta.totalPages}
            </Text>
            <TouchableOpacity
              style={[
                styles.pageButton,
                paginationMeta.page >= paginationMeta.totalPages - 1 && styles.pageButtonDisabled,
              ]}
              disabled={paginationMeta.page >= paginationMeta.totalPages - 1}
              onPress={() => paginationMeta.setPage((p) => Math.min(paginationMeta.totalPages - 1, p + 1))}
            >
              <Feather
                name="chevron-right"
                size={15}
                color={paginationMeta.page >= paginationMeta.totalPages - 1 ? colors.muted : colors.text}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.pageButton,
                paginationMeta.page >= paginationMeta.totalPages - 1 && styles.pageButtonDisabled,
              ]}
              disabled={paginationMeta.page >= paginationMeta.totalPages - 1}
              onPress={() => paginationMeta.setPage(paginationMeta.totalPages - 1)}
            >
              <Feather
                name="chevrons-right"
                size={15}
                color={paginationMeta.page >= paginationMeta.totalPages - 1 ? colors.muted : colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <InvoiceDetailModal
        invoice={selectedInvoice}
        visible={selectedInvoice !== null}
        onClose={() => setSelectedInvoice(null)}
      />
      <LrDetailsModal
        invoice={selectedLrInvoice}
        visible={selectedLrInvoice !== null}
        onClose={() => setSelectedLrInvoice(null)}
      />
      <PendingOrderDetailModal
        order={selectedPendingOrder}
        visible={selectedPendingOrder !== null}
        onClose={() => setSelectedPendingOrder(null)}
      />
      <ProformaInvoiceDetailModal
        proforma={selectedProforma}
        visible={selectedProforma !== null}
        onClose={() => setSelectedProforma(null)}
      />
      <ArCreditMemoDetailModal
        memo={selectedCreditMemo}
        visible={selectedCreditMemo !== null}
        onClose={() => setSelectedCreditMemo(null)}
      />
      <PdfViewerModal
        visible={Boolean(pdfUri)}
        uri={pdfUri}
        title="Invoice PDF"
        onClose={() => setPdfUri(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  text: { fontSize: 13, fontFamily: typography.medium, color: colors.text },
  header: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { padding: 4 },
  headerTitleBlock: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  dealerName: { fontSize: 16, fontFamily: typography.bold, color: colors.text },
  statusPill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: radius.xl },
  statusPillActive: { backgroundColor: "#F0FDF4" },
  statusPillInactive: { backgroundColor: colors.surface },
  statusPillText: { fontSize: 10, fontFamily: typography.bold },
  statusTextActive: { color: colors.success },
  statusTextInactive: { color: colors.muted },
  infoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  infoItem: { flexDirection: "row", alignItems: "center", gap: 6, width: "48%" },
  infoText: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, flexShrink: 1 },
  infoTextLink: { color: colors.text, fontFamily: typography.semibold },
  scrollContent: { padding: spacing.md },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.md },
  statCard: { width: "31%", backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, gap: 4 },
  statIconCircle: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  statValue: { fontSize: 16, fontFamily: typography.bold, color: colors.text },
  statLabel: { fontSize: 10, fontFamily: typography.semibold, color: colors.textSecondary },
    statAmount: { fontSize: 10, fontFamily: typography.medium, color: colors.text, marginTop: 1 },
  statAmountBlock: { marginTop: 2 },
  statAmountLabel: { fontSize: 9, fontFamily: typography.medium, color: colors.muted },
  tabBar: { marginBottom: spacing.sm },
  tabBarContent: { gap: 6 },
  tabItem: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.xl, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  tabItemActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: 11, fontFamily: typography.semibold, color: colors.textSecondary },
  tabTextActive: { color: colors.white },
  tabContentBox: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, alignItems: "center", gap: 8 },
  tabContentIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  tabContentTitle: { fontSize: 13, fontFamily: typography.bold, color: colors.text },
  tabContentSubtitle: { fontSize: 11, fontFamily: typography.medium, color: colors.muted, fontStyle: "italic" },
  retryBtn: { marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: radius.sm },
  retryBtnText: { fontSize: 13, fontFamily: typography.bold, color: colors.white },
  balanceCard: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, marginBottom: spacing.md, alignItems: "center" },
  balanceLabel: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, marginBottom: 6 },
  balanceValue: { fontSize: 24, fontFamily: typography.bold, color: colors.primary },
  ledgerCard: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  ledgerCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  ledgerCardTopRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  ledgerDocName: { fontSize: 15, fontFamily: typography.bold, color: colors.text, flex: 1, marginRight: spacing.sm },
  ledgerTypeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.xl },
  ledgerTypeBadgeDebit: { backgroundColor: "#FEF2F2" },
  ledgerTypeBadgeCredit: { backgroundColor: "#F0FDF4" },
  ledgerTypeBadgeText: { fontSize: 11, fontFamily: typography.bold },
  ledgerTypeTextDebit: { color: colors.error },
  ledgerTypeTextCredit: { color: colors.success },
  viewButton: { width: 26, height: 26, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  ledgerDetails: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, lineHeight: 17, marginBottom: spacing.sm },
  ledgerDivider: { height: 1, backgroundColor: colors.border, marginBottom: spacing.sm },
  ledgerInfoRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  ledgerInfoBlock: { flex: 1 },
  ledgerInfoLabel: { fontSize: 11, fontFamily: typography.medium, color: colors.muted, marginBottom: 3 },
  ledgerInfoValue: { fontSize: 13, fontFamily: typography.semibold, color: colors.text },
  ledgerBalanceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  ledgerBalanceLabel: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary },
  ledgerBalanceValue: { fontSize: 14, fontFamily: typography.bold, color: colors.text },
  fixedPaginationBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, paddingHorizontal: spacing.md, paddingTop: spacing.sm, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  paginationText: { flex: 1, fontSize: 11, fontFamily: typography.medium, color: colors.textSecondary },
  paginationControls: { flexDirection: "row", alignItems: "center", gap: 5 },
  pageButton: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.white },
  pageButtonDisabled: { opacity: 0.45 },
  pageText: { minWidth: 40, textAlign: "center", fontSize: 11, fontFamily: typography.semibold, color: colors.text },
  ledgerFilterCard: { backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md, gap: spacing.sm },
  ledgerFilterRow: { flexDirection: "row", gap: spacing.sm },
  dateField: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 8, gap: 2 },
  dateFieldLabel: { fontSize: 10, fontFamily: typography.medium, color: colors.textSecondary },
  dateFieldValue: { fontSize: 13, fontFamily: typography.semibold, color: colors.text },
  ledgerFilterButtonRow: { flexDirection: "row", gap: spacing.sm },
  searchButton: { flex: 1, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.sm, paddingVertical: 10, alignItems: "center" },
  searchButtonText: { fontSize: 13, fontFamily: typography.bold, color: colors.primary },
  resetButton: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingVertical: 10, alignItems: "center", backgroundColor: colors.white },
    resetButtonText: { fontSize: 13, fontFamily: typography.bold, color: colors.text },
    ledgerSearchBox: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  ledgerSearchInput: { flex: 1, fontSize: 13, fontFamily: typography.medium, color: colors.text, paddingVertical: 8 },
  docSearchBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, marginBottom: spacing.md },
  docSearchInput: { flex: 1, fontSize: 13, fontFamily: typography.medium, color: colors.text, paddingVertical: 10 },
  ledgerDateText: { fontSize: 11, fontFamily: typography.medium, color: colors.muted },
  ledgerAmountsRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.sm, marginBottom: spacing.sm },
  ledgerAmountBox: { flex: 1, alignItems: "center", paddingVertical: spacing.sm, paddingHorizontal: 4 },
  ledgerAmountValue: { fontSize: 13, fontFamily: typography.bold, color: colors.text, marginTop: 2 },
  ledgerAmountDivider: { width: 1, alignSelf: "stretch", backgroundColor: colors.border, marginVertical: spacing.xs },
  ledgerInvoiceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
});
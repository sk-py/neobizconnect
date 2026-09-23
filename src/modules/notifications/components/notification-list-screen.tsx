import { colors, radius, spacing, typography, txtSize } from "@/constants/theme";
import { fetchNotifications, NotificationListItem } from "@/modules/notifications/services/notifications-api";
import { Feather } from "@react-native-vector-icons/feather/static";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const TITLE_KEYS = ["title", "Title", "notification_title"];
const MESSAGE_KEYS = ["message", "Message", "body", "description"];
const DATE_KEYS = ["createdDate", "created_date", "CreatedDate", "date", "PostingDate", "created_at"];
const IMAGE_KEYS = ["imageUrl", "image_url", "ImageUrl", "file", "File", "attachment"];

const pick = (obj: any, keys: string[]): any => {
  for (const k of keys) {
    if (obj?.[k] !== undefined && obj?.[k] !== null && obj?.[k] !== "") {
      return obj[k];
    }
  }
  return undefined;
};

const formatDate = (value: string | null | undefined) => {
  const text = String(value ?? "").trim();
  if (!text) return "";
  const d = new Date(text);
  if (isNaN(d.getTime())) return text;
  return d.toLocaleString('en-GB', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: true 
  }).replace(',', '');
};

function NotificationCard({ item }: { item: NotificationListItem }) {
  const title = pick(item, TITLE_KEYS) || "Notification";
  const message = pick(item, MESSAGE_KEYS);
  const date = pick(item, DATE_KEYS);
  const imageUrl = pick(item, IMAGE_KEYS);

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.iconCircle}>
          <Feather name="bell" size={16} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={1}>{title}</Text>
          {date ? <Text style={styles.cardDate}>{formatDate(date)}</Text> : null}
        </View>
      </View>

      {message ? (
        <Text style={styles.cardMessage} numberOfLines={3}>{message}</Text>
      ) : null}

      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.cardImage} contentFit="cover" />
      ) : null}
    </View>
  );
}

export default function NotificationListScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["notifications-list"],
    queryFn: fetchNotifications,
  });

  const items = data ?? [];

  if (isLoading) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.centerText}>Loading...</Text>
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerBox}>
        <Feather name="alert-triangle" size={26} color={colors.error} />
        <Text style={styles.centerText}>Couldn't load notifications</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sent Notifications</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item, idx) => String(item.id ?? idx)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <NotificationCard item={item} />}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.centerBox}>
            <View style={styles.emptyIconCircle}>
              <Feather name="inbox" size={26} color={colors.muted} />
            </View>
            <Text style={styles.centerText}>No notifications sent yet</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  headerTitle: { fontSize: txtSize.body, fontFamily: typography.bold, color: colors.text },
  listContent: { padding: spacing.md, paddingTop: spacing.xl, flexGrow: 1 }, 
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: spacing.xl * 2 },
  centerText: { fontSize: 13, fontFamily: typography.medium, color: colors.text },
  emptyIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  retryBtn: { marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 10, backgroundColor: colors.primary, borderRadius: radius.sm },
  retryBtnText: { fontSize: 13, fontFamily: typography.bold, color: colors.white },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm, marginBottom: spacing.sm },
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEF2F2', alignItems: "center", justifyContent: "center", marginTop: 2 },
  cardTitle: { fontSize: 15, fontFamily: typography.bold, color: colors.text, marginBottom: 2 },
  cardDate: { fontSize: 11, fontFamily: typography.medium, color: colors.muted },
  cardMessage: { fontSize: 13, fontFamily: typography.medium, color: colors.textSecondary, lineHeight: 18, marginTop: spacing.xs },
  cardImage: { width: "100%", height: 140, borderRadius: radius.sm, marginTop: spacing.sm, backgroundColor: colors.surface },
});
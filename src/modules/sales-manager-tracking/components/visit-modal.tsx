import { colors, radius, spacing, typography } from "@/constants/theme";
import { api } from "@/services/axios";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchCurrentLocation } from "../store/tracking.store";
import { AddDistributorForm } from "./add-distributor-form";

type DistributorResponse = {
  visit_location: {
    id: number;
    shop_name: string;
    shop_type: string;
    latitude: string;
    longitude: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    gstin: string;
  };
  distance: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onStartVisit: (distributorId: number, name: string, address: string) => Promise<void>;
};

export const VisitModal = ({ visible, onClose, onStartVisit }: Props) => {
  const [search, setSearch] = useState("");
  const [distributors, setDistributors] = useState<DistributorResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [startingId, setStartingId] = useState<number | null>(null);

  // We will build the Add form in the next step
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (visible && !showAddForm) {
      loadNearbyDistributors();
    }
  }, [visible, showAddForm]);

  const loadNearbyDistributors = async () => {
    setIsLoading(true);
    try {
      const loc = await fetchCurrentLocation();
      const payload = {
        latitude: loc.coords.latitude.toFixed(6),
        longitude: loc.coords.longitude.toFixed(6),
      };

      const res = await api.post("/Visit/Location/Get", payload);
      setDistributors(res.data || []);
    } catch (error) {
      Alert.alert("Fetch Failed", "Could not load nearby distributors. Please check your connection.");
      setDistributors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredDistributors = distributors.filter((d) =>
    d.visit_location.shop_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleStart = async (item: DistributorResponse) => {
    const { id, shop_name, address, city } = item.visit_location;
    const fullAddress = `${address}, ${city}`;
    
    setStartingId(id);
    try {
      await onStartVisit(id, shop_name, fullAddress);
      onClose();
    } catch (error: any) {
      Alert.alert("Start Visit Failed", error.message || "Unable to start visit.");
    } finally {
      setStartingId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Feather name="arrow-left" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{showAddForm ? "Add New Distributor" : "Nearby Distributors"}</Text>
          <View style={{ width: 24 }} />
        </View>

        {!showAddForm ? (
          <View style={styles.content}>
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Feather name="search" size={16} color={colors.muted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search distributors..."
                  placeholderTextColor={colors.muted}
                  value={search}
                  onChangeText={setSearch}
                />
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddForm(true)}>
                <Feather name="plus" size={18} color={colors.white} />
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.centerContent}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Locating nearby distributors...</Text>
              </View>
            ) : filteredDistributors.length === 0 ? (
              <View style={styles.centerContent}>
                <Feather name="map-pin" size={48} color={colors.border} style={{ marginBottom: spacing.md }} />
                <Text style={styles.emptyTitle}>No Distributors Found</Text>
                <Text style={styles.emptyDesc}>
                  There are no registered distributors within your current proximity.
                </Text>
                <TouchableOpacity style={styles.addEmptyBtn} onPress={() => setShowAddForm(true)}>
                  <Text style={styles.addEmptyBtnText}>Add New Distributor</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={filteredDistributors}
                keyExtractor={(item) => item.visit_location.id.toString()}
                contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
                renderItem={({ item }) => (
                  <View style={styles.card}>
                    <View style={styles.cardInfo}>
                      <Text style={styles.shopName}>{item.visit_location.shop_name}</Text>
                      <Text style={styles.shopAddress} numberOfLines={1}>
                        {item.visit_location.address}, {item.visit_location.city}
                      </Text>
                      <View style={styles.distanceBadge}>
                        <Feather name="navigation" size={10} color={colors.primary} />
                        <Text style={styles.distanceText}>{item.distance}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.startBtn}
                      onPress={() => handleStart(item)}
                      disabled={startingId === item.visit_location.id}
                    >
                      {startingId === item.visit_location.id ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Text style={styles.startBtnText}>Start Visit</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        ) : (
          <AddDistributorForm 
            onCancel={() => setShowAddForm(false)} 
            onSuccess={() => {
              setShowAddForm(false);
              loadNearbyDistributors();
            }} 
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 18, fontFamily: typography.bold, color: colors.text },
  content: { flex: 1 },
  searchRow: { flexDirection: "row", padding: spacing.md, gap: spacing.sm, backgroundColor: colors.white },
  searchBox: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.surface, paddingHorizontal: spacing.sm, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, height: 42 },
  searchInput: { flex: 1, fontSize: 13, fontFamily: typography.medium, color: colors.text },
  addBtn: { width: 42, height: 42, backgroundColor: colors.primary, borderRadius: radius.sm, justifyContent: "center", alignItems: "center" },
  
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", padding: spacing.xl },
  loadingText: { marginTop: spacing.md, fontSize: 13, fontFamily: typography.medium, color: colors.muted },
  emptyTitle: { fontSize: 16, fontFamily: typography.bold, color: colors.text, marginBottom: 4 },
  emptyDesc: { fontSize: 13, fontFamily: typography.regular, color: colors.muted, textAlign: "center", marginBottom: spacing.xl },
  addEmptyBtn: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: radius.sm },
  addEmptyBtnText: { color: colors.white, fontFamily: typography.bold, fontSize: 14 },

  card: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  cardInfo: { flex: 1, paddingRight: 8 },
  shopName: { fontSize: 15, fontFamily: typography.bold, color: colors.text },
  shopAddress: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, marginTop: 2, marginBottom: 6 },
  distanceBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EFF6FF", alignSelf: "flex-start", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  distanceText: { fontSize: 10, fontFamily: typography.bold, color: colors.primary },
  startBtn: { backgroundColor: "#EFF6FF", width: 85, height: 34, justifyContent: "center", alignItems: "center", borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary },
  startBtnText: { color: colors.primary, fontSize: 12, fontFamily: typography.bold },
});
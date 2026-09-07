import { colors, radius, spacing, typography } from "@/constants/theme";
import { zodResolver } from "@hookform/resolvers/zod";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { ActiveVisit, Dealer } from "../types";

const MOCK_DEALERS: Dealer[] = [
  { id: "1", name: "Apex Wheel & Tyres", contactPerson: "Rajesh Shah", phone: "9820192831", address: "Shop 4, MIDC, Thane" },
  { id: "2", name: "Galaxy Alloy Studio", contactPerson: "Sunil Verma", phone: "9876543210", address: "Plot 12, Link Road, Andheri" },
];

const dealerSchema = z.object({
  name: z.string().min(1, "Shop name is required"),
  contactPerson: z.string().min(1, "Contact person is required"),
  phone: z.string().length(10, "Phone number must be exactly 10 digits"),
  address: z.string().min(1, "Address is required"),
});

type DealerForm = z.infer<typeof dealerSchema>;

type Props = {
  visible: boolean;
  onClose: () => void;
  onStartVisit: (visit: ActiveVisit) => void;
};

export const VisitModal = ({ visible, onClose, onStartVisit }: Props) => {
  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const { control, handleSubmit, reset } = useForm<DealerForm>({
    resolver: zodResolver(dealerSchema),
    defaultValues: { name: "", contactPerson: "", phone: "", address: "" },
  });

  const filteredDealers = MOCK_DEALERS.filter(
    (d) => d.name.toLowerCase().includes(search.toLowerCase()) || d.contactPerson.toLowerCase().includes(search.toLowerCase())
  );

  const handleStart = (dealer: Dealer) => {
    onStartVisit({
      id: Date.now().toString(),
      dealerId: dealer.id,
      dealerName: dealer.name,
      dealerAddress: dealer.address,
      startTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    });
    onClose();
  };

  const handleCreateDealerDummy = (data: DealerForm) => {
    console.log("[Visit Manager] Dummy Add Dealer Submitted:", data);
    if (Platform.OS === "android") ToastAndroid.show("Dealer added successfully!", ToastAndroid.SHORT);
    reset();
    setShowAddForm(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}><Feather name="arrow-left" size={24} color={colors.text} /></TouchableOpacity>
          <Text style={styles.headerTitle}>{showAddForm ? "Add New Dealer" : "Select Dealer"}</Text>
          <View style={{ width: 24 }} />
        </View>

        {!showAddForm ? (
          <View style={styles.content}>
            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Feather name="search" size={16} color={colors.muted} />
                <TextInput style={styles.searchInput} placeholder="Search dealer..." placeholderTextColor={colors.muted} value={search} onChangeText={setSearch} />
              </View>
              <TouchableOpacity style={styles.addDealerBtn} onPress={() => setShowAddForm(true)}>
                <Feather name="plus" size={18} color={colors.white} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={filteredDealers}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}
              renderItem={({ item }) => (
                <View style={styles.dealerCard}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.dealerName}>{item.name}</Text>
                    <Text style={styles.dealerContact}>{item.contactPerson} • {item.phone}</Text>
                  </View>
                  <TouchableOpacity style={styles.startBtn} onPress={() => handleStart(item)}>
                    <Text style={styles.startBtnText}>Start Visit</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        ) : (
          <View style={styles.formContent}>
            <Controller control={control} name="name" render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Shop Name</Text>
                <TextInput style={[styles.input, error && styles.inputError]} placeholder="e.g. Royal Tyres" value={value} onChangeText={onChange} />
                {error && <Text style={styles.errorText}>{error.message}</Text>}
              </View>
            )} />

            <Controller control={control} name="contactPerson" render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Contact Person</Text>
                <TextInput style={[styles.input, error && styles.inputError]} placeholder="Full Name" value={value} onChangeText={onChange} />
                {error && <Text style={styles.errorText}>{error.message}</Text>}
              </View>
            )} />

            <Controller control={control} name="phone" render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Phone Number</Text>
                <TextInput style={[styles.input, error && styles.inputError]} placeholder="10-digit mobile" keyboardType="numeric" value={value} onChangeText={onChange} />
                {error && <Text style={styles.errorText}>{error.message}</Text>}
              </View>
            )} />

            <Controller control={control} name="address" render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Address</Text>
                <TextInput style={[styles.input, { height: 70 }, error && styles.inputError]} multiline placeholder="Full shop address" value={value} onChangeText={onChange} />
                {error && <Text style={styles.errorText}>{error.message}</Text>}
              </View>
            )} />

            <TouchableOpacity style={styles.submitNewBtn} onPress={handleSubmit(handleCreateDealerDummy)}>
              <Text style={styles.submitNewBtnText}>Save Dealer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { reset(); setShowAddForm(false); }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
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
  addDealerBtn: { width: 42, height: 42, backgroundColor: colors.primary, borderRadius: radius.sm, justifyContent: "center", alignItems: "center" },
  dealerCard: { flexDirection: "row", alignItems: "center", backgroundColor: colors.white, padding: spacing.md, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  dealerName: { fontSize: 15, fontFamily: typography.bold, color: colors.text },
  dealerContact: { fontSize: 12, fontFamily: typography.medium, color: colors.textSecondary, marginTop: 2 },
  startBtn: { backgroundColor: "#EFF6FF", paddingVertical: 8, paddingHorizontal: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.primary },
  startBtnText: { color: colors.primary, fontSize: 12, fontFamily: typography.bold },
  formContent: { padding: spacing.lg },
  fieldGroup: { marginBottom: spacing.md },
  fieldLabel: { fontSize: 13, fontFamily: typography.bold, color: colors.text, marginBottom: 4 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 10, fontSize: 13, fontFamily: typography.medium, color: colors.text },
  inputError: { borderColor: colors.error },
  errorText: { color: colors.error, fontSize: 11, fontFamily: typography.medium, marginTop: 4 },
  submitNewBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: radius.sm, alignItems: "center", marginTop: spacing.sm },
  submitNewBtnText: { color: colors.white, fontSize: 15, fontFamily: typography.bold },
  cancelBtn: { paddingVertical: 12, alignItems: "center", marginTop: spacing.xs },
  cancelBtnText: { color: colors.muted, fontSize: 14, fontFamily: typography.medium },
});
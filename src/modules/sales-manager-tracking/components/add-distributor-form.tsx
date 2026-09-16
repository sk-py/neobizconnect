import { colors, radius, spacing, typography } from "@/constants/theme";
import { zodResolver } from "@hookform/resolvers/zod";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { z } from "zod";
import { useAddDistributorLocation, useExistingDistributors } from "../hooks/use-distributors";
import { ExistingDistributor } from "../types";

const formSchema = z.object({
  shop_name: z.string().min(1, "Shop name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().min(1, "Pincode is required"),
  gstin: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  onCancel: () => void;
  onSuccess: () => void;
};

export const AddDistributorForm = ({ onCancel, onSuccess }: Props) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: existingList = [], isLoading: isLoadingExisting } = useExistingDistributors();
  const { mutate: addDistributor, isPending: isSubmitting } = useAddDistributorLocation();

  const { control, handleSubmit, setValue, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { shop_name: "", address: "", city: "", state: "", pincode: "", gstin: "" },
  });

  const filteredList = existingList.filter(
    (item) =>
      item.shop_name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      searchQuery.trim().length > 0
  );

  const handleSelectExisting = (item: ExistingDistributor) => {
    setValue("shop_name", item.shop_name);
    setValue("address", item.address);
    setValue("city", item.city);
    setValue("state", item.state);
    setValue("pincode", item.pincode);
    setValue("gstin", item.gstin || "");
    setSearchQuery(item.shop_name);
    setShowDropdown(false);
  };

  const onSubmit = (data: FormValues) => {
    Alert.alert(
      "Location Verification",
      "Are you physically present at the distributor's office right now?\n\nYour current GPS coordinates will be permanently locked to this distributor for future visits.",
      [
        { text: "No, cancel", style: "cancel" },
        {
          text: "Yes, I am here",
          style: "default",
          onPress: () => {
            addDistributor(data, {
              onSuccess: () => {
                reset();
                onSuccess();
              },
              onError: (error: any) => {
                Alert.alert("Submission Failed", error?.message || "Could not save the distributor.");
              },
            });
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.warningBox}>
          <Feather name="map-pin" size={16} color={colors.error} />
          <Text style={styles.warningText}>
            You must be at the physical location of the distributor. The coordinates will be locked upon saving.
          </Text>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Shop Name</Text>
          <TextInput
            style={styles.input}
            placeholder={isLoadingExisting ? "Loading existing distributors..." : "Search existing or enter new..."}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setValue("shop_name", text);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
          />
          {showDropdown && filteredList.length > 0 && (
            <View style={styles.dropdown}>
              {filteredList.map((item, index) => (
                <TouchableOpacity
                  key={`${item.shop_name}-${index}`}
                  style={styles.dropdownItem}
                  onPress={() => handleSelectExisting(item)}
                >
                  <Text style={styles.dropdownTitle}>{item.shop_name}</Text>
                  <Text style={styles.dropdownSub}>{item.city}, {item.state}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Address</Text>
              <TextInput
                style={[styles.input, { height: 60 }, error && styles.inputError]}
                multiline
                value={value}
                onChangeText={onChange}
              />
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>
          )}
        />

        <View style={styles.row}>
          <Controller
            control={control}
            name="city"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>City</Text>
                <TextInput style={[styles.input, error && styles.inputError]} value={value} onChangeText={onChange} />
                {error && <Text style={styles.errorText}>{error.message}</Text>}
              </View>
            )}
          />
          <Controller
            control={control}
            name="state"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>State</Text>
                <TextInput style={[styles.input, error && styles.inputError]} value={value} onChangeText={onChange} />
                {error && <Text style={styles.errorText}>{error.message}</Text>}
              </View>
            )}
          />
        </View>

        <View style={styles.row}>
          <Controller
            control={control}
            name="pincode"
            render={({ field: { onChange, value }, fieldState: { error } }) => (
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>Pincode</Text>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  keyboardType="numeric"
                  value={value}
                  onChangeText={onChange}
                />
                {error && <Text style={styles.errorText}>{error.message}</Text>}
              </View>
            )}
          />
          <Controller
            control={control}
            name="gstin"
            render={({ field: { onChange, value } }) => (
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>GSTIN (Optional)</Text>
                <TextInput style={styles.input} autoCapitalize="characters" value={value} onChangeText={onChange} />
              </View>
            )}
          />
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <Text style={styles.submitBtnText}>Save & Lock Coordinates</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={isSubmitting}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  warningBox: { flexDirection: "row", backgroundColor: "#FEF2F2", padding: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.error, marginBottom: spacing.lg, gap: 8 },
  warningText: { flex: 1, color: colors.error, fontSize: 12, fontFamily: typography.medium, lineHeight: 18 },
  fieldGroup: { marginBottom: spacing.md, position: "relative" },
  fieldLabel: { fontSize: 12, fontFamily: typography.bold, color: colors.text, marginBottom: 4 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 10, fontSize: 13, fontFamily: typography.medium, color: colors.text },
  inputError: { borderColor: colors.error },
  errorText: { color: colors.error, fontSize: 11, fontFamily: typography.medium, marginTop: 4 },
  row: { flexDirection: "row", gap: spacing.md },
  dropdown: { position: "absolute", top: 62, left: 0, right: 0, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, maxHeight: 150, zIndex: 10, elevation: 5 },
  dropdownItem: { padding: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  dropdownTitle: { fontSize: 13, fontFamily: typography.bold, color: colors.text },
  dropdownSub: { fontSize: 11, fontFamily: typography.medium, color: colors.muted },
  submitBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: radius.sm, alignItems: "center", marginTop: spacing.sm },
  submitBtnText: { color: colors.white, fontSize: 14, fontFamily: typography.bold },
  cancelBtn: { paddingVertical: 12, alignItems: "center", marginTop: spacing.xs },
  cancelBtnText: { color: colors.muted, fontSize: 14, fontFamily: typography.medium },
});
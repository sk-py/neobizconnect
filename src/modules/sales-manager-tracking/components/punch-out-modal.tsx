import { colors, radius, spacing, typography } from "@/constants/theme";
import { zodResolver } from "@hookform/resolvers/zod";
import { Feather } from "@react-native-vector-icons/feather/static";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { z } from "zod";
import { TransportMode } from "../types";

const checkoutSchema = z.object({
  totalKm: z.string().min(1, "Total KM is required for personal vehicles").refine((val) => !isNaN(Number(val)), { message: "Must be a valid number" }),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

type Props = {
  visible: boolean;
  activeTransport: TransportMode;
  onClose: () => void;
  onConfirmCheckout: (data?: { endOdometerUri: string; totalKm: string }) => void;
};

export const PunchOutModal = ({ visible, activeTransport, onClose, onConfirmCheckout }: Props) => {
  const isPersonalVehicle = activeTransport === "Car (Personal)" || activeTransport === "Bike (Personal)";
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  const { control, handleSubmit, reset } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { totalKm: "" },
  });

  const handleCapture = async () => {
    setCameraError(null);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      setCameraError("Camera permission is required to capture meter.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: true });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleConfirm = (data?: CheckoutForm) => {
    if (isPersonalVehicle) {
      if (!photoUri) {
        setCameraError("Please capture the closing odometer reading.");
        return;
      }
      onConfirmCheckout({ endOdometerUri: photoUri, totalKm: data!.totalKm });
    } else {
      onConfirmCheckout();
    }
    reset();
    setPhotoUri(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.card}>
          <Text style={styles.title}>End Your Day</Text>
          <Text style={styles.desc}>This will stop live tracking and submit your route report.</Text>

          {isPersonalVehicle && (
            <View style={styles.personalBlock}>
              <Text style={styles.label}>End Odometer Photo</Text>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.preview} />
              ) : (
                <TouchableOpacity style={[styles.captureBtn, cameraError && styles.captureErrorBorder]} onPress={handleCapture}>
                  <Feather name="camera" size={20} color={colors.primary} />
                  <Text style={styles.captureBtnText}>Capture Closing Meter</Text>
                </TouchableOpacity>
              )}
              {cameraError && <Text style={styles.errorText}>{cameraError}</Text>}

              <Text style={[styles.label, { marginTop: spacing.sm }]}>Total Distance Traveled (KM)</Text>
              <Controller
                control={control}
                name="totalKm"
                render={({ field: { onChange, value }, fieldState: { error } }) => (
                  <>
                    <TextInput style={[styles.input, error && styles.inputError]} placeholder="e.g. 42.5" keyboardType="numeric" value={value} onChangeText={onChange} />
                    {error && <Text style={styles.errorText}>{error.message}</Text>}
                  </>
                )}
              />
            </View>
          )}

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={isPersonalVehicle ? handleSubmit(handleConfirm) : () => handleConfirm()}>
              <Text style={styles.confirmBtnText}>Confirm Punch Out</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: spacing.md },
  card: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.lg },
  title: { fontSize: 18, fontFamily: typography.bold, color: colors.text },
  desc: { fontSize: 13, fontFamily: typography.medium, color: colors.muted, marginVertical: spacing.sm },
  personalBlock: { marginVertical: spacing.sm },
  label: { fontSize: 12, fontFamily: typography.bold, color: colors.text, marginBottom: 4 },
  captureBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, height: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  captureErrorBorder: { borderColor: colors.error, backgroundColor: "#FEF2F2" },
  captureBtnText: { fontSize: 13, fontFamily: typography.bold, color: colors.primary },
  preview: { width: "100%", height: 110, borderRadius: radius.sm, marginBottom: spacing.xs },
  input: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 10, fontSize: 13, fontFamily: typography.medium, color: colors.text },
  inputError: { borderColor: colors.error },
  errorText: { color: colors.error, fontSize: 11, fontFamily: typography.medium, marginTop: 4 },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  cancelBtnText: { color: colors.text, fontFamily: typography.medium },
  confirmBtn: { flex: 1, backgroundColor: colors.error, paddingVertical: 12, alignItems: "center", borderRadius: radius.sm },
  confirmBtnText: { color: colors.white, fontFamily: typography.bold },
});
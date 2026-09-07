import { colors, radius, spacing, typography } from "@/constants/theme";
import { Feather } from "@react-native-vector-icons/feather/static";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TransportMode } from "../types";

const MODES: TransportMode[] = ["Walking", "Bus", "Train", "Auto", "Car (Personal)", "Bike (Personal)", "Other"];

type Props = {
  visible: boolean;
  currentMode: TransportMode;
  onClose: () => void;
  onSelectMode: (mode: TransportMode, photoUri?: string) => void;
};

export const TransportModal = ({ visible, currentMode, onClose, onSelectMode }: Props) => {
  const [selectedMode, setSelectedMode] = useState<TransportMode>(currentMode);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const isPersonalVehicle = (mode: TransportMode) => mode === "Car (Personal)" || mode === "Bike (Personal)";

  const handleCaptureOdometer = async () => {
    setErrorBanner(null);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      setErrorBanner("Camera permission is required to capture the meter.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true, aspect: [4, 3] });
    if (!result.canceled && result.assets[0]) {
      setIsProcessing(true);
      const manipResult = await ImageManipulator.manipulateAsync(result.assets[0].uri, [{ resize: { width: 1080 } }], { compress: 0.6 });
      setPhotoUri(manipResult.uri);
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (isPersonalVehicle(selectedMode) && !photoUri) {
      setErrorBanner("Odometer photo is required before starting a personal vehicle trip.");
      return;
    }
    setErrorBanner(null);
    onSelectMode(selectedMode, photoUri || undefined);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mode of Transport</Text>
          <TouchableOpacity onPress={onClose}><Feather name="x" size={24} color={colors.text} /></TouchableOpacity>
        </View>

        <View style={styles.body}>
          {errorBanner && (
            <View style={styles.errorBanner}>
              <Feather name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorBannerText}>{errorBanner}</Text>
            </View>
          )}

          <Text style={styles.subtitle}>Select how you are currently traveling:</Text>
          <View style={styles.modesContainer}>
            {MODES.map((mode) => {
              const active = selectedMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeChip, active && styles.modeChipActive]}
                  onPress={() => { setSelectedMode(mode); setErrorBanner(null); if (!isPersonalVehicle(mode)) setPhotoUri(null); }}
                >
                  <Text style={[styles.modeText, active && styles.modeTextActive]}>{mode}</Text>
                  {active && <Feather name="check" size={16} color={colors.white} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {isPersonalVehicle(selectedMode) && (
            <View style={styles.odometerSection}>
              <Text style={styles.odometerTitle}>Odometer Reading (Mandatory)</Text>
              {photoUri ? (
                <View style={styles.imagePreviewWrapper}>
                  <Image source={{ uri: photoUri }} style={styles.previewImage} />
                  <TouchableOpacity style={styles.retakeBtn} onPress={handleCaptureOdometer}>
                    <Feather name="camera" size={14} color={colors.white} />
                    <Text style={styles.retakeBtnText}>Retake</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={[styles.cameraBox, errorBanner && styles.cameraBoxError]} onPress={handleCaptureOdometer} disabled={isProcessing}>
                  {isProcessing ? <ActivityIndicator color={colors.primary} /> : (
                    <>
                      <Feather name="camera" size={32} color={colors.muted} />
                      <Text style={styles.cameraBoxText}>Take Meter Photo</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Text style={styles.confirmBtnText}>Save Transport Mode</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white },
  title: { fontSize: 18, fontFamily: typography.bold, color: colors.text },
  body: { padding: spacing.md, flex: 1 },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF2F2", padding: 12, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.error, marginBottom: spacing.md },
  errorBannerText: { flex: 1, color: colors.error, fontSize: 12, fontFamily: typography.medium },
  subtitle: { fontSize: 13, fontFamily: typography.medium, color: colors.textSecondary, marginBottom: spacing.md },
  modesContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  modeChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  modeChipActive: { backgroundColor: colors.text, borderColor: colors.text },
  modeText: { fontSize: 13, fontFamily: typography.medium, color: colors.text },
  modeTextActive: { color: colors.white, fontFamily: typography.bold },
  odometerSection: { marginTop: spacing.xl, padding: spacing.md, backgroundColor: colors.white, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  odometerTitle: { fontSize: 14, fontFamily: typography.bold, color: colors.text, marginBottom: spacing.sm },
  cameraBox: { height: 120, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed", justifyContent: "center", alignItems: "center", backgroundColor: colors.surface },
  cameraBoxError: { borderColor: colors.error, backgroundColor: "#FEF2F2" },
  cameraBoxText: { marginTop: 6, fontSize: 13, fontFamily: typography.medium, color: colors.muted },
  imagePreviewWrapper: { alignItems: "center", position: "relative" },
  previewImage: { width: "100%", height: 150, borderRadius: radius.sm },
  retakeBtn: { position: "absolute", bottom: 8, right: 8, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,0,0,0.7)", paddingVertical: 6, paddingHorizontal: 12, borderRadius: radius.xl },
  retakeBtnText: { color: colors.white, fontSize: 12, fontFamily: typography.medium },
  footer: { padding: spacing.md, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  confirmBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: radius.sm, alignItems: "center" },
  confirmBtnText: { color: colors.white, fontSize: 15, fontFamily: typography.bold },
});
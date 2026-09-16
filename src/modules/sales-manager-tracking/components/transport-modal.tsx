import { colors, radius, spacing, typography } from "@/constants/theme";
import { Feather } from "@react-native-vector-icons/feather/static";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
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
  onSelectMode: (mode: TransportMode, photoUris?: string[]) => void;
};

export const TransportModal = ({ visible, currentMode, onClose, onSelectMode }: Props) => {
  const [selectedMode, setSelectedMode] = useState<TransportMode>(currentMode);
  const [photoUris, setPhotoUris] = useState<string[]>([]);
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

    // Capture image without cropping or aspect ratio restrictions
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      setIsProcessing(true);
      try {
        // Compress lightly without cropping
        const manipResult = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 1280 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        setPhotoUris((prev) => [...prev, manipResult.uri]);
      } catch (err) {
        setErrorBanner("Failed to process image. Try again.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUris((prev) => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    if (isPersonalVehicle(selectedMode) && photoUris.length === 0) {
      setErrorBanner("At least one odometer reading photo is required.");
      return;
    }
    setErrorBanner(null);
    onSelectMode(selectedMode, isPersonalVehicle(selectedMode) ? photoUris : []);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Mode of Transport</Text>
          <TouchableOpacity onPress={onClose}>
            <Feather name="x" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
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
                  onPress={() => {
                    setSelectedMode(mode);
                    setErrorBanner(null);
                    if (!isPersonalVehicle(mode)) setPhotoUris([]);
                  }}
                >
                  <Text style={[styles.modeText, active && styles.modeTextActive]}>{mode}</Text>
                  {active && <Feather name="check" size={16} color={colors.white} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {isPersonalVehicle(selectedMode) && (
            <View style={styles.odometerSection}>
              <Text style={styles.odometerTitle}>Odometer Reading Photos ({photoUris.length})</Text>

              {photoUris.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbnailList}>
                  {photoUris.map((uri, index) => (
                    <View key={index} style={styles.imageThumbnailWrapper}>
                      <Image source={{ uri }} style={styles.previewThumbnail} />
                      <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemovePhoto(index)}>
                        <Feather name="x" size={12} color={colors.white} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              <TouchableOpacity
                style={[styles.cameraBox, errorBanner && styles.cameraBoxError]}
                onPress={handleCaptureOdometer}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <ActivityIndicator color={colors.primary} />
                ) : (
                  <>
                    <Feather name="camera" size={28} color={colors.muted} />
                    <Text style={styles.cameraBoxText}>
                      {photoUris.length > 0 ? "Add Another Photo" : "Take Meter Photo"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

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
  body: { padding: spacing.md },
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
  thumbnailList: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.sm },
  imageThumbnailWrapper: { position: "relative" },
  previewThumbnail: { width: 90, height: 90, borderRadius: radius.sm },
  removeBtn: { position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" },
  cameraBox: { height: 90, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, borderStyle: "dashed", justifyContent: "center", alignItems: "center", backgroundColor: colors.surface },
  cameraBoxError: { borderColor: colors.error, backgroundColor: "#FEF2F2" },
  cameraBoxText: { marginTop: 4, fontSize: 12, fontFamily: typography.medium, color: colors.muted },
  footer: { padding: spacing.md, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  confirmBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: radius.sm, alignItems: "center" },
  confirmBtnText: { color: colors.white, fontSize: 15, fontFamily: typography.bold },
});
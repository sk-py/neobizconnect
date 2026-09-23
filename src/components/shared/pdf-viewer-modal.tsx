import { colors, radius, spacing, typography } from "@/constants/theme";
import { PdfView } from "@kishannareshpal/expo-pdf";
import { Feather } from "@react-native-vector-icons/feather/static";
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PdfViewerModalProps = {
  visible: boolean;
  uri: string | null;
  title?: string;
  onClose: () => void;
};

export const PdfViewerModal = ({
  visible,
  uri,
  title = "Document Viewer",
  onClose
}: PdfViewerModalProps) => {

  const insets = useSafeAreaInsets();


  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.safeArea, {
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }]} >
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {!uri ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Preparing document...</Text>
            </View>
          ) : (
            <PdfView
              style={styles.pdfView}
              uri={uri}
              onError={(error) => console.error("[PdfViewerModal] Render Error:", error)}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontFamily: typography.bold,
    color: colors.text,
    paddingRight: spacing.md
  },
  closeBtn: {
    padding: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.xl
  },
  content: {
    flex: 1,
    backgroundColor: colors.background
  },
  pdfView: {
    flex: 1
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
    fontFamily: typography.medium,
    color: colors.muted
  }
});
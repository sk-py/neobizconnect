import { colors, radius, spacing, typography } from "@/constants/theme";
import { PdfView } from "@kishannareshpal/expo-pdf";
import Feather from "@react-native-vector-icons/feather/static";
import { Directory, File, Paths } from "expo-file-system";
import * as FileSystemLegacy from "expo-file-system/legacy";
import { scheduleNotificationAsync } from "expo-notifications";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { ActivityIndicator, Alert, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  const [isProcessing, setIsProcessing] = useState(false);
  const [cachedFile, setCachedFile] = useState<File | null>(null);

  // Modern FileSystem API: Downloads and wraps the file in a class instance
  const getLocalFile = async () => {
    if (!uri) return null;

    // If it's already a local file, wrap it in a modern File instance
    if (uri.startsWith("file://")) return new File(uri);

    // Use cached instance if we already downloaded it this session
    if (cachedFile && cachedFile.exists) return cachedFile;

    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `${sanitizedTitle}_${Date.now()}.pdf`;

    // Modern API: Create a dedicated 'pdfs' directory in the cache sandbox
    const cacheDir = new Directory(Paths.cache, 'pdfs');
    if (!cacheDir.exists) {
      cacheDir.create();
    }

    const file = new File(cacheDir, fileName);

    // Download directly into the modern File instance
    await File.downloadFileAsync(uri, file);

    setCachedFile(file);
    return file;
  };

  const handleShare = async () => {
    try {
      setIsProcessing(true);
      const file = await getLocalFile();
      if (!file) throw new Error("No file to share");

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Unavailable", "Sharing is not available on this device");
        return;
      }

      await Sharing.shareAsync(file.uri, {
        mimeType: "application/pdf",
        dialogTitle: `Share ${title}`,
        UTI: "com.adobe.pdf" // Explicitly marks as PDF for Apple frameworks
      });
    } catch (error) {
      console.error("Share error:", error);
      Alert.alert("Error", "Could not share the document.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = async () => {
    try {
      setIsProcessing(true);
      const file = await getLocalFile();
      if (!file) throw new Error("No file to download");

      if (Platform.OS === "android") {
        // Android: Public Downloads folder via SAF + Local Notification
        const permissions = await FileSystemLegacy.StorageAccessFramework.requestDirectoryPermissionsAsync();

        if (permissions.granted) {
          const base64Data = await file.base64();
          const finalUri = await FileSystemLegacy.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            title,
            "application/pdf"
          );

          await FileSystemLegacy.writeAsStringAsync(finalUri, base64Data, {
            encoding: FileSystemLegacy.EncodingType.Base64
          });

          await scheduleNotificationAsync({
            content: {
              title: "Download Complete",
              body: `${title}.pdf is ready. Tap to open it.`,
              data: {
                action: 'open_downloaded_file',
                fileUri: finalUri,
                mimeType: "application/pdf"
              }
            },
            trigger: null,
          });
        }
      } else {
        // iOS: Trigger Share Sheet immediately for "Save to Files"
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/pdf",
          UTI: "com.adobe.pdf"
        });
      }

    } catch (error) {
      console.error("Download error:", error);
      Alert.alert("Error", "Could not save the document.");
    } finally {
      setIsProcessing(false);
    }
  };

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

          <View style={styles.headerActions}>
            {isProcessing ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
            ) : (
              <>
                <TouchableOpacity onPress={handleDownload} style={styles.actionBtn}>
                  <Feather name="download" size={20} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleShare} style={styles.actionBtn}>
                  <Feather name="share-2" size={20} color={colors.text} />
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  loader: {
    marginRight: spacing.sm,
  },
  actionBtn: {
    padding: 8,
    backgroundColor: colors.background,
    borderRadius: radius.md
  },
  closeBtn: {
    padding: 8,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    marginLeft: spacing.xs
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
import { Directory, File, Paths } from "expo-file-system";
import * as FileSystemLegacy from "expo-file-system/legacy";
import * as Notifications from "expo-notifications";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";
import * as XLSX from "xlsx";

export const generateExcelLocally = async (
  filteredData: any[],
  title: string = "Report",
) => {
  try {
    // Convert JSON to a SheetJS worksheet
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report Data");

    // Write the workbook to a Base64 string
    const base64 = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });
    const sanitizedTitle = title.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `${sanitizedTitle}_${Date.now()}.xlsx`;
    const mimeType =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    // Save locally using the modern File API inside the app sandbox
    const cacheDir = new Directory(Paths.cache, "excel");
    if (!cacheDir.exists) {
      cacheDir.create();
    }
    const file = new File(cacheDir, fileName);

    await FileSystemLegacy.writeAsStringAsync(file.uri, base64, {
      encoding: FileSystemLegacy.EncodingType.Base64,
    });

    // Split OS routing
    if (Platform.OS === "android") {
      const permissions =
        await FileSystemLegacy.StorageAccessFramework.requestDirectoryPermissionsAsync();

      if (permissions.granted) {
        const finalUri =
          await FileSystemLegacy.StorageAccessFramework.createFileAsync(
            permissions.directoryUri,
            sanitizedTitle,
            mimeType,
          );
        await FileSystemLegacy.writeAsStringAsync(finalUri, base64, {
          encoding: FileSystemLegacy.EncodingType.Base64,
        });

        await Notifications.scheduleNotificationAsync({
          content: {
            title: "Download Complete",
            body: `${sanitizedTitle}.xlsx is ready. Tap to open it.`,
            data: {
              action: "open_downloaded_file",
              fileUri: finalUri,
              mimeType: mimeType,
            },
          },
          trigger: null,
        });
      }
    } else {
      // iOS: Trigger Share Sheet immediately for "Save to Files"
      await Sharing.shareAsync(file.uri, {
        mimeType: mimeType,
        UTI: "com.microsoft.excel.xlsx",
      });
    }
  } catch (error) {
    console.error("Excel Export Error:", error);
    Alert.alert("Error", "Could not export the data to Excel.");
  }
};

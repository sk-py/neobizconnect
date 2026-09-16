import * as FileSystem from "expo-file-system/legacy";
import { fetchInvoicePdfBase64 } from "@/modules/dealers/services/dealer-invoice-pdf.api";

export const openInvoicePdf = async (
  docEntry: string,
  invoiceNumber: string,
): Promise<string> => {
  if (!docEntry) {
    throw new Error("Missing invoice DocEntry");
  }

  const base64 = await fetchInvoicePdfBase64(docEntry);
  const fileName = `invoice-${invoiceNumber || docEntry}.pdf`;
  const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return fileUri;
};
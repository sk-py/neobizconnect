import { api } from "@/services/axios";
import { File, Paths } from "expo-file-system";

// 1. Fetch Stats
export const fetchArInvoiceStats = async (groupCompanyName: string) => {
  const response = await api.get(`/Neo/Invoice/Count/Data`);
  return response.data;
};

// 2. Fetch Paginated List
export const fetchArInvoices = async (
  groupCompanyName: string,
  page: number,
) => {
  const response = await api.get(`/Neo/Invoice/List/Pagenation?page=${page}`);
  return response.data;
};

// 3. Robust PDF Downloader
export const downloadInvoicePdf = async (
  groupCompanyName: string,
  docEntry: string,
): Promise<string> => {
  try {
    const response = await api.post(
      `/Neo/SAP/InvoicePDF`,
      { DocEntry: docEntry },
      {
        responseType: "arraybuffer",
        // Prevent Axios from throwing immediately on 4xx/5xx so we can parse the binary error
        validateStatus: (status) => status < 500,
      },
    );

      // Intercept JSON errors hidden inside the ArrayBuffer
    const contentType = String(response.headers["content-type"] || "");
    if (contentType.includes("application/json")) {
      const textDecoder = new TextDecoder("utf-8");
      const errorText = textDecoder.decode(new Uint8Array(response.data));
      const errorJson = JSON.parse(errorText);
      throw new Error(
        errorJson.message || "Server returned JSON instead of a PDF.",
      );
    }

    // Validate successful HTTP status
    if (response.status !== 200) {
      throw new Error(
        `Failed to download PDF. HTTP Status: ${response.status}`,
      );
    }

    // Safely manage the file system
    const file = new File(Paths.cache, `Invoice_${docEntry}.pdf`);

    if (file.exists) {
      file.delete();
    }

    file.create();
    file.write(new Uint8Array(response.data));

    return file.uri;
  } catch (error) {
    console.error(`[downloadInvoicePdf] Error:`, error);
    throw error;
  }
};

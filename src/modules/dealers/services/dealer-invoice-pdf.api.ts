import { api } from "@/services/axios";

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? result;
      resolve(base64);
    };
    reader.readAsDataURL(blob);
  });
};

export const fetchInvoicePdfBase64 = async (
  docEntry: string,
): Promise<string> => {
  const res = await api.post(
    `/Neo/SAP/InvoicePDF`,
    { DocEntry: docEntry },
    { responseType: "blob" },
  );

  return blobToBase64(res.data);
};
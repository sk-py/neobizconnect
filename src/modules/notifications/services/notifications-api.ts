import { api } from "@/services/axios";

export type SendNotificationPayload = {
  title: string;
  message: string;
  imageUri?: string;
  imageName?: string;
  imageType?: string;
};

export const sendNotification = async (
  payload: SendNotificationPayload,
): Promise<void> => {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("message", payload.message);

  if (payload.imageUri) {
    formData.append("file", {
      uri: payload.imageUri,
      name: payload.imageName || "attachment.jpg",
      type: payload.imageType || "image/jpeg",
    } as any);
  }

  await api.post("/Notification/Upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
import { api } from "@/services/axios";

export type NotificationListItem = {
  id?: string | number;
  title?: string;
  message?: string;
  imageUrl?: string;
  createdDate?: string;
  [key: string]: any;
};

export const fetchNotifications = async (): Promise<NotificationListItem[]> => {
  const res = await api.get("/Notification/List");
  const data = res.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.List)) return data.List;
  if (Array.isArray(data?.Notifications)) return data.Notifications;

  return [];
};

export type SendNotificationPayload = {
  title: string;
  message: string;
  imageUri?: string;
  imageName?: string;
  imageType?: string;
};

const getImageMimeType = (fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    case "heic":
      return "image/heic";
    case "jpg":
    case "jpeg":
    default:
      return "image/jpeg";
  }
};

export const sendNotification = async (
  payload: SendNotificationPayload,
): Promise<void> => {
  const formData = new FormData();
  formData.append("name", payload.title.trim());
  formData.append("description", payload.message.trim());

  if (payload.imageUri) {
    const fileName = payload.imageName?.trim() || "attachment.jpg";

    formData.append(
      "files",
      {
        uri: payload.imageUri,
        name: fileName,
        type: payload.imageType || getImageMimeType(fileName),
      } as any,
    );
  }

  await api.post("/Notification/Upload", formData, {
    headers: {
      Accept: "*/*",
      "Content-Type": "multipart/form-data",
    },
  });
};
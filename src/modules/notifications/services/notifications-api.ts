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
  const res = await api.get(`/Notification/List`);
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

export const sendNotification = async (
  payload: SendNotificationPayload,
): Promise<void> => {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("message", payload.message);

  if (payload.imageUri) {
    const file: any = {
      uri: payload.imageUri,
      name: payload.imageName || "attachment.jpg",
      type: payload.imageType || "image/jpeg",
    };
    formData.append("file", file);
  }

  await api.post("/Notification/Upload", formData);
};
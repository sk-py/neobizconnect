import { api } from "@/services/axios";

export const generateOtp = async (username: string): Promise<void> => {
  await api.post("/Generate/OTP", { username });
};

export const verifyOtp = async (username: string, otp: string): Promise<void> => {
  await api.post("/OTP/Check", { username, otp });
};

export const resetPassword = async (username: string, password: string): Promise<void> => {
  await api.post("/Password/Change", { username, password });
};
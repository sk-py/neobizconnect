import { useAuthStore } from "@/store/auth.store";
import axios from "axios";

type Environment = "production" | "uat" | "test";

const BASE_URLS: Record<Environment, string> = {
  production: "https://neobizconnect.com/CRM-API/Crm/Portal",
  uat: "https://crm-uat.actifyzone.com/crm-uat/Crm/Portal",
  test: "https://crm-test.actifyzone.com/crm-test/Crm/Portal",
};

const ENVIRONMENT: Environment = "uat";

export const BASE_URL = BASE_URLS[ENVIRONMENT];
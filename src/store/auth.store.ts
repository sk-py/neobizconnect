import { UserRole } from "@/constants/modules";
import { validateToken } from "@/services/validateToken";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { deleteItemAsync, getItemAsync, setItemAsync } from "expo-secure-store";
import { create } from "zustand";

export type BrandType = "Neo" | "Zetta";

export type User = {
  //   id: string;
  name: string;
  authority_id: number;
  authority: UserRole;
  dealer_code?: string;
  dealer_brand_type: BrandType[];
  group_company_name: string;
  companyid: number;
  branchid: number;
  groupid: number;
  accesstoken: string;
  modules: Module[];
};

type AuthState = {
  user: User | null;
  accessToken: string | null;

  isHydrating: boolean;
  isAuthenticated: boolean;

  setSession: (accesstoken: string, user: User) => void;
  clearSession: () => void;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,

  isHydrating: true,
  isAuthenticated: false,

  setSession: async (accessToken, user) => {
    await setItemAsync("accessToken", accessToken);
    set({
      accessToken,
      user,
      isAuthenticated: true,
    });
  },

  clearSession: async () => {
    set({
      accessToken: null,
      user: null,
      isAuthenticated: false,
    });

    try {
      await deleteItemAsync("accessToken");
      await AsyncStorage.clear();
    } catch (error) {
      console.error("Failed to clear AsyncStorage on logout:", error);
    }
  },
  hydrate: async () => {
    try {
      const token = await getItemAsync("accessToken");

      if (!token) {
        set({
          isAuthenticated: false,
        });
        return;
      }

      const response = await validateToken(token);
      // console.log(response);

      if (!response.accesstoken) {
        set({
          accessToken: null,
          user: null,
          isAuthenticated: false,
        });
        return;
      }

      set({
        accessToken: response.accesstoken,
        user: response,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error("Auth hydration failed: ", error);

      set({
        accessToken: null,
        user: null,
        isAuthenticated: false,
      });
    } finally {
      set({
        isHydrating: false,
      });
    }
  },
}));

type Module = {
  moduleName: string;
  url: string;
  icon: string;
  subModules: subModule[];
};

type subModule = {
  subModuleName: string;
  url: string;
};

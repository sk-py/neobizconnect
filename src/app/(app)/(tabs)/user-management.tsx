import { useFocusEffect, useRouter } from "expo-router";
import { useCallback } from "react";
import { BackHandler } from "react-native";
import UserManagementScreen from "@/modules/user-management/components/user-management-screen";

export default function UserManagementRoute() {
  const router = useRouter();

    useFocusEffect(
        useCallback(() => {
            const onBackPress = () => {
                router.push("/user-setup");
                return true;
            };

            const subscription = BackHandler.addEventListener(
                "hardwareBackPress",
                onBackPress,
            );

            return () => subscription.remove();
        }, [router]),
    );

    return <UserManagementScreen />;
}
import { colors, radius, spacing, txtSize, typography } from "@/constants/theme";
import { useAuth } from "@/hooks/use-auth";
import { removePushToken, syncPushToken } from "@/services/pushApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useQuery } from "@tanstack/react-query";
import { getDevicePushTokenAsync, getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications';
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { fetchDealerProfile } from "../service/profile.api";

const isValidValue = (val?: string | null) => {
  if (!val) return false;
  const normalized = val.trim().toUpperCase();
  return normalized !== "" && normalized !== "NA" && normalized !== "N/A" && normalized !== "NULL";
};

export const ProfileScreen = () => {
  const router = useRouter();
  const { user, clearSession } = useAuth();
  const groupCompanyName = user?.group_company_name || "Neo";
  const [pushEnabled, setPushEnabled] = useState(true);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["dealer-profile", groupCompanyName],
    queryFn: () => fetchDealerProfile(groupCompanyName),
    enabled: Boolean(groupCompanyName),
  });

  // Hydrate the toggle state when the screen mounts
  useEffect(() => {
    AsyncStorage.getItem("pushEnabled").then((val) => {
      if (val === "false") {
        setPushEnabled(false);
      }
    });
  }, []);

  const handlePushToggle = async (value: boolean) => {
    setPushEnabled(value);
    try {
      
      if (value) {

        const { status: existingStatus } = await getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          setPushEnabled(false); // Revert switch
          Alert.alert(
            "Permission Required",
            "Push notifications are blocked. Please enable them in your device settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() }
            ]
          );
          return; // Abort execution
        }
        
        const tokenData = await getDevicePushTokenAsync();
        const token = tokenData.data;

        await AsyncStorage.setItem("pushEnabled", value ? "true" : "false");
        await syncPushToken(user?.user_id!, token);
      } else {
        const tokenData = await getDevicePushTokenAsync();
        await AsyncStorage.setItem("pushEnabled", "false");
        await removePushToken(user?.user_id!, tokenData.data);
      }

    } catch (error) {
      // Revert the UI switch and storage if the backend fails
      setPushEnabled(!value);
      await AsyncStorage.setItem("pushEnabled", !value ? "true" : "false");
      Alert.alert("Error", "Failed to update notification settings.");
    }
  };

  if (isLoading || !profile) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.centerBox]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const primaryBillTo = profile.bill_to?.[0];
  const primaryShipTo = profile.ship_to?.[0];

  const gstin = primaryBillTo?.bill_to_gstin || primaryShipTo?.ship_to_gstin || "";

  const billToAddressStr = primaryBillTo
    ? `${primaryBillTo.bill_to_buildingfloorroom ? primaryBillTo.bill_to_buildingfloorroom + " " : ""}${primaryBillTo.bill_to_address}`
    : "";

  const shipToAddressStr = primaryShipTo
    ? `${primaryShipTo.ship_to_buildingfloorroom ? primaryShipTo.ship_to_buildingfloorroom + " " : ""}${primaryShipTo.ship_to_address}`
    : "";

  const displayFields = [
    { id: "contact", icon: "user", label: "Contact Person", value: profile.contact_person },
    { id: "phone", icon: "phone", label: "Phone No.", value: profile.phone_no },
    { id: "email", icon: "mail", label: "Email Address", value: profile.email },
    { id: "gstin", icon: "file-text", label: "GST Number", value: gstin },
    { id: "billing", icon: "map-pin", label: "Billing Address", value: billToAddressStr },
    { id: "shipping", icon: "truck", label: "Shipping Address", value: shipToAddressStr },
  ].filter(field => isValidValue(field.value));

  const InfoRow = ({ icon, label, value, isLast = false }: { icon: string; label: string; value: string; isLast?: boolean }) => (
    <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
      <Feather name={icon as any} size={18} color={colors.textSecondary} style={styles.infoIcon} />
      <View style={styles.infoTextContainer}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text selectable style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.safeArea} >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Feather name="briefcase" size={32} color={colors.primary} />
          </View>
          <View style={styles.nameRow}>
            <Text selectable style={styles.dealerName}>{profile.dealer_name}</Text>
            <Feather name="check-circle" size={18} color={colors.success} />
          </View>
          {isValidValue(profile.dealer_code) && (
            <Text selectable style={styles.dealerCode}>Dealer Code: {profile.dealer_code}</Text>
          )}
        </View>

        {displayFields.length > 0 && (
          <View style={styles.sectionCard}>
            {displayFields.map((field, index) => (
              <InfoRow
                key={field.id}
                icon={field.icon}
                label={field.label}
                value={field.value}
                isLast={index === displayFields.length - 1}
              />
            ))}
          </View>
        )}

        {/* New Settings Section */}
        <View style={[styles.sectionCard, { marginTop: spacing.lg }]}>
          <View style={[styles.infoRow, styles.infoRowLast, { alignItems: "center" }]}>
            <Feather name="bell" size={18} color={colors.textSecondary} style={styles.infoIcon} />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoValue}>Push Notifications</Text>
              <Text style={styles.infoLabel}>Receive alerts and order updates</Text>
            </View>
            <Switch
              value={pushEnabled}
              onValueChange={handlePushToggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.border}
            />
          </View>
        </View>

                <Pressable
          onPress={() => router.push("/change-password")}
          style={({ pressed, hovered }: any) => [
            styles.logoutButton,
            (pressed || hovered) && { backgroundColor: colors.primary }
          ]}
        >
          {({ pressed, hovered }: any) => (
            <>
              <Feather name="lock" size={18} color={(pressed || hovered) ? colors.white : colors.primary} />
              <Text style={[styles.logoutText, (pressed || hovered) && { color: colors.white }]}>
                Change Password
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={clearSession}
          style={({ pressed, hovered }: any) => [
            styles.logoutButton,
            (pressed || hovered) && { backgroundColor: colors.primary }
          ]}
        >
          {({ pressed, hovered }: any) => (
            <>
              <Feather
                name="log-out"
                size={18}
                color={(pressed || hovered) ? colors.white : colors.primary}
              />
              <Text style={[
                styles.logoutText,
                (pressed || hovered) && { color: colors.white }
              ]}>
                Logout
              </Text>
            </>
          )}
        </Pressable>

      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  dealerName: {
    fontSize: 22,
    fontFamily: typography.bold,
    color: colors.text,
  },
  dealerCode: {
    fontSize: txtSize.small,
    fontFamily: typography.medium,
    color: colors.textSecondary,
  },
  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
    alignItems: "flex-start",
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoIcon: {
    marginTop: 2,
    marginRight: spacing.md,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: typography.medium,
    color: colors.muted,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: typography.semibold,
    color: colors.text,
    lineHeight: 20,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: spacing.xl,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: "transparent",
  },
  logoutText: {
    color: colors.primary,
    fontFamily: typography.bold,
    fontSize: 16,
  },
});
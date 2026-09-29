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

  const handleLogout = async () => {
    const tokenData = await getDevicePushTokenAsync();
    await AsyncStorage.setItem("pushEnabled", "false");
    await removePushToken(user?.user_id!, tokenData.data);
    clearSession();
  };

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
          setPushEnabled(false);
          Alert.alert(
            "Permission Required",
            "Push notifications are blocked. Please enable them in your device settings.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Open Settings", onPress: () => Linking.openSettings() }
            ]
          );
          return; 
        }

        const tokenData = await getDevicePushTokenAsync();
        await AsyncStorage.setItem("pushEnabled", "true");
        await syncPushToken(user?.user_id!, tokenData.data);
      } else {
        const tokenData = await getDevicePushTokenAsync();
        await AsyncStorage.setItem("pushEnabled", "false");
        await removePushToken(user?.user_id!, tokenData.data);
      }
    } catch (error) {
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

  // Grab the first available GSTIN to represent the business
  const gstin = profile.bill_to?.[0]?.bill_to_gstin || profile.ship_to?.[0]?.ship_to_gstin || "";

  // Dynamically map all billing and shipping addresses
  const addressFields: any[] = [];
  
  profile.bill_to?.forEach((bill: any, index: number) => {
    const addr = `${bill.bill_to_buildingfloorroom ? bill.bill_to_buildingfloorroom + " " : ""}${bill.bill_to_address}`;
    if (isValidValue(addr)) {
      addressFields.push({
        id: `billing_${index}`,
        icon: "map-pin",
        label: profile.bill_to.length > 1 ? `Billing Address ${index + 1}` : "Billing Address",
        value: addr
      });
    }
  });

  profile.ship_to?.forEach((ship: any, index: number) => {
    const addr = `${ship.ship_to_buildingfloorroom ? ship.ship_to_buildingfloorroom + " " : ""}${ship.ship_to_address}`;
    if (isValidValue(addr)) {
      addressFields.push({
        id: `shipping_${index}`,
        icon: "truck",
        label: profile.ship_to.length > 1 ? `Shipping Address ${index + 1}` : "Shipping Address",
        value: addr
      });
    }
  });

  const displayFields = [
    { id: "contact", icon: "user", label: "Contact Person", value: profile.contact_person },
    { id: "phone", icon: "phone", label: "Phone No.", value: profile.phone_no },
    { id: "email", icon: "mail", label: "Email Address", value: profile.email },
    { id: "gstin", icon: "file-text", label: "GST Number", value: gstin },
    ...addressFields // Append dynamic addresses here
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

        {/* 1. Identity Header (Row Layout) */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <Feather name="briefcase" size={28} color={colors.primary} />
          </View>
          <View style={styles.headerTextContainer}>
            <View style={styles.nameRow}>
              <Text selectable style={styles.dealerName} numberOfLines={2}>
                {profile.dealer_name}
              </Text>
              <Feather name="check-circle" size={16} color={colors.success} style={styles.verifiedIcon} />
            </View>
            {isValidValue(profile.dealer_code) && (
              <Text selectable style={styles.dealerCode}>Code/Id: {profile.dealer_code}</Text>
            )}
          </View>
        </View>

        {/* 2. Business Information */}
        {displayFields.length > 0 && (
          <View style={styles.sectionGroup}>
            <Text style={styles.sectionTitle}>Business Details</Text>
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
          </View>
        )}

        {/* 3. Settings & Preferences */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.sectionCard}>
            
            <View style={styles.infoRow}>
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

            <Pressable 
              style={({ pressed }) => [styles.infoRow, styles.infoRowLast, pressed && styles.pressedRow]} 
              onPress={() => router.push("/change-password")}
            >
              <Feather name="lock" size={18} color={colors.textSecondary} style={styles.infoIcon} />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoValue}>Change Password</Text>
                <Text style={styles.infoLabel}>Update your account security</Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.muted} />
            </Pressable>

          </View>
        </View>

        {/* 4. Destructive Action (Logout) */}
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutButton,
            pressed && { opacity: 0.7 }
          ]}
        >
          <Feather name="log-out" size={18} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
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
    flexDirection: "row",
    alignItems: "center",
    // paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xl,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  dealerName: {
    flexShrink: 1, // Ensures long names wrap instead of pushing the icon off-screen
    fontSize: 20,
    fontFamily: typography.bold,
    color: colors.text,
    lineHeight: 24,
  },
  verifiedIcon: {
    marginLeft: 6,
    marginTop: 4, // Aligns with the first line of text
  },
  dealerCode: {
    fontSize: txtSize.small,
    fontFamily: typography.medium,
    color: colors.textSecondary,
  },
  sectionGroup: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: typography.bold,
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
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
    alignItems: "center", 
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  pressedRow: {
    backgroundColor: colors.surface,
  },
  infoIcon: {
    marginRight: spacing.md,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: typography.medium,
    color: colors.muted,
    marginBottom: 2,
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
    marginTop: spacing.sm,
    paddingVertical: 16,
    borderRadius: radius.lg,
    backgroundColor: "#FEF2F2",
  },
  logoutText: {
    color: "#EF4444",
    fontFamily: typography.bold,
    fontSize: 16,
  },
});
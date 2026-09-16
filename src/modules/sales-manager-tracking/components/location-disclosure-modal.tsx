import { colors, radius, spacing, typography } from "@/constants/theme";
import { Feather } from "@react-native-vector-icons/feather/static";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
};

export const LocationDisclosureModal = ({ visible, onAccept, onDecline }: Props) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDecline}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.card}>
          <View style={styles.iconCircle}>
            <Feather name="map-pin" size={24} color={colors.primary} />
          </View>
          
          <Text style={styles.title}>Location Tracking Required</Text>
          
          <Text style={styles.desc}>
            NeoBiz Connect collects location data to enable live route tracking and dealer visit logging even when the app is closed or not in use.
          </Text>
          
          <View style={styles.bulletList}>
            <View style={styles.bullet}>
              <Feather name="check-circle" size={16} color={colors.success} />
              <Text style={styles.bulletText}>Verifies attendance at dealer shops</Text>
            </View>
            <View style={styles.bullet}>
              <Feather name="check-circle" size={16} color={colors.success} />
              <Text style={styles.bulletText}>Calculates accurate travel allowances</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.declineBtn} onPress={onDecline}>
              <Text style={styles.declineBtnText}>No Thanks</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
              <Text style={styles.acceptBtnText}>I Agree</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.xl, alignItems: "center" },
  iconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(37, 99, 235, 0.1)", justifyContent: "center", alignItems: "center", marginBottom: spacing.md },
  title: { fontSize: 18, fontFamily: typography.bold, color: colors.text, marginBottom: spacing.sm, textAlign: "center" },
  desc: { fontSize: 14, fontFamily: typography.medium, color: colors.textSecondary, textAlign: "center", lineHeight: 22, marginBottom: spacing.lg },
  bulletList: { width: "100%", backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.sm, marginBottom: spacing.xl },
  bullet: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  bulletText: { fontSize: 13, fontFamily: typography.medium, color: colors.text },
  actions: { flexDirection: "row", gap: spacing.md, width: "100%" },
  declineBtn: { flex: 1, paddingVertical: 14, alignItems: "center", borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border },
  declineBtnText: { color: colors.text, fontSize: 14, fontFamily: typography.bold },
  acceptBtn: { flex: 1, backgroundColor: colors.primary, paddingVertical: 14, alignItems: "center", borderRadius: radius.sm },
  acceptBtnText: { color: colors.white, fontSize: 14, fontFamily: typography.bold },
});
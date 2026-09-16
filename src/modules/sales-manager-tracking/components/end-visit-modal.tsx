import { colors, radius, spacing, typography } from "@/constants/theme";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Props = {
  visible: boolean;
  dealerName: string;
  onClose: () => void;
  onSubmit: (data: { conclusion: string; visit_reason: string; remarks: string; future_prospects: string }) => Promise<void>;
};

export const EndVisitModal = ({ visible, dealerName, onClose, onSubmit }: Props) => {
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [conclusion, setConclusion] = useState("");
  const [futureProspects, setFutureProspects] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      Alert.alert("Required Field", "Please provide a visit reason.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        visit_reason: reason.trim(),
        remarks: remarks.trim(),
        conclusion: conclusion.trim(),
        future_prospects: futureProspects.trim()
      });
      onClose();
    } catch (error: any) {
      Alert.alert("Failed to End Visit", error.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>End Visit</Text>
          <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
            <Feather name="x" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.subtitle}>
              Completing meeting with <Text style={styles.dealerHighlight}>{dealerName}</Text>
            </Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Visit Reason *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Routine checkup, Payment collection..."
                value={reason}
                onChangeText={setReason}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Remarks</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Any specific observations..."
                value={remarks}
                onChangeText={setRemarks}
                multiline
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Conclusion</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Outcome of the meeting..."
                value={conclusion}
                onChangeText={setConclusion}
                multiline
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Future Prospects</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Follow-up actions, next steps..."
                value={futureProspects}
                onChangeText={setFutureProspects}
                multiline
                editable={!isSubmitting}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]} 
            onPress={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitBtnText}>Submit & End Visit</Text>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.white },
  title: { fontSize: 18, fontFamily: typography.bold, color: colors.text },
  body: { padding: spacing.md },
  subtitle: { fontSize: 14, fontFamily: typography.medium, color: colors.textSecondary, marginBottom: spacing.xl },
  dealerHighlight: { fontFamily: typography.bold, color: colors.primary },
  fieldGroup: { marginBottom: spacing.lg },
  label: { fontSize: 13, fontFamily: typography.bold, color: colors.text, marginBottom: 6 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 12, fontSize: 14, fontFamily: typography.medium, color: colors.text },
  textArea: { height: 80, textAlignVertical: "top" },
  footer: { padding: spacing.md, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  submitBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: radius.sm, alignItems: "center" },
  submitBtnDisabled: { opacity: 0.7 },
  submitBtnText: { color: colors.white, fontSize: 15, fontFamily: typography.bold },
});
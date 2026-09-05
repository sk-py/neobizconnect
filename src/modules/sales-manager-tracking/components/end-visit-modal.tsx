import { colors, radius, spacing, typography } from "@/constants/theme";
import { zodResolver } from "@hookform/resolvers/zod";
import { Feather } from "@react-native-vector-icons/feather/static";
import { Controller, useForm } from "react-hook-form";
import {
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
import { z } from "zod";

const endVisitSchema = z.object({
  reason: z.string().optional(),
  conclusion: z.string().min(1, "Conclusion is mandatory to close the visit"),
  remarks: z.string().optional(),
  futureProspects: z.string().optional(),
});

type EndVisitForm = z.infer<typeof endVisitSchema>;

type Props = {
  visible: boolean;
  dealerName: string;
  onClose: () => void;
  onSubmit: (data: EndVisitForm) => void;
};

export const EndVisitModal = ({ visible, dealerName, onClose, onSubmit }: Props) => {
  const { control, handleSubmit, reset } = useForm<EndVisitForm>({
    resolver: zodResolver(endVisitSchema),
    defaultValues: { reason: "", conclusion: "", remarks: "", futureProspects: "" },
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const submitForm = (data: EndVisitForm) => {
    onSubmit(data);
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Wrap up Visit</Text>
            <Text style={styles.sub}>{dealerName}</Text>
          </View>
          <TouchableOpacity onPress={handleClose}><Feather name="x" size={24} color={colors.text} /></TouchableOpacity>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Reason for Visit</Text>
            <Controller
              control={control}
              name="reason"
              render={({ field: { onChange, value } }) => (
                <TextInput style={styles.input} placeholder="Routine check, payment follow-up..." value={value} onChangeText={onChange} />
              )}
            />

            <Text style={styles.label}>Conclusion (Mandatory)</Text>
            <Controller
              control={control}
              name="conclusion"
              render={({ field: { onChange, value }, fieldState: { error } }) => (
                <>
                  <TextInput 
                    style={[styles.input, styles.textArea, error && styles.inputError]} 
                    multiline 
                    placeholder="What was agreed upon?" 
                    value={value} 
                    onChangeText={onChange} 
                  />
                  {error && <Text style={styles.errorText}>{error.message}</Text>}
                </>
              )}
            />

            <Text style={styles.label}>Remarks / Feedback</Text>
            <Controller
              control={control}
              name="remarks"
              render={({ field: { onChange, value } }) => (
                <TextInput style={styles.input} placeholder="Stock complaints, market issues..." value={value} onChangeText={onChange} />
              )}
            />

            <Text style={styles.label}>Future Prospects</Text>
            <Controller
              control={control}
              name="futureProspects"
              render={({ field: { onChange, value } }) => (
                <TextInput style={styles.input} placeholder="Expected orders, next visit date..." value={value} onChangeText={onChange} />
              )}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit(submitForm)}>
              <Text style={styles.submitBtnText}>Complete & End Visit</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 18, fontFamily: typography.bold, color: colors.text },
  sub: { fontSize: 12, fontFamily: typography.medium, color: colors.muted, marginTop: 2 },
  body: { padding: spacing.md },
  label: { fontSize: 12, fontFamily: typography.bold, color: colors.text, marginBottom: 4 },
  input: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, padding: 10, fontSize: 13, fontFamily: typography.medium, color: colors.text, marginBottom: spacing.md },
  inputError: { borderColor: colors.error, marginBottom: 4 },
  errorText: { color: colors.error, fontSize: 11, fontFamily: typography.medium, marginBottom: spacing.md },
  textArea: { height: 75, textAlignVertical: "top" },
  submitBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: radius.sm, alignItems: "center", marginTop: spacing.sm },
  submitBtnText: { color: colors.white, fontSize: 15, fontFamily: typography.bold },
});
import { colors, spacing, txtSize, typography } from "@/constants/theme";
import { zodResolver } from "@hookform/resolvers/zod";
import { Feather } from "@react-native-vector-icons/feather";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import axios from "axios";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { useLogin } from "../hooks/use-auth";
import { LoginForm, loginSchema } from "../schema";

const LoginScreen = () => {
  const router = useRouter();

  const usernameRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<
    "username" | "password" | null
  >(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const { setSession } = useAuth();
  const { mutate, isPending } = useLogin();

  const onSubmit = async (data: LoginForm) => {
    mutate(data, {
      onSuccess: (result) => {
        setSession(result.accesstoken, result);
      },
      onError: (error) => {
        if (axios.isAxiosError(error)) {
          const errMsg = error.response?.data?.message;

          ToastAndroid.show(
            errMsg || "Something went wrong",
            1000
          );
        }
      },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardView}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand */}
          <View style={styles.brandTag}>
            <View style={styles.brandTitle}>
              <Text style={[styles.brandText, styles.brandPrimary]}>
                Neo
              </Text>
              <Text style={styles.brandText}>Biz Connect</Text>
            </View>

            <Text style={styles.brandSubtitle}>
              by Neo Wheels
            </Text>
          </View>

          {/* Heading */}
          <View style={styles.screenHeadings}>
            <Text style={styles.screenTitle}>
              Dealer Ordering,{"\n"}Sales & Inventory
            </Text>

            <Text style={styles.screenSubtitle}>
              One clean portal to place orders, monitor sales performance,
              and check live inventory.
            </Text>
          </View>

          {/* Login Card */}
          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                Welcome back.
              </Text>

              <Text style={styles.formSubtitle}>
                Please login to continue.
              </Text>
            </View>

            {/* Username */}
            <View style={styles.inputGroup}>
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[
                      styles.inputContainer,
                      focusedField === "username" &&
                        styles.inputContainerFocused,
                      errors.username &&
                        styles.inputContainerError,
                    ]}
                  >
                    <Feather
                      name="user"
                      size={18}
                      color={
                        focusedField === "username"
                          ? colors.primary
                          : colors.muted
                      }
                    />

                    <TextInput
                      ref={usernameRef}
                      style={styles.textInput}
                      placeholder="Username"
                      placeholderTextColor={colors.muted}
                      value={value}
                      onChangeText={onChange}
                      onFocus={() => setFocusedField("username")}
                      onBlur={() => {
                        onBlur();
                        setFocusedField(null);
                      }}
                      inputMode="email"
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="email"
                      returnKeyType="next"
                      onSubmitEditing={() => {
                        passwordRef.current?.focus();
                      }}
                    />
                  </View>
                )}
              />

              {errors.username && (
                <Text style={styles.errorText}>
                  {errors.username.message}
                </Text>
              )}
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    style={[
                      styles.inputContainer,
                      focusedField === "password" &&
                        styles.inputContainerFocused,
                      errors.password &&
                        styles.inputContainerError,
                    ]}
                  >
                    <Feather
                      name="lock"
                      size={18}
                      color={
                        focusedField === "password"
                          ? colors.primary
                          : colors.muted
                      }
                    />

                    <TextInput
                      ref={passwordRef}
                      style={styles.textInput}
                      placeholder="Password"
                      placeholderTextColor={colors.muted}
                      secureTextEntry={!showPassword}
                      value={value}
                      onChangeText={onChange}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => {
                        onBlur();
                        setFocusedField(null);
                      }}
                      autoCapitalize="none"
                      autoCorrect={false}
                      autoComplete="password"
                      returnKeyType="done"
                      onSubmitEditing={handleSubmit(onSubmit)}
                    />

                    <TouchableOpacity
                      onPress={() =>
                        setShowPassword((prev) => !prev)
                      }
                      activeOpacity={0.6}
                      hitSlop={10}
                      accessibilityRole="button"
                      accessibilityLabel={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      <Feather
                        name={
                          showPassword
                            ? "eye"
                            : "eye-off"
                        }
                        size={18}
                        color={colors.muted}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />

              {errors.password && (
                <Text style={styles.errorText}>
                  {errors.password.message}
                </Text>
              )}
            </View>

            {/* Forgot password */}
            <TouchableOpacity
              style={styles.forgotButton}
              activeOpacity={0.7}
              onPress={() =>
                router.push("/forgot-password")
              }
            >
              <Text style={styles.forgotText}>
                Forgot password?
              </Text>
            </TouchableOpacity>

            {/* Login */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              activeOpacity={0.8}
              style={styles.loginButton}
              disabled={isPending}
            >
              {isPending ? (
                <ActivityIndicator />
              ) : (
                <>
                  <Text style={styles.loginButtonText}>
                    Login
                  </Text>

                  <View style={styles.loginButtonIcon}>
                    <Feather
                      name="arrow-right"
                      color={colors.white}
                      size={18}
                    />
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              © 2024 Neo Wheels Ltd. All rights reserved.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor: colors.background || "#FAFAFA",
  },

  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
    paddingTop: spacing.md,
  },

  brandTag: {
    paddingHorizontal: spacing.lg,
  },

  brandTitle: {
    flexDirection: "row",
    alignItems: "center",
  },

  brandText: {
    fontSize: 22,
    fontFamily: typography.bold,
    color: colors.text,
  },

  brandPrimary: {
    color: colors.primary,
  },

  brandSubtitle: {
    marginTop: 2,
    color: colors.muted,
    fontFamily: typography.medium,
    fontSize: txtSize.small,
  },

  screenHeadings: {
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: 40,
    paddingBottom: 32,
  },

  screenTitle: {
    fontSize: 26,
    fontFamily: typography.bold,
    textAlign: "center",
    color: colors.text,
    lineHeight: 34,
  },

  screenSubtitle: {
    marginTop: 16,
    fontSize: txtSize.body,
    lineHeight: 22,
    textAlign: "center",
    color: colors.muted,
    fontFamily: typography.medium,
  },

  formCard: {
    width: "90%",
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: colors.white,
    borderRadius: 18,
    elevation: 8,
    shadowColor: "#808080",
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    marginBottom: 30,
  },

  formHeader: {
    marginBottom: 24,
    alignItems: "center",
  },

  formTitle: {
    fontSize: 18,
    fontFamily: typography.bold,
    color: colors.text,
  },

  formSubtitle: {
    marginTop: 4,
    fontSize: txtSize.small,
    fontFamily: typography.medium,
    color: colors.muted,
  },

  inputGroup: {
    width: "100%",
    marginBottom: 16,
  },

  inputContainer: {
    height: 46,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border || "#E5E5E5",
    borderRadius: 12,
    backgroundColor: colors.white,
  },

  inputContainerFocused: {
    borderColor: colors.primary,
  },

  inputContainerError: {
    borderColor: colors.error,
  },

  textInput: {
    flex: 1,
    height: 46,
    padding: 0,
    fontSize: txtSize.body,
    fontFamily: typography.regular,
    color: colors.text,
  },

  errorText: {
    marginTop: 4,
    fontSize: txtSize.small,
    color: colors.error,
    fontFamily: typography.regular,
  },

  forgotButton: {
    alignSelf: "flex-end",
    marginTop: 4,
    marginBottom: 24,
  },

  forgotText: {
    fontSize: txtSize.small,
    fontFamily: typography.bold,
    color: colors.primary,
  },

  loginButton: {
    height: 42,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 12,
    position: "relative",
  },

  loginButtonText: {
    color: colors.white,
    fontSize: txtSize.body,
    fontFamily: typography.bold,
  },

  loginButtonIcon: {
    position: "absolute",
    right: 20,
  },

  footerContainer: {
    alignItems: "center",
    justifyContent: "flex-end",
    textAlignVertical: "bottom",
    marginTop: 20,
    flex: 1,
  },

  footerText: {
    fontSize: 12,
    fontFamily: typography.medium,
    color: colors.muted,
    marginBottom: 8,
  },

  footerLinksRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  footerLink: {
    fontSize: 12,
    fontFamily: typography.medium,
    color: colors.muted,
  },

  footerSeparator: {
    fontSize: 12,
    color: colors.muted,
    marginHorizontal: 4,
  },
});
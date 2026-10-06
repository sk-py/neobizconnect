import { colors, spacing, txtSize, typography } from "@/constants/theme";
import { zodResolver } from "@hookform/resolvers/zod";
import { Feather } from "@react-native-vector-icons/feather";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Keyboard,
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
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/hooks/use-auth";
import axios from "axios";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { useLogin } from "../hooks/use-auth";
import { LoginForm, loginSchema } from "../schema";

const LoginScreen = () => {
    const router = useRouter();
  const insets = useSafeAreaInsets();

  const usernameRef = useRef<TextInput>(null);
    const passwordRef = useRef<TextInput>(null);
    const scrollRef = useRef<ScrollView>(null);
    const cardY = useRef(0);
  const rootRef = useRef<View>(null);
  const [kbOverlap, setKbOverlap] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

    useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardVisible(true);

      // Measure how much of the screen the keyboard really covers.
      // It is 0 if the system already resized the window, so this is safe on every device.
      setTimeout(() => {
        rootRef.current?.measureInWindow((_x, y, _w, h) => {
          const overlap = Math.max(0, y + h - e.endCoordinates.screenY);
          setKbOverlap(overlap);

          // Then bring the login card to the top of the visible area
          setTimeout(() => {
            scrollRef.current?.scrollTo({
              y: Math.max(0, cardY.current - 60),
              animated: true,
            });
          }, 80);
        });
      }, 100);
    });

    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
      setKbOverlap(0);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
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
        behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
              <SafeAreaView ref={rootRef} style={styles.safeArea} edges={["top", "left", "right"]}>
        <ScrollView
                    ref={scrollRef}
                  contentContainerStyle={[styles.scrollContent, { paddingBottom: kbOverlap }]}
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

            {/* Heading (hidden while typing so nothing gets cut off) */}
          {!keyboardVisible && (
            <View style={styles.screenHeadings}>
                            <Text style={styles.screenTitle}>Dealer Ordering,</Text>
              <Text style={styles.screenTitleAccent}>Sales & Inventory</Text>

              <Text style={styles.screenSubtitle}>
                One clean portal to place orders, monitor sales performance,
                and check live inventory.
              </Text>
            </View>
          )}
                      {/* Login Card */}
          <View
            style={styles.formCard}
            onLayout={(e) => {
              cardY.current = e.nativeEvent.layout.y;
            }}
          >
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Welcome back.</Text>
              <Text style={styles.formSubtitle}>Please login to continue.</Text>
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
                    <View
            style={[
              styles.footerContainer,
              { paddingBottom: keyboardVisible ? 12 : Math.max(insets.bottom, 12) + 8 },
            ]}
          >
            <Text style={styles.footerText}>
              © {new Date().getFullYear()} Neo Wheels Ltd. All rights reserved.
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
      backgroundColor: "#FFF8F7",
  },

  safeArea: {
    flex: 1,
        backgroundColor: "#FFF8F7",
  },

  scrollContent: {
    flexGrow: 1,
      paddingBottom: 0,
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
        paddingTop: 28,
    paddingBottom: 24,
  },

  screenHeadingsCompact: {
    paddingTop: 8,
    paddingBottom: 12,
  },

  hidden: {
    display: "none",
  },

    eyebrowPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 16,
  },

  eyebrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },

  eyebrowText: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontFamily: typography.bold,
    color: colors.primary,
  },

    screenTitleAccent: {
    fontSize: 32,
    fontFamily: typography.bold,
    color: colors.primary,
    textAlign: "center",
    lineHeight: 40,
    letterSpacing: -0.5,
  },

  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 20,
  },

  featureChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border || "#E5E5E5",
  },

  featureChipText: {
    fontSize: 12,
    fontFamily: typography.medium,
    color: colors.textSecondary,
  },

  screenTitle: {
      fontSize: 22,
    fontFamily: typography.semibold,
    textAlign: "center",
    color: colors.text,
    lineHeight: 30,
    letterSpacing: 0.2,
  },

  screenSubtitle: {
      marginTop: 14,
    maxWidth: 300,
    fontSize: 14,
    lineHeight: 22,
    letterSpacing: 0.2,
    textAlign: "center",
    color: "#4B5563",
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
       shadowColor: colors.primary,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: {
      width: 0,
      height: 10,
    },
        marginBottom: 16,
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
        height: 50,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border || "#E5E5E5",
    borderRadius: 12,
    backgroundColor: colors.surface,
  },

  inputContainerFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },

  inputContainerError: {
    borderColor: colors.error,
  },

  textInput: {
        flex: 1,
    height: 50,
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
        height: 50,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 12,
    position: "relative",
    elevation: 4,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
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
    marginTop: 16,
    paddingBottom: 20,
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
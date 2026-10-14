import { FieldSelect } from "@/components/custom/field-select";
import { SkeletonList } from "@/components/custom/skeleton";
import { colors, radius, spacing, txtSize, typography } from "@/constants/theme";
import {
  createUser,
  updateUser,
  fetchUsersCount,
    fetchAuthorities,
  fetchUsersList,
} from "@/modules/user-management/services/user-management.api";
import { DealerEmployee } from "@/modules/user-management/types";
import { LegendList } from "@legendapp/list/react-native";
import { Feather } from "@react-native-vector-icons/feather/static";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Linking,
   Keyboard,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const PAGE_SIZE = 10;

type TabKey = "list" | "create";

const isActive = (status: string | null | undefined) =>
  (status ?? "").trim().toUpperCase() === "ACTIVE";

export default function UserManagementScreen() {
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
    const [tab, setTab] = useState<TabKey>("list");
  const [kbHeight, setKbHeight] = useState(0);
  const createScrollRef = useRef<ScrollView>(null);
  const editScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", (e) =>
      setKbHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKbHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
    const [showPasswordId, setShowPasswordId] = useState<number | null>(null);

  const [editingUser, setEditingUser] = useState<DealerEmployee | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editMobile, setEditMobile] = useState("");
  const [editAuthorityLabel, setEditAuthorityLabel] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editError, setEditError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showEditPassword, setShowEditPassword] = useState(false);

 
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [authorityLabel, setAuthorityLabel] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const {
    data: users = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["user-management-list"],
    queryFn: fetchUsersList,
  });

    const { data: authorityOptions = [], isLoading: authoritiesLoading } = useQuery({
    queryKey: ["user-management-authorities"],
    queryFn: fetchAuthorities,
  });

  const { data: counts } = useQuery({
    queryKey: ["user-management-count"],
    queryFn: fetchUsersCount,
  });

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;
    return users.filter((u) =>
      [`${u.firstname} ${u.lastname}`, u.email, u.number, u.authority_name].some(
        (value) => String(value ?? "").toLowerCase().includes(query),
      ),
    );
  }, [users, searchQuery]);

  const totalItems = filteredUsers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const paginatedUsers = useMemo(() => {
    const start = safePage * PAGE_SIZE;
    return filteredUsers.slice(start, start + PAGE_SIZE);
  }, [filteredUsers, safePage]);
  const rangeStart = totalItems === 0 ? 0 : safePage * PAGE_SIZE + 1;
  const rangeEnd = Math.min(totalItems, (safePage + 1) * PAGE_SIZE);

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-management-list"] });
      queryClient.invalidateQueries({ queryKey: ["user-management-count"] });
      setFirstName("");
      setLastName("");
      setEmail("");
      setMobile("");
      setAuthorityLabel("");
      setPassword("");
      setFormError(null);
      setSuccessMsg("User created successfully.");
      setTab("list");
    },
    onError: (err: any) => {
      setFormError(err?.message || "Failed to create user.");
    },
  });

  const handleCreateUser = () => {
    setFormError(null);
    if (!firstName.trim()) return setFormError("First name is required.");
    if (!email.trim()) return setFormError("Email address is required.");
    const authority = authorityOptions.find((a) => a.label === authorityLabel);
    if (!authority) return setFormError("Please select an authority.");
    if (!password.trim()) return setFormError("Password is required.");

    createMutation.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      email: email.trim(),
      mobile: mobile.trim() || undefined,
      authorityId: authority.value,
      password: password.trim(),
    });
  };

    const openEdit = (item: DealerEmployee) => {
    const matched = authorityOptions.find(
            (a) => a.value === item.authorityid,
    );
    setEditingUser(item);
    setEditFirstName(item.firstname ?? "");
    setEditLastName(item.lastname ?? "");
    setEditEmail(item.email ?? "");
    setEditMobile(item.number ?? "");
    setEditAuthorityLabel(matched?.label ?? item.authority_name ?? "");
    setEditPassword(item.account_password ?? "");
    setShowEditPassword(false);
    setEditError(null);
  };

  const closeEdit = () => {
    setEditingUser(null);
    setEditError(null);
  };

  const updateMutation = useMutation({
    mutationFn: updateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-management-list"] });
      queryClient.invalidateQueries({ queryKey: ["user-management-count"] });
      closeEdit();
      setSuccessMsg("User updated successfully.");
    },
    onError: (err: any) => {
      setEditError(err?.message || "Failed to update user.");
    },
  });

  const handleUpdateUser = () => {
    if (!editingUser) return;
    setEditError(null);
    if (!editFirstName.trim()) return setEditError("First name is required.");
    if (!editEmail.trim()) return setEditError("Email address is required.");
    const authority = authorityOptions.find((a) => a.label === editAuthorityLabel);
    if (!authority) return setEditError("Please select an authority.");
    if (!editPassword.trim()) return setEditError("Password is required.");

    updateMutation.mutate({
      id: editingUser.id,
      existing: editingUser,
      firstName: editFirstName.trim(),
      lastName: editLastName.trim() || undefined,
      email: editEmail.trim(),
      mobile: editMobile.trim() || undefined,
      authorityId: authority.value,
      password: editPassword.trim(),
    });
  };

  const renderUserRow = ({ item }: { item: DealerEmployee }) => {
    const active = isActive(item.login_status);
    const showPassword = showPasswordId === item.id;

    return (
      <View style={styles.card}>
                <View style={styles.cardTop}>
          <View style={styles.cardTopLeft}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.firstname} {item.lastname}
            </Text>
            <Text style={styles.authorityText}>{item.authority_name}</Text>
          </View>
          <View style={styles.cardTopRight}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => openEdit(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Feather name="edit-2" size={14} color="#2563EB" />
            </TouchableOpacity>
            <View
              style={[
                styles.statusBadge,
                active ? styles.statusBadgeActive : styles.statusBadgeInactive,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: active ? colors.success : colors.error },
                ]}
              >
                {active ? "Active" : "Inactive"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.detailRow}>
                    <TouchableOpacity
            style={styles.detailChip}
            onPress={() => item.email && void Linking.openURL(`mailto:${item.email}`)}
          >
            <Feather name="mail" size={12} color={colors.textSecondary} />
            <Text style={styles.detailChipText}>{item.email || "-"}</Text>
          </TouchableOpacity>

          {!!item.number && (
            <TouchableOpacity
              style={styles.detailChip}
              onPress={() => void Linking.openURL(`tel:${item.number}`)}
            >
              <Feather name="phone" size={12} color={colors.textSecondary} />
              <Text style={styles.detailChipText}>{item.number}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.passwordRow}>
          <Text style={styles.detailLabel}>Password</Text>
          <View style={styles.passwordValueRow}>
            <Text style={styles.passwordText}>
              {showPassword ? item.account_password : "••••••••"}
            </Text>
                        <TouchableOpacity
              onPress={() =>
                setShowPasswordId(showPassword ? null : item.id)
              }
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Feather
                name={showPassword ? "eye" : "eye-off"}
                size={14}
                color={colors.muted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderListTab = () => (
    <>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Users</Text>
          <Text style={styles.statValue}>{counts?.total ?? "-"}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Active Users</Text>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {counts?.active ?? "-"}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Inactive Users</Text>
          <Text style={[styles.statValue, { color: colors.error }]}>
            {counts?.inactive ?? "-"}
          </Text>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Feather name="search" size={13} color={colors.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search name, email, authority..."
          placeholderTextColor={colors.muted}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setPage(0);
          }}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery("");
              setPage(0);
            }}
          >
            <Feather name="x-circle" size={13} color={colors.muted} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <SkeletonList count={6} />
      ) : isError ? (
        <View style={styles.stateBox}>
          <Feather name="alert-triangle" size={28} color={colors.error} />
          <Text style={styles.errorTitle}>Couldn't load users</Text>
          <Text style={styles.errorSubtitle}>
            {error instanceof Error ? error.message : "Something went wrong."}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={styles.stateBox}>
          <Feather name="users" size={28} color={colors.muted} />
          <Text style={styles.emptyText}>No users found</Text>
        </View>
      ) : (
        <>
            <LegendList
            data={paginatedUsers}
            keyExtractor={(item: DealerEmployee) => String(item.id)}
            renderItem={renderUserRow}
            contentContainerStyle={styles.listContent}
            estimatedItemSize={150}
            extraData={showPasswordId}
            recycleItems
          />

          <View style={styles.paginationBar}>
            <Text style={styles.paginationText}>
              Showing {rangeStart} to {rangeEnd} of {totalItems} entries
            </Text>
            <View style={styles.paginationControls}>
              <TouchableOpacity
                style={[styles.pageButton, safePage === 0 && styles.pageButtonDisabled]}
                disabled={safePage === 0}
                onPress={() => setPage((p) => Math.max(0, p - 1))}
              >
                <Feather name="chevron-left" size={15} color={safePage === 0 ? colors.muted : colors.text} />
              </TouchableOpacity>
              <Text style={styles.pageText}>
                {safePage + 1} / {totalPages}
              </Text>
              <TouchableOpacity
                style={[
                  styles.pageButton,
                  safePage >= totalPages - 1 && styles.pageButtonDisabled,
                ]}
                disabled={safePage >= totalPages - 1}
                onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                <Feather
                  name="chevron-right"
                  size={15}
                  color={safePage >= totalPages - 1 ? colors.muted : colors.text}
                />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </>
  );

  const renderCreateTab = () => (
        <ScrollView
      ref={createScrollRef}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.formScroll, { paddingBottom: kbHeight + 40 }]}
    >
      <Text style={styles.formTitle}>Create User</Text>
      <Text style={styles.formSubtitle}>Add a new user and assign authority access.</Text>

      <Text style={styles.fieldLabel}>
        First Name<Text style={styles.required}> *</Text>
      </Text>
      <TextInput
        style={styles.textInput}
        placeholder="Enter first name"
        placeholderTextColor={colors.muted}
        value={firstName}
        onChangeText={setFirstName}
      />

      <Text style={styles.fieldLabel}>Last Name</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Enter last name"
        placeholderTextColor={colors.muted}
        value={lastName}
        onChangeText={setLastName}
      />

      <Text style={styles.fieldLabel}>
        Email Address<Text style={styles.required}> *</Text>
      </Text>
      <TextInput
        style={styles.textInput}
        placeholder="example@email.com"
        placeholderTextColor={colors.muted}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

            <Text style={styles.fieldLabel}>Mobile Number</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Enter mobile number"
        placeholderTextColor={colors.muted}
        value={mobile}
        onChangeText={setMobile}
        keyboardType="phone-pad"
      />

      <Text style={styles.fieldLabel}>
        Authority<Text style={styles.required}> *</Text>
      </Text>
      <FieldSelect
        label="Authority"
        value={authorityLabel}
        options={authorityOptions.map((a) => a.label)}
        loading={authoritiesLoading}
        onChange={setAuthorityLabel}
        placeholder="Select authority"
      />

      <Text style={styles.fieldLabel}>
        Password<Text style={styles.required}> *</Text>
      </Text>
      <TextInput
        style={styles.textInput}
        placeholder="Enter password"
        placeholderTextColor={colors.muted}
                value={password}
        onFocus={() =>
          setTimeout(() => createScrollRef.current?.scrollToEnd({ animated: true }), 250)
        }
        onChangeText={setPassword}
        secureTextEntry
      />

      {formError && (
        <View style={styles.saveErrorBox}>
          <Feather name="alert-triangle" size={14} color={colors.error} />
          <Text style={styles.saveErrorText}>{formError}</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.createBtn, createMutation.isPending && styles.createBtnDisabled]}
        onPress={handleCreateUser}
        disabled={createMutation.isPending}
      >
        <Text style={styles.createBtnText}>
          {createMutation.isPending ? "Creating..." : "Create User"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>User Management</Text>
        <Text style={styles.headerSubtitle}>Manage portal users and their access</Text>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "list" && styles.tabBtnActive]}
            onPress={() => setTab("list")}
          >
            <Feather name="list" size={13} color={tab === "list" ? colors.white : colors.textSecondary} />
            <Text style={[styles.tabBtnText, tab === "list" && styles.tabBtnTextActive]}>List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === "create" && styles.tabBtnActive]}
            onPress={() => setTab("create")}
          >
            <Feather name="edit-2" size={13} color={tab === "create" ? colors.white : colors.textSecondary} />
            <Text style={[styles.tabBtnText, tab === "create" && styles.tabBtnTextActive]}>Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      {tab === "list" ? renderListTab() : renderCreateTab()}
          <Modal
        visible={!!editingUser}
        transparent
        animationType="slide"
        onRequestClose={closeEdit}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.formTitle}>Edit User</Text>
              <TouchableOpacity onPress={closeEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Feather name="x" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

              <ScrollView
              keyboardShouldPersistTaps="handled"
                            ref={editScrollRef}
              contentContainerStyle={[
                styles.modalScroll,
                { paddingBottom: insets.bottom + kbHeight + 40 },
              ]}
            >
                  <Text style={styles.fieldLabel}>
                First Name<Text style={styles.required}> *</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter first name"
                placeholderTextColor={colors.muted}
                value={editFirstName}
                onChangeText={setEditFirstName}
              />

              <Text style={styles.fieldLabel}>Last Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter last name"
                placeholderTextColor={colors.muted}
                value={editLastName}
                onChangeText={setEditLastName}
              />

              <Text style={styles.fieldLabel}>
                Email Address<Text style={styles.required}> *</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="example@email.com"
                placeholderTextColor={colors.muted}
                value={editEmail}
                onChangeText={setEditEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <Text style={styles.fieldLabel}>Mobile Number</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter mobile number"
                placeholderTextColor={colors.muted}
                value={editMobile}
                onChangeText={setEditMobile}
                keyboardType="phone-pad"
              />

              <Text style={styles.fieldLabel}>
                Authority<Text style={styles.required}> *</Text>
              </Text>
              <FieldSelect
                label="Authority"
                value={editAuthorityLabel}
                options={authorityOptions.map((a) => a.label)}
                onChange={setEditAuthorityLabel}
                placeholder="Select authority"
              />

              <Text style={styles.fieldLabel}>
                Password<Text style={styles.required}> *</Text>
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter password"
                placeholderTextColor={colors.muted}
                                value={editPassword}
                onFocus={() =>
                  setTimeout(() => editScrollRef.current?.scrollToEnd({ animated: true }), 250)
                }
                onChangeText={setEditPassword}
                secureTextEntry
              />

              {editError && (
                <View style={styles.saveErrorBox}>
                  <Feather name="alert-triangle" size={14} color={colors.error} />
                  <Text style={styles.saveErrorText}>{editError}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.createBtn, updateMutation.isPending && styles.createBtnDisabled]}
                onPress={handleUpdateUser}
                disabled={updateMutation.isPending}
              >
                <Text style={styles.createBtnText}>
                  {updateMutation.isPending ? "Updating..." : "Update"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
          <Modal
        visible={!!successMsg}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessMsg(null)}
      >
        <View style={styles.successOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIcon}>
              <Feather name="check" size={28} color={colors.white} />
            </View>
            <Text style={styles.successTitle}>Success</Text>
            <Text style={styles.successText}>{successMsg}</Text>
            <TouchableOpacity style={styles.successBtn} onPress={() => setSuccessMsg(null)}>
              <Text style={styles.successBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },

  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 20, fontFamily: typography.bold, color: colors.text },
  headerSubtitle: { fontSize: txtSize.small, fontFamily: typography.medium, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.sm },

  tabRow: { flexDirection: "row", gap: 8 },
  tabBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.sm, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tabBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabBtnText: { fontSize: txtSize.xs, fontFamily: typography.semibold, color: colors.textSecondary },
  tabBtnTextActive: { color: colors.white },

  statsRow: { flexDirection: "row", gap: 8, paddingHorizontal: spacing.md, paddingTop: spacing.md },
  statCard: { flex: 1, backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm, alignItems: "center", gap: 2 },
  statLabel: { fontSize: 10, fontFamily: typography.medium, color: colors.muted },
  statValue: { fontSize: 18, fontFamily: typography.bold, color: colors.text },

  searchContainer: { flexDirection: "row", alignItems: "center", margin: spacing.md, height: 36, backgroundColor: colors.surface, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10 },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, height: "100%", padding: 0, fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.text },

  listContent: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },

  card: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: spacing.sm, marginBottom: spacing.sm },
  cardTopLeft: { flex: 1 },
  userName: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.text },
  authorityText: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.textSecondary, marginTop: 2 },

  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 },
  statusBadgeActive: { backgroundColor: "#DCFCE7" },
  statusBadgeInactive: { backgroundColor: "#FEF2F2" },
  statusBadgeText: { fontSize: txtSize.xs, fontFamily: typography.semibold },

  detailRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: spacing.sm },
  detailChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm, backgroundColor: colors.surface, maxWidth: "100%" },
  detailChipText: { fontSize: txtSize.xs, fontFamily: typography.semibold, color: colors.textSecondary, flexShrink: 1 },

  passwordRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  detailLabel: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.muted },
  passwordValueRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  passwordText: { fontSize: txtSize.xs, fontFamily: typography.semibold, color: colors.text },

  stateBox: { alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: spacing.xl, paddingHorizontal: spacing.xl },
  emptyText: { fontSize: txtSize.small, fontFamily: typography.semibold, color: colors.text },
  errorTitle: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.error },
  errorSubtitle: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.textSecondary, textAlign: "center" },
  retryButton: { marginTop: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.sm, backgroundColor: colors.primary },
  retryButtonText: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.white },

  paginationBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  paginationText: { flex: 1, fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.textSecondary },
  paginationControls: { flexDirection: "row", alignItems: "center", gap: 8 },
  pageButton: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.surface },
  pageButtonDisabled: { opacity: 0.45 },
  pageText: { minWidth: 40, textAlign: "center", fontSize: txtSize.xs, fontFamily: typography.semibold, color: colors.text },

  formScroll: { padding: spacing.md, paddingBottom: spacing.xl },
  formTitle: { fontSize: 18, fontFamily: typography.bold, color: colors.text },
  formSubtitle: { fontSize: txtSize.small, fontFamily: typography.medium, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.md },

  fieldLabel: { fontSize: txtSize.xs, fontFamily: typography.semibold, color: colors.textSecondary, marginBottom: 6, marginTop: spacing.sm },
  required: { color: colors.error },
  textInput: { backgroundColor: colors.white, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 10, fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.text },

  saveErrorBox: { flexDirection: "row", alignItems: "flex-start", gap: 6, backgroundColor: "#FEF2F2", borderRadius: radius.sm, padding: spacing.sm, marginTop: spacing.md },
  saveErrorText: { fontSize: txtSize.xs, fontFamily: typography.medium, color: colors.error, flex: 1 },

  createBtn: { marginTop: spacing.lg, paddingVertical: 14, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: "center" },
  createBtnDisabled: { opacity: 0.6 },
  cardTopRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  editBtn: { width: 28, height: 28, alignItems: "center", justifyContent: "center", borderRadius: radius.sm, backgroundColor: "#EFF6FF" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalCard: { maxHeight: "90%", backgroundColor: colors.white, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingTop: spacing.md },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalScroll: { padding: spacing.md, paddingBottom: spacing.xl },
    successOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center", padding: spacing.lg },
  successCard: { width: "100%", maxWidth: 320, backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg, alignItems: "center" },
  successIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.success, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  successTitle: { fontSize: 18, fontFamily: typography.bold, color: colors.text },
  successText: { fontSize: txtSize.small, fontFamily: typography.medium, color: colors.textSecondary, textAlign: "center", marginTop: 4, marginBottom: spacing.lg },
  successBtn: { alignSelf: "stretch", paddingVertical: 12, borderRadius: radius.sm, backgroundColor: colors.primary, alignItems: "center" },
  successBtnText: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.white },
    passwordInputWrap: { justifyContent: "center" },
  passwordInput: { paddingRight: 44 },
  passwordEye: { position: "absolute", right: 12, height: "100%", justifyContent: "center" },
  createBtnText: { fontSize: txtSize.small, fontFamily: typography.bold, color: colors.white },
});
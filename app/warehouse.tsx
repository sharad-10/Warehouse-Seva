import HeaderBar from "@/src/components/panels/HeaderBar";
import ProfileModal from "@/src/components/modals/ProfileModal";
import SettingsModal from "@/src/components/modals/SettingsModal";
import StaffModal from "@/src/components/modals/StaffModal";
import SpaceSheet from "@/src/components/modals/SpaceSheet";
import CardModal from "@/src/components/modals/CardModal";
import HomeTab from "@/src/components/tabs/HomeTab";
import AlertsTab from "@/src/components/tabs/AlertsTab";
import { auth, db } from "@/src/firebase/config";
import { useCards } from "@/src/hooks/useCards";
import { useSpaceRole } from "@/src/hooks/useSpaceRole";
import { useSpaces } from "@/src/hooks/useSpaces";
import { useSpaceStaff } from "@/src/hooks/useSpaceStaff";
import { Card, CardField, SpaceRole } from "@/src/types/index";
import { getAlertPreviews } from "@/src/utils/cardAlerts";
import { useRouter } from "expo-router";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type TabType = "home" | "alerts" | "settings";

const TAB_ICONS: Record<TabType, string> = {
  home: "🏠",
  alerts: "🔔",
  settings: "⚙",
};

const TAB_LABELS: Record<TabType, string> = {
  home: "Home",
  alerts: "Alerts",
  settings: "Settings",
};

export default function MainScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [firebaseUser, setFirebaseUser] = React.useState<User | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<TabType>("home");

  const [selectedSpaceId, setSelectedSpaceId] = React.useState<string | null>(null);
  const [spaceSheetVisible, setSpaceSheetVisible] = React.useState(false);
  const [cardModalVisible, setCardModalVisible] = React.useState(false);
  const [editingCard, setEditingCard] = React.useState<Card | null>(null);
  const [settingsVisible, setSettingsVisible] = React.useState(false);
  const [profileVisible, setProfileVisible] = React.useState(false);
  const [staffVisible, setStaffVisible] = React.useState(false);

  const [spaceNameDraft, setSpaceNameDraft] = React.useState("");
  const [profileName, setProfileName] = React.useState("");
  const [profilePhone, setProfilePhone] = React.useState("");
  const [inviteValue, setInviteValue] = React.useState("");
  const [createStaffUsername, setCreateStaffUsername] = React.useState("");
  const [createStaffPassword, setCreateStaffPassword] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<SpaceRole>("edit");

  const { spaces, loading: spacesLoading, error: spacesError, addSpace, updateSpace, deleteSpace } = useSpaces();
  const currentSpace = spaces.find((s) => s.id === selectedSpaceId) ?? null;
  const { role, loading: roleLoading } = useSpaceRole(currentSpace);
  const { cards, error: cardsError, addCard, updateCard, deleteCard } = useCards(selectedSpaceId);
  const { members, inviteMember, createManagedStaffMember, updateMemberRole, removeMember } = useSpaceStaff(currentSpace);

  const alertPreviews = React.useMemo(() => getAlertPreviews(cards, 7), [cards]);

  // Auth listener
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      setFirebaseUser(user);
      setAuthLoading(false);

      // Load profile info
      getDoc(doc(db, "users", user.uid)).then((snap) => {
        if (snap.exists()) {
          setProfileName(snap.data().displayName ?? snap.data().username ?? "");
          setProfilePhone(snap.data().phone ?? "");
        }
      }).catch(() => undefined);
    });
    return unsubscribe;
  }, [router]);

  // Auto-select first space when spaces load
  React.useEffect(() => {
    if (spaces.length > 0 && !selectedSpaceId) {
      setSelectedSpaceId(spaces[0].id);
    }
  }, [spaces, selectedSpaceId]);

  const handleCreateSpace = async () => {
    const name = spaceNameDraft.trim();
    if (!name) return;
    const id = await addSpace(name);
    setSpaceNameDraft("");
    if (id) {
      setSelectedSpaceId(id);
      setSpaceSheetVisible(false);
    }
  };

  const handleRenameSpace = (spaceId: string) => {
    const space = spaces.find((s) => s.id === spaceId);
    if (!space) return;
    Alert.prompt(
      "Rename Space",
      "Enter a new name:",
      async (newName) => {
        if (newName?.trim()) {
          await updateSpace(spaceId, { name: newName.trim() });
        }
      },
      "plain-text",
      space.name,
    );
  };

  const handleDeleteSpace = async (spaceId: string) => {
    if (selectedSpaceId === spaceId) setSelectedSpaceId(null);
    await deleteSpace(spaceId);
    setSpaceSheetVisible(false);
  };

  const handleOpenCard = (card: Card) => {
    setEditingCard(card);
    setCardModalVisible(true);
  };

  const handleCreateCard = () => {
    setEditingCard(null);
    setCardModalVisible(true);
  };

  const handleSaveCard = async (name: string, fields: CardField[]) => {
    if (editingCard) {
      await updateCard(editingCard.id, { name, fields });
    } else {
      await addCard(name, fields);
    }
    setCardModalVisible(false);
    setEditingCard(null);
  };

  const handleDeleteCard = async () => {
    if (!editingCard) return;
    await deleteCard(editingCard.id);
    setCardModalVisible(false);
    setEditingCard(null);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  const handleInvite = async () => {
    try {
      await inviteMember(inviteValue, inviteRole);
      setInviteValue("");
      Alert.alert("Success", "Member invited successfully.");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  const handleCreateStaff = async () => {
    try {
      await createManagedStaffMember(createStaffUsername, createStaffPassword, inviteRole);
      setCreateStaffUsername("");
      setCreateStaffPassword("");
      Alert.alert("Success", "Staff account created and added.");
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  };

  if (authLoading || spacesLoading || roleLoading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const tabContent = {
    home: (
      <HomeTab
        spaces={spaces}
        cards={cards}
        alerts={alertPreviews}
        membersCount={members.length}
        selectedSpaceId={selectedSpaceId}
        role={role}
        onSelectSpace={setSelectedSpaceId}
        onOpenSpaceSheet={() => setSpaceSheetVisible(true)}
        onOpenCard={handleOpenCard}
        onCreateCard={handleCreateCard}
        onOpenAlerts={() => setActiveTab("alerts")}
        onOpenStaff={() => { setSettingsVisible(false); setStaffVisible(true); }}
      />
    ),
    alerts: <AlertsTab cards={cards} />,
    settings: null,
  };

  const ownerLabel = firebaseUser
    ? (firebaseUser.displayName ?? firebaseUser.email ?? "")
    : "";

  return (
    <View style={styles.root}>
      <HeaderBar
        spaceName={currentSpace?.name ?? null}
        onOpenSpaceSheet={() => setSpaceSheetVisible(true)}
      />

      {/* Error banner */}
      {(spacesError || cardsError) && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{spacesError ?? cardsError}</Text>
        </View>
      )}

      {/* Tab content */}
      <View style={styles.tabContent}>
        {tabContent[activeTab]}
      </View>

      {/* Bottom tab bar */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom + 4 }]}>
        {(Object.keys(TAB_ICONS) as TabType[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={styles.tabItem}
              onPress={() => {
                if (tab === "settings") {
                  setSettingsVisible(true);
                } else {
                  setActiveTab(tab);
                }
              }}
            >
              {isActive && tab !== "settings" && <View style={styles.tabActiveIndicator} />}
              <Text style={styles.tabIcon}>{TAB_ICONS[tab]}</Text>
              <Text style={[styles.tabLabel, isActive && tab !== "settings" && styles.tabLabelActive]}>
                {TAB_LABELS[tab]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Modals */}
      <SpaceSheet
        visible={spaceSheetVisible}
        spaces={spaces}
        currentSpaceId={selectedSpaceId}
        draftName={spaceNameDraft}
        setDraftName={setSpaceNameDraft}
        onSelect={setSelectedSpaceId}
        onCreate={handleCreateSpace}
        onRename={handleRenameSpace}
        onDelete={handleDeleteSpace}
        onClose={() => setSpaceSheetVisible(false)}
        userRole={role}
      />

      <CardModal
        visible={cardModalVisible}
        editingCard={editingCard}
        spaceName={currentSpace?.name ?? ""}
        onSave={(name, fields) => void handleSaveCard(name, fields)}
        onDelete={editingCard ? () => void handleDeleteCard() : undefined}
        onClose={() => { setCardModalVisible(false); setEditingCard(null); }}
      />

      <SettingsModal
        visible={settingsVisible}
        space={currentSpace}
        cards={cards}
        alerts={alertPreviews}
        userRole={role}
        onOpenProfile={() => {
          setSettingsVisible(false);
          setProfileVisible(true);
        }}
        onOpenStaff={() => {
          setSettingsVisible(false);
          setStaffVisible(true);
        }}
        onClose={() => setSettingsVisible(false)}
      />

      <ProfileModal
        visible={profileVisible}
        firebaseUser={firebaseUser}
        nameInput={profileName}
        setNameInput={setProfileName}
        phoneInput={profilePhone}
        setPhoneInput={setProfilePhone}
        userRole={role}
        onLogout={handleLogout}
        onClose={() => setProfileVisible(false)}
      />

      <StaffModal
        visible={staffVisible}
        ownerLabel={ownerLabel}
        members={members}
        inviteValue={inviteValue}
        setInviteValue={setInviteValue}
        createUsernameValue={createStaffUsername}
        setCreateUsernameValue={setCreateStaffUsername}
        createPasswordValue={createStaffPassword}
        setCreatePasswordValue={setCreateStaffPassword}
        selectedRole={inviteRole}
        setSelectedRole={setInviteRole}
        onInvite={() => void handleInvite()}
        onCreateStaff={() => void handleCreateStaff()}
        onUpdateRole={(memberId, r) => void updateMemberRole(memberId, r)}
        onRemove={(memberId) => void removeMember(memberId)}
        onClose={() => setStaffVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  errorBanner: {
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#FFCDD2",
  },
  errorText: {
    color: "#C62828",
    fontSize: 12,
    textAlign: "center",
  },
  tabContent: {
    flex: 1,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E8ECF4",
    paddingTop: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    gap: 2,
    position: "relative",
  },
  tabActiveIndicator: {
    position: "absolute",
    top: 0,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#2196F3",
  },
  tabIcon: {
    fontSize: 20,
  },
  tabLabel: {
    fontSize: 10,
    color: "#9E9E9E",
    fontWeight: "600",
  },
  tabLabelActive: {
    color: "#2196F3",
  },
});

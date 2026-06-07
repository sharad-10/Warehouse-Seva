import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "../src/firebase/config";

export default function SignupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const handleSignup = async () => {
    if (!username || !phone || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    try {
      const normalizedUsername = username.trim().toLowerCase();
      const syntheticEmail = `${normalizedUsername}@warehouseseva.app`;

      // Check username availability
      const usernameRef = doc(db, "usernames", normalizedUsername);
      const usernameSnap = await getDoc(usernameRef);
      if (usernameSnap.exists()) {
        Alert.alert("Error", "Username already taken");
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, syntheticEmail, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: normalizedUsername });

      await setDoc(doc(db, "users", user.uid), {
        email: syntheticEmail,
        username: normalizedUsername,
        phone: phone.trim(),
        createdAt: new Date().toISOString(),
      });

      await setDoc(usernameRef, { uid: user.uid, email: syntheticEmail });

      router.replace("/");
    } catch (error: any) {
      if (error?.code === "permission-denied" || error?.message?.includes("permission-denied")) {
        Alert.alert("Firebase Rules Blocked Signup", "Update Firestore rules for usernames and users, then try again.");
        return;
      }
      Alert.alert("Signup Failed", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior="padding"
    >
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>🏭</Text>
        </View>
        <Text style={styles.appName}>Warehouse Seva</Text>
        <Text style={styles.tagline}>Create your account to get started</Text>
      </View>

      <View style={styles.card}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 24, 48) }]}
        >
          <Text style={styles.cardTitle}>Create Account</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Username</Text>
            <TextInput
              placeholder="Choose a username"
              placeholderTextColor="#BDBDBD"
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Phone Number</Text>
            <TextInput
              placeholder="Enter phone number"
              placeholderTextColor="#BDBDBD"
              style={styles.input}
              keyboardType="number-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Password</Text>
            <TextInput
              placeholder="Create a password (min 6 chars)"
              placeholderTextColor="#BDBDBD"
              style={styles.input}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Confirm Password</Text>
            <TextInput
              placeholder="Repeat your password"
              placeholderTextColor="#BDBDBD"
              style={styles.input}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <TouchableOpacity style={styles.signupBtn} onPress={handleSignup}>
            <Text style={styles.signupBtnText}>Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => router.replace("/login")}>
            <Text style={styles.loginLinkText}>Already have an account? </Text>
            <Text style={styles.loginLinkAccent}>Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#1A237E",
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 24,
    gap: 8,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  logoIcon: {
    fontSize: 32,
  },
  appName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 13,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  scrollContent: {
    padding: 28,
    gap: 14,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A237E",
    marginBottom: 4,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#424242",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#F5F7FA",
    padding: 13,
    borderRadius: 12,
    fontSize: 15,
    color: "#212121",
  },
  signupBtn: {
    backgroundColor: "#2196F3",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  signupBtnText: {
    fontWeight: "700",
    fontSize: 16,
    color: "#FFFFFF",
  },
  loginLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginLinkText: {
    fontSize: 14,
    color: "#757575",
  },
  loginLinkAccent: {
    fontSize: 14,
    color: "#2196F3",
    fontWeight: "700",
  },
});

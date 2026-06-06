import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "../src/firebase/config";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const showAuthError = (error: any) => {
    if (error?.code === "permission-denied" || error?.message?.includes("permission-denied")) {
      Alert.alert(
        "Firebase Rules Blocked Login",
        "Your Firestore rules are blocking access to the usernames collection. Allow reads on usernames for login by username, or log in with email until rules are updated.",
      );
      return;
    }
    Alert.alert("Login Failed", error.message);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter username/email and password");
      return;
    }

    try {
      let loginEmail = email.trim().toLowerCase();
      const usernameInput = loginEmail;

      if (!loginEmail.includes("@")) {
        // Fast path: try synthetic email before Firestore lookup
        const syntheticEmail = `${loginEmail}@warehouseseva.app`;
        try {
          await signInWithEmailAndPassword(auth, syntheticEmail, password);
          router.replace("/");
          return;
        } catch {
          // Not a synthetic-email account — fall through to Firestore lookup
        }

        const usernameSnap = await getDoc(doc(db, "usernames", loginEmail));

        if (usernameSnap.exists()) {
          loginEmail = usernameSnap.data().email;
        } else {
          const usersSnapshot = await getDocs(
            query(collection(db, "users"), where("username", "==", loginEmail)),
          );

          const firstUser = usersSnapshot.docs[0];
          if (!firstUser) {
            Alert.alert("Error", "Username not found");
            return;
          }

          loginEmail = firstUser.data().email;

          try {
            await setDoc(
              doc(db, "usernames", usernameInput),
              { uid: firstUser.id, email: loginEmail },
              { merge: true },
            );
          } catch {
            // Ignore mapping repair failures so username login still works.
          }
        }
      }

      await signInWithEmailAndPassword(auth, loginEmail, password);
      router.replace("/");
    } catch (error: any) {
      showAuthError(error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Branded header */}
      <View style={[styles.header, { paddingTop: insets.top + 32 }]}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoIcon}>🏭</Text>
        </View>
        <Text style={styles.appName}>Warehouse Seva</Text>
        <Text style={styles.tagline}>Manage your inventory with ease</Text>
      </View>

      {/* Form card */}
      <View style={[styles.card, { paddingBottom: Math.max(insets.bottom + 24, 48) }]}>
        <Text style={styles.cardTitle}>Welcome back</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Username or Email</Text>
          <TextInput
            placeholder="Enter username or email"
            placeholderTextColor="#BDBDBD"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Password</Text>
          <TextInput
            placeholder="Enter your password"
            placeholderTextColor="#BDBDBD"
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginBtnText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signupLink}
          onPress={() => router.replace("/signup")}
        >
          <Text style={styles.signupLinkText}>Don't have an account? </Text>
          <Text style={styles.signupLinkAccent}>Create one</Text>
        </TouchableOpacity>
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
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 32,
    gap: 10,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  logoIcon: {
    fontSize: 38,
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    gap: 16,
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
  loginBtn: {
    backgroundColor: "#2196F3",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 4,
  },
  loginBtnText: {
    fontWeight: "700",
    fontSize: 16,
    color: "#FFFFFF",
  },
  signupLink: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  signupLinkText: {
    fontSize: 14,
    color: "#757575",
  },
  signupLinkAccent: {
    fontSize: 14,
    color: "#2196F3",
    fontWeight: "700",
  },
});

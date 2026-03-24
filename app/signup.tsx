import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth, db } from "../src/firebase/config";
import { useLanguage } from "@/src/i18n/LanguageContext";

export default function SignupScreen() {
  const router = useRouter();
  const { t } = useLanguage();

  const [email, setEmail] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

  const showSignupError = (error: any) => {
    if (error?.code === "permission-denied" || error?.message?.includes("permission-denied")) {
      Alert.alert(
        "Firebase Rules Blocked Signup",
        "Your Firestore rules are blocking the username check or profile creation. Update Firestore rules for usernames and users, then try again.",
      );
      return;
    }

    Alert.alert("Signup Failed", error.message);
  };

  const handleSignup = async () => {
    if (!email || !username || !phone || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedUsername = username.trim().toLowerCase();

      // 1️⃣ Check if username already exists
      const usernameRef = doc(db, "usernames", normalizedUsername);
      const usernameSnap = await getDoc(usernameRef);

      if (usernameSnap.exists()) {
        Alert.alert("Error", "Username already taken");
        return;
      }

      // 2️⃣ Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        normalizedEmail,
        password,
      );

      const user = userCredential.user;

      await updateProfile(user, {
        displayName: normalizedUsername,
      });

      // 3️⃣ Save user data
      await setDoc(doc(db, "users", user.uid), {
        email: normalizedEmail,
        username: normalizedUsername,
        phone: phone.trim(),
        createdAt: new Date().toISOString(),
      });

      // 4️⃣ Create username → email mapping
      await setDoc(usernameRef, {
        uid: user.uid,
        email: normalizedEmail,
      });
      router.replace("/");
    } catch (error: any) {
      showSignupError(error);
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("signup.title")}</Text>

      <TextInput
        placeholder={t("signup.email")}
        placeholderTextColor="#999"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder={t("signup.username")}
        placeholderTextColor="#999"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        placeholder={t("signup.phone")}
        placeholderTextColor="#999"
        style={styles.input}
        keyboardType="number-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <TextInput
        placeholder={t("signup.password")}
        placeholderTextColor="#999"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        placeholder={t("signup.confirmPassword")}
        placeholderTextColor="#999"
        style={styles.input}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.btnText}>{t("signup.button")}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.link}
        onPress={() => router.replace("/login")}
      >
        <Text>{t("signup.haveAccount")}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 30,
    backgroundColor: "#FFFDF7",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#F4B400",
    marginBottom: 25,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#F2E6B3",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#F4B400",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: {
    fontWeight: "bold",
    color: "#fff",
  },
  link: {
    marginTop: 15,
    alignItems: "center",
  },
});

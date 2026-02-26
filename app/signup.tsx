import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
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

export default function SignupScreen() {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");

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
      // 1️⃣ Check if username already exists
      const usernameRef = doc(db, "usernames", username.toLowerCase());
      const usernameSnap = await getDoc(usernameRef);

      if (usernameSnap.exists()) {
        Alert.alert("Error", "Username already taken");
        return;
      }

      // 2️⃣ Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      const user = userCredential.user;

      // 3️⃣ Save user data
      await setDoc(doc(db, "users", user.uid), {
        email,
        phone,
        createdAt: new Date(),
        currentRole: "admin", // 👈 First login role
      });

      // 4️⃣ Create username → email mapping
      await setDoc(usernameRef, {
        uid: user.uid,
        email,
        role: "admin", // 👈 FIRST USER = ADMIN
      });
      router.replace("/");
    } catch (error: any) {
      Alert.alert("Signup Failed", error.message);
    }
  };
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      <TextInput
        placeholder="Enter email"
        placeholderTextColor="#999"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Enter username"
        placeholderTextColor="#999"
        style={styles.input}
        value={username}
        onChangeText={setUsername}
      />

      <TextInput
        placeholder="Enter phone number"
        placeholderTextColor="#999"
        style={styles.input}
        keyboardType="number-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <TextInput
        placeholder="Enter password"
        placeholderTextColor="#999"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TextInput
        placeholder="Confirm password"
        placeholderTextColor="#999"
        style={styles.input}
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.btnText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.link}
        onPress={() => router.replace("/login")}
      >
        <Text>Already have account? Login</Text>
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

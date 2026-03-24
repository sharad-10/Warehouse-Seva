import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
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

export default function LoginScreen() {
  const router = useRouter();
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

      // If input does NOT contain @ → treat as username
      if (!loginEmail.includes("@")) {
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
              {
                uid: firstUser.id,
                email: loginEmail,
              },
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
    <View style={styles.container}>
      <Text style={styles.title}>Warehouse Seva</Text>

      <TextInput
        placeholder="Enter email or username"
        placeholderTextColor="#999"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Enter your password"
        placeholderTextColor="#999"
        style={styles.input}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.btnText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.link}
        onPress={() => router.replace("/signup")}
      >
        <Text>Create new account</Text>
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
    fontSize: 26,
    fontWeight: "bold",
    color: "#F4B400",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#F2E6B3",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
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

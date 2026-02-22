import { Redirect } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { auth } from "../src/firebase/config";

export default function Index() {
  const [user, setUser] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#F4B400" />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;

  return <Redirect href="/warehouse" />;
}

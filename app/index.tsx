import { Redirect } from "expo-router";
import { useAuthStore } from "../src/store/useAuthStore";

export default function Index() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/warehouse" />;
}

import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { auth, db } from "../firebase/config";

export function useUserRole() {
  const [role, setRole] = useState<"admin" | "edit" | "view">("admin");

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const unsubscribe = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists()) {
        setRole(snap.data().currentRole || "admin");
      }
    });

    return unsubscribe;
  }, []);

  return role;
}

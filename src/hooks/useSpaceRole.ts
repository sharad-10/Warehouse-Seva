import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

import { auth, db } from "../firebase/config";
import { Space, SpaceRole } from "../types/index";

export function useSpaceRole(space: Space | null) {
  const [role, setRole] = useState<SpaceRole>("view");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!space) {
      setRole("view");
      setError(null);
      setLoading(false);
      return;
    }

    let unsubscribeRole: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeRole?.();

      if (!user) {
        setRole("view");
        setError(null);
        setLoading(false);
        return;
      }

      if (space.ownerId === user.uid) {
        setRole("admin");
        setError(null);
        setLoading(false);
        return;
      }

      unsubscribeRole = onSnapshot(
        doc(db, "spaceMembers", `${space.id}_${user.uid}`),
        (snap) => {
          setRole((snap.data()?.role as SpaceRole | undefined) ?? "view");
          setError(null);
          setLoading(false);
        },
        (err) => {
          setRole("view");
          setError(err.message);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeRole?.();
    };
  }, [space]);

  return { role, loading, error };
}

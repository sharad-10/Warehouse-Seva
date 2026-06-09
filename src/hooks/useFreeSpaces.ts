import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import { auth, db } from "../firebase/config";
import { FreeSpace } from "../types/index";

export function useFreeSpaces() {
  const [freeSpaces, setFreeSpaces] = useState<FreeSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeSnapshot?.();

      if (!user) {
        setFreeSpaces([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      unsubscribeSnapshot = onSnapshot(
        collection(db, "freeSpaces"),
        (snap) => {
          const data: FreeSpace[] = snap.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<FreeSpace, "id">) }))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          setFreeSpaces(data);
          setError(null);
          setLoading(false);
        },
        (err) => {
          setFreeSpaces([]);
          setError(err.message);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSnapshot?.();
    };
  }, []);

  const addFreeSpace = async (
    data: Omit<FreeSpace, "id" | "ownerId" | "ownerName" | "createdAt">,
  ) => {
    const user = auth.currentUser;
    if (!user) return;
    await addDoc(collection(db, "freeSpaces"), {
      ...data,
      ownerId: user.uid,
      ownerName: user.displayName ?? user.email ?? "Unknown",
      createdAt: new Date().toISOString(),
    });
  };

  const updateFreeSpace = async (
    id: string,
    data: Partial<Omit<FreeSpace, "id" | "ownerId" | "createdAt">>,
  ) => {
    await updateDoc(doc(db, "freeSpaces", id), data);
  };

  const deleteFreeSpace = async (id: string) => {
    await deleteDoc(doc(db, "freeSpaces", id));
  };

  return { freeSpaces, loading, error, addFreeSpace, updateFreeSpace, deleteFreeSpace };
}

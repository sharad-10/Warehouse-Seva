import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import { auth, db } from "../firebase/config";
import { Space } from "../types/index";

const normalizeSpace = (d: { id: string; data: () => object }): Space => ({
  id: d.id,
  ...(d.data() as Omit<Space, "id">),
});

export function useSpaces() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribeOwned: (() => void) | undefined;
    let unsubscribeMemberships: (() => void) | undefined;
    let unsubscribeShared: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      unsubscribeOwned?.();
      unsubscribeMemberships?.();
      unsubscribeShared?.();

      if (!user) {
        setSpaces([]);
        setError(null);
        setLoading(false);
        return;
      }

      let ownedSpaces: Space[] = [];
      let sharedSpaces: Space[] = [];

      const sync = () => {
        const merged = [...ownedSpaces, ...sharedSpaces];
        const unique = Array.from(new Map(merged.map((s) => [s.id, s])).values());
        unique.sort((a, b) => a.name.localeCompare(b.name));
        setSpaces(unique);
        setError(null);
        setLoading(false);
      };

      unsubscribeOwned = onSnapshot(
        query(collection(db, "spaces"), where("ownerId", "==", user.uid)),
        (snap) => {
          ownedSpaces = snap.docs.map(normalizeSpace);
          sync();
        },
        (err) => {
          setSpaces([]);
          setError(err.message);
          setLoading(false);
        },
      );

      unsubscribeMemberships = onSnapshot(
        query(collection(db, "spaceMembers"), where("uid", "==", user.uid)),
        (memberSnap) => {
          unsubscribeShared?.();
          const spaceIds = memberSnap.docs
            .map((d) => d.data().spaceId as string)
            .filter(Boolean);

          if (spaceIds.length === 0) {
            sharedSpaces = [];
            sync();
            return;
          }

          unsubscribeShared = onSnapshot(
            query(collection(db, "spaces"), where(documentId(), "in", spaceIds.slice(0, 10))),
            (sharedSnap) => {
              sharedSpaces = sharedSnap.docs.map(normalizeSpace);
              sync();
            },
            (err) => {
              sharedSpaces = [];
              setError(err.message);
              setLoading(false);
            },
          );
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeOwned?.();
      unsubscribeMemberships?.();
      unsubscribeShared?.();
    };
  }, []);

  const addSpace = async (name: string) => {
    const user = auth.currentUser;
    if (!user) return;
    const ref = await addDoc(collection(db, "spaces"), {
      name,
      ownerId: user.uid,
      createdAt: new Date().toISOString(),
    });
    await setDoc(doc(db, "users", user.uid), { uid: user.uid }, { merge: true });
    return ref.id;
  };

  const updateSpace = async (id: string, data: Partial<Space>) => {
    await updateDoc(doc(db, "spaces", id), data);
  };

  const deleteSpace = async (id: string) => {
    // Cascade: delete all cards in this space
    const cardsSnap = await getDocs(query(collection(db, "cards"), where("spaceId", "==", id)));
    await Promise.all(cardsSnap.docs.map((d) => deleteDoc(d.ref)));
    // Cascade: delete all space members
    const membersSnap = await getDocs(query(collection(db, "spaceMembers"), where("spaceId", "==", id)));
    await Promise.all(membersSnap.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(doc(db, "spaces", id));
  };

  return { spaces, loading, error, addSpace, updateSpace, deleteSpace };
}

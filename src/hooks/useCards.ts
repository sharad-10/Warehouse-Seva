import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import { db } from "../firebase/config";
import { Card, CardField } from "../types/index";

export function useCards(spaceId: string | null) {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!spaceId) {
      setCards([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      query(collection(db, "cards"), where("spaceId", "==", spaceId)),
      (snap) => {
        const data: Card[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Card, "id">),
          fields: (d.data().fields as CardField[]) ?? [],
        }));
        data.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        setCards(data);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setCards([]);
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [spaceId]);

  const addCard = async (name: string, fields: CardField[] = []) => {
    if (!spaceId) return;
    await addDoc(collection(db, "cards"), {
      spaceId,
      name,
      fields,
      createdAt: new Date().toISOString(),
    });
  };

  const updateCard = async (id: string, data: Partial<Omit<Card, "id">>) => {
    await updateDoc(doc(db, "cards", id), data);
  };

  const deleteCard = async (id: string) => {
    await deleteDoc(doc(db, "cards", id));
  };

  return { cards, loading, error, addCard, updateCard, deleteCard };
}

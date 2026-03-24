import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import { db } from "../firebase/config";
import { Stick } from "../types/warehouse";

export function useSticks(warehouseId: string | null) {
  const [sticks, setSticks] = useState<Stick[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!warehouseId) {
      setSticks([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      query(collection(db, "sticks"), where("warehouseId", "==", warehouseId)),
      (snapshot) => {
        const data = snapshot.docs.map((stickDoc) => ({
          id: stickDoc.id,
          ...(stickDoc.data() as Omit<Stick, "id">),
        }));

        data.sort((a, b) => {
          if (a.row !== b.row) {
            return a.row - b.row;
          }

          if (a.col !== b.col) {
            return a.col - b.col;
          }

          return (a.createdAt ?? "").localeCompare(b.createdAt ?? "");
        });

        setSticks(data);
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        setSticks([]);
        setError(snapshotError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [warehouseId]);

  const createStick = async (name: string) => {
    if (!warehouseId) return;

    await addDoc(collection(db, "sticks"), {
      warehouseId,
      name,
      row: sticks.length,
      col: 0,
      createdAt: new Date().toISOString(),
    });
  };

  const deleteStick = async (id: string) => {
    await deleteDoc(doc(db, "sticks", id));
  };

  return { sticks, loading, error, createStick, deleteStick };
}

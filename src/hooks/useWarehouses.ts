import { onAuthStateChanged } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import { auth, db } from "../firebase/config";
import { Warehouse } from "../types/warehouse";

const DEFAULT_LAYOUT = {
  stickRows: 3,
  stickCols: 1,
  stickWidth: 90,
  stickLength: 120,
};

const normalizeWarehouse = (warehouseDoc: { id: string; data: () => object }): Warehouse => ({
  id: warehouseDoc.id,
  ...(warehouseDoc.data() as Omit<Warehouse, "id">),
  stickRows:
    (warehouseDoc.data() as Partial<Warehouse>).stickRows ?? DEFAULT_LAYOUT.stickRows,
  stickCols:
    (warehouseDoc.data() as Partial<Warehouse>).stickCols ?? DEFAULT_LAYOUT.stickCols,
  stickWidth: DEFAULT_LAYOUT.stickWidth,
  stickLength: DEFAULT_LAYOUT.stickLength,
});

export function useWarehouses() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
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
        setWarehouses([]);
        setError(null);
        setLoading(false);
        return;
      }

      let ownedWarehouses: Warehouse[] = [];
      let sharedWarehouses: Warehouse[] = [];

      const syncWarehouses = () => {
        const merged = [...ownedWarehouses, ...sharedWarehouses];
        const unique = Array.from(new Map(merged.map((item) => [item.id, item])).values());

        unique.sort((a, b) => a.name.localeCompare(b.name));
        setWarehouses(unique);
        setError(null);
        setLoading(false);
      };

      unsubscribeOwned = onSnapshot(
        query(collection(db, "warehouses"), where("ownerId", "==", user.uid)),
        (snapshot) => {
          ownedWarehouses = snapshot.docs.map(normalizeWarehouse);

          syncWarehouses();
        },
        (snapshotError) => {
          setWarehouses([]);
          setError(snapshotError.message);
          setLoading(false);
        },
      );

      unsubscribeMemberships = onSnapshot(
        query(collection(db, "warehouseMembers"), where("uid", "==", user.uid)),
        (membershipSnapshot) => {
          unsubscribeShared?.();

          const warehouseIds = membershipSnapshot.docs
            .map((memberDoc) => memberDoc.data().warehouseId as string)
            .filter(Boolean);

          if (warehouseIds.length === 0) {
            sharedWarehouses = [];
            syncWarehouses();
            return;
          }

          unsubscribeShared = onSnapshot(
            query(
              collection(db, "warehouses"),
              where(documentId(), "in", warehouseIds.slice(0, 10)),
            ),
            (sharedSnapshot) => {
              sharedWarehouses = sharedSnapshot.docs.map(normalizeWarehouse);

              syncWarehouses();
            },
            (snapshotError) => {
              sharedWarehouses = [];
              setError(snapshotError.message);
              setLoading(false);
            },
          );
        },
        (snapshotError) => {
          setError(snapshotError.message);
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

  const addWarehouse = async (name: string) => {
    const user = auth.currentUser;
    if (!user) return;

    const newWarehouse = await addDoc(collection(db, "warehouses"), {
      name,
      ownerId: user.uid,
      createdAt: new Date().toISOString(),
      ...DEFAULT_LAYOUT,
    });

    await setDoc(doc(db, "users", user.uid), { email: user.email ?? "" }, { merge: true });
    return newWarehouse.id;
  };

  const updateWarehouse = async (id: string, data: Partial<Warehouse>) => {
    await updateDoc(doc(db, "warehouses", id), data);
  };

  const deleteWarehouse = async (id: string) => {
    await deleteDoc(doc(db, "warehouses", id));
  };

  return {
    warehouses,
    loading,
    error,
    addWarehouse,
    updateWarehouse,
    deleteWarehouse,
  };
}

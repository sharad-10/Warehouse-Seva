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

export function useRacks(warehouseId: string | null) {
  const [racks, setRacks] = useState<any[]>([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user || !warehouseId) {
      setRacks([]);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "warehouses", warehouseId, "racks"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRacks(data);
      },
    );

    return unsubscribe;
  }, [user, warehouseId]);

  const addRack = async () => {
    if (!user || !warehouseId) return;

    await addDoc(
      collection(db, "users", user.uid, "warehouses", warehouseId, "racks"),
      {
        name: "Rack",
        position: [0, 1, 0],
        stock: 0,
        width: 1.5,
        depth: 1,
        bagsPerLevel: 5,
        entryDate: "",
        expiryDate: "",
        rate: 0,
        createdAt: new Date(),
      },
    );
  };

  const updateRack = async (id: string, data: any) => {
    if (!user || !warehouseId) return;

    await updateDoc(
      doc(db, "users", user.uid, "warehouses", warehouseId, "racks", id),
      data,
    );
  };

  const deleteRack = async (id: string) => {
    if (!user || !warehouseId) return;

    await deleteDoc(
      doc(db, "users", user.uid, "warehouses", warehouseId, "racks", id),
    );
  };

  return {
    racks,
    addRack,
    updateRack,
    deleteRack,
  };
}

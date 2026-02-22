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

export function useWarehouses() {
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const unsubscribe = onSnapshot(
      collection(db, "users", user.uid, "warehouses"),
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setWarehouses(data);
      },
    );

    return unsubscribe;
  }, [user]);

  const addWarehouse = async (name: string) => {
    if (!user) return;

    await addDoc(collection(db, "users", user.uid, "warehouses"), {
      name,
      createdAt: new Date(),
    });
  };

  const deleteWarehouse = async (id: string) => {
    if (!user) return;

    await deleteDoc(doc(db, "users", user.uid, "warehouses", id));
  };

  const renameWarehouse = async (id: string, name: string) => {
    if (!user) return;

    await updateDoc(doc(db, "users", user.uid, "warehouses", id), { name });
  };

  return {
    warehouses,
    addWarehouse,
    deleteWarehouse,
    renameWarehouse,
  };
}

import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

import { auth, db } from "../firebase/config";
import { Warehouse, WarehouseRole } from "../types/warehouse";

export function useUserRole(warehouse: Warehouse | null) {
  const [role, setRole] = useState<WarehouseRole>("view");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!warehouse) {
      setRole("view");
      setError(null);
      setLoading(false);
      return;
    }

    let unsubscribeRole: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setRole("view");
        setError(null);
        setLoading(false);
        return;
      }

      if (warehouse.ownerId === user.uid) {
        setRole("admin");
        setError(null);
        setLoading(false);
        return;
      }

      unsubscribeRole = onSnapshot(
        doc(db, "warehouseMembers", `${warehouse.id}_${user.uid}`),
        (snapshot) => {
          setRole((snapshot.data()?.role as WarehouseRole | undefined) ?? "view");
          setError(null);
          setLoading(false);
        },
        (snapshotError) => {
          setRole("view");
          setError(snapshotError.message);
          setLoading(false);
        },
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeRole?.();
    };
  }, [warehouse]);

  return { role, loading, error };
}

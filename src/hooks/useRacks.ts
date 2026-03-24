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
import { Rack, Warehouse } from "../types/warehouse";

export function useRacks(warehouseId: string | null) {
  const [racks, setRacks] = useState<Rack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!warehouseId) {
      setRacks([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      query(collection(db, "racks"), where("warehouseId", "==", warehouseId)),
      (snapshot) => {
        const data = snapshot.docs.map((rackDoc) => ({
          id: rackDoc.id,
          ...(rackDoc.data() as Omit<Rack, "id">),
        }));

        data.sort((a, b) => a.name.localeCompare(b.name));
        setRacks(data);
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        setRacks([]);
        setError(snapshotError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [warehouseId]);

  const addRack = async (
    warehouse: Warehouse,
    rackInput?: Partial<Rack> & { name: string; stock: number; stackCount: number; occupancyPercent: number; stickId: string },
  ) => {
    const rackCount = racks.length + 1;
    const stock = rackInput?.stock ?? 0;
    const stackCount = rackInput?.stackCount ?? 1;

    await addDoc(collection(db, "racks"), {
      warehouseId: warehouse.id,
      stickId: rackInput?.stickId ?? "",
      name: rackInput?.name ?? `Rack ${rackCount}`,
      material: rackInput?.material ?? "",
      position: rackInput?.position ?? [0, 1, 0],
      stock,
      width: rackInput?.width ?? 12,
      depth: rackInput?.depth ?? 8,
      stackCount,
      bagsPerLevel: Math.max(1, Math.ceil(stock / stackCount)),
      occupancyPercent: rackInput?.occupancyPercent ?? 25,
      entryDate: rackInput?.entryDate ?? new Date().toISOString().split("T")[0],
      expiryDate: "",
      rate: 0,
    });
  };

  const updateRack = async (id: string, data: Partial<Rack>) => {
    await updateDoc(doc(db, "racks", id), data);
  };

  const deleteRack = async (id: string) => {
    await deleteDoc(doc(db, "racks", id));
  };

  return {
    racks,
    loading,
    error,
    addRack,
    updateRack,
    deleteRack,
  };
}

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import { db } from "../firebase/config";
import { Warehouse, WarehouseMember, WarehouseRole } from "../types/warehouse";

export function useWarehouseStaff(warehouse: Warehouse | null) {
  const [members, setMembers] = useState<WarehouseMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!warehouse) {
      setMembers([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      query(collection(db, "warehouseMembers"), where("warehouseId", "==", warehouse.id)),
      (snapshot) => {
        const memberDocs = snapshot.docs.map((memberDoc) => ({
          id: memberDoc.id,
          ...(memberDoc.data() as Omit<WarehouseMember, "id">),
        }));

        setMembers(memberDocs.sort((a, b) => (a.username ?? a.email ?? "").localeCompare(b.username ?? b.email ?? "")));
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        setMembers([]);
        setError(snapshotError.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [warehouse]);

  const inviteMember = async (identifier: string, role: WarehouseRole) => {
    if (!warehouse) {
      throw new Error("Select a warehouse first.");
    }

    const normalized = identifier.trim().toLowerCase();
    if (!normalized) {
      throw new Error("Enter a username or email.");
    }

    let targetUid = "";
    let username = "";
    let email = "";

    if (normalized.includes("@")) {
      const usersSnapshot = await getDocs(
        query(collection(db, "users"), where("email", "==", normalized)),
      );

      const firstUser = usersSnapshot.docs[0];
      if (!firstUser) {
        throw new Error("No user found with that email.");
      }

      targetUid = firstUser.id;
      username = firstUser.data().username ?? "";
      email = firstUser.data().email ?? normalized;
    } else {
      const usernameSnapshot = await getDoc(doc(db, "usernames", normalized));

      if (usernameSnapshot.exists()) {
        targetUid = usernameSnapshot.data().uid;
        username = normalized;
        email = usernameSnapshot.data().email ?? "";
      } else {
        const usersSnapshot = await getDocs(
          query(collection(db, "users"), where("username", "==", normalized)),
        );

        const firstUser = usersSnapshot.docs[0];
        if (!firstUser) {
          throw new Error("Username not found.");
        }

        targetUid = firstUser.id;
        username = firstUser.data().username ?? normalized;
        email = firstUser.data().email ?? "";

        // Best-effort repair for older accounts that are missing username mapping.
        // If rules block this write, inviting should still continue successfully.
        try {
          await setDoc(
            doc(db, "usernames", normalized),
            {
              uid: targetUid,
              email,
            },
            { merge: true },
          );
        } catch {
          // Ignore mapping repair failures here.
        }
      }
    }

    if (targetUid === warehouse.ownerId) {
      throw new Error("The warehouse owner already has admin access.");
    }

    await setDoc(doc(db, "warehouseMembers", `${warehouse.id}_${targetUid}`), {
      uid: targetUid,
      warehouseId: warehouse.id,
      username,
      email,
      role,
    });
  };

  const updateMemberRole = async (memberId: string, role: WarehouseRole) => {
    await updateDoc(doc(db, "warehouseMembers", memberId), { role });
  };

  const removeMember = async (memberId: string) => {
    await deleteDoc(doc(db, "warehouseMembers", memberId));
  };

  return {
    members,
    loading,
    error,
    inviteMember,
    updateMemberRole,
    removeMember,
  };
}

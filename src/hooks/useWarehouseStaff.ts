import { deleteApp, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  signOut,
} from "firebase/auth";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

import { auth, db, firebaseConfig } from "../firebase/config";
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

    const trimmedIdentifier = identifier.trim();
    const normalized = trimmedIdentifier.toLowerCase();
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
        throw new Error("No account found with that email. Ask this staff member to sign up first.");
      }

      targetUid = firstUser.id;
      username = firstUser.data().username ?? "";
      email = firstUser.data().email ?? normalized;
    } else {
      const usernameSnapshot = await getDoc(doc(db, "usernames", normalized));
      const legacyUsernameSnapshot =
        normalized === trimmedIdentifier
          ? usernameSnapshot
          : await getDoc(doc(db, "usernames", trimmedIdentifier));

      if (usernameSnapshot.exists()) {
        targetUid = usernameSnapshot.data().uid;
        username = normalized;
        email = usernameSnapshot.data().email ?? "";
      } else if (legacyUsernameSnapshot.exists()) {
        targetUid = legacyUsernameSnapshot.data().uid;
        username = legacyUsernameSnapshot.id;
        email = legacyUsernameSnapshot.data().email ?? "";
      } else {
        let usersSnapshot = await getDocs(
          query(collection(db, "users"), where("username", "==", normalized)),
        );

        if (usersSnapshot.empty && trimmedIdentifier !== normalized) {
          usersSnapshot = await getDocs(
            query(collection(db, "users"), where("username", "==", trimmedIdentifier)),
          );
        }

        const firstUser = usersSnapshot.docs[0];
        if (!firstUser) {
          throw new Error(
            "No account found for this username. Ask this staff member to sign up first, then invite by username or email.",
          );
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

  const createManagedStaffMember = async (
    usernameInput: string,
    password: string,
    role: WarehouseRole,
  ) => {
    if (!warehouse) {
      throw new Error("Select a warehouse first.");
    }

    const adminUser = auth.currentUser;
    if (!adminUser) {
      throw new Error("Only a signed-in admin can create staff.");
    }

    const normalizedUsername = usernameInput.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!normalizedUsername) {
      throw new Error("Enter a staff username.");
    }

    if (trimmedPassword.length < 6) {
      throw new Error("Staff password must be at least 6 characters.");
    }

    const usernameDoc = await getDoc(doc(db, "usernames", normalizedUsername));
    if (usernameDoc.exists()) {
      throw new Error("That username is already in use.");
    }

    const existingUserSnapshot = await getDocs(
      query(collection(db, "users"), where("username", "==", normalizedUsername)),
    );
    if (!existingUserSnapshot.empty) {
      throw new Error("That username is already in use.");
    }

    const syntheticEmail = `${normalizedUsername}@staff.warehouse-seva.app`;
    const tempAppName = `staff-create-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);
    const tempDb = getFirestore(tempApp);

    try {
      const credential = await createUserWithEmailAndPassword(
        tempAuth,
        syntheticEmail,
        trimmedPassword,
      );

      await setDoc(doc(tempDb, "users", credential.user.uid), {
        email: syntheticEmail,
        username: normalizedUsername,
        phone: "",
        createdAt: new Date().toISOString(),
        createdByAdminUid: adminUser.uid,
      });

      await setDoc(doc(tempDb, "usernames", normalizedUsername), {
        uid: credential.user.uid,
        email: syntheticEmail,
      });

      await setDoc(doc(db, "warehouseMembers", `${warehouse.id}_${credential.user.uid}`), {
        uid: credential.user.uid,
        warehouseId: warehouse.id,
        username: normalizedUsername,
        email: syntheticEmail,
        role,
      });
    } finally {
      await signOut(tempAuth).catch(() => undefined);
      await deleteApp(tempApp).catch(() => undefined);
    }
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
    createManagedStaffMember,
    updateMemberRole,
    removeMember,
  };
}

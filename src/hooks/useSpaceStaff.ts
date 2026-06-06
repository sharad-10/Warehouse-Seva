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
import { Space, SpaceMember, SpaceRole } from "../types/index";

export function useSpaceStaff(space: Space | null) {
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!space) {
      setMembers([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      query(collection(db, "spaceMembers"), where("spaceId", "==", space.id)),
      (snap) => {
        const data: SpaceMember[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<SpaceMember, "id">),
        }));
        data.sort((a, b) => (a.username ?? a.email ?? "").localeCompare(b.username ?? b.email ?? ""));
        setMembers(data);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setMembers([]);
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [space]);

  const inviteMember = async (identifier: string, role: SpaceRole) => {
    if (!space) throw new Error("Select a space first.");

    const trimmed = identifier.trim();
    const normalized = trimmed.toLowerCase();
    if (!normalized) throw new Error("Enter a username or email.");

    let targetUid = "";
    let username = "";
    let email = "";

    if (normalized.includes("@")) {
      const snap = await getDocs(query(collection(db, "users"), where("email", "==", normalized)));
      const first = snap.docs[0];
      if (!first) throw new Error("No account found with that email.");
      targetUid = first.id;
      username = first.data().username ?? "";
      email = first.data().email ?? normalized;
    } else {
      const usernameSnap = await getDoc(doc(db, "usernames", normalized));
      if (usernameSnap.exists()) {
        targetUid = usernameSnap.data().uid;
        username = normalized;
        email = usernameSnap.data().email ?? "";
      } else {
        const usersSnap = await getDocs(query(collection(db, "users"), where("username", "==", normalized)));
        const first = usersSnap.docs[0];
        if (!first) throw new Error("No account found for this username.");
        targetUid = first.id;
        username = first.data().username ?? normalized;
        email = first.data().email ?? "";
        try {
          await setDoc(doc(db, "usernames", normalized), { uid: targetUid, email }, { merge: true });
        } catch { /* ignore mapping repair failures */ }
      }
    }

    if (targetUid === space.ownerId) throw new Error("The space owner already has admin access.");

    await setDoc(doc(db, "spaceMembers", `${space.id}_${targetUid}`), {
      uid: targetUid,
      spaceId: space.id,
      username,
      email,
      role,
    });
  };

  const createManagedStaffMember = async (usernameInput: string, password: string, role: SpaceRole) => {
    if (!space) throw new Error("Select a space first.");
    const adminUser = auth.currentUser;
    if (!adminUser) throw new Error("Only a signed-in admin can create staff.");

    const normalizedUsername = usernameInput.trim().toLowerCase();
    const trimmedPassword = password.trim();
    if (!normalizedUsername) throw new Error("Enter a staff username.");
    if (trimmedPassword.length < 6) throw new Error("Password must be at least 6 characters.");

    const usernameDoc = await getDoc(doc(db, "usernames", normalizedUsername));
    if (usernameDoc.exists()) throw new Error("That username is already in use.");

    const existingSnap = await getDocs(query(collection(db, "users"), where("username", "==", normalizedUsername)));
    if (!existingSnap.empty) throw new Error("That username is already in use.");

    const syntheticEmail = `${normalizedUsername}@staff.warehouseseva.app`;
    const tempAppName = `staff-create-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const tempApp = initializeApp(firebaseConfig, tempAppName);
    const tempAuth = getAuth(tempApp);
    const tempDb = getFirestore(tempApp);

    try {
      const credential = await createUserWithEmailAndPassword(tempAuth, syntheticEmail, trimmedPassword);
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
      await setDoc(doc(db, "spaceMembers", `${space.id}_${credential.user.uid}`), {
        uid: credential.user.uid,
        spaceId: space.id,
        username: normalizedUsername,
        email: syntheticEmail,
        role,
      });
    } finally {
      await signOut(tempAuth).catch(() => undefined);
      await deleteApp(tempApp).catch(() => undefined);
    }
  };

  const updateMemberRole = async (memberId: string, role: SpaceRole) => {
    await updateDoc(doc(db, "spaceMembers", memberId), { role });
  };

  const removeMember = async (memberId: string) => {
    await deleteDoc(doc(db, "spaceMembers", memberId));
  };

  return { members, loading, error, inviteMember, createManagedStaffMember, updateMemberRole, removeMember };
}

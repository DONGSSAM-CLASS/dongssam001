import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from './firebase';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [member, setMember] = useState(null);   // members/{uid}
  const [admin, setAdmin] = useState(null);     // admins/{uid}
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setMember(null);
        setAdmin(null);
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    setLoading(true);
    let got = 0;
    const done = () => { got += 1; if (got >= 2) setLoading(false); };

    const unsubMember = onSnapshot(
      doc(db, 'members', user.uid),
      (s) => { setMember(s.exists() ? { id: s.id, ...s.data() } : null); done(); },
      () => { setMember(null); done(); }
    );
    const unsubAdmin = onSnapshot(
      doc(db, 'admins', user.uid),
      (s) => { setAdmin(s.exists() ? { id: s.id, ...s.data() } : null); done(); },
      () => { setAdmin(null); done(); }
    );
    return () => { unsubMember(); unsubAdmin(); };
  }, [user]);

  const adminVerified = useMemo(() => {
    const until = admin?.verifiedUntil?.toDate?.();
    return Boolean(until && until.getTime() > Date.now());
  }, [admin]);

  const isStaffEditor = Boolean(
    user?.emailVerified && member?.status === 'approved' && member?.memberType === 'staff'
  );
  const canManageContent = adminVerified || isStaffEditor;
  const canWriteLesson = Boolean(
    member?.status === 'approved' && ['staff', 'member'].includes(member?.memberType)
  );

  const value = useMemo(
    () => ({
      user,
      member,
      admin,
      isAdmin: Boolean(admin),
      adminVerified,
      isStaffEditor,
      canManageContent,
      canWriteLesson,
      loading,
      logout: () => (isFirebaseConfigured ? signOut(auth) : Promise.resolve()),
    }),
    [user, member, admin, adminVerified, isStaffEditor, canManageContent, canWriteLesson, loading]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export async function ensureAnonAuth(): Promise<string | null> {
  try {
    const appMod: any = await import("firebase/app");
    const authMod: any = await import("firebase/auth");

    const app = appMod.getApps().length ? appMod.getApps()[0] : null;
    if (!app) return null;

    const auth = authMod.getAuth(app);

    if (auth.currentUser?.uid) return auth.currentUser.uid;

    const res = await authMod.signInAnonymously(auth);
    return res?.user?.uid || null;
  } catch {
    return null;
  }
}

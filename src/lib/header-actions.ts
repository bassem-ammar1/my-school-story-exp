export function headerActions(pathname: string) {
  const home = pathname === "/home" || pathname === "/home/";
  return { search: home, share: home, logout: !home };
}

export async function signOutAndRedirect(actions: {
  cancelQueries: () => Promise<unknown>;
  clear: () => void;
  signOut: () => Promise<{ error: unknown }>;
  redirect: () => Promise<unknown>;
}) {
  await actions.cancelQueries();
  actions.clear();
  const { error } = await actions.signOut();
  if (error) throw error;
  await actions.redirect();
}
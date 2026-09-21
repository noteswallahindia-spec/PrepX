/* ============================================
   AUTH HELPERS (Part 2 में पूरा use होगा)
   अभी बस basic functions
   ============================================ */

async function getCurrentUser() {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getProfile(userId) {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return data;
}

async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
  window.location.reload();
}

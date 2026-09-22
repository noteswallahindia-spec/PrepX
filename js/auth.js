// ============================================
// AUTH - Email, Google, Profile
// ============================================

const Auth = {
  async signUp(email, password, name) {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { name } },
    });
    if (error) throw error;
  },

  async signIn(email, password) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  async signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  },

  async signOut() {
    await supabase.auth.signOut();
  },

  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  async getProfile(uid) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();
    return data;
  },

  async saveProfile(profile) {
    const { error } = await supabase.from("profiles").upsert(profile);
    if (error) throw error;
  },

  onAuthChange(callback) {
    supabase.auth.onAuthStateChange((event, session) => callback(event, session));
  },
};

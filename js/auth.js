/* ============================================
   AUTH - Email, Google, Guest, Profile
   ============================================ */

const Auth = {

  // ============ EMAIL SIGNUP ============
  async signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name || "Student" },
      },
    });
    if (error) throw error;
    return data;
  },

  // ============ EMAIL LOGIN ============
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  // ============ GOOGLE ============
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  },

  // ============ LOGOUT ============
  async signOut() {
    Guest.clear();
    await supabase.auth.signOut();
    window.location.reload();
  },

  // ============ CURRENT USER ============
  async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // ============ PROFILE ============
  async getProfile(uid) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async updateProfile(uid, updates) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", uid)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  // ============ SESSION ============
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  },

  // ============ AUTH STATE CHANGE ============
  onAuthChange(callback) {
    supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },
};

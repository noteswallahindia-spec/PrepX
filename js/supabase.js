/* ============================================
   GUEST MODE
   सब data phone में store, Supabase पर सिर्फ count
   ============================================ */

const Guest = {
  // Guest ID generate + save
  init() {
    let id = localStorage.getItem(APP_CONFIG.guestStorageKey);
    if (!id) {
      id = "guest_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
      localStorage.setItem(APP_CONFIG.guestStorageKey, id);

      // Supabase पर सिर्फ count increment (best effort)
      if (supabase) {
        supabase.rpc("increment_guest_count").then(() => {}).catch(() => {});
      }
    }
    return id;
  },

  getId() {
    return localStorage.getItem(APP_CONFIG.guestStorageKey);
  },

  isGuest() {
    return localStorage.getItem(APP_CONFIG.guestFlagKey) === "1";
  },

  setGuest(flag) {
    if (flag) {
      localStorage.setItem(APP_CONFIG.guestFlagKey, "1");
      this.init();
    } else {
      localStorage.removeItem(APP_CONFIG.guestFlagKey);
    }
  },

  // Guest profile — phone में
  saveProfile(profile) {
    const data = {
      ...profile,
      id: this.getId(),
      is_guest: true,
      created_at: new Date().toISOString(),
    };
    localStorage.setItem(APP_CONFIG.userCacheKey, JSON.stringify(data));
    return data;
  },

  getProfile() {
    const raw = localStorage.getItem(APP_CONFIG.userCacheKey);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },

  clear() {
    localStorage.removeItem(APP_CONFIG.userCacheKey);
    localStorage.removeItem(APP_CONFIG.guestFlagKey);
    // guest ID नहीं हटाते — अगर वो दोबारा guest बनना चाहे
  },
};

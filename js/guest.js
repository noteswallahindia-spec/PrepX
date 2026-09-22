// ============================================
// GUEST MODE - phone में save, Supabase में सिर्फ count
// ============================================

const Guest = {
  idKey: "prex_guest_id",
  flagKey: "prex_is_guest",
  cacheKey: "prex_user_cache",

  init() {
    let id = localStorage.getItem(this.idKey);
    if (!id) {
      id = "guest_" + Date.now() + "_" + Math.random().toString(36).slice(2, 9);
      localStorage.setItem(this.idKey, id);
      if (supabase) {
        supabase.rpc("increment_guest_count").then(() => {}).catch(() => {});
      }
    }
    return id;
  },

  getId() { return localStorage.getItem(this.idKey); },
  isGuest() { return localStorage.getItem(this.flagKey) === "1"; },

  set(flag) {
    if (flag) {
      localStorage.setItem(this.flagKey, "1");
      this.init();
    } else {
      localStorage.removeItem(this.flagKey);
    }
  },

  save(profile) {
    localStorage.setItem(this.cacheKey, JSON.stringify({ ...profile, is_guest: true }));
  },

  get() {
    try { return JSON.parse(localStorage.getItem(this.cacheKey) || "null"); }
    catch { return null; }
  },

  clear() {
    localStorage.removeItem(this.cacheKey);
    localStorage.removeItem(this.flagKey);
  },
};

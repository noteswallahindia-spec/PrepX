/* ============================================
   SUPABASE CLIENT
   Connection create करता है
   ============================================ */

let supabase = null;

function initSupabase() {
  try {
    if (SUPABASE_URL === "YOUR_SUPABASE_URL_HERE") {
      throw new Error("config.js में SUPABASE_URL paste नहीं किया");
    }
    if (SUPABASE_ANON_KEY === "YOUR_SUPABASE_ANON_KEY_HERE") {
      throw new Error("config.js में SUPABASE_ANON_KEY paste नहीं किया");
    }

    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: window.localStorage,
      },
    });

    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Test connection by hitting a simple endpoint
async function testConnection() {
  if (!supabase) return { ok: false, error: "Supabase not initialized" };

  try {
    // Try to read the exams table (empty is fine, we just want to know if reachable)
    const { error } = await supabase.from("exams").select("id").limit(1);

    if (error) {
      // PGRST116 = no rows, which is fine
      if (error.code === "PGRST116") return { ok: true };
      throw error;
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message || "Connection failed" };
  }
}

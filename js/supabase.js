// ============================================
// SUPABASE CLIENT
// ============================================

var supabase = null;

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

async function testConnection() {
  try {
    const { error } = await supabase.from("shop_categories").select("id").limit(1);
    if (error && error.code !== "PGRST116") throw error;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

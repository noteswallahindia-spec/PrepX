/* ============================================
   PREX - CONFIG
   ⚠️ यहाँ अपनी Supabase keys paste करो
   ============================================ */

const SUPABASE_URL = "YOUR_SUPABASE_URL_HERE";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY_HERE";

// ============================================
// नीचे कुछ मत बदलो
// ============================================

const APP_CONFIG = {
  name: "PreX",
  tagline: "AI Test App for Students",
  version: "1.0.0",
  defaultLang: "hi",
  guestStorageKey: "prex_guest_id",
  guestFlagKey: "prex_is_guest",
  userCacheKey: "prex_user_cache",
  paperCacheKey: "prex_paper_",
};

// AI Edge Function name (Supabase में यही naam रखना)
const AI_FUNCTION_URL = SUPABASE_URL + "/functions/v1/generate-paper";

/* ============================================
   PARIKSHA APP - CONFIG
   ⚠️ यहाँ अपनी Supabase keys paste करो
   ============================================ */

// STEP 1: Supabase Dashboard → Settings → API
// STEP 2: नीचे वाली 2 lines में अपनी values paste करो
// STEP 3: Save करो

const SUPABASE_URL = "YOUR_SUPABASE_URL_HERE";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY_HERE";

// ============================================
// नीचे कुछ मत बदलो
// ============================================

const APP_CONFIG = {
  name: "परीक्षा",
  version: "1.0.0",
  defaultLang: "hi",
  classes: [6, 7, 8, 9, 10, 11, 12],
  boards: ["CBSE", "ICSE", "State Board"],
};

/* ============================================
   MAIN APP - STARTUP LOGIC
   ============================================ */

const Screen = {
  show(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const el = document.getElementById(id);
    if (el) el.classList.add("active");
  },
};

async function startApp() {
  // 1. Show splash for at least 1.5 seconds
  Screen.show("splash");
  await sleep(1500);

  // 2. Initialize Supabase
  const init = initSupabase();
  if (!init.ok) {
    showError(init.error);
    return;
  }

  // 3. Test connection
  const conn = await testConnection();
  if (!conn.ok) {
    showError(conn.error);
    return;
  }

  // 4. Success!
  Screen.show("welcome");
  const status = document.getElementById("status-box");
  if (status) {
    status.textContent = "✅ Supabase Connected — " + APP_CONFIG.name + " v" + APP_CONFIG.version;
  }
}

function showError(msg) {
  Screen.show("error");
  const el = document.getElementById("error-msg");
  if (el) el.textContent = msg;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ===== Boot =====
window.addEventListener("DOMContentLoaded", startApp);

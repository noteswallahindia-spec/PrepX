/* ============================================
   PREX - MAIN APP LOGIC
   ============================================ */

const App = {
  state: {
    user: null,       // Supabase user OR guest
    profile: null,    // profile data
    isGuest: false,
    setupStep: 1,
    setupData: { cls: null, board: null, lang: null },
    authMode: "login", // login | signup
  },
};

// ============================================
// SCREEN ROUTER
// ============================================
const Screen = {
  show(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const el = document.getElementById(id);
    if (el) {
      el.classList.add("active");
      el.scrollTop = 0;
    }
  },
};

// ============================================
// TOAST
// ============================================
function toast(msg, type = "") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast show " + type;
  clearTimeout(el._t);
  el._t = setTimeout(() => {
    el.className = "toast " + type;
  }, 2400);
}

// ============================================
// INJECT ICONS (startup par)
// ============================================
function injectIcons() {
  setHTML("splash-logo", icon("logo", 72));
  setHTML("welcome-icon", icon("sparkle", 48));
  setHTML("welcome-arrow", icon("arrowRight", 18));
  setHTML("btn-auth-back", icon("arrowLeft", 18));
  setHTML("icon-name", icon("user", 18));
  setHTML("icon-mail", icon("mail", 18));
  setHTML("icon-lock", icon("lock", 18));
  setHTML("icon-google", icon("google", 20));
  setHTML("icon-guest", icon("guest", 20));
  setHTML("btn-eye", icon("eye", 18));
  setHTML("setup-arrow", icon("arrowRight", 18));
  setHTML("header-logo", icon("logo", 26));
  setHTML("btn-logout", icon("logout", 18));
  setHTML("card-icon", icon("sparkle", 30));
  setHTML("fc1", icon("sparkle", 22));
  setHTML("fc2", icon("exam", 22));
  setHTML("fc3", icon("check", 22));
  setHTML("fc4", icon("trophy", 22));
  setHTML("error-icon", icon("alert", 48));

  // Bottom nav
  const navIcons = { home: "home", test: "exam", rank: "trophy", me: "user" };
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.innerHTML = icon(navIcons[btn.dataset.nav], 24);
  });
}

function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

// ============================================
// STARTUP
// ============================================
async function startApp() {
  injectIcons();

  // Splash for min 1.5s
  Screen.show("splash");
  await sleep(1500);

  // Init Supabase
  const init = initSupabase();
  if (!init.ok) {
    showError(init.error);
    return;
  }

  // Test connection
  const conn = await testConnection();
  if (!conn.ok) {
    showError(conn.error);
    return;
  }

  // Check existing session
  await checkExistingSession();

  // Listen for auth changes
  Auth.onAuthChange(async (event, session) => {
    if (event === "SIGNED_IN" && session) {
      await handleUserLoggedIn(session.user);
    }
  });
}

async function checkExistingSession() {
  // 1. Check Supabase session
  const session = await Auth.getSession();
  if (session && session.user) {
    await handleUserLoggedIn(session.user);
    return;
  }

  // 2. Check guest mode
  if (Guest.isGuest()) {
    const profile = Guest.getProfile();
    if (profile && profile.cls && profile.board) {
      App.state.isGuest = true;
      App.state.user = { id: profile.id, email: null };
      App.state.profile = profile;
      showHome();
      return;
    }
  }

  // 3. Nobody — show welcome
  Screen.show("welcome");
}

async function handleUserLoggedIn(user) {
  App.state.user = user;
  App.state.isGuest = false;

  // Fetch profile
  let profile = null;
  try {
    profile = await Auth.getProfile(user.id);
  } catch (e) {
    console.warn("Profile fetch failed:", e);
  }

  if (!profile) {
    // No profile yet — go to setup
    App.state.profile = { id: user.id, name: user.user_metadata?.name || "Student" };
    startSetup();
    return;
  }

  App.state.profile = profile;

  // Check if setup complete
  if (!profile.cls || !profile.board || !profile.lang) {
    startSetup();
    return;
  }

  showHome();
}

// ============================================
// ERROR
// ============================================
function showError(msg) {
  Screen.show("error");
  setHTML("error-icon", icon("alert", 48));
  const el = document.getElementById("error-msg");
  if (el) el.textContent = msg;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ============================================
// WELCOME → AUTH
// ============================================
document.addEventListener("click", async (e) => {
  const target = e.target.closest("#btn-get-started");
  if (target) {
    Screen.show("auth");
    setAuthMode("login");
  }
});

// ============================================
// AUTH SCREEN LOGIC
// ============================================
function setAuthMode(mode) {
  App.state.authMode = mode;

  document.querySelectorAll(".tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.tab === mode);
  });

  const title = document.getElementById("auth-title");
  const sub = document.getElementById("auth-sub");
  const nameGroup = document.getElementById("name-group");
  const submitText = document.getElementById("auth-submit-text");

  if (mode === "signup") {
    title.textContent = "Signup";
    sub.textContent = "नया account बनाओ";
    nameGroup.style.display = "block";
    submitText.textContent = "Signup";
  } else {
    title.textContent = "Login";
    sub.textContent = "अपना account access करो";
    nameGroup.style.display = "none";
    submitText.textContent = "Login";
  }
  clearAuthError();
}

function clearAuthError() {
  const el = document.getElementById("auth-error");
  if (el) el.textContent = "";
}

function showAuthError(msg) {
  const el = document.getElementById("auth-error");
  if (el) el.textContent = msg;
}

// Tab switching
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => setAuthMode(tab.dataset.tab));
});

// Back button
document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-auth-back")) {
    Screen.show("welcome");
  }
});

// Password eye toggle
document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-eye")) {
    const inp = document.getElementById("inp-password");
    const btn = document.getElementById("btn-eye");
    if (inp.type === "password") {
      inp.type = "text";
      btn.innerHTML = icon("eyeOff", 18);
    } else {
      inp.type = "password";
      btn.innerHTML = icon("eye", 18);
    }
  }
});

// Auth form submit
document.addEventListener("submit", async (e) => {
  if (e.target.id !== "auth-form") return;
  e.preventDefault();
  clearAuthError();

  const email = document.getElementById("inp-email").value.trim();
  const password = document.getElementById("inp-password").value;
  const name = document.getElementById("inp-name").value.trim();
  const btn = document.getElementById("btn-auth-submit");

  if (!email || !password) {
    showAuthError("Email और password भरो");
    return;
  }
  if (password.length < 6) {
    showAuthError("Password कम से कम 6 characters का हो");
    return;
  }
  if (App.state.authMode === "signup" && !name) {
    showAuthError("नाम भरो");
    return;
  }

  btn.classList.add("loading");
  btn.disabled = true;

  try {
    if (App.state.authMode === "signup") {
      await Auth.signUp(email, password, name);
      toast("Account बन गया! Email check करो", "success");
    } else {
      await Auth.signIn(email, password);
      toast("Login successful", "success");
    }
    // onAuthChange will handle the rest
  } catch (err) {
    console.error(err);
    let msg = err.message || "कुछ गड़बड़ हो गई";
    if (msg.includes("Invalid login")) msg = "Email या password गलत है";
    if (msg.includes("already registered")) msg = "यह email पहले से registered है";
    if (msg.includes("Email not confirmed")) msg = "Email confirm करो";
    showAuthError(msg);
  } finally {
    btn.classList.remove("loading");
    btn.disabled = false;
  }
});

// Google
document.addEventListener("click", async (e) => {
  if (e.target.closest("#btn-google")) {
    try {
      await Auth.signInWithGoogle();
    } catch (err) {
      console.error(err);
      showAuthError(err.message || "Google login failed");
    }
  }
});

// Guest
document.addEventListener("click", async (e) => {
  if (e.target.closest("#btn-guest")) {
    Guest.setGuest(true);
    App.state.isGuest = true;
    App.state.user = { id: Guest.getId(), email: null };
    App.state.profile = { id: Guest.getId(), name: "Guest" };
    toast("Guest mode में आपका data सिर्फ इस phone में रहेगा", "success");
    startSetup();
  }
});

// ============================================
// PROFILE SETUP
// ============================================
function startSetup() {
  App.state.setupStep = 1;
  App.state.setupData = { cls: null, board: null, lang: null };
  buildSetupChips();
  updateSetupStep();
  Screen.show("setup");
}

function buildSetupChips() {
  // Classes
  const cg = document.getElementById("class-grid");
  cg.innerHTML = APP_CONFIG.classes.map((c) =>
    `<button type="button" class="chip" data-type="cls" data-val="${c}">Class ${c}</button>`
  ).join("");

  // Boards
  const bg = document.getElementById("board-grid");
  bg.innerHTML = APP_CONFIG.boards.map((b) =>
    `<button type="button" class="chip" data-type="board" data-val="${b}">${b}</button>`
  ).join("");

  // Languages
  const lg = document.getElementById("lang-grid");
  const langs = [
    { v: "hi", l: "हिंदी" },
    { v: "en", l: "English" },
    { v: "both", l: "Both" },
  ];
  lg.innerHTML = langs.map((x) =>
    `<button type="button" class="chip" data-type="lang" data-val="${x.v}">${x.l}</button>`
  ).join("");
}

// Chip click
document.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  const type = chip.dataset.type;
  const val = chip.dataset.val;

  // Remove selected from same type
  document.querySelectorAll(`.chip[data-type="${type}"]`).forEach((c) =>
    c.classList.remove("selected")
  );
  chip.classList.add("selected");

  // Save
  if (type === "cls") App.state.setupData.cls = parseInt(val);
  else App.state.setupData[type] = val;
});

function updateSetupStep() {
  document.querySelectorAll(".setup-step").forEach((s) => {
    s.classList.toggle("active", parseInt(s.dataset.step) === App.state.setupStep);
  });
  document.querySelectorAll(".step").forEach((s) => {
    s.classList.toggle("active", parseInt(s.dataset.step) <= App.state.setupStep);
  });

  const nextText = document.getElementById("setup-next-text");
  nextText.textContent = App.state.setupStep === 3 ? "Finish" : "Next";
}

document.addEventListener("click", async (e) => {
  if (!e.target.closest("#btn-setup-next")) return;

  const step = App.state.setupStep;
  const data = App.state.setupData;

  if (step === 1 && !data.cls) return toast("Class चुनो", "error");
  if (step === 2 && !data.board) return toast("Board चुनो", "error");
  if (step === 3 && !data.lang) return toast("Language चुनो", "error");

  if (step < 3) {
    App.state.setupStep++;
    updateSetupStep();
    return;
  }

  // Final step — save
  await saveProfileAndGoHome();
});

async function saveProfileAndGoHome() {
  const data = App.state.setupData;
  const profile = {
    id: App.state.user.id,
    name: App.state.profile.name || "Student",
    cls: data.cls,
    board: data.board,
    lang: data.lang,
  };

  if (App.state.isGuest) {
    // Guest — phone में save
    Guest.saveProfile(profile);
    App.state.profile = profile;
    toast("Setup complete!", "success");
    showHome();
  } else {
    // Real user — Supabase में save
    try {
      await Auth.updateProfile(App.state.user.id, {
        cls: data.cls,
        board: data.board,
        lang: data.lang,
        name: profile.name,
      });
      App.state.profile = profile;
      toast("Profile saved!", "success");
      showHome();
    } catch (err) {
      console.error(err);
      toast("Save failed: " + err.message, "error");
    }
  }
}

// ============================================
// HOME
// ============================================
function showHome() {
  const profile = App.state.profile;

  // Greet
  const hour = new Date().getHours();
  let greet = "नमस्ते";
  if (hour < 12) greet = "Good morning";
  else if (hour < 17) greet = "Good afternoon";
  else greet = "Good evening";

  setText("greet-name", greet + ", " + (profile.name || "Student"));
  setText("greet-sub", App.state.isGuest ? "Guest mode" : "Ready to learn?");

  // Profile rows
  setText("pm-class", "Class " + (profile.cls || "—"));
  setText("pm-board", profile.board || "—");
  setText("pm-lang", profile.lang === "hi" ? "हिंदी" : profile.lang === "en" ? "English" : "Both");
  setText("pm-mode", App.state.isGuest ? "Guest" : "Signed in");

  // Welcome card
  setText("card-title", "Welcome to PreX!");
  setText("card-text", "Part 3 में AI paper generator आएगा");

  Screen.show("home");
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// Logout
document.addEventListener("click", async (e) => {
  if (e.target.closest("#btn-logout")) {
    if (App.state.isGuest) {
      if (confirm("Guest data मिट जाएगा. Logout करें?")) {
        Guest.clear();
        localStorage.removeItem(APP_CONFIG.guestStorageKey);
        location.reload();
      }
    } else {
      await Auth.signOut();
    }
  }
});

// Bottom nav (placeholder — Part 7 में enable होंगे)
document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const nav = btn.dataset.nav;
    if (nav !== "home") {
      toast("यह feature Part " + (nav === "test" ? "3" : nav === "rank" ? "7" : "7") + " में आएगा");
    }
  });
});

// ============================================
// BOOT
// ============================================
window.addEventListener("DOMContentLoaded", startApp);

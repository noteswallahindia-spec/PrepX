/* ============================================
   PREX - MAIN APP (Part 3)
   ============================================ */

const App = {
  state: {
    user: null,
    profile: null,
    isGuest: false,
    setupStep: 1,
    setupData: { cls: null, board: null, lang: null, mode: null, examCategory: null, examName: null },
    authMode: "login",
    categories: [],
    subjects: [],
    chapters: [],
    currentPaper: null,
    examConfig: { subject: null, chapters: [], type: "mixed", difficulty: "medium", count: 10, duration: 30 },
  },
};

// ============================================
// SCREEN
// ============================================
const Screen = {
  show(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const el = document.getElementById(id);
    if (el) { el.classList.add("active"); el.scrollTop = 0; }
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
  el._t = setTimeout(() => { el.className = "toast " + type; }, 2400);
}

// ============================================
// ICONS
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
  setHTML("error-icon", icon("alert", 48));

  setHTML("mode-icon-school", icon("book", 28));
  setHTML("mode-icon-competitive", icon("trophy", 28));
  setHTML("btn-comp-back", icon("arrowLeft", 18));

  setHTML("cta-icon", icon("sparkle", 26));
  setHTML("cta-arrow", icon("arrowRight", 20));
  setHTML("fc1", icon("exam", 22));
  setHTML("fc2", icon("book", 22));
  setHTML("fc3", icon("trophy", 22));
  setHTML("fc4", icon("check", 22));

  setHTML("btn-exam-back", icon("arrowLeft", 18));
  setHTML("btn-paper-back", icon("arrowLeft", 18));
  setHTML("btn-generate-icon", icon("sparkle", 20));
  setHTML("regen-icon", icon("sparkle", 18));
  setHTML("start-arrow", icon("arrowRight", 18));
  setHTML("gen-icon", icon("sparkle", 52));

  const navIcons = { home: "home", test: "exam", rank: "trophy", me: "user" };
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.innerHTML = icon(navIcons[btn.dataset.nav], 24);
  });
}

function setHTML(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ============================================
// STARTUP
// ============================================
async function startApp() {
  injectIcons();
  Screen.show("splash");
  await sleep(1500);

  const init = initSupabase();
  if (!init.ok) return showError(init.error);

  const conn = await testConnection();
  if (!conn.ok) return showError(conn.error);

  await checkExistingSession();

  Auth.onAuthChange(async (event, session) => {
    if (event === "SIGNED_IN" && session) await handleUserLoggedIn(session.user);
  });
}

async function checkExistingSession() {
  const session = await Auth.getSession();
  if (session?.user) return handleUserLoggedIn(session.user);

  if (Guest.isGuest()) {
    const profile = Guest.getProfile();
    if (profile && profile.mode) {
      App.state.isGuest = true;
      App.state.user = { id: profile.id, email: null };
      App.state.profile = profile;
      return showHome();
    }
    if (profile && profile.cls) {
      // Old guest profile from Part 2 — force setup again
      App.state.profile = profile;
      return Screen.show("setup-mode");
    }
  }

  Screen.show("welcome");
}

async function handleUserLoggedIn(user) {
  App.state.user = user;
  App.state.isGuest = false;

  let profile = null;
  try { profile = await Auth.getProfile(user.id); } catch {}

  if (!profile) {
    App.state.profile = { id: user.id, name: user.user_metadata?.name || "Student" };
    return Screen.show("setup-mode");
  }

  App.state.profile = profile;
  if (!profile.mode) return Screen.show("setup-mode");
  showHome();
}

// ============================================
// ERROR / SLEEP
// ============================================
function showError(msg) {
  Screen.show("error");
  setHTML("error-icon", icon("alert", 48));
  setText("error-msg", msg);
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

// ============================================
// WELCOME → AUTH
// ============================================
document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-get-started")) {
    Screen.show("auth");
    setAuthMode("login");
  }
});

// ============================================
// AUTH MODE
// ============================================
function setAuthMode(mode) {
  App.state.authMode = mode;
  document.querySelectorAll(".tab").forEach((t) =>
    t.classList.toggle("active", t.dataset.tab === mode)
  );
  const signup = mode === "signup";
  setText("auth-title", signup ? "Signup" : "Login");
  setText("auth-sub", signup ? "नया account बनाओ" : "अपना account access करो");
  setText("auth-submit-text", signup ? "Signup" : "Login");
  document.getElementById("name-group").style.display = signup ? "block" : "none";
  setText("auth-error", "");
}

document.querySelectorAll(".tab").forEach((t) =>
  t.addEventListener("click", () => setAuthMode(t.dataset.tab))
);

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-auth-back")) Screen.show("welcome");
});

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-eye")) {
    const inp = document.getElementById("inp-password");
    const btn = document.getElementById("btn-eye");
    if (inp.type === "password") { inp.type = "text"; btn.innerHTML = icon("eyeOff", 18); }
    else { inp.type = "password"; btn.innerHTML = icon("eye", 18); }
  }
});

// ============================================
// AUTH SUBMIT
// ============================================
document.addEventListener("submit", async (e) => {
  if (e.target.id !== "auth-form") return;
  e.preventDefault();
  setText("auth-error", "");

  const email = document.getElementById("inp-email").value.trim();
  const password = document.getElementById("inp-password").value;
  const name = document.getElementById("inp-name").value.trim();
  const btn = document.getElementById("btn-auth-submit");

  if (!email || !password) return setText("auth-error", "Email और password भरो");
  if (password.length < 6) return setText("auth-error", "Password कम से कम 6 characters");
  if (App.state.authMode === "signup" && !name) return setText("auth-error", "नाम भरो");

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
  } catch (err) {
    let msg = err.message || "कुछ गड़बड़";
    if (msg.includes("Invalid login")) msg = "Email या password गलत";
    if (msg.includes("already registered")) msg = "यह email पहले से registered";
    if (msg.includes("Email not confirmed")) msg = "Email confirm करो";
    setText("auth-error", msg);
  } finally {
    btn.classList.remove("loading");
    btn.disabled = false;
  }
});

// ============================================
// GOOGLE / GUEST
// ============================================
document.addEventListener("click", async (e) => {
  if (e.target.closest("#btn-google")) {
    try { await Auth.signInWithGoogle(); }
    catch (err) { setText("auth-error", err.message); }
  }
});

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-guest")) {
    Guest.setGuest(true);
    App.state.isGuest = true;
    App.state.user = { id: Guest.getId(), email: null };
    App.state.profile = { id: Guest.getId(), name: "Guest" };
    toast("Guest mode active", "success");
    Screen.show("setup-mode");
  }
});

// ============================================
// SETUP MODE (School / Competitive)
// ============================================
document.addEventListener("click", (e) => {
  const card = e.target.closest(".mode-card");
  if (!card) return;
  const mode = card.dataset.mode;
  App.state.setupData.mode = mode;

  if (mode === "school") {
    buildSchoolSetup();
    Screen.show("setup-school");
  } else {
    loadCompetitiveView();
    Screen.show("setup-comp");
  }
});

// ============================================
// SCHOOL SETUP (Class, Board, Lang)
// ============================================
function buildSchoolSetup() {
  App.state.setupStep = 1;
  App.state.setupData.cls = null;
  App.state.setupData.board = null;
  App.state.setupData.lang = null;

  const classes = [6,7,8,9,10,11,12];
  setHTML("class-grid", classes.map((c) =>
    `<button type="button" class="chip" data-type="cls" data-val="${c}">Class ${c}</button>`
  ).join(""));

  const boards = ["CBSE", "ICSE", "State Board"];
  setHTML("board-grid", boards.map((b) =>
    `<button type="button" class="chip" data-type="board" data-val="${b}">${b}</button>`
  ).join(""));

  const langs = [{v:"hi",l:"हिंदी"},{v:"en",l:"English"},{v:"both",l:"Both"}];
  setHTML("lang-grid", langs.map((x) =>
    `<button type="button" class="chip" data-type="lang" data-val="${x.v}">${x.l}</button>`
  ).join(""));

  updateSchoolStep();
}

document.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip || !chip.dataset.type) return;
  const type = chip.dataset.type;
  const val = chip.dataset.val;
  document.querySelectorAll(`.chip[data-type="${type}"]`).forEach((c) => c.classList.remove("selected"));
  chip.classList.add("selected");
  if (type === "cls") App.state.setupData.cls = parseInt(val);
  else App.state.setupData[type] = val;
});

function updateSchoolStep() {
  document.querySelectorAll("#setup-school .setup-step").forEach((s) =>
    s.classList.toggle("active", parseInt(s.dataset.step) === App.state.setupStep)
  );
  document.querySelectorAll("#setup-school .step").forEach((s) =>
    s.classList.toggle("active", parseInt(s.dataset.step) <= App.state.setupStep)
  );
  setText("setup-next-text", App.state.setupStep === 3 ? "Finish" : "Next");
}

document.addEventListener("click", async (e) => {
  if (!e.target.closest("#btn-setup-next")) return;
  const step = App.state.setupStep;
  const d = App.state.setupData;

  if (step === 1 && !d.cls) return toast("Class चुनो", "error");
  if (step === 2 && !d.board) return toast("Board चुनो", "error");
  if (step === 3 && !d.lang) return toast("Language चुनो", "error");

  if (step < 3) { App.state.setupStep++; updateSchoolStep(); return; }
  await saveSchoolProfile();
});

async function saveSchoolProfile() {
  const d = App.state.setupData;
  const profile = {
    id: App.state.user.id,
    name: App.state.profile.name || "Student",
    mode: "school",
    cls: d.cls,
    board: d.board,
    lang: d.lang,
    exam_category: null,
  };
  await saveProfile(profile);
}

async function saveProfile(profile) {
  if (App.state.isGuest) {
    Guest.saveProfile(profile);
    App.state.profile = profile;
    showHome();
    return;
  }
  try {
    await Auth.updateProfile(App.state.user.id, {
      cls: profile.cls, board: profile.board, lang: profile.lang, name: profile.name,
      // Additional fields for Part 3 — may not exist in old schema, ignore error
    });
    // Try to save mode + exam_category (new columns)
    try {
      await supabase.from("profiles").update({
        mode: profile.mode,
        exam_category: profile.exam_category,
      }).eq("id", App.state.user.id);
    } catch {}
    App.state.profile = profile;
    showHome();
  } catch (err) {
    toast("Save failed: " + err.message, "error");
  }
}

// ============================================
// COMPETITIVE SETUP
// ============================================
async function loadCompetitiveView() {
  document.getElementById("comp-cat-view").style.display = "block";
  document.getElementById("comp-exam-view").style.display = "none";
  document.getElementById("comp-lang-view").style.display = "none";

  try {
    const cats = await Exams.getCategories();
    App.state.categories = cats;
    const topCats = cats.filter((c) => !c.parent && c.id !== "school");
    setHTML("comp-cat-list", topCats.map((c) =>
      `<button class="cat-item" data-cat="${c.id}">
        <span>${c.name_hi} <span style="color:var(--muted);font-weight:500;">(${c.name})</span></span>
        <span class="cat-arrow">${ICONS.arrowRight}</span>
      </button>`
    ).join(""));
  } catch (err) {
    toast("Load failed: " + err.message, "error");
  }
}

document.addEventListener("click", async (e) => {
  const item = e.target.closest("#comp-cat-list .cat-item");
  if (!item) return;
  const catId = item.dataset.cat;
  const cat = App.state.categories.find((c) => c.id === catId);
  if (!cat) return;

  App.state.setupData.examCategory = catId;

  // Show exams for this category
  const childExams = App.state.categories.filter((c) => c.parent === catId);
  if (!childExams.length) {
    toast("इस category में exams नहीं हैं", "error");
    return;
  }

  setText("comp-cat-title", cat.name_hi + " — exam चुनो");
  setHTML("comp-exam-list", childExams.map((ex) =>
    `<button class="cat-item" data-exam="${ex.id}" data-examname="${ex.name}">
      <span>${ex.name_hi} <span style="color:var(--muted);font-weight:500;">(${ex.name})</span></span>
      <span class="cat-arrow">${ICONS.check}</span>
    </button>`
  ).join(""));

  document.getElementById("comp-cat-view").style.display = "none";
  document.getElementById("comp-exam-view").style.display = "block";
});

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-comp-back")) {
    document.getElementById("comp-exam-view").style.display = "none";
    document.getElementById("comp-cat-view").style.display = "block";
  }
});

document.addEventListener("click", (e) => {
  const item = e.target.closest("#comp-exam-list .cat-item");
  if (!item) return;
  App.state.setupData.examCategory = item.dataset.exam;
  App.state.setupData.examName = item.dataset.examname;

  // Show language selection
  const langs = [{v:"hi",l:"हिंदी"},{v:"en",l:"English"},{v:"both",l:"Both"}];
  setHTML("comp-lang-grid", langs.map((x) =>
    `<button type="button" class="chip" data-type="clang" data-val="${x.v}">${x.l}</button>`
  ).join(""));

  document.getElementById("comp-exam-view").style.display = "none";
  document.getElementById("comp-lang-view").style.display = "block";
});

document.addEventListener("click", async (e) => {
  const chip = e.target.closest('.chip[data-type="clang"]');
  if (!chip) return;
  document.querySelectorAll('.chip[data-type="clang"]').forEach((c) => c.classList.remove("selected"));
  chip.classList.add("selected");
  App.state.setupData.lang = chip.dataset.val;

  // Save immediately
  const d = App.state.setupData;
  const profile = {
    id: App.state.user.id,
    name: App.state.profile.name || "Student",
    mode: "competitive",
    cls: null,
    board: null,
    lang: d.lang,
    exam_category: d.examCategory,
    exam_name: d.examName,
  };
  await saveProfile(profile);
});

// ============================================
// HOME
// ============================================
function showHome() {
  const p = App.state.profile;
  const hour = new Date().getHours();
  let greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  setText("greet-name", greet + ", " + (p.name || "Student"));
  setText("greet-sub", App.state.isGuest ? "Guest mode" : "Ready to learn?");

  setText("pc-mode", p.mode === "competitive" ? "Competitive" : "School");

  if (p.mode === "competitive") {
    setText("pc-label-1", "Exam");
    setText("pc-value-1", p.exam_name || p.exam_category || "—");
    setText("pc-label-2", "Language");
    setText("pc-value-2", p.lang === "hi" ? "हिंदी" : p.lang === "en" ? "English" : "Both");
  } else {
    setText("pc-label-1", "Class");
    setText("pc-value-1", "Class " + (p.cls || "—"));
    setText("pc-label-2", "Board");
    setText("pc-value-2", p.board || "—");
  }

  Screen.show("home");
}

// ============================================
// LOGOUT
// ============================================
document.addEventListener("click", async (e) => {
  if (e.target.closest("#btn-logout")) {
    if (App.state.isGuest) {
      if (confirm("Guest data मिट जाएगा. Logout?")) {
        Guest.clear();
        localStorage.removeItem(APP_CONFIG.guestStorageKey);
        location.reload();
      }
    } else {
      await Auth.signOut();
    }
  }
});

// ============================================
// NAV
// ============================================
document.querySelectorAll(".nav-item").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    if (btn.dataset.nav !== "home") {
      toast("Part " + (btn.dataset.nav === "test" ? "4" : "7") + " में आएगा");
    }
  });
});

// ============================================
// EXAM SETUP FLOW
// ============================================
document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-start-test")) openExamSetup();
});

async function openExamSetup() {
  const examId = Exams.getExamIdFromProfile(App.state.profile);
  if (!examId) return toast("Profile incomplete", "error");

  try {
    const subjects = await Exams.getSubjects(examId);
    if (!subjects.length) {
      return toast("इस exam के subjects नहीं मिले", "error");
    }
    App.state.subjects = subjects;

    // Fill subject dropdown
    const sel = document.getElementById("es-subject");
    sel.innerHTML = subjects.map((s, i) =>
      `<option value="${i}">${s.name_hi || s.name}</option>`
    ).join("");
    sel.onchange = () => renderChapters(subjects[parseInt(sel.value)]);

    renderChapters(subjects[0]);
    App.state.examConfig.subject = subjects[0].name;
    Screen.show("exam-setup");
  } catch (err) {
    toast("Load failed: " + err.message, "error");
  }
}

function renderChapters(subject) {
  App.state.examConfig.subject = subject.name;
  App.state.examConfig.chapters = [];
  const chapters = subject.chapters || [];
  setHTML("es-chapters", chapters.map((ch, i) =>
    `<label class="chapter-item">
      <input type="checkbox" value="${ch}" data-chapter />
      <span>${ch}</span>
    </label>`
  ).join(""));

  document.querySelectorAll("#es-chapters input[data-chapter]").forEach((cb) => {
    cb.addEventListener("change", () => {
      const list = [];
      document.querySelectorAll("#es-chapters input[data-chapter]:checked").forEach((c) => list.push(c.value));
      App.state.examConfig.chapters = list;
    });
  });
}

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-select-all")) {
    const cbs = document.querySelectorAll("#es-chapters input[data-chapter]");
    const all = Array.from(cbs).every((c) => c.checked);
    cbs.forEach((c) => { c.checked = !all; });
    const list = [];
    cbs.forEach((c) => { if (c.checked) list.push(c.value); });
    App.state.examConfig.chapters = list;
  }
});

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-exam-back")) Sc

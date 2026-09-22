// ============================================
// PREX MAIN APP
// ============================================

const State = {
  user: null,
  profile: null,
  isGuest: false,
  authMode: "login",
  setupData: { mode: null, cls: null, board: null, lang: null, examCategory: null, examName: null },
  setupStep: 1,
  lastResult: null,
};

const Screen = {
  show(id) {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
    const el = document.getElementById(id);
    if (el) { el.classList.add("active"); el.scrollTop = 0; }
    const navScreens = ["home", "shop", "rank", "me"];
    document.getElementById("bottom-nav").style.display = navScreens.includes(id) ? "flex" : "none";
    document.querySelectorAll(".nav-item").forEach((b) => {
      b.classList.toggle("active", b.dataset.nav === id);
    });
  },
};

function toast(msg, type = "") {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast show " + type;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.className = "toast " + type; }, 2400);
}
const setText = (id, t) => { const e = document.getElementById(id); if (e) e.textContent = t; };
const setHTML = (id, h) => { const e = document.getElementById(id); if (e) e.innerHTML = h; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function injectIcons() {
  try {
    setHTML("splash-logo", icon("logo", 72));
    setHTML("welcome-icon", icon("sparkle", 48));
    setHTML("welcome-arrow", icon("arrowRight", 18));
    setHTML("btn-auth-back", icon("arrowLeft", 18));
    setHTML("icon-name", icon("user", 18));
    setHTML("icon-mail", icon("mail", 18));
    setHTML("icon-lock", icon("lock", 18));
    setHTML("icon-guest", icon("guest", 20));
    setHTML("btn-eye", icon("eye", 18));
    setHTML("setup-arrow", icon("arrowRight", 18));
    setHTML("header-logo", icon("logo", 26));
    setHTML("shop-logo", icon("logo", 26));
    setHTML("rank-logo", icon("logo", 26));
    setHTML("me-logo", icon("logo", 26));
    setHTML("notif-bell-icon", icon("bell", 20));
    setHTML("btn-logout", icon("logout", 18));
    setHTML("me-logout-icon", icon("logout", 20));
    setHTML("cta-icon", icon("sparkle", 26));
    setHTML("cta-arrow", icon("arrowRight", 20));
    setHTML("fc-notes", icon("book", 22));
    setHTML("fc-flash", icon("star", 22));
    setHTML("fc-doubt", icon("brain", 22));
    setHTML("fc-history", icon("chart", 22));
    setHTML("error-icon", icon("alert", 48));
    setHTML("mode-icon-school", icon("book", 28));
    setHTML("mode-icon-competitive", icon("trophy", 28));
    setHTML("btn-comp-back", icon("arrowLeft", 18));
    setHTML("shop-search-icon", icon("search", 18));
    setHTML("btn-pd-back", icon("arrowLeft", 18));
    setHTML("btn-exam-back", icon("arrowLeft", 18));
    setHTML("btn-paper-back", icon("arrowLeft", 18));
    setHTML("btn-generate-icon", icon("sparkle", 20));
    setHTML("gen-icon", icon("sparkle", 52));
    setHTML("er-timer-icon", icon("clock", 18));
    setHTML("btn-er-exit", icon("close", 20));
    setHTML("btn-er-palette", icon("grid", 20));
    setHTML("er-mark-icon", icon("flag", 20));
    setHTML("er-prev-icon", icon("chevronLeft", 16));
    setHTML("er-next-icon", icon("chevronRight", 16));
    setHTML("btn-palette-close", icon("close", 20));
    setHTML("submit-modal-icon", icon("send", 32));
    setHTML("confirm-icon", icon("send", 18));
    setHTML("exit-modal-icon", icon("alert", 32));
    setHTML("timeup-icon", icon("clock", 32));
    setHTML("eval-icon", icon("brain", 52));
    setHTML("rs-icon", icon("check", 40));
    setHTML("rs-ai-icon", icon("brain", 22));
    setHTML("rs-weak-icon", icon("chart", 20));
    setHTML("rs-strong-icon", icon("star", 20));
    setHTML("rs-cert-icon", icon("trophy", 26));
    setHTML("rs-cert-arrow", icon("arrowRight", 20));
    setHTML("btn-rs-home-icon", icon("home", 18));
    setHTML("btn-rs-review-icon", icon("book", 18));
    setHTML("btn-rs-retake-icon", icon("refresh", 18));
    setHTML("btn-review-back-icon", icon("arrowLeft", 18));
    setHTML("btn-cert-home-icon", icon("home", 18));
    setHTML("cert-dl-icon", icon("download", 18));
    setHTML("cert-wa-icon", icon("whatsapp", 18));
    setHTML("cert-share-icon", icon("share", 18));
    setHTML("cert-copy-icon", icon("link", 18));
    setHTML("cert-retake-icon", icon("refresh", 18));
    setHTML("ds-xp-icon", icon("zap", 20));
    setHTML("ds-streak-icon", icon("flame", 20));
    setHTML("ds-tests-icon", icon("target", 20));
    setHTML("ds-avg-icon", icon("trending", 20));
    setHTML("me-xp-icon", icon("zap", 20));
    setHTML("me-streak-icon", icon("flame", 20));
    setHTML("me-tests-icon", icon("target", 20));
    setHTML("btn-notif-back", icon("arrowLeft", 18));
    setHTML("btn-adm-back", icon("arrowLeft", 18));
    setHTML("adm-save-icon", icon("check", 18));
    setHTML("btn-rh-back", icon("arrowLeft", 18));
    setHTML("btn-sp-back", icon("arrowLeft", 18));
    setHTML("btn-badges-back", icon("arrowLeft", 18));
    setHTML("btn-notes-back", icon("arrowLeft", 18));
    setHTML("btn-nv-back", icon("arrowLeft", 18));
    setHTML("btn-fc-back", icon("arrowLeft", 18));
    setHTML("btn-doubt-back", icon("arrowLeft", 18));
    setHTML("m1", icon("chart", 20));
    setHTML("m2", icon("book", 20));
    setHTML("m3", icon("award", 20));
    setHTML("m4", icon("book", 20));
    setHTML("m5", icon("star", 20));
    setHTML("m6", icon("brain", 20));
    setHTML("m7", icon("package", 20));
    document.querySelectorAll(".nav-item [data-icon]").forEach((el) => {
      el.innerHTML = ICONS[el.dataset.icon] || "";
    });
  } catch (e) { console.warn("Icons:", e); }
}
async function startApp() {
  try {
    injectIcons();
    Screen.show("splash");
    await sleep(1500);

    const init = initSupabase();
    if (!init.ok) return showError(init.error);

    const conn = await testConnection();
    if (!conn.ok) return showError(conn.error);

    if (typeof Certificate !== "undefined") Certificate.init();

    await checkSession();

    Auth.onAuthChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) await handleLoggedIn(session.user);
    });
  } catch (e) {
    console.error(e);
    showError(e.message || "Startup failed");
  }
}

async function checkSession() {
  const session = await Auth.getSession();
  if (session?.user) return handleLoggedIn(session.user);
  if (Guest.isGuest()) {
    const p = Guest.get();
    if (p && p.mode) {
      State.isGuest = true;
      State.user = { id: p.id };
      State.profile = p;
      return showHome();
    }
  }
  Screen.show("welcome");
}

async function handleLoggedIn(user) {
  State.user = user;
  State.isGuest = false;
  let profile = null;
  try { profile = await Auth.getProfile(user.id); } catch {}
  if (!profile) {
    State.profile = { id: user.id, name: user.user_metadata?.name || "Student" };
    return Screen.show("setup-mode");
  }
  State.profile = profile;
  if (!profile.mode) return Screen.show("setup-mode");
  showHome();
}

function showError(msg) {
  Screen.show("error");
  setHTML("error-icon", icon("alert", 48));
  setText("error-msg", msg);
}

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-get-started")) {
    Screen.show("auth");
    setAuthMode("login");
  }
});

function setAuthMode(mode) {
  State.authMode = mode;
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === mode));
  const s = mode === "signup";
  setText("auth-title", s ? "Signup" : "Login");
  setText("auth-sub", s ? "नया account बनाओ" : "अपना account access करो");
  setText("auth-submit-text", s ? "Signup" : "Login");
  document.getElementById("name-group").style.display = s ? "block" : "none";
  setText("auth-error", "");
}

document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => setAuthMode(t.dataset.tab)));

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

document.addEventListener("submit", async (e) => {
  if (e.target.id !== "auth-form") return;
  e.preventDefault();
  const email = document.getElementById("inp-email").value.trim();
  const password = document.getElementById("inp-password").value;
  const name = document.getElementById("inp-name").value.trim();
  const btn = document.getElementById("btn-auth-submit");
  setText("auth-error", "");
  if (!email || !password) return setText("auth-error", "Email और password भरो");
  if (password.length < 6) return setText("auth-error", "Password कम से कम 6 characters");
  if (State.authMode === "signup" && !name) return setText("auth-error", "नाम भरो");
  btn.classList.add("loading");
  btn.disabled = true;
  try {
    if (State.authMode === "signup") {
      await Auth.signUp(email, password, name);
      toast("Account बन गया! Login करो", "success");
      setAuthMode("login");
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

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-guest")) {
    Guest.set(true);
    State.isGuest = true;
    State.user = { id: Guest.getId() };
    State.profile = { id: Guest.getId(), name: "Guest" };
    toast("Guest mode active", "success");
    Screen.show("setup-mode");
  }
});

document.addEventListener("click", (e) => {
  const card = e.target.closest(".mode-card");
  if (!card) return;
  State.setupData.mode = card.dataset.mode;
  if (card.dataset.mode === "school") {
    buildSchoolSetup();
    Screen.show("setup-school");
  } else {
    loadCompetitiveView();
    Screen.show("setup-comp");
  }
});

function buildSchoolSetup() {
  State.setupStep = 1;
  State.setupData.cls = null;
  State.setupData.board = null;
  State.setupData.lang = null;
  setHTML("class-grid", [6,7,8,9,10,11,12].map((c) =>
    `<button type="button" class="chip" data-type="cls" data-val="${c}">Class ${c}</button>`).join(""));
  setHTML("board-grid", ["CBSE", "ICSE", "State Board"].map((b) =>
    `<button type="button" class="chip" data-type="board" data-val="${b}">${b}</button>`).join(""));
  setHTML("lang-grid", [{v:"hi",l:"हिंदी"},{v:"en",l:"English"},{v:"both",l:"Both"}].map((x) =>
    `<button type="button" class="chip" data-type="lang" data-val="${x.v}">${x.l}</button>`).join(""));
  updateSchoolStep();
}

document.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip || !chip.dataset.type) return;
  const type = chip.dataset.type;
  const val = chip.dataset.val;
  document.querySelectorAll(`.chip[data-type="${type}"]`).forEach((c) => c.classList.remove("selected"));
  chip.classList.add("selected");
  if (type === "cls") State.setupData.cls = parseInt(val);
  else State.setupData[type] = val;
});

function updateSchoolStep() {
  document.querySelectorAll("#setup-school .setup-step").forEach((s) =>
    s.classList.toggle("active", parseInt(s.dataset.step) === State.setupStep));
  document.querySelectorAll("#setup-school .step").forEach((s) =>
    s.classList.toggle("active", parseInt(s.dataset.step) <= State.setupStep));
  setText("setup-next-text", State.setupStep === 3 ? "Finish" : "Next");
}

document.addEventListener("click", async (e) => {
  if (!e.target.closest("#btn-setup-next")) return;
  const d = State.setupData;
  if (State.setupStep === 1 && !d.cls) return toast("Class चुनो", "error");
  if (State.setupStep === 2 && !d.board) return toast("Board चुनो", "error");
  if (State.setupStep === 3 && !d.lang) return toast("Language चुनो", "error");
  if (State.setupStep < 3) {
    State.setupStep++;
    updateSchoolStep();
    return;
  }
  await saveProfile({ mode: "school", cls: d.cls, board: d.board, lang: d.lang });
});

async function loadCompetitiveView() {
  document.getElementById("comp-cat-view").style.display = "block";
  document.getElementById("comp-exam-view").style.display = "none";
  document.getElementById("comp-lang-view").style.display = "none";
  try {
    await Exams.loadCategories();
    const top = Exams.getTopCategories();
    setHTML("comp-cat-list", top.map((c) =>
      `<button class="cat-item" data-cat="${c.id}">
        <span>${c.name_hi} <span style="color:var(--muted);font-weight:500;font-size:12px;">(${c.name})</span></span>
        <span>${ICONS.arrowRight}</span>
      </button>`).join(""));
  } catch (err) { toast("Load failed: " + err.message, "error"); }
}

document.addEventListener("click", (e) => {
  const item = e.target.closest("#comp-cat-list .cat-item");
  if (!item) return;
  const catId = item.dataset.cat;
  const cat = Exams.categories.find((c) => c.id === catId);
  if (!cat) return;
  const exams = Exams.getChildExams(catId);
  if (!exams.length) return toast("इस category में exams नहीं हैं", "error");
  setText("comp-cat-title", cat.name_hi + " — exam चुनो");
  setHTML("comp-exam-list", exams.map((ex) =>
    `<button class="cat-item" data-exam="${ex.id}" data-examname="${ex.name}">
      <span>${ex.name_hi} <span style="color:var(--muted);font-weight:500;font-size:12px;">(${ex.name})</span></span>
      <span>${ICONS.arrowRight}</span>
    </button>`).join(""));
  document.getElementById("comp-cat-view").style.display = "none";
  document.getElementById("comp-exam-view").style.display = "block";
});

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-comp-back")) {
    document.getElementById("comp-exam-view").style.display = "none";
    document.getElementById("comp-lang-view").style.display = "none";
    document.getElementById("comp-cat-view").style.display = "block";
  }
});

document.addEventListener("click", (e) => {
  const item = e.target.closest("#comp-exam-list .cat-item");
  if (!item) return;
  State.setupData.examCategory = item.dataset.exam;
  State.setupData.examName = item.dataset.examname;
  setHTML("comp-lang-grid", [{v:"hi",l:"हिंदी"},{v:"en",l:"English"},{v:"both",l:"Both"}].map((x) =>
    `<button type="button" class="chip" data-type="clang" data-val="${x.v}">${x.l}</button>`).join(""));
  document.getElementById("comp-exam-view").style.display = "none";
  document.getElementById("comp-lang-view").style.display = "block";
});

document.addEventListener("click", async (e) => {
  const chip = e.target.closest('.chip[data-type="clang"]');
  if (!chip) return;
  document.querySelectorAll('.chip[data-type="clang"]').forEach((c) => c.classList.remove("selected"));
  chip.classList.add("selected");
  await saveProfile({
    mode: "competitive",
    examCategory: State.setupData.examCategory,
    examName: State.setupData.examName,
    lang: chip.dataset.val,
  });
});

async function saveProfile(data) {
  const profile = {
    id: State.user.id,
    name: State.profile?.name || "Student",
    mode: data.mode,
    cls: data.cls || null,
    board: data.board || null,
    lang: data.lang || "hi",
    exam_category: data.examCategory || null,
    exam_name: data.examName || null,
  };
  if (State.isGuest) {
    Guest.save(profile);
    State.profile = profile;
    toast("Setup complete!", "success");
    return showHome();
  }
  try {
    await Auth.saveProfile(profile);
    State.profile = profile;
    toast("Profile saved!", "success");
    showHome();
  } catch (err) { toast("Save failed: " + err.message, "error"); }
    }
async function showHome() {
  const p = State.profile;
  const h = new Date().getHours();
  const g = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  setText("greet-name", g + ", " + (p.name || "Student"));
  setText("greet-sub", State.isGuest ? "Guest mode" : "Ready to learn?");
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
  try { await Dashboard.load(); Dashboard.render(); } catch (e) { console.warn(e); }
  try { DailyChallenge.load(); } catch (e) { console.warn(e); }
  try { updateNotifBadge(); } catch (e) { console.warn(e); }
  try { Notifications.checkDailyReminder(); } catch (e) { console.warn(e); }
  try { Badges.load().then(() => Badges.checkAndUnlock()); } catch (e) { console.warn(e); }
}

async function updateNotifBadge() {
  await Notifications.load();
  const count = Notifications.unreadCount();
  const badge = document.getElementById("notif-badge");
  if (badge) {
    if (count > 0) { badge.style.display = "flex"; badge.textContent = count > 9 ? "9+" : count; }
    else { badge.style.display = "none"; }
  }
}

document.addEventListener("click", async (e) => {
  if (e.target.closest("#btn-logout") || e.target.closest("#btn-me-logout")) {
    if (State.isGuest) {
      if (confirm("Guest data मिट जाएगा. Logout?")) {
        Guest.clear();
        localStorage.removeItem("prex_guest_id");
        location.reload();
      }
    } else {
      await Auth.signOut();
      location.reload();
    }
  }
});

document.addEventListener("click", (e) => {
  const nav = e.target.closest(".nav-item");
  if (!nav) return;
  const t = nav.dataset.nav;
  if (t === "home") showHome();
  else if (t === "shop") openShop();
  else if (t === "rank") Leaderboard.open();
  else if (t === "me") openMe();
  else if (t === "test") ExamSetup.open();
});

document.addEventListener("click", (e) => {
  const card = e.target.closest(".feature-card[data-nav]");
  if (!card) return;
  const t = card.dataset.nav;
  if (t === "shop") openShop();
  else if (t === "rank") Leaderboard.open();
  else if (t === "me") openMe();
  else if (t === "test") ExamSetup.open();
  else if (t === "notes") Notes.open();
  else if (t === "flashcards") Flashcards.open();
  else if (t === "doubts") Doubts.open();
  else if (t === "history") ResultsHistory.open();
});

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-start-test")) ExamSetup.open();
});

async function openMe() {
  const p = State.profile;
  setText("me-name", p.name || "Student");
  setText("me-sub", State.isGuest ? "Guest User" : "Signed In");
  setText("me-avatar", (p.name || "S").charAt(0).toUpperCase());
  setText("me-mode", p.mode === "competitive" ? "Competitive" : "School");
  if (p.mode === "competitive") {
    setText("me-class", p.exam_name || p.exam_category || "—");
    setText("me-board", p.lang === "hi" ? "हिंदी" : p.lang === "en" ? "English" : "Both");
  } else {
    setText("me-class", "Class " + (p.cls || "—"));
    setText("me-board", (p.board || "—") + " • " + (p.lang === "hi" ? "हिंदी" : p.lang === "en" ? "English" : "Both"));
  }
  Screen.show("me");
  await Dashboard.load();
  const s = Dashboard.stats || {};
  setText("me-xp", Dashboard.formatNum(s.xp || 0));
  setText("me-streak", s.streak || 0);
  setText("me-tests", s.tests_taken || 0);
}

async function openShop() {
  Screen.show("shop");
  if (!Shop.products.length) {
    try { await Shop.load(); } catch (e) { toast("Shop load failed", "error"); }
  }
  renderShopCats();
  renderProducts();
}

function renderShopCats() {
  const cats = [{ id: "all", name: "All" }, ...Shop.categories];
  setHTML("shop-cats", cats.map((c) =>
    `<button class="cat-chip ${Shop.currentCat === c.id ? "active" : ""}" data-cat="${c.id}">${c.name}</button>`).join(""));
}

document.addEventListener("click", (e) => {
  const chip = e.target.closest(".cat-chip");
  if (!chip) return;
  Shop.currentCat = chip.dataset.cat;
  renderShopCats();
  renderProducts();
});

document.addEventListener("input", (e) => {
  if (e.target.id === "shop-search") renderProducts();
});

function renderProducts() {
  const list = Shop.getFiltered();
  const featured = Shop.getFeatured();
  const fsec = document.getElementById("featured-section");
  if (featured.length) {
    fsec.style.display = "block";
    setHTML("featured-list", featured.map(Shop.featuredCardHTML).join(""));
  } else fsec.style.display = "none";
  if (!list.length) {
    setHTML("products-grid", `<div style="grid-column:1/-1;text-align:center;padding:40px 20px;color:var(--muted);">कोई product नहीं मिला</div>`);
  } else {
    setHTML("products-grid", list.map(Shop.productCardHTML).join(""));
  }
}

document.addEventListener("click", (e) => {
  const card = e.target.closest(".product-card, .featured-card");
  if (!card) return;
  const p = Shop.findById(card.dataset.product);
  if (p) openProductDetail(p);
});

function openProductDetail(p) {
  Shop.currentProduct = p;
  const img = (p.images && p.images[0]) || "https://via.placeholder.com/600x800?text=Product";
  const stars = "★".repeat(Math.round(p.rating || 0)) + "☆".repeat(5 - Math.round(p.rating || 0));
  const links = p.links || {};
  let marketsHTML = "";
  if (links.flipkart) marketsHTML += Shop.marketBtnHTML("flipkart", "Flipkart", "Best deals & fast delivery", links.flipkart);
  if (links.amazon) marketsHTML += Shop.marketBtnHTML("amazon", "amazon", "Wide range & trusted delivery", links.amazon);
  if (links.meesho) marketsHTML += Shop.marketBtnHTML("meesho", "meesho", "Great prices & more offers", links.meesho);
  if (links.other) marketsHTML += Shop.marketBtnHTML("other", "Other Stores", "Check on other platforms", links.other);
  const tags = (p.tags || []).map((t) =>
    `<div class="pd-feature">${ICONS.check}<div class="pd-feature-label">${t}</div></div>`).join("");
  setHTML("pd-content", `
    <img class="product-detail-img" src="${img}" alt="${p.title}" onerror="this.src='https://via.placeholder.com/600x800?text=Product'"/>
    ${p.badge ? `<div class="pd-badge">${p.badge}</div>` : ""}
    <div class="pd-title">${p.title}</div>
    <div class="pd-rating">
      <span class="pd-stars">${stars}</span>
      <span style="font-weight:700;">${p.rating || 0}</span>
      <span class="muted">(${p.rating_count || 0})</span>
      <span class="pd-verified">${ICONS.check} Verified</span>
    </div>
    <div class="pd-desc">${p.description || ""}</div>
    <div class="pd-section-title">Available On</div>
    <div class="pd-section-sub">अपना पसंदीदा marketplace चुनो</div>
    <div class="market-grid">${marketsHTML}</div>
    <div class="pd-section-title">Product Description</div>
    <div class="pd-desc" style="margin-top:8px;">${p.description || "No description."}</div>
    ${tags ? `<div class="pd-section-title">Details</div><div class="pd-features" style="margin-top:8px;">${tags}</div>` : ""}
  `);
  Screen.show("product-detail");
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest(".market-btn");
  if (!btn) return;
  const url = btn.dataset.url;
  if (url) window.open(url, "_blank", "noopener");
});

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-pd-back")) Screen.show("shop");
});

window.addEventListener("DOMContentLoaded", startApp);
console.log("app.js loaded OK");

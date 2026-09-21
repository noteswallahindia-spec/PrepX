/* ============================================
   EXAM ROOM - Part 4
   Full test UI with timer, palette, mark
   ============================================ */

const ExamRoom = {
  paper: null,
  current: 0,
  answers: {},      // { qIndex: "A" | text }
  marked: {},       // { qIndex: true }
  visited: {},      // { qIndex: true }
  timeLeft: 0,      // seconds
  totalTime: 0,
  timerId: null,
  draftKey: "prex_exam_draft",

  // ============================================
  // START
  // ============================================
  start(paper, durationMin) {
    this.paper = paper;
    this.current = 0;
    this.answers = {};
    this.marked = {};
    this.visited = { 0: true };
    this.totalTime = durationMin * 60;
    this.timeLeft = this.totalTime;

    // Try restore draft
    this.tryRestoreDraft();

    // Render + timer
    this.render();
    this.startTimer();

    // Enter fullscreen-ish
    Screen.show("exam-room");
  },

  // ============================================
  // DRAFT (crash recovery)
  // ============================================
  saveDraft() {
    try {
      const draft = {
        paperId: this.paper.title || "paper",
        current: this.current,
        answers: this.answers,
        marked: this.marked,
        visited: this.visited,
        timeLeft: this.timeLeft,
        totalTime: this.totalTime,
        savedAt: Date.now(),
      };
      localStorage.setItem(this.draftKey, JSON.stringify(draft));
    } catch {}
  },

  tryRestoreDraft() {
    try {
      const raw = localStorage.getItem(this.draftKey);
      if (!raw) return;
      const draft = JSON.parse(raw);
      // Only restore if less than 6 hours old AND same paper
      if (Date.now() - draft.savedAt > 6 * 3600 * 1000) return;
      if (draft.paperId !== (this.paper.title || "paper")) return;
      if (confirm("पिछला attempt मिला. Resume करें?")) {
        this.answers = draft.answers || {};
        this.marked = draft.marked || {};
        this.visited = draft.visited || {};
        this.current = draft.current || 0;
        this.timeLeft = draft.timeLeft || this.totalTime;
        toast("Draft restored", "success");
      } else {
        this.clearDraft();
      }
    } catch {}
  },

  clearDraft() {
    try { localStorage.removeItem(this.draftKey); } catch {}
  },

  // ============================================
  // TIMER
  // ============================================
  startTimer() {
    this.stopTimer();
    this.tickTimer();
    this.timerId = setInterval(() => this.tickTimer(), 1000);
  },

  stopTimer() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  },

  tickTimer() {
    const el = document.getElementById("er-timer-text");
    const wrap = document.getElementById("er-timer");
    if (!el) return;

    if (this.timeLeft <= 0) {
      el.textContent = "00:00";
      this.stopTimer();
      this.timeUp();
      return;
    }

    this.timeLeft--;
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    el.textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");

    // Color states
    wrap.classList.toggle("warning", this.timeLeft <= 300 && this.timeLeft > 60);
    wrap.classList.toggle("danger", this.timeLeft <= 60);

    // Save every 30 sec
    if (this.timeLeft % 30 === 0) this.saveDraft();
  },

  timeUp() {
    document.getElementById("timeup").classList.add("open");
  },

  // ============================================
  // RENDER
  // ============================================
  render() {
    const q = this.paper.questions[this.current];
    const total = this.paper.questions.length;

    // Header
    setText("er-q-num", `Q${this.current + 1} / ${total}`);
    setText("er-q-marks", (q.marks || 1) + " mark" + (q.marks > 1 ? "s" : ""));
    setText("er-q-type", q.type === "mcq" ? "MCQ" : "Subjective");

    // Progress bar
    const progress = ((this.current + 1) / total) * 100;
    const fill = document.getElementById("er-progress-fill");
    if (fill) fill.style.width = progress + "%";

    // Question text
    setText("er-q-text", q.question);

    // Render MCQ vs Subjective
    if (q.type === "mcq") {
      this.renderMCQ(q);
    } else {
      this.renderSubjective(q);
    }

    // Mark button state
    const markBtn = document.getElementById("btn-er-mark");
    markBtn.classList.toggle("marked", !!this.marked[this.current]);

    // Nav buttons
    document.getElementById("btn-er-prev").disabled = this.current === 0;

    const nextBtn = document.getElementById("btn-er-next");
    const nextText = document.getElementById("er-next-text");
    if (this.current === total - 1) {
      nextText.textContent = "Submit";
    } else {
      nextText.textContent = "Next";
    }

    // Save draft
    this.saveDraft();
  },

  renderMCQ(q) {
    document.getElementById("er-subjective").style.display = "none";
    const box = document.getElementById("er-options");
    box.style.display = "flex";

    const keys = ["A", "B", "C", "D", "E", "F"];
    const selected = this.answers[this.current];

    box.innerHTML = (q.options || []).map((opt, i) => {
      const key = keys[i] || String(i + 1);
      const isSel = selected === key;
      // Strip "A) " prefix from option text if present
      const text = opt.replace(/^[A-F]\)\s*/, "").replace(/^[A-F]\.\s*/, "");
      return `<button type="button" class="er-option ${isSel ? "selected" : ""}" data-key="${key}">
        <span class="er-option-key">${key}</span>
        <span>${text}</span>
      </button>`;
    }).join("");

    box.querySelectorAll(".er-option").forEach((btn) => {
      btn.onclick = () => {
        this.answers[this.current] = btn.dataset.key;
        this.render();
      };
    });
  },

  renderSubjective(q) {
    document.getElementById("er-options").style.display = "none";
    document.getElementById("er-options").innerHTML = "";
    document.getElementById("er-subjective").style.display = "block";

    const ta = document.getElementById("er-answer-input");
    ta.value = this.answers[this.current] || "";

    const updateWordCount = () => {
      const text = ta.value.trim();
      const words = text ? text.split(/\s+/).length : 0;
      document.getElementById("er-word-count").textContent = words + " words";
    };

    ta.oninput = () => {
      this.answers[this.current] = ta.value;
      updateWordCount();
      this.saveDraft();
    };

    updateWordCount();
  },

  // ============================================
  // NAVIGATION
  // ============================================
  next() {
    const total = this.paper.questions.length;
    if (this.current === total - 1) {
      this.openSubmitConfirm();
      return;
    }
    this.current++;
    this.visited[this.current] = true;
    this.render();
    document.getElementById("er-body").scrollTop = 0;
  },

  prev() {
    if (this.current === 0) return;
    this.current--;
    this.visited[this.current] = true;
    this.render();
    document.getElementById("er-body").scrollTop = 0;
  },

  jumpTo(idx) {
    this.current = idx;
    this.visited[idx] = true;
    this.render();
    this.closePalette();
    document.getElementById("er-body").scrollTop = 0;
  },

  toggleMark() {
    this.marked[this.current] = !this.marked[this.current];
    this.render();
    toast(this.marked[this.current] ? "Marked for review" : "Unmarked");
  },

  // ============================================
  // PALETTE
  // ============================================
  openPalette() {
    this.renderPalette();
    document.getElementById("palette-drawer").classList.add("open");
  },

  closePalette() {
    document.getElementById("palette-drawer").classList.remove("open");
  },

  renderPalette() {
    const grid = document.getElementById("palette-grid");
    const total = this.paper.questions.length;

    grid.innerHTML = "";
    for (let i = 0; i < total; i++) {
      const btn = document.createElement("button");
      btn.className = "palette-num";
      btn.textContent = i + 1;
      btn.onclick = () => this.jumpTo(i);

      const hasAns = this.answers[i] !== undefined && this.answers[i] !== "";
      const isMarked = this.marked[i];
      const isVisited = this.visited[i];

      if (isMarked) btn.classList.add("marked");
      else if (hasAns) btn.classList.add("answered");
      else if (isVisited) btn.classList.add("notanswered");
      else if (isVisited) btn.classList.add("visited");

      if (i === this.current) btn.classList.add("current");
      grid.appendChild(btn);
    }

    // Summary
    let answered = 0, marked = 0;
    for (let i = 0; i < total; i++) {
      const hasAns = this.answers[i] !== undefined && this.answers[i] !== "";
      if (hasAns) answered++;
      if (this.marked[i]) marked++;
    }
    setText("sum-answered", answered);
    setText("sum-notanswered", total - answered);
    setText("sum-marked", marked);
  },

  // ============================================
  // SUBMIT
  // ============================================
  openSubmitConfirm() {
    const total = this.paper.questions.length;
    let answered = 0, marked = 0;
    for (let i = 0; i < total; i++) {
      const hasAns = this.answers[i] !== undefined && this.answers[i] !== "";
      if (hasAns) answered++;
      if (this.marked[i]) marked++;
    }
    const notAns = total - answered;

    setHTML("submit-stats", `
      <div class="stat-row"><span class="stat-label">Total Questions</span><span class="stat-value">${total}</span></div>
      <div class="stat-row"><span class="stat-label">Answered</span><span class="stat-value">${answered}</span></div>
      <div class="stat-row"><span class="stat-label">Not Answered</span><span class="stat-value ${notAns > 0 ? 'danger' : ''}">${notAns}</span></div>
      <div class="stat-row"><span class="stat-label">Marked for Review</span><span class="stat-value ${marked > 0 ? 'warn' : ''}">${marked}</span></div>
      <div class="stat-row"><span class="stat-label">Time Used</span><span class="stat-value">${this.formatTime(this.totalTime - this.timeLeft)}</span></div>
    `);

    document.getElementById("submit-confirm").classList.add("open");
  },

  closeSubmitConfirm() {
    document.getElementById("submit-confirm").classList.remove("open");
  },

  confirmSubmit() {
    this.closeSubmitConfirm();
    this.submit();
  },

  submit() {
    this.stopTimer();

    // Build answer string for storage
    const answersList = [];
    const total = this.paper.questions.length;
    for (let i = 0; i < total; i++) {
      const a = this.answers[i];
      if (a === undefined || a === "") {
        answersList.push("X");  // not answered
      } else if (typeof a === "string" && a.length === 1 && a.match(/[A-F]/)) {
        answersList.push(a);  // MCQ
      } else {
        answersList.push("S");  // subjective
      }
    }
    const answerStr = answersList.join("");

    // Calculate score
    let score = 0, totalMarks = 0;
    const weakTopics = [];
    for (let i = 0; i < total; i++) {
      const q = this.paper.questions[i];
      const marks = q.marks || 1;
      totalMarks += marks;
      if (q.type === "mcq") {
        if (this.answers[i] === q.correct_answer) score += marks;
      }
      // Subjective: AI evaluation in Part 5
    }

    // Save to localStorage (guest) or Supabase
    const result = {
      paper: this.paper,
      answers: this.answers,
      answerStr,
      score,
      totalMarks,
      timeUsed: this.totalTime - this.timeLeft,
      submittedAt: new Date().toISOString(),
      subject: App.state.examConfig.subject,
      examCategory: App.state.profile?.exam_category || null,
      mode: App.state.profile?.mode || "school",
    };

    // Save to App state
    App.state.lastResult = result;

    // Save to Supabase (best-effort)
    this.saveResultToBackend(result);

    // Clear draft
    this.clearDraft();

    toast("Test submitted!", "success");
    Screen.show("result-pending");
  },

  async saveResultToBackend(result) {
    if (!supabase) return;
    try {
      const userId = App.state.user?.id;
      if (!userId) return;
      // Guest users have no Supabase user
      if (App.state.isGuest) {
        // Save locally only
        try {
          const history = JSON.parse(localStorage.getItem("prex_guest_results") || "[]");
          history.unshift(result);
          localStorage.setItem("prex_guest_results", JSON.stringify(history.slice(0, 10)));
        } catch {}
        return;
      }

      const { error } = await supabase.from("attempts").insert({
        user_id: userId,
        paper_json: result.paper,
        answer_str: result.answerStr,
        score: result.score,
        total: result.totalMarks,
        time_sec: result.timeUsed,
        status: "submitted",
      });
      if (error) console.warn("Save failed:", error);
    } catch (e) {
      console.warn("Save error:", e);
    }
  },

  formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  },

  // ============================================
  // EXIT
  // ============================================
  openExitConfirm() {
    document.getElementById("exit-confirm").classList.add("open");
  },
  closeExitConfirm() {
    document.getElementById("exit-confirm").classList.remove("open");
  },
  confirmExit() {
    this.stopTimer();
    this.saveDraft();  // keep draft
    this.closeExitConfirm();
    Screen.show("home");
  },
};

// ============================================
// WIRE UP EVENTS
// ============================================
document.addEventListener("click", (e) => {
  // Exit
  if (e.target.closest("#btn-er-exit")) ExamRoom.openExitConfirm();

  // Palette toggle
  if (e.target.closest("#btn-er-palette")) ExamRoom.openPalette();
  if (e.target.closest("#btn-palette-close")) ExamRoom.closePalette();

  // Palette overlay click (outside panel)
  const drawer = document.getElementById("palette-drawer");
  if (drawer && e.target === drawer) ExamRoom.closePalette();

  // Navigation
  if (e.target.closest("#btn-er-next")) ExamRoom.next();
  if (e.target.closest("#btn-er-prev")) ExamRoom.prev();
  if (e.target.closest("#btn-er-mark")) ExamRoom.toggleMark();

  // Submit from palette
  if (e.target.closest("#btn-submit-from-palette")) {
    ExamRoom.closePalette();
    ExamRoom.openSubmitConfirm();
  }

  // Submit confirm
  if (e.target.closest("#btn-cancel-submit")) ExamRoom.closeSubmitConfirm();
  if (e.target.closest("#btn-confirm-submit")) ExamRoom.confirmSubmit();

  // Exit confirm
  if (e.target.closest("#btn-cancel-exit")) ExamRoom.closeExitConfirm();
  if (e.target.closest("#btn-confirm-exit")) ExamRoom.confirmExit();

  // Timeup continue
  if (e.target.closest("#btn-timeup-continue")) {
    document.getElementById("timeup").classList.remove("open");
    ExamRoom.submit();
  }
});

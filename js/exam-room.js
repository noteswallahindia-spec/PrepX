// ============================================
// EXAM ROOM
// ============================================

const ExamRoom = {
  paper: null,
  current: 0,
  answers: {},
  marked: {},
  visited: {},
  timeLeft: 0,
  totalTime: 0,
  timerId: null,
  draftKey: "prex_exam_draft",
  provider: null,

  start(paper, durationMin, provider) {
    this.paper = paper;
    this.current = 0;
    this.answers = {};
    this.marked = {};
    this.visited = { 0: true };
    this.totalTime = durationMin * 60;
    this.timeLeft = this.totalTime;
    this.provider = provider || null;

    this.tryRestoreDraft();
    this.render();
    this.startTimer();
    Screen.show("exam-room");
  },

  saveDraft() {
    try {
      localStorage.setItem(this.draftKey, JSON.stringify({
        paperTitle: this.paper.title,
        current: this.current,
        answers: this.answers,
        marked: this.marked,
        visited: this.visited,
        timeLeft: this.timeLeft,
        totalTime: this.totalTime,
        savedAt: Date.now(),
      }));
    } catch {}
  },

  tryRestoreDraft() {
    try {
      const raw = localStorage.getItem(this.draftKey);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (Date.now() - d.savedAt > 6 * 3600 * 1000) return;
      if (d.paperTitle !== this.paper.title) return;
      if (confirm("पिछला attempt मिला. Resume करें?")) {
        this.answers = d.answers || {};
        this.marked = d.marked || {};
        this.visited = d.visited || {};
        this.current = d.current || 0;
        this.timeLeft = d.timeLeft || this.totalTime;
        toast("Draft restored", "success");
      } else {
        this.clearDraft();
      }
    } catch {}
  },

  clearDraft() {
    try { localStorage.removeItem(this.draftKey); } catch {}
  },

  startTimer() {
    this.stopTimer();
    this.tickTimer();
    this.timerId = setInterval(() => this.tickTimer(), 1000);
  },

  stopTimer() {
    if (this.timerId) { clearInterval(this.timerId); this.timerId = null; }
  },

  tickTimer() {
    const el = document.getElementById("er-timer-text");
    const wrap = document.getElementById("er-timer");
    if (!el) return;

    if (this.timeLeft <= 0) {
      el.textContent = "00:00";
      this.stopTimer();
      document.getElementById("timeup").classList.add("open");
      return;
    }

    this.timeLeft--;
    const m = Math.floor(this.timeLeft / 60);
    const s = this.timeLeft % 60;
    el.textContent = String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");

    wrap.classList.toggle("warning", this.timeLeft <= 300 && this.timeLeft > 60);
    wrap.classList.toggle("danger", this.timeLeft <= 60);

    if (this.timeLeft % 30 === 0) this.saveDraft();
  },

  render() {
    const q = this.paper.questions[this.current];
    const total = this.paper.questions.length;

    setText("er-q-num", `Q${this.current + 1} / ${total}`);
    setText("er-q-marks", (q.marks || 1) + " mark" + ((q.marks || 1) > 1 ? "s" : ""));
    setText("er-q-type", q.type === "mcq" ? "MCQ" : "Subjective");

    const progress = ((this.current + 1) / total) * 100;
    const fill = document.getElementById("er-progress-fill");
    if (fill) fill.style.width = progress + "%";

    setText("er-q-text", q.question);

    if (q.type === "mcq") this.renderMCQ(q);
    else this.renderSubjective(q);

    const markBtn = document.getElementById("btn-er-mark");
    markBtn.classList.toggle("marked", !!this.marked[this.current]);

    document.getElementById("btn-er-prev").disabled = this.current === 0;

    const nextText = document.getElementById("er-next-text");
    nextText.textContent = this.current === total - 1 ? "Submit" : "Next";

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

    const updateCount = () => {
      const text = ta.value.trim();
      const words = text ? text.split(/\s+/).length : 0;
      document.getElementById("er-word-count").textContent = words + " words";
    };

    ta.oninput = () => {
      this.answers[this.current] = ta.value;
      updateCount();
      this.saveDraft();
    };

    updateCount();
  },

  next() {
    const total = this.paper.questions.length;
    if (this.current === total - 1) return this.openSubmitConfirm();
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

      if (i === this.current) btn.classList.add("current");
      grid.appendChild(btn);
    }

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
      <div class="stat-row"><span class="stat-label">Total</span><span class="stat-value">${total}</span></div>
      <div class="stat-row"><span class="stat-label">Answered</span><span class="stat-value">${answered}</span></div>
      <div class="stat-row"><span class="stat-label">Not Answered</span><span class="stat-value ${notAns > 0 ? "danger" : ""}">${notAns}</span></div>
      <div class="stat-row"><span class="stat-label">Marked</span><span class="stat-value ${marked > 0 ? "warn" : ""}">${marked}</span></div>
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

  async submit() {
    this.stopTimer();
    Screen.show("evaluating");

    const answersList = [];
    const total = this.paper.questions.length;
    for (let i = 0; i < total; i++) {
      const a = this.answers[i];
      if (a === undefined || a === "") answersList.push("X");
      else if (typeof a === "string" && a.length === 1 && a.match(/[A-F]/)) answersList.push(a);
      else answersList.push("S");
    }
    const answerStr = answersList.join("");

    let mcqScore = 0, totalMarks = 0;
    for (let i = 0; i < total; i++) {
      const q = this.paper.questions[i];
      const marks = q.marks || 1;
      totalMarks += marks;
      if (q.type === "mcq" && this.answers[i] === q.correct_answer) mcqScore += marks;
    }

    let subjectiveEval = [];
    let aiFeedback = "";
    let weakTopics = [];
    let strongTopics = [];
    let subjectiveScore = 0;

    try {
      const hasSubjective = this.paper.questions.some((q) => q.type === "subjective");
      if (hasSubjective) {
        setText("eval-status", "AI answers check कर रहा है...");
        const evalRes = await AIEval.evaluate(this.paper, this.answers);
        subjectiveEval = evalRes.evaluations || [];
        weakTopics = evalRes.weak_topics || [];
        strongTopics = evalRes.strong_topics || [];
        aiFeedback = evalRes.overall_feedback || "";
        subjectiveEval.forEach((e) => { subjectiveScore += (e.awarded || 0); });
      }
    } catch (e) {
      console.warn("AI eval failed:", e);
      aiFeedback = "AI evaluation failed.";
    }

    const finalScore = mcqScore + subjectiveScore;
    const timeUsed = this.totalTime - this.timeLeft;

    const resultData = {
      paper: this.paper,
      answers: this.answers,
      answerStr,
      score: finalScore,
      totalMarks,
      timeUsed,
      subjectiveEval,
      weakTopics,
      strongTopics,
      aiFeedback,
      provider: this.provider,
      subject: ExamSetup.config.subject,
      examTitle: this.paper.title || "Test",
      examCategory: State.profile?.exam_category || null,
    };

    App.state.lastResult = resultData;

    await this.saveToBackend(resultData);

    // Mark daily challenge as attempted
    try { await DailyChallenge.markAttempted(finalScore, totalMarks); } catch {}

    this.clearDraft();
    Result.show(resultData);
  },

  async saveToBackend(resultData) {
    try {
      if (State.isGuest) {
        const history = JSON.parse(localStorage.getItem("prex_guest_results") || "[]");
        history.unshift({
          score: resultData.score,
          total: resultData.totalMarks,
          subject: resultData.subject,
          at: new Date().toISOString(),
        });
        localStorage.setItem("prex_guest_results", JSON.stringify(history.slice(0, 10)));
        return;
      }

      const userId = State.user?.id;
      if (!userId) return;

      const { data: attempt, error: e1 } = await supabase
        .from("attempts")
        .insert({
          user_id: userId,
          exam_category: resultData.examCategory,
          exam_title: resultData.examTitle,
          subject: resultData.subject,
          paper_json: resultData.paper,
          answer_str: resultData.answerStr,
          score: resultData.score,
          total: resultData.totalMarks,
          time_sec: resultData.timeUsed,
          status: "submitted",
          ai_provider: resultData.provider,
        })
        .select()
        .single();

      if (e1) throw e1;

      const percent = resultData.totalMarks
        ? Math.round((resultData.score / resultData.totalMarks) * 100)
        : 0;

      let grade = "F";
      if (percent >= 90) grade = "A+";
      else if (percent >= 80) grade = "A";
      else if (percent >= 70) grade = "B+";
      else if (percent >= 60) grade = "B";
      else if (percent >= 50) grade = "C";
      else if (percent >= 40) grade = "D";

      await supabase.from("results").insert({
        user_id: userId,
        attempt_id: attempt.id,
        exam_title: resultData.examTitle,
        subject: resultData.subject,
        score: resultData.score,
        total: resultData.totalMarks,
        percent,
        grade,
        weak_topics: resultData.weakTopics,
        strong_topics: resultData.strongTopics,
        ai_feedback: resultData.aiFeedback,
        subjective_eval: resultData.subjectiveEval,
      });

      supabase.rpc("cleanup_old_attempts").then(() => {}).catch(() => {});
    } catch (e) {
      console.warn("Save failed:", e);
    }
  },

  formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + "m " + s + "s";
  },

  openExitConfirm() { document.getElementById("exit-confirm").classList.add("open"); },
  closeExitConfirm() { document.getElementById("exit-confirm").classList.remove("open"); },
  confirmExit() {
    this.stopTimer();
    this.saveDraft();
    this.closeExitConfirm();
    Screen.show("home");
  },
};

// ============================================
// EVENT WIRING
// ============================================
document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-er-exit")) ExamRoom.openExitConfirm();
  if (e.target.closest("#btn-er-palette")) ExamRoom.openPalette();
  if (e.target.closest("#btn-palette-close")) ExamRoom.closePalette();

  const drawer = document.getElementById("palette-drawer");
  if (drawer && e.target === drawer) ExamRoom.closePalette();

  if (e.target.closest("#btn-er-next")) ExamRoom.next();
  if (e.target.closest("#btn-er-prev")) ExamRoom.prev();
  if (e.target.closest("#btn-er-mark")) ExamRoom.toggleMark();

  if (e.target.closest("#btn-submit-from-palette")) {
    ExamRoom.closePalette();
    ExamRoom.openSubmitConfirm();
  }

  if (e.target.closest("#btn-cancel-submit")) ExamRoom.closeSubmitConfirm();
  if (e.target.closest("#btn-confirm-submit")) ExamRoom.confirmSubmit();

  if (e.target.closest("#btn-cancel-exit")) ExamRoom.closeExitConfirm();
  if (e.target.closest("#btn-confirm-exit")) ExamRoom.confirmExit();

  if (e.target.closest("#btn-timeup-continue")) {
    document.getElementById("timeup").classList.remove("open");
    ExamRoom.submit();
  }
});

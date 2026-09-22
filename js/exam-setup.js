// ============================================
// EXAM SETUP + PAPER PREVIEW
// ============================================

const ExamSetup = {
  config: {
    subject: null,
    chapters: [],
    type: "mixed",
    difficulty: "medium",
    count: 10,
    duration: 30,
  },
  subjects: [],
  currentPaper: null,
  currentProvider: null,

  async open() {
    const profile = State.profile;
    const examId = this.getExamId(profile);
    if (!examId) return toast("Profile incomplete", "error");

    Screen.show("exam-setup");

    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .eq("exam_id", examId)
        .order("sort_order");
      if (error) throw error;

      if (!data || !data.length) {
        return toast("इस exam के subjects नहीं मिले", "error");
      }

      this.subjects = data;
      const sel = document.getElementById("es-subject");
      sel.innerHTML = data.map((s, i) =>
        `<option value="${i}">${s.name_hi || s.name}</option>`).join("");
      sel.onchange = () => this.renderChapters(data[parseInt(sel.value)]);

      this.renderChapters(data[0]);
    } catch (e) {
      toast("Load failed: " + e.message, "error");
    }
  },

  getExamId(profile) {
    if (!profile) return null;
    if (profile.mode === "competitive") return profile.exam_category;
    const cls = profile.cls;
    const board = (profile.board || "").toLowerCase();
    if (board.includes("cbse")) return "cbse_" + cls;
    if (board.includes("icse")) return "icse_" + cls;
    return "cbse_" + cls;
  },

  renderChapters(subject) {
    this.config.subject = subject.name;
    this.config.chapters = [];
    const chapters = subject.chapters || [];

    setHTML("es-chapters", chapters.map((ch) =>
      `<label class="chapter-item">
        <input type="checkbox" value="${ch}" data-chapter />
        <span>${ch}</span>
      </label>`).join(""));

    document.querySelectorAll("#es-chapters input[data-chapter]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const list = [];
        document.querySelectorAll("#es-chapters input[data-chapter]:checked").forEach((c) => list.push(c.value));
        this.config.chapters = list;
      });
    });
  },

  async generate() {
    const p = State.profile;
    const cfg = this.config;

    if (!cfg.chapters || !cfg.chapters.length) {
      return toast("कम से कम 1 chapter चुनो", "error");
    }

    const examName = p.mode === "competitive"
      ? (p.exam_name || p.exam_category)
      : `${p.board} Class ${p.cls}`;

    const aiCfg = {
      examName,
      subject: cfg.subject,
      chapters: cfg.chapters,
      type: cfg.type,
      difficulty: cfg.difficulty,
      count: cfg.count,
      duration: cfg.duration,
      lang: p.lang || "hi",
    };

    Screen.show("generating");
    let progress = 0;
    const fill = document.getElementById("gen-fill");
    const status = document.getElementById("gen-status");

    const steps = [
      "Analyzing chapters...",
      "Finding patterns...",
      "Generating questions...",
      "Verifying answers...",
      "Formatting paper...",
    ];
    let idx = 0;

    const tick = setInterval(() => {
      progress = Math.min(progress + Math.random() * 12, 92);
      fill.style.width = progress + "%";
      const n = Math.min(Math.floor(progress / 20), steps.length - 1);
      if (n !== idx) { idx = n; status.textContent = steps[idx]; }
    }, 500);

    try {
      const res = await AI.generatePaper(aiCfg);
      clearInterval(tick);
      fill.style.width = "100%";
      status.textContent = "Done! Provider: " + res.provider;
      await sleep(400);

      this.currentPaper = res.paper;
      this.currentProvider = res.provider;
      this.showPaper(res.paper, res.provider);
    } catch (e) {
      clearInterval(tick);
      toast("AI failed: " + e.message, "error");
      Screen.show("exam-setup");
    }
  },

  showPaper(paper, provider) {
    setText("paper-title", paper.title || "Test Paper");

    const qs = paper.questions || [];
    const totalMarks = qs.reduce((s, q) => s + (q.marks || 1), 0);

    setHTML("paper-info", `
      <div><strong>Questions:</strong> ${qs.length}</div>
      <div><strong>Total Marks:</strong> ${totalMarks}</div>
      <div><strong>Subject:</strong> ${this.config.subject}</div>
      <div><strong>Duration:</strong> ${this.config.duration} min</div>
      <div><strong>AI:</strong> ${provider}</div>
      <div style="margin-top:8px;font-style:italic;">${paper.instructions || ""}</div>
    `);

    setHTML("paper-questions", qs.map((q, i) => {
      if (q.type === "mcq") {
        return `<div class="q-card">
          <div class="q-num">Q${i + 1} • MCQ • ${q.marks || 1} mark</div>
          <div class="q-text">${q.question}</div>
          <div class="q-options">
            ${(q.options || []).map((o) => {
              const isCorrect = o.trim().charAt(0) === q.correct_answer;
              return `<div class="q-option ${isCorrect ? "correct" : ""}">${o}</div>`;
            }).join("")}
          </div>
          ${q.explanation ? `<div class="q-marks">${q.explanation}</div>` : ""}
        </div>`;
      } else {
        return `<div class="q-card">
          <div class="q-num">Q${i + 1} • Subjective • ${q.marks || 5} marks</div>
          <div class="q-text">${q.question}</div>
          <div class="q-subjective">यहाँ अपना उत्तर लिखो...</div>
          ${q.sample_answer ? `<div class="q-marks" style="margin-top:10px;"><strong>Sample:</strong> ${q.sample_answer}</div>` : ""}
        </div>`;
      }
    }).join(""));

    Screen.show("paper");
  },
};

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-exam-back")) Screen.show("home");
});

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-select-all")) {
    const cbs = document.querySelectorAll("#es-chapters input[data-chapter]");
    const all = Array.from(cbs).every((c) => c.checked);
    cbs.forEach((c) => { c.checked = !all; });
    const list = [];
    cbs.forEach((c) => { if (c.checked) list.push(c.value); });
    ExamSetup.config.chapters = list;
  }
});

const ES_GROUPS = {
  "es-type": "type",
  "es-diff": "difficulty",
  "es-count": "count",
  "es-dur": "duration",
};

Object.entries(ES_GROUPS).forEach(([gid, key]) => {
  document.querySelectorAll(`#${gid} .opt-chip`).forEach((chip) => {
    chip.addEventListener("click", () => {
      document.querySelectorAll(`#${gid} .opt-chip`).forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      const v = chip.dataset.val;
      ExamSetup.config[key] = (key === "count" || key === "duration") ? parseInt(v) : v;
    });
  });
});

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-generate")) ExamSetup.generate();
});

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-paper-back")) Screen.show("exam-setup");
});

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-regen")) Screen.show("exam-setup");
});

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-start-exam")) {
    if (!ExamSetup.currentPaper) return toast("Paper तैयार नहीं", "error");
    ExamRoom.start(ExamSetup.currentPaper, ExamSetup.config.duration);
  }
});

// ============================================
// DAILY CHALLENGE - 5 questions daily
// ============================================

const DailyChallenge = {
  todayPaper: null,

  async load() {
    const today = new Date().toISOString().slice(0, 10);

    if (State.isGuest) {
      const stored = JSON.parse(localStorage.getItem("prex_daily_" + today) || "null");
      if (stored) {
        this.todayPaper = stored;
        this.renderCard(stored);
      } else {
        this.renderCard(null);
      }
      return;
    }

    try {
      const { data } = await supabase
        .from("daily_challenges")
        .select("*")
        .eq("user_id", State.user.id)
        .eq("challenge_date", today)
        .maybeSingle();

      if (data) {
        this.todayPaper = data;
        this.renderCard(data);
      } else {
        this.renderCard(null);
      }
    } catch (e) { this.renderCard(null); }
  },

  renderCard(data) {
    const box = document.getElementById("daily-box");
    if (!box) return;

    const today = new Date().toISOString().slice(0, 10);

    if (!data) {
      box.innerHTML = `
        <div class="daily-card">
          <div class="daily-header">
            <span class="daily-icon">${ICONS.sparkle}</span>
            <div>
              <div class="daily-title">Daily Challenge</div>
              <div class="daily-sub">आज के 5 सवाल</div>
            </div>
          </div>
          <button class="btn-primary daily-btn" id="btn-daily-start">
            <span>Start Today's Challenge</span>
            <span class="btn-icon">${ICONS.arrowRight}</span>
          </button>
        </div>`;
      return;
    }

    if (data.attempted) {
      box.innerHTML = `
        <div class="daily-card done">
          <div class="daily-header">
            <span class="daily-icon done">${ICONS.check}</span>
            <div>
              <div class="daily-title">आज का Challenge ✅</div>
              <div class="daily-sub">Score: ${data.score} / ${data.total}</div>
            </div>
          </div>
        </div>`;
      return;
    }

    box.innerHTML = `
      <div class="daily-card">
        <div class="daily-header">
          <span class="daily-icon">${ICONS.sparkle}</span>
          <div>
            <div class="daily-title">Daily Challenge तैयार</div>
            <div class="daily-sub">5 सवाल • 10 मिनट</div>
          </div>
        </div>
        <button class="btn-primary daily-btn" id="btn-daily-open">
          <span>Open Challenge</span>
          <span class="btn-icon">${ICONS.arrowRight}</span>
        </button>
      </div>`;
  },

  async startNew() {
    const p = State.profile;
    if (!p) return;

    const examName = p.mode === "competitive"
      ? (p.exam_name || p.exam_category)
      : `${p.board} Class ${p.cls}`;

    // Get subject from profile
    let subject = "General";
    try {
      const examId = ExamSetup.getExamId(p);
      const { data } = await supabase.from("subjects").select("name").eq("exam_id", examId).limit(1);
      if (data && data[0]) subject = data[0].name;
    } catch {}

    const aiCfg = {
      examName,
      subject,
      chapters: ["Mixed"],
      type: "mcq",
      difficulty: "medium",
      count: 5,
      duration: 10,
      lang: p.lang || "hi",
    };

    Screen.show("generating");
    document.getElementById("gen-status").textContent = "Daily challenge बना रहे हैं...";

    try {
      const res = await AI.generatePaper(aiCfg);
      this.todayPaper = {
        paper_json: res.paper,
        subject,
        provider: res.provider,
      };

      // Save
      const today = new Date().toISOString().slice(0, 10);

      if (State.isGuest) {
        localStorage.setItem("prex_daily_" + today, JSON.stringify({
          paper_json: res.paper,
          subject,
          attempted: false,
        }));
      } else {
        await supabase.from("daily_challenges").insert({
          user_id: State.user.id,
          challenge_date: today,
          paper_json: res.paper,
          subject,
        });
      }

      ExamSetup.currentPaper = res.paper;
      ExamSetup.config.duration = 10;
      ExamSetup.config.subject = subject;

      ExamSetup.showPaper(res.paper, "daily");
    } catch (e) {
      toast("Failed: " + e.message, "error");
      showHome();
    }
  },

  open() {
    if (!this.todayPaper || !this.todayPaper.paper_json) return;
    ExamSetup.currentPaper = this.todayPaper.paper_json;
    ExamSetup.config.duration = 10;
    ExamSetup.config.subject = this.todayPaper.subject || "Daily";

    // Check if already attempted
    if (this.todayPaper.attempted) {
      return toast("आज का challenge पूरा हो गया", "success");
    }

    ExamSetup.showPaper(this.todayPaper.paper_json, "daily");
  },

  async markAttempted(score, total) {
    const today = new Date().toISOString().slice(0, 10);

    if (State.isGuest) {
      const stored = JSON.parse(localStorage.getItem("prex_daily_" + today) || "null");
      if (stored) {
        stored.attempted = true;
        stored.score = score;
        stored.total = total;
        localStorage.setItem("prex_daily_" + today, JSON.stringify(stored));
      }
      return;
    }

    try {
      await supabase.from("daily_challenges")
        .update({ attempted: true, score, total })
        .eq("user_id", State.user.id)
        .eq("challenge_date", today);
    } catch (e) {}
  },
};

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-daily-start")) DailyChallenge.startNew();
  if (e.target.closest("#btn-daily-open")) DailyChallenge.open();
});

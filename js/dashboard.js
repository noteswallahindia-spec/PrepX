// ============================================
// DASHBOARD - Home stats + recent tests
// ============================================

const Dashboard = {
  stats: null,
  recent: [],

  async load() {
    await Promise.all([this.loadStats(), this.loadRecent()]);
  },

  async loadStats() {
    if (State.isGuest) {
      const history = JSON.parse(localStorage.getItem("prex_guest_results") || "[]");
      const tests = history.length;
      const totalScore = history.reduce((s, h) => s + (h.score || 0), 0);
      const totalMarks = history.reduce((s, h) => s + (h.total || 0), 0);
      this.stats = {
        xp: totalScore * 10,
        streak: this.calcStreak(history),
        tests_taken: tests,
        total_score: totalScore,
        total_marks: totalMarks,
        avg_percent: totalMarks ? Math.round((totalScore / totalMarks) * 100) : 0,
      };
      return;
    }

    try {
      const { data } = await supabase
        .from("profiles")
        .select("xp, streak, coins, tests_taken, total_score, total_marks")
        .eq("id", State.user.id)
        .maybeSingle();

      if (data) {
        this.stats = {
          xp: data.xp || 0,
          streak: data.streak || 0,
          coins: data.coins || 0,
          tests_taken: data.tests_taken || 0,
          total_score: data.total_score || 0,
          total_marks: data.total_marks || 0,
          avg_percent: data.total_marks
            ? Math.round((data.total_score / data.total_marks) * 100)
            : 0,
        };
      } else {
        this.stats = { xp: 0, streak: 0, coins: 0, tests_taken: 0, avg_percent: 0 };
      }
    } catch (e) {
      console.warn("Stats load failed:", e);
      this.stats = { xp: 0, streak: 0, coins: 0, tests_taken: 0, avg_percent: 0 };
    }
  },

  async loadRecent() {
    if (State.isGuest) {
      const history = JSON.parse(localStorage.getItem("prex_guest_results") || "[]");
      this.recent = history.slice(0, 3).map((h) => ({
        exam_title: h.subject || "Test",
        subject: h.subject,
        score: h.score,
        total: h.total,
        created_at: h.at,
      }));
      return;
    }

    try {
      const { data } = await supabase
        .from("results")
        .select("id, exam_title, subject, score, total, percent, grade, created_at")
        .eq("user_id", State.user.id)
        .order("created_at", { ascending: false })
        .limit(3);
      this.recent = data || [];
    } catch (e) {
      console.warn("Recent load failed:", e);
      this.recent = [];
    }
  },

  calcStreak(history) {
    if (!history.length) return 0;
    const dates = [...new Set(history.map((h) => new Date(h.at).toDateString()))];
    const sorted = dates.sort((a, b) => new Date(b) - new Date(a));

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1]);
      const curr = new Date(sorted[i]);
      const diff = Math.round((prev - curr) / 86400000);
      if (diff === 1) streak++;
      else break;
    }
    return streak;
  },

  render() {
    const s = this.stats;
    if (!s) return;

    setText("ds-xp", this.formatNum(s.xp));
    setText("ds-streak", s.streak || 0);
    setText("ds-tests", s.tests_taken || 0);
    setText("ds-avg", (s.avg_percent || 0) + "%");

    // Recent
    const box = document.getElementById("ds-recent");
    if (!box) return;

    if (!this.recent.length) {
      box.innerHTML = `
        <div class="empty-mini">
          <div class="empty-mini-icon">${ICONS.sparkle}</div>
          <div class="empty-mini-title">अभी कोई test नहीं दिया</div>
          <div class="empty-mini-sub">पहला AI test शुरू करो</div>
        </div>`;
      return;
    }

    box.innerHTML = this.recent.map((r) => {
      const pct = r.total ? Math.round((r.score / r.total) * 100) : 0;
      const date = new Date(r.created_at);
      const time = this.timeAgo(date);
      return `
        <div class="recent-item">
          <div class="recent-icon">
            <span class="recent-pct ${pct >= 60 ? "good" : pct >= 40 ? "mid" : "low"}">${pct}%</span>
          </div>
          <div class="recent-info">
            <div class="recent-title">${r.exam_title || "Test"}</div>
            <div class="recent-sub">${r.subject || ""} • ${r.score}/${r.total} • ${time}</div>
          </div>
        </div>`;
    }).join("");
  },

  timeAgo(date) {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "अभी";
    if (mins < 60) return mins + "m पहले";
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + "h पहले";
    const days = Math.floor(hrs / 24);
    if (days < 7) return days + "d पहले";
    return date.getDate() + "/" + (date.getMonth() + 1);
  },

  formatNum(n) {
    if (n >= 10000) return (n / 1000).toFixed(1) + "k";
    return String(n || 0);
  },
};

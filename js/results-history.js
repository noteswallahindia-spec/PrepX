// ============================================
// RESULTS HISTORY - All past attempts
// ============================================

const ResultsHistory = {

  async open() {
    Screen.show("results-history");
    await this.load();
  },

  async load() {
    const box = document.getElementById("rh-list");
    box.innerHTML = `<div class="lb-loading">Loading...</div>`;

    let list = [];

    if (State.isGuest) {
      list = JSON.parse(localStorage.getItem("prex_guest_results") || "[]");
      list = list.map((h, i) => ({
        id: "g_" + i,
        exam_title: h.subject || "Test",
        subject: h.subject,
        score: h.score,
        total: h.total,
        percent: h.total ? Math.round((h.score / h.total) * 100) : 0,
        created_at: h.at,
      }));
    } else {
      try {
        const { data } = await supabase
          .from("results")
          .select("*")
          .eq("user_id", State.user.id)
          .order("created_at", { ascending: false })
          .limit(50);
        list = data || [];
      } catch (e) { list = []; }
    }

    if (!list.length) {
      box.innerHTML = `
        <div class="empty-mini">
          <div class="empty-mini-title">अभी कोई test नहीं</div>
          <div class="empty-mini-sub">पहला test दो → इतिहास बनेगा</div>
        </div>`;
      return;
    }

    box.innerHTML = list.map((r) => {
      const pct = r.percent != null ? r.percent : (r.total ? Math.round((r.score / r.total) * 100) : 0);
      const date = new Date(r.created_at);
      const dateStr = date.getDate() + "/" + (date.getMonth() + 1) + "/" + date.getFullYear();
      const grade = this.getGrade(pct);

      return `
        <div class="rh-item">
          <div class="rh-score ${pct >= 60 ? "good" : pct >= 40 ? "mid" : "low"}">
            <div class="rh-pct">${pct}%</div>
            <div class="rh-grade">${grade}</div>
          </div>
          <div class="rh-info">
            <div class="rh-title">${r.exam_title || "Test"}</div>
            <div class="rh-sub">${r.subject || ""}</div>
            <div class="rh-meta">${r.score} / ${r.total} • ${dateStr}</div>
          </div>
        </div>`;
    }).join("");
  },

  getGrade(p) {
    if (p >= 90) return "A+";
    if (p >= 80) return "A";
    if (p >= 70) return "B+";
    if (p >= 60) return "B";
    if (p >= 50) return "C";
    if (p >= 40) return "D";
    return "F";
  },
};

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-results-history")) ResultsHistory.open();
  if (e.target.closest("#btn-rh-back")) Screen.show("me");
});

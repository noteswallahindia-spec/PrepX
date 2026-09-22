// ============================================
// LEADERBOARD - School / Class / India
// ============================================

const Leaderboard = {
  currentTab: "india",
  data: [],
  loading: false,

  async open() {
    Screen.show("rank");
    await this.load();
  },

  async load() {
    if (this.loading) return;
    this.loading = true;

    // Show loading
    setHTML("lb-list", `<div class="lb-loading">Loading...</div>`);
    setHTML("lb-podium", "");

    try {
      let query = supabase
        .from("leaderboard_view")
        .select("*")
        .order("xp", { ascending: false })
        .limit(50);

      // Filter by tab
      if (this.currentTab === "class") {
        const cls = State.profile?.cls;
        if (cls) query = query.eq("cls", cls);
      } else if (this.currentTab === "exam") {
        const exam = State.profile?.exam_category;
        if (exam) query = query.eq("exam_category", exam);
      }
      // India = no filter

      const { data, error } = await query;
      if (error) throw error;

      this.data = data || [];
      this.render();
    } catch (e) {
      console.warn("Leaderboard error:", e);
      setHTML("lb-list", `<div class="lb-loading">Load failed. दोबारा कोशिश करो.</div>`);
    } finally {
      this.loading = false;
    }
  },

  render() {
    const list = this.data;
    if (!list.length) {
      setHTML("lb-podium", "");
      setHTML("lb-list", `<div class="lb-loading">अभी कोई data नहीं। पहला test दो!</div>`);
      return;
    }

    // Podium (top 3)
    const top = list.slice(0, 3);
    const rest = list.slice(3);

    setHTML("lb-podium", `
      <div class="podium-wrap">
        <div class="podium-item p2">
          <div class="podium-avatar">${(top[1]?.name || "?").charAt(0).toUpperCase()}</div>
          <div class="podium-name">${this.shortName(top[1]?.name)}</div>
          <div class="podium-xp">${Dashboard.formatNum(top[1]?.xp || 0)} XP</div>
          <div class="podium-rank">2</div>
        </div>
        <div class="podium-item p1">
          <div class="podium-crown">${ICONS.trophy}</div>
          <div class="podium-avatar gold">${(top[0]?.name || "?").charAt(0).toUpperCase()}</div>
          <div class="podium-name">${this.shortName(top[0]?.name)}</div>
          <div class="podium-xp">${Dashboard.formatNum(top[0]?.xp || 0)} XP</div>
          <div class="podium-rank">1</div>
        </div>
        <div class="podium-item p3">
          <div class="podium-avatar">${(top[2]?.name || "?").charAt(0).toUpperCase()}</div>
          <div class="podium-name">${this.shortName(top[2]?.name)}</div>
          <div class="podium-xp">${Dashboard.formatNum(top[2]?.xp || 0)} XP</div>
          <div class="podium-rank">3</div>
        </div>
      </div>
    `);

    // Rest of list
    const myId = State.user?.id;
    let myRank = -1;
    list.forEach((u, i) => {
      if (u.id === myId) myRank = i + 1;
    });

    let listHTML = rest.map((u, i) => {
      const rank = i + 4;
      const isMe = u.id === myId;
      return this.rowHTML(u, rank, isMe);
    }).join("");

    // If user is in top 3 or not in list at all, still show their rank
    if (myRank > 0 && myRank <= 3) {
      // User is in top 3, no need for extra
    }

    setHTML("lb-list", listHTML || `<div class="lb-loading">और ranks जल्द आएंगे</div>`);

    // If user's rank is beyond 50, show a small "Your rank" bar
    if (myRank === -1 && State.profile && !State.isGuest) {
      // Not in top 50
      setHTML("lb-my-rank", `
        <div class="lb-my-rank-bar">
          <span class="lb-my-rank-label">तुम्हारी rank</span>
          <span class="lb-my-rank-value">50+</span>
        </div>
      `);
    } else {
      setHTML("lb-my-rank", "");
    }
  },

  rowHTML(u, rank, isMe) {
    const initial = (u.name || "?").charAt(0).toUpperCase();
    const badge = u.tests_taken ? u.tests_taken + " tests" : "";
    return `
      <div class="lb-row ${isMe ? "me" : ""}">
        <div class="lb-rank-num">${rank}</div>
        <div class="lb-avatar">${initial}</div>
        <div class="lb-info">
          <div class="lb-name">${u.name}${isMe ? ' <span class="lb-you">YOU</span>' : ""}</div>
          <div class="lb-sub">${badge}</div>
        </div>
        <div class="lb-xp">${Dashboard.formatNum(u.xp || 0)}<span class="lb-xp-lbl">XP</span></div>
      </div>
    `;
  },

  shortName(name) {
    if (!name) return "—";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0];
    return parts[0] + " " + parts[1].charAt(0) + ".";
  },

  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll(".lb-tab").forEach((t) => {
      t.classList.toggle("active", t.dataset.tab === tab);
    });
    this.load();
  },
};

// ============================================
// EVENT WIRING
// ============================================
document.addEventListener("click", (e) => {
  const tab = e.target.closest(".lb-tab");
  if (tab) Leaderboard.switchTab(tab.dataset.tab);
});

// ============================================
// BADGES - Achievement system
// ============================================

const Badges = {
  all: [
    { key: "first_test", name: "पहला कदम", desc: "पहला test पूरा किया", icon: "star" },
    { key: "ten_tests", name: "10 Tests", desc: "10 tests पूरे किए", icon: "trophy" },
    { key: "fifty_tests", name: "50 Tests", desc: "50 tests पूरे किए", icon: "award" },
    { key: "streak_3", name: "3-Day Streak", desc: "3 दिन लगातार test", icon: "flame" },
    { key: "streak_7", name: "Week Warrior", desc: "7 दिन streak", icon: "flame" },
    { key: "streak_30", name: "Month Master", desc: "30 दिन streak", icon: "flame" },
    { key: "perfect_score", name: "100% Score", desc: "एक test में पूरे marks", icon: "star" },
    { key: "xp_1000", name: "1K XP", desc: "1000 XP कमाए", icon: "zap" },
    { key: "xp_10000", name: "10K XP", desc: "10,000 XP कमाए", icon: "zap" },
    { key: "daily_master", name: "Daily Master", desc: "5 daily challenges पूरे", icon: "target" },
  ],

  unlocked: [],

  async load() {
    if (State.isGuest) {
      this.unlocked = JSON.parse(localStorage.getItem("prex_badges") || "[]");
      return;
    }
    try {
      const { data } = await supabase.from("user_badges").select("badge_key").eq("user_id", State.user.id);
      this.unlocked = (data || []).map((x) => x.badge_key);
    } catch (e) { this.unlocked = []; }
  },

  async checkAndUnlock() {
    const stats = Dashboard.stats || {};
    const tests = stats.tests_taken || 0;
    const streak = stats.streak || 0;
    const xp = stats.xp || 0;

    const checks = [
      { key: "first_test", ok: tests >= 1 },
      { key: "ten_tests", ok: tests >= 10 },
      { key: "fifty_tests", ok: tests >= 50 },
      { key: "streak_3", ok: streak >= 3 },
      { key: "streak_7", ok: streak >= 7 },
      { key: "streak_30", ok: streak >= 30 },
      { key: "xp_1000", ok: xp >= 1000 },
      { key: "xp_10000", ok: xp >= 10000 },
    ];

    for (const c of checks) {
      if (c.ok && !this.unlocked.includes(c.key)) {
        await this.unlock(c.key);
      }
    }
  },

  async unlock(key) {
    this.unlocked.push(key);

    if (State.isGuest) {
      localStorage.setItem("prex_badges", JSON.stringify(this.unlocked));
    } else {
      try {
        await supabase.from("user_badges").insert({ user_id: State.user.id, badge_key: key });
      } catch (e) {}
    }

    const badge = this.all.find((b) => b.key === key);
    if (badge) {
      Notifications.add("🏆 नया Badge!", badge.name + " unlock हुआ", "success");
      toast("🏆 Badge unlocked: " + badge.name, "success");
    }
  },

  async open() {
    await this.load();
    Screen.show("badges");
    this.render();
  },

  render() {
    const box = document.getElementById("badges-grid");
    if (!box) return;

    box.innerHTML = this.all.map((b) => {
      const unlocked = this.unlocked.includes(b.key);
      return `
        <div class="badge-card ${unlocked ? "unlocked" : "locked"}">
          <div class="badge-icon">${ICONS[b.icon] || ICONS.star}</div>
          <div class="badge-name">${b.name}</div>
          <div class="badge-desc">${b.desc}</div>
          ${unlocked ? `<div class="badge-check">${ICONS.check}</div>` : ""}
        </div>`;
    }).join("");

    setText("badges-count", this.unlocked.length + " / " + this.all.length);
  },
};

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-badges")) Badges.open();
  if (e.target.closest("#btn-badges-back")) Screen.show("me");
});

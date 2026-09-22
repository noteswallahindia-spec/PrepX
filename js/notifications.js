// ============================================
// NOTIFICATIONS
// ============================================

const Notifications = {
  list: [],

  async load() {
    if (State.isGuest) {
      this.list = JSON.parse(localStorage.getItem("prex_notifs") || "[]");
      return;
    }
    try {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", State.user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      this.list = data || [];
    } catch (e) { this.list = []; }
  },

  async add(title, body, type = "info") {
    const notif = {
      id: "n_" + Date.now(),
      title, body, type,
      read: false,
      created_at: new Date().toISOString(),
    };

    if (State.isGuest) {
      this.list.unshift(notif);
      this.list = this.list.slice(0, 20);
      localStorage.setItem("prex_notifs", JSON.stringify(this.list));
      return;
    }

    try {
      await supabase.from("notifications").insert({
        user_id: State.user.id,
        title, body, type,
      });
      this.list.unshift(notif);
    } catch (e) { console.warn(e); }
  },

  unreadCount() {
    return this.list.filter((n) => !n.read).length;
  },

  async markAllRead() {
    this.list.forEach((n) => n.read = true);
    if (State.isGuest) {
      localStorage.setItem("prex_notifs", JSON.stringify(this.list));
      return;
    }
    try {
      await supabase.from("notifications")
        .update({ read: true })
        .eq("user_id", State.user.id)
        .eq("read", false);
    } catch (e) {}
  },

  render() {
    const box = document.getElementById("notif-list");
    if (!box) return;

    if (!this.list.length) {
      box.innerHTML = `
        <div class="empty-mini">
          <div class="empty-mini-title">कोई notification नहीं</div>
          <div class="empty-mini-sub">Test दो और updates पाओ</div>
        </div>`;
      return;
    }

    box.innerHTML = this.list.map((n) => {
      const dt = new Date(n.created_at);
      const time = Dashboard.timeAgo(dt);
      return `
        <div class="notif-item ${n.read ? "" : "unread"}">
          <div class="notif-dot ${n.type}"></div>
          <div class="notif-body">
            <div class="notif-title">${n.title}</div>
            ${n.body ? `<div class="notif-text">${n.body}</div>` : ""}
            <div class="notif-time">${time}</div>
          </div>
        </div>`;
    }).join("");
  },

  open() {
    this.load().then(() => {
      this.render();
      this.markAllRead();
      Screen.show("notifications");
    });
  },

  // Local reminder checks
  checkDailyReminder() {
    const last = localStorage.getItem("prex_last_reminder");
    const today = new Date().toDateString();
    if (last === today) return;

    const h = new Date().getHours();
    if (h >= 18) {
      this.add(
        "Aaj test दिया?",
        "रोज़ 1 test → streak बनाओ 🔥",
        "reminder"
      );
      localStorage.setItem("prex_last_reminder", today);
    }
  },
};

// ============================================
// EVENT WIRING
// ============================================
document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-notif")) Notifications.open();
  if (e.target.closest("#btn-notif-back")) Screen.show("home");
});

// ============================================
// SAVED PAPERS
// ============================================

const SavedPapers = {

  async open() {
    Screen.show("saved-papers");
    await this.load();
  },

  async load() {
    const box = document.getElementById("sp-list");
    box.innerHTML = `<div class="lb-loading">Loading...</div>`;

    let list = [];

    if (State.isGuest) {
      list = JSON.parse(localStorage.getItem("prex_saved_papers") || "[]");
    } else {
      try {
        const { data } = await supabase
          .from("saved_papers")
          .select("id, title, subject, duration_min, created_at")
          .eq("user_id", State.user.id)
          .order("created_at", { ascending: false })
          .limit(30);
        list = data || [];
      } catch (e) { list = []; }
    }

    if (!list.length) {
      box.innerHTML = `
        <div class="empty-mini">
          <div class="empty-mini-title">कोई saved paper नहीं</div>
          <div class="empty-mini-sub">AI paper generate करो → Save दबाओ</div>
        </div>`;
      return;
    }

    box.innerHTML = list.map((p) => {
      const date = new Date(p.created_at);
      const d = date.getDate() + "/" + (date.getMonth() + 1);
      return `
        <div class="sp-item" data-sp-id="${p.id}">
          <div class="sp-icon">${ICONS.book}</div>
          <div class="sp-info">
            <div class="sp-title">${p.title || "Paper"}</div>
            <div class="sp-sub">${p.subject || ""} • ${p.duration_min || 30} min • ${d}</div>
          </div>
          <button class="sp-del" data-sp-del="${p.id}">${ICONS.x}</button>
        </div>`;
    }).join("");
  },

  async save(paper, subject, duration, provider) {
    const entry = {
      title: paper.title || "Test Paper",
      subject: subject || "",
      paper_json: paper,
      duration_min: duration || 30,
      provider: provider || null,
      created_at: new Date().toISOString(),
    };

    if (State.isGuest) {
      const list = JSON.parse(localStorage.getItem("prex_saved_papers") || "[]");
      entry.id = "g_" + Date.now();
      list.unshift(entry);
      localStorage.setItem("prex_saved_papers", JSON.stringify(list.slice(0, 30)));
      toast("Paper saved ✅", "success");
      return;
    }

    try {
      await supabase.from("saved_papers").insert({
        user_id: State.user.id,
        title: entry.title,
        subject: entry.subject,
        paper_json: entry.paper_json,
        duration_min: entry.duration_min,
        provider: entry.provider,
      });
      toast("Paper saved ✅", "success");
    } catch (e) {
      toast("Save failed: " + e.message, "error");
    }
  },

  async openPaper(id) {
    let paper = null;
    let duration = 30;

    if (State.isGuest) {
      const list = JSON.parse(localStorage.getItem("prex_saved_papers") || "[]");
      const found = list.find((x) => x.id === id);
      if (found) { paper = found.paper_json; duration = found.duration_min; }
    } else {
      try {
        const { data } = await supabase
          .from("saved_papers")
          .select("paper_json, duration_min")
          .eq("id", id)
          .maybeSingle();
        if (data) { paper = data.paper_json; duration = data.duration_min; }
      } catch (e) {}
    }

    if (!paper) return toast("Paper not found", "error");

    ExamSetup.currentPaper = paper;
    ExamSetup.config.duration = duration || 30;
    ExamSetup.config.subject = paper.subject || "Test";

    ExamSetup.showPaper(paper, "saved");
  },

  async delete(id) {
    if (State.isGuest) {
      const list = JSON.parse(localStorage.getItem("prex_saved_papers") || "[]");
      const filtered = list.filter((x) => x.id !== id);
      localStorage.setItem("prex_saved_papers", JSON.stringify(filtered));
      toast("Deleted", "success");
      this.load();
      return;
    }

    try {
      await supabase.from("saved_papers").delete().eq("id", id);
      toast("Deleted", "success");
      this.load();
    } catch (e) { toast("Failed", "error"); }
  },
};

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-saved-papers")) SavedPapers.open();
  if (e.target.closest("#btn-sp-back")) Screen.show("me");
  if (e.target.closest("#btn-save-paper")) {
    if (!ExamSetup.currentPaper) return;
    SavedPapers.save(
      ExamSetup.currentPaper,
      ExamSetup.config.subject,
      ExamSetup.config.duration,
      ExamSetup.currentProvider
    );
  }
  const item = e.target.closest("[data-sp-id]");
  if (item && !e.target.closest("[data-sp-del]")) {
    SavedPapers.openPaper(item.dataset.spId);
  }
  const del = e.target.closest("[data-sp-del]");
  if (del) {
    e.stopPropagation();
    if (confirm("Delete करें?")) SavedPapers.delete(del.dataset.spDel);
  }
});

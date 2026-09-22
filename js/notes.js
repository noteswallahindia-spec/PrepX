// ============================================
// NOTES - AI generated notes
// ============================================

const Notes = {

  async open() {
    Screen.show("notes");
    await this.load();
  },

  async load() {
    const box = document.getElementById("notes-list");
    box.innerHTML = `<div class="lb-loading">Loading...</div>`;

    let list = [];

    if (State.isGuest) {
      list = JSON.parse(localStorage.getItem("prex_notes") || "[]");
    } else {
      try {
        const { data } = await supabase
          .from("notes")
          .select("id, subject, topic, content, created_at")
          .eq("user_id", State.user.id)
          .order("created_at", { ascending: false })
          .limit(30);
        list = data || [];
      } catch (e) { list = []; }
    }

    if (!list.length) {
      box.innerHTML = `
        <div class="empty-mini">
          <div class="empty-mini-title">कोई notes नहीं</div>
          <div class="empty-mini-sub">नीचे topic लिखो → AI notes बनाएगा</div>
        </div>`;
      return;
    }

    box.innerHTML = list.map((n) => `
      <div class="note-item">
        <div class="note-head">
          <div class="note-topic">${n.topic}</div>
          ${n.subject ? `<div class="note-subject">${n.subject}</div>` : ""}
        </div>
        <div class="note-preview">${(n.content || "").slice(0, 150)}...</div>
        <div class="note-actions">
          <button class="note-btn" data-note-view='${JSON.stringify(n).replace(/'/g, "&apos;")}'>View</button>
          <button class="note-btn danger" data-note-del="${n.id}">Delete</button>
        </div>
      </div>
    `).join("");
  },

  async generate() {
    const topic = document.getElementById("note-topic").value.trim();
    const subject = document.getElementById("note-subject").value.trim();

    if (!topic) return toast("Topic लिखो", "error");

    const btn = document.getElementById("btn-note-generate");
    btn.disabled = true;
    btn.textContent = "Generating...";

    const prompt = `Create concise, exam-focused study notes in Hindi (Devanagari) on the topic: "${topic}"${subject ? " (Subject: " + subject + ")" : ""}.

Format:
# ${topic}

## Key Concepts
- point 1
- point 2
- point 3

## Important Formulas/Facts
- formula or fact 1
- formula or fact 2

## Common Mistakes
- mistake 1
- mistake 2

## Quick Revision
2-3 lines summary

Keep it under 300 words. Use bullet points. Be accurate and exam-oriented.

Return plain text only, no JSON, no code blocks.`;

    try {
      const url = SUPABASE_URL + "/functions/v1/answer-doubt";
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error("AI failed");
      const json = await res.json();
      const content = json.text || "";

      const note = {
        topic,
        subject: subject || "",
        content,
        created_at: new Date().toISOString(),
      };

      if (State.isGuest) {
        const list = JSON.parse(localStorage.getItem("prex_notes") || "[]");
        note.id = "g_" + Date.now();
        list.unshift(note);
        localStorage.setItem("prex_notes", JSON.stringify(list.slice(0, 30)));
      } else {
        await supabase.from("notes").insert({
          user_id: State.user.id,
          topic: note.topic,
          subject: note.subject,
          content: note.content,
          source: "ai",
        });
      }

      document.getElementById("note-topic").value = "";
      document.getElementById("note-subject").value = "";
      toast("Notes बन गए ✅", "success");
      await this.load();
    } catch (e) {
      toast("Failed: " + e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Generate Notes";
    }
  },

  viewNote(note) {
    setText("nv-topic", note.topic);
    setText("nv-subject", note.subject || "");
    document.getElementById("nv-content").innerHTML = this.formatNote(note.content);
    Screen.show("note-view");
  },

  formatNote(text) {
    if (!text) return "";
    let html = text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/^- (.+)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");
    html = html.replace(/\n\n/g, "</p><p>");
    return "<p>" + html + "</p>";
  },

  async delete(id) {
    if (State.isGuest) {
      const list = JSON.parse(localStorage.getItem("prex_notes") || "[]");
      localStorage.setItem("prex_notes", JSON.stringify(list.filter((x) => x.id !== id)));
      this.load();
      return;
    }
    try {
      await supabase.from("notes").delete().eq("id", id);
      this.load();
    } catch (e) {}
  },
};

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-notes")) Notes.open();
  if (e.target.closest("#btn-notes-back")) Screen.show("me");
  if (e.target.closest("#btn-note-generate")) Notes.generate();
  if (e.target.closest("#btn-nv-back")) Screen.show("notes");

  const view = e.target.closest("[data-note-view]");
  if (view) {
    try {
      const note = JSON.parse(view.dataset.noteView.replace(/&apos;/g, "'"));
      Notes.viewNote(note);
    } catch {}
  }

  const del = e.target.closest("[data-note-del]");
  if (del) {
    if (confirm("Delete करें?")) Notes.delete(del.dataset.noteDel);
  }
});

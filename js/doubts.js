// ============================================
// DOUBTS - Ask AI any question
// ============================================

const Doubts = {

  async open() {
    Screen.show("doubts");
    await this.load();
  },

  async load() {
    const box = document.getElementById("doubt-list");
    box.innerHTML = `<div class="lb-loading">Loading...</div>`;

    let list = [];
    if (State.isGuest) {
      list = JSON.parse(localStorage.getItem("prex_doubts") || "[]");
    } else {
      try {
        const { data } = await supabase
          .from("doubts")
          .select("*")
          .eq("user_id", State.user.id)
          .order("created_at", { ascending: false })
          .limit(30);
        list = data || [];
      } catch (e) { list = []; }
    }

    if (!list.length) {
      box.innerHTML = `
        <div class="empty-mini">
          <div class="empty-mini-title">कोई doubt नहीं</div>
          <div class="empty-mini-sub">ऊपर सवाल लिखो → AI जवाब देगा</div>
        </div>`;
      return;
    }

    box.innerHTML = list.map((d) => `
      <div class="doubt-item">
        <div class="doubt-q">Q: ${d.question}</div>
        ${d.answer ? `<div class="doubt-a">${d.answer}</div>` : `<div class="doubt-pending">⏳ Answer pending</div>`}
        <div class="doubt-del" data-doubt-del="${d.id}">Delete</div>
      </div>
    `).join("");
  },

  async ask() {
    const q = document.getElementById("doubt-input").value.trim();
    if (!q) return toast("सवाल लिखो", "error");

    const btn = document.getElementById("btn-doubt-ask");
    btn.disabled = true;
    btn.textContent = "AI सोच रहा है...";

    const p = State.profile || {};
    const cls = p.mode === "competitive"
      ? (p.exam_name || p.exam_category || "Competitive exam")
      : ("Class " + (p.cls || "10") + " " + (p.board || "CBSE"));

    const prompt = `You are an expert tutor helping an Indian student (${cls}).

Student's doubt: "${q}"

Answer in Hindi (Devanagari) with English terms for technical words.

Format:
1. Direct answer (1-2 lines)
2. Explanation (3-5 points)
3. Example (if applicable)
4. Common mistake (1 line)

Keep total under 200 words. Be clear and simple. No markdown headers, just clean structured text.`;

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
      const answer = json.text || "Answer नहीं मिला";

      const entry = {
        question: q,
        answer,
        created_at: new Date().toISOString(),
      };

      if (State.isGuest) {
        const list = JSON.parse(localStorage.getItem("prex_doubts") || "[]");
        entry.id = "g_" + Date.now();
        list.unshift(entry);
        localStorage.setItem("prex_doubts", JSON.stringify(list.slice(0, 30)));
      } else {
        await supabase.from("doubts").insert({
          user_id: State.user.id,
          question: q,
          answer,
          status: "answered",
        });
      }

      document.getElementById("doubt-input").value = "";
      toast("Answer मिल गया ✅", "success");
      await this.load();
    } catch (e) {
      toast("Failed: " + e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Ask AI";
    }
  },

  async delete(id) {
    if (State.isGuest) {
      const list = JSON.parse(localStorage.getItem("prex_doubts") || "[]");
      localStorage.setItem("prex_doubts", JSON.stringify(list.filter((x) => x.id !== id)));
      this.load();
      return;
    }
    try {
      await supabase.from("doubts").delete().eq("id", id);
      this.load();
    } catch (e) {}
  },
};

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-doubts")) Doubts.open();
  if (e.target.closest("#btn-doubt-back")) Screen.show("me");
  if (e.target.closest("#btn-doubt-ask")) Doubts.ask();

  const del = e.target.closest("[data-doubt-del]");
  if (del) {
    if (confirm("Delete करें?")) Doubts.delete(del.dataset.doubtDel);
  }
});

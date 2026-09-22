// ============================================
// FLASHCARDS - Q&A revision
// ============================================

const Flashcards = {
  cards: [],
  current: 0,
  flipped: false,

  async open() {
    Screen.show("flashcards");
    await this.load();
    this.render();
  },

  async load() {
    if (State.isGuest) {
      this.cards = JSON.parse(localStorage.getItem("prex_flashcards") || "[]");
    } else {
      try {
        const { data } = await supabase
          .from("flashcards")
          .select("*")
          .eq("user_id", State.user.id)
          .order("created_at", { ascending: false })
          .limit(100);
        this.cards = data || [];
      } catch (e) { this.cards = []; }
    }
    this.current = 0;
    this.flipped = false;
  },

  render() {
    const box = document.getElementById("fc-view");

    if (!this.cards.length) {
      box.innerHTML = `
        <div class="empty-mini">
          <div class="empty-mini-title">कोई flashcard नहीं</div>
          <div class="empty-mini-sub">ऊपर topic लिखो → AI बनाएगा</div>
        </div>`;
      return;
    }

    const card = this.cards[this.current];
    box.innerHTML = `
      <div class="fc-counter">${this.current + 1} / ${this.cards.length}</div>
      <div class="fc-card ${this.flipped ? "flipped" : ""}" id="fc-card">
        <div class="fc-front">
          <div class="fc-label">Q</div>
          <div class="fc-text">${card.front}</div>
        </div>
        <div class="fc-back">
          <div class="fc-label">A</div>
          <div class="fc-text">${card.back}</div>
        </div>
      </div>
      <div class="fc-hint">Tap to ${this.flipped ? "hide" : "show"} answer</div>
      <div class="fc-nav">
        <button class="btn-secondary" id="btn-fc-prev" ${this.current === 0 ? "disabled" : ""}>Previous</button>
        <button class="btn-primary" id="btn-fc-next" ${this.current === this.cards.length - 1 ? "disabled" : ""}>Next</button>
      </div>`;
  },

  flip() {
    this.flipped = !this.flipped;
    this.render();
  },

  next() {
    if (this.current < this.cards.length - 1) {
      this.current++;
      this.flipped = false;
      this.render();
    }
  },

  prev() {
    if (this.current > 0) {
      this.current--;
      this.flipped = false;
      this.render();
    }
  },

  async generate() {
    const topic = document.getElementById("fc-topic").value.trim();
    const subject = document.getElementById("fc-subject").value.trim();
    if (!topic) return toast("Topic लिखो", "error");

    const btn = document.getElementById("btn-fc-generate");
    btn.disabled = true;
    btn.textContent = "Generating...";

    const prompt = `Generate 8 flashcards for the topic "${topic}"${subject ? " (Subject: " + subject + ")" : ""}.

Return ONLY valid JSON:
{
  "cards": [
    { "front": "Question in Hindi", "back": "Answer in Hindi" }
  ]
}

Keep questions short (one line). Answers short (1-2 lines). Make them exam-focused.

Generate JSON now:`;

    try {
      const url = SUPABASE_URL + "/functions/v1/generate-paper";
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
      const cards = json.data?.cards || [];

      if (!cards.length) throw new Error("No cards generated");

      if (State.isGuest) {
        const list = JSON.parse(localStorage.getItem("prex_flashcards") || "[]");
        cards.forEach((c, i) => {
          list.unshift({
            id: "g_" + Date.now() + "_" + i,
            front: c.front,
            back: c.back,
            subject: subject || "",
          });
        });
        localStorage.setItem("prex_flashcards", JSON.stringify(list.slice(0, 100)));
      } else {
        await supabase.from("flashcards").insert(cards.map((c) => ({
          user_id: State.user.id,
          front: c.front,
          back: c.back,
          subject: subject || "",
        })));
      }

      document.getElementById("fc-topic").value = "";
      document.getElementById("fc-subject").value = "";
      toast("Flashcards बन गए ✅", "success");
      await this.load();
      this.render();
    } catch (e) {
      toast("Failed: " + e.message, "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Generate Flashcards";
    }
  },
};

document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-flashcards")) Flashcards.open();
  if (e.target.closest("#btn-fc-back")) Screen.show("me");
  if (e.target.closest("#btn-fc-generate")) Flashcards.generate();
  if (e.target.closest("#fc-card")) Flashcards.flip();
  if (e.target.closest("#btn-fc-next")) Flashcards.next();
  if (e.target.closest("#btn-fc-prev")) Flashcards.prev();
});

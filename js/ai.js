// ============================================
// AI - Paper Generation via Edge Function
// ============================================

const AI = {

  buildPrompt(cfg) {
    const langInstr = cfg.lang === "en"
      ? "Write in English."
      : "Write in Hindi (Devanagari) with English terms for technical words.";

    let typeInstr = "";
    if (cfg.type === "mcq") {
      typeInstr = `Generate ${cfg.count} MCQ questions only. Each question must have 4 options.`;
    } else if (cfg.type === "subjective") {
      typeInstr = `Generate ${cfg.count} subjective questions only. No options.`;
    } else {
      const mcq = Math.ceil(cfg.count * 0.7);
      const sub = cfg.count - mcq;
      typeInstr = `Generate ${mcq} MCQ + ${sub} subjective questions.`;
    }

    const chapters = cfg.chapters?.length ? cfg.chapters.join(", ") : "all topics";

    return `You are an expert exam paper setter in India.

Create a mock test paper:
- Exam: ${cfg.examName}
- Subject: ${cfg.subject}
- Chapters: ${chapters}
- Difficulty: ${cfg.difficulty}
- Duration: ${cfg.duration} minutes
- Total questions: ${cfg.count}
- ${typeInstr}
- ${langInstr}

RULES:
1. Return ONLY valid JSON.
2. Format exactly:
{
  "title": "Test title",
  "instructions": "2-3 line instructions",
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "Question text",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correct_answer": "B",
      "marks": 1,
      "explanation": "Brief explanation"
    },
    {
      "id": 2,
      "type": "subjective",
      "question": "Question text",
      "marks": 5,
      "sample_answer": "2-3 line model answer"
    }
  ]
}

3. MCQ: correct_answer must be "A", "B", "C", or "D".
4. Subjective: no options field.
5. Every question unique and exam-quality.

Generate JSON now:`;
  },

  async generatePaper(cfg) {
    const prompt = this.buildPrompt(cfg);
    const url = SUPABASE_URL + "/functions/v1/generate-paper";

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ prompt }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "AI failed");
    }

    const result = await res.json();
    if (!result.ok || !result.data) throw new Error("Invalid AI response");

    return { paper: result.data, provider: result.provider };
  },
};

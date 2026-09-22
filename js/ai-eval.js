// ============================================
// AI EVALUATION - Subjective answers check
// ============================================

const AIEval = {

  buildPrompt(paper, answers) {
    const questions = paper.questions || [];

    // Only evaluate subjective
    const toEval = [];
    questions.forEach((q, i) => {
      if (q.type !== "subjective") return;
      const ans = answers[i] || "";
      if (!ans.trim()) return;
      toEval.push({
        idx: i,
        question: q.question,
        marks: q.marks || 5,
        sample: q.sample_answer || "",
        answer: ans.trim(),
      });
    });

    if (!toEval.length) return null;

    const listText = toEval.map((q, i) =>
      `Q${i + 1} (max ${q.marks} marks):
Question: ${q.question}
Model answer: ${q.sample}
Student's answer: ${q.answer}
---`).join("\n\n");

    return `You are an expert exam evaluator in India. Evaluate the following subjective answers.

${listText}

RULES:
1. Return ONLY valid JSON.
2. Format exactly:
{
  "evaluations": [
    { "index": 0, "awarded": 3, "max": 5, "feedback": "Short feedback in Hindi/English mix" }
  ],
  "weak_topics": ["topic1"],
  "strong_topics": ["topic2"],
  "overall_feedback": "2-3 line overall feedback"
}

3. "index" starts from 0.
4. "awarded" between 0 and "max".
5. "feedback" 1-2 lines max.
6. Weak/strong topics short (2-4 words each).
7. Be fair but strict — award based on accuracy, completeness, clarity.

Generate JSON now:`;
  },

  async evaluate(paper, answers) {
    const prompt = this.buildPrompt(paper, answers);
    if (!prompt) return { evaluations: [], weak_topics: [], strong_topics: [], overall_feedback: "" };

    const url = SUPABASE_URL + "/functions/v1/evaluate-answers";

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
      throw new Error(err.error || "AI eval failed");
    }

    const result = await res.json();
    if (!result.ok || !result.data) throw new Error("Invalid eval response");

    return {
      ...result.data,
      provider: result.provider,
    };
  },
};

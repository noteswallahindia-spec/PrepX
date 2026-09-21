/* ============================================
   AI - Paper Generation via Edge Function
   ============================================ */

const AI = {

  // Build the prompt
  buildPrompt(config) {
    const {
      examName, subject, chapters, type, difficulty,
      count, duration, lang, mode,
    } = config;

    const langInstr = lang === "en"
      ? "Write in English."
      : "Write in Hindi (Devanagari) with English terms for technical words.";

    let typeInstr = "";
    if (type === "mcq") {
      typeInstr = `Generate ${count} MCQ questions only. Each question must have 4 options.`;
    } else if (type === "subjective") {
      typeInstr = `Generate ${count} subjective questions only (short and long answers). No options.`;
    } else {
      const mcqCount = Math.ceil(count * 0.7);
      const subCount = count - mcqCount;
      typeInstr = `Generate ${mcqCount} MCQ questions + ${subCount} subjective questions.`;
    }

    const chaptersText = chapters && chapters.length
      ? chapters.join(", ")
      : "all topics";

    return `You are an expert exam paper setter in India.

Create a mock test paper with the following details:
- Exam: ${examName}
- Subject: ${subject}
- Chapters/Topics: ${chaptersText}
- Difficulty: ${difficulty}
- Duration: ${duration} minutes
- Total questions: ${count}
- ${typeInstr}
- ${langInstr}

IMPORTANT RULES:
1. Return ONLY valid JSON, no extra text before or after.
2. Format exactly like this:
{
  "title": "Test title",
  "instructions": "2-3 line instruction for student",
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "Question text",
      "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
      "correct_answer": "B",
      "marks": 1,
      "explanation": "Brief explanation why this is correct"
    },
    {
      "id": 2,
      "type": "subjective",
      "question": "Question text",
      "marks": 5,
      "expected_keywords": ["keyword1", "keyword2"],
      "sample_answer": "2-3 line model answer"
    }
  ]
}

3. For MCQ: correct_answer must be "A", "B", "C", or "D".
4. For subjective: no options field.
5. Every question must be unique and exam-quality.
6. Use syllabus-appropriate content only.

Generate the JSON now:`;
  },

  // Call edge function
  async generatePaper(config) {
    const prompt = this.buildPrompt(config);

    const res = await fetch(AI_FUNCTION_URL, {
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
    if (!result.ok || !result.data) {
      throw new Error("Invalid AI response");
    }

    return {
      paper: result.data,
      provider: result.provider,
    };
  },

  // Save paper as attempt (started)
  async savePaper(paper, examId, userId) {
    const { data, error } = await supabase
      .from("attempts")
      .insert({
        user_id: userId,
        exam_id: examId || null,
        paper_json: paper,
        status: "generated",
      })
      .select()
      .single();
    if (error) {
      console.warn("Save paper failed:", error);
      return null;
    }
    return data;
  },
};

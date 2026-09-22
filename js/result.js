// ============================================
// RESULT - Detailed Result Screen
// ============================================

const Result = {
  current: null,

  show(resultData) {
    this.current = resultData;
    const r = resultData;
    const percent = r.totalMarks ? Math.round((r.score / r.totalMarks) * 100) : 0;

    let grade = "F";
    if (percent >= 90) grade = "A+";
    else if (percent >= 80) grade = "A";
    else if (percent >= 70) grade = "B+";
    else if (percent >= 60) grade = "B";
    else if (percent >= 50) grade = "C";
    else if (percent >= 40) grade = "D";

    setText("rs-score", r.score + " / " + r.totalMarks);
    setText("rs-percent", percent + "%");
    setText("rs-grade", "Grade: " + grade);
    setText("rs-time", this.formatTime(r.timeUsed));

    let correct = 0, wrong = 0, skipped = 0, subjectiveCount = 0;
    const total = r.paper.questions.length;
    for (let i = 0; i < total; i++) {
      const q = r.paper.questions[i];
      const a = r.answers[i];
      if (q.type === "subjective") {
        if (a && a.trim()) subjectiveCount++;
        continue;
      }
      if (a === undefined || a === "") skipped++;
      else if (a === q.correct_answer) correct++;
      else wrong++;
    }

    setHTML("rs-stats", `
      <div class="stat-box">
        <div class="stat-num" style="color:var(--success);">${correct}</div>
        <div class="stat-lbl">Correct</div>
      </div>
      <div class="stat-box">
        <div class="stat-num" style="color:var(--error);">${wrong}</div>
        <div class="stat-lbl">Wrong</div>
      </div>
      <div class="stat-box">
        <div class="stat-num">${skipped}</div>
        <div class="stat-lbl">Skipped</div>
      </div>
      <div class="stat-box">
        <div class="stat-num" style="color:var(--primary);">${subjectiveCount}</div>
        <div class="stat-lbl">Subjective</div>
      </div>
    `);

    const aiBox = document.getElementById("rs-ai-box");
    if (r.aiFeedback) {
      aiBox.style.display = "block";
      setText("rs-ai-text", r.aiFeedback);
    } else aiBox.style.display = "none";

    const weakBox = document.getElementById("rs-weak-box");
    if (r.weakTopics && r.weakTopics.length) {
      weakBox.style.display = "block";
      setHTML("rs-weak-tags", r.weakTopics.map((t) =>
        `<span class="topic-tag weak">${t}</span>`).join(""));
    } else weakBox.style.display = "none";

    const strongBox = document.getElementById("rs-strong-box");
    if (r.strongTopics && r.strongTopics.length) {
      strongBox.style.display = "block";
      setHTML("rs-strong-tags", r.strongTopics.map((t) =>
        `<span class="topic-tag strong">${t}</span>`).join(""));
    } else strongBox.style.display = "none";

    Screen.show("result");
  },

  showReview() {
    const r = this.current;
    if (!r) return;
    const qs = r.paper.questions || [];
    const keys = ["A", "B", "C", "D", "E", "F"];

    setHTML("review-list", qs.map((q, i) => {
      const userAns = r.answers[i] || "";
      const isMCQ = q.type === "mcq";
      const isCorrect = isMCQ && userAns === q.correct_answer;

      let badgeClass = "skipped";
      let badgeText = "Skipped";
      if (userAns) {
        if (isMCQ) {
          badgeClass = isCorrect ? "correct" : "wrong";
          badgeText = isCorrect ? "Correct" : "Wrong";
        } else {
          badgeClass = "subjective";
          badgeText = "Subjective";
        }
      }

      let ansBlock = "";
      if (isMCQ) {
        ansBlock = (q.options || []).map((o, idx) => {
          const key = keys[idx];
          const isUser = userAns === key;
          const isRight = q.correct_answer === key;
          let cls = "";
          if (isRight) cls = "correct";
          else if (isUser && !isRight) cls = "wrong";
          return `<div class="rev-opt ${cls}">
            <span class="rev-key">${key}</span>
            <span>${o.replace(/^[A-F]\)\s*/, "")}</span>
            ${isUser ? '<span class="rev-you">You</span>' : ""}
          </div>`;
        }).join("");
      } else {
        const subEval = (r.subjectiveEval || []).find((e) => e.index === i);
        const awarded = subEval ? subEval.awarded : null;
        const maxM = subEval ? subEval.max : (q.marks || 5);
        const feedback = subEval ? subEval.feedback : "";

        ansBlock = `
          <div class="rev-sub-label">Your answer:</div>
          <div class="rev-sub-ans">${userAns || "<em>Not answered</em>"}</div>
          ${userAns ? `
            <div class="rev-sub-label" style="margin-top:10px;">AI Evaluation:</div>
            <div class="rev-sub-eval">
              <div class="rev-eval-score">${awarded !== null ? awarded + " / " + maxM : "—"}</div>
              <div class="rev-eval-feedback">${feedback || "—"}</div>
            </div>
          ` : ""}
          ${q.sample_answer ? `
            <div class="rev-sub-label" style="margin-top:10px;">Model answer:</div>
            <div class="rev-sub-model">${q.sample_answer}</div>
          ` : ""}
        `;
      }

      return `<div class="rev-card">
        <div class="rev-header">
          <span class="rev-num">Q${i + 1}</span>
          <span class="rev-badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="rev-q">${q.question}</div>
        <div class="rev-ans-block">${ansBlock}</div>
        ${q.explanation ? `<div class="rev-expl">${q.explanation}</div>` : ""}
      </div>`;
    }).join(""));

    Screen.show("review");
  },

  formatTime(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + "m " + s + "s";
  },
};

// ============================================
// EVENT WIRING
// ============================================
document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-rs-home")) Screen.show("home");
  if (e.target.closest("#btn-rs-review")) Result.showReview();
  if (e.target.closest("#btn-rs-retake")) Screen.show("exam-setup");
  if (e.target.closest("#btn-review-back")) Screen.show("result");
  if (e.target.closest("#btn-rs-certificate")) {
    if (!Result.current) return;
    Certificate.generate(Result.current);
  }
});

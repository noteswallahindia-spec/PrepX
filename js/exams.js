/* ============================================
   EXAMS - Load categories, subjects, chapters
   ============================================ */

const Exams = {

  // Get all categories (top-level + children)
  async loadCategories() {
    const { data, error } = await supabase
      .from("exam_categories")
      .select("*")
      .eq("active", true)
      .order("sort_order");
    if (error) throw error;
    return data || [];
  },

  // Get subjects for an exam
  async loadSubjects(examId) {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("exam_id", examId)
      .order("sort_order");
    if (error) throw error;
    return data || [];
  },

  // Cache
  _cache: { cats: null, subjects: {} },

  async getCategories() {
    if (this._cache.cats) return this._cache.cats;
    const cats = await this.loadCategories();
    this._cache.cats = cats;
    return cats;
  },

  async getSubjects(examId) {
    if (this._cache.subjects[examId]) return this._cache.subjects[examId];
    const subs = await this.loadSubjects(examId);
    this._cache.subjects[examId] = subs;
    return subs;
  },

  // Build exam_id from profile
  getExamIdFromProfile(profile) {
    if (!profile) return null;
    if (profile.mode === "competitive") return profile.exam_category;
    // School
    const cls = profile.cls;
    const board = (profile.board || "").toLowerCase();
    if (board.includes("cbse")) return "cbse_" + cls;
    if (board.includes("icse")) return "icse_" + cls;
    return "cbse_" + cls;
  },
};

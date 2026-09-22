// ============================================
// EXAMS - categories, subjects
// ============================================

const Exams = {
  categories: [],

  async loadCategories() {
    const { data, error } = await supabase
      .from("exam_categories")
      .select("*")
      .eq("active", true)
      .order("sort_order");
    if (error) throw error;
    this.categories = data || [];
    return this.categories;
  },

  getTopCategories() {
    return this.categories.filter((c) => !c.parent && c.id !== "school");
  },

  getChildExams(parentId) {
    return this.categories.filter((c) => c.parent === parentId);
  },
};

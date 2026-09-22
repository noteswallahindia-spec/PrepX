// ============================================
// SHOP ADMIN - Simple product manager
// ============================================

const AdminShop = {
  editing: null,

  async open() {
    Screen.show("admin-shop");
    await this.loadList();
  },

  async loadList() {
    const box = document.getElementById("adm-list");
    box.innerHTML = `<div class="lb-loading">Loading...</div>`;

    try {
      const { data } = await supabase
        .from("shop_products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (!data || !data.length) {
        box.innerHTML = `<div class="lb-loading">कोई product नहीं</div>`;
        return;
      }

      box.innerHTML = data.map((p) => `
        <div class="adm-item">
          <img class="adm-thumb" src="${(p.images && p.images[0]) || ""}" onerror="this.style.display='none'"/>
          <div class="adm-info">
            <div class="adm-title">${p.title}</div>
            <div class="adm-meta">${p.category || "—"} • ${p.price_text || "—"} ${p.active ? "" : "• <span style='color:var(--error)'>INACTIVE</span>"}</div>
          </div>
          <button class="adm-del" data-del="${p.id}">
            ${ICONS.x}
          </button>
        </div>
      `).join("");
    } catch (e) {
      box.innerHTML = `<div class="lb-loading">Load failed</div>`;
    }
  },

  async save() {
    const title = document.getElementById("adm-title").value.trim();
    const desc = document.getElementById("adm-desc").value.trim();
    const cat = document.getElementById("adm-cat").value.trim();
    const imgs = document.getElementById("adm-imgs").value.trim();
    const price = document.getElementById("adm-price").value.trim();
    const fk = document.getElementById("adm-fk").value.trim();
    const amz = document.getElementById("adm-amz").value.trim();
    const meesho = document.getElementById("adm-meesho").value.trim();
    const other = document.getElementById("adm-other").value.trim();

    if (!title) return toast("Title भरो", "error");

    const images = imgs.split(",").map((s) => s.trim()).filter(Boolean);
    const links = {};
    if (fk) links.flipkart = fk;
    if (amz) links.amazon = amz;
    if (meesho) links.meesho = meesho;
    if (other) links.other = other;

    const product = {
      title,
      description: desc,
      category: cat || "books",
      images,
      price_text: price || "—",
      links,
      active: true,
      rating: 0,
      rating_count: 0,
      sort_order: 0,
    };

    try {
      if (this.editing) {
        await supabase.from("shop_products").update(product).eq("id", this.editing);
        toast("Product updated ✅", "success");
      } else {
        await supabase.from("shop_products").insert(product);
        toast("Product added ✅", "success");
      }
      this.clearForm();
      await this.loadList();
    } catch (e) {
      toast("Save failed: " + e.message, "error");
    }
  },

  clearForm() {
    ["adm-title", "adm-desc", "adm-cat", "adm-imgs", "adm-price", "adm-fk", "adm-amz", "adm-meesho", "adm-other"]
      .forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
    this.editing = null;
  },
};

document.addEventListener("click", async (e) => {
  if (e.target.closest("#btn-admin-shop")) AdminShop.open();
  if (e.target.closest("#btn-adm-back")) Screen.show("me");
  if (e.target.closest("#btn-adm-save")) AdminShop.save();
  if (e.target.closest("#btn-adm-clear")) AdminShop.clearForm();

  const delBtn = e.target.closest("[data-del]");
  if (delBtn) {
    if (!confirm("Product delete करें?")) return;
    try {
      await supabase.from("shop_products").update({ active: false }).eq("id", delBtn.dataset.del);
      toast("Deleted", "success");
      AdminShop.loadList();
    } catch (e) { toast("Failed", "error"); }
  }
});

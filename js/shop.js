// ============================================
// SHOP - products, categories, marketplace links
// ============================================

const Shop = {
  products: [],
  categories: [],
  currentCat: "all",
  currentProduct: null,

  async load() {
    const [catsRes, prodsRes] = await Promise.all([
      supabase.from("shop_categories").select("*").eq("active", true).order("sort_order"),
      supabase.from("shop_products").select("*").eq("active", true).order("sort_order"),
    ]);
    this.categories = catsRes.data || [];
    this.products = prodsRes.data || [];
  },

  getFiltered() {
    const search = (document.getElementById("shop-search")?.value || "").toLowerCase().trim();
    let list = this.products;
    if (this.currentCat !== "all") list = list.filter((p) => p.category === this.currentCat);
    if (search) {
      list = list.filter((p) =>
        (p.title || "").toLowerCase().includes(search) ||
        (p.category || "").toLowerCase().includes(search)
      );
    }
    return list;
  },

  getFeatured() {
    return this.products.filter((p) => p.featured).slice(0, 6);
  },

  findById(id) {
    return this.products.find((p) => p.id === id);
  },

  productCardHTML(p) {
    const img = (p.images && p.images[0]) || "https://via.placeholder.com/300x400?text=Product";
    const stars = "★".repeat(Math.round(p.rating || 0)) + "☆".repeat(5 - Math.round(p.rating || 0));
    return `<div class="product-card" data-product="${p.id}">
      <div class="product-img-wrap">
        <img class="product-img" src="${img}" loading="lazy" alt="${p.title}" onerror="this.src='https://via.placeholder.com/300x400?text=Product'"/>
        ${p.badge ? `<div class="product-badge">${p.badge}</div>` : ""}
      </div>
      <div class="product-info">
        <div class="product-cat">${p.category || "Product"}</div>
        <div class="product-title">${p.title}</div>
        ${p.rating ? `<div class="product-rating">
          <span class="product-stars">${stars}</span>
          <span class="product-rt">${p.rating}</span>
          <span class="product-rc">(${p.rating_count || 0})</span>
        </div>` : ""}
        <div class="product-price">${p.price_text || ""}</div>
      </div>
    </div>`;
  },

  featuredCardHTML(p) {
    const img = (p.images && p.images[0]) || "https://via.placeholder.com/600x400?text=Product";
    const stars = "★".repeat(Math.round(p.rating || 0)) + "☆".repeat(5 - Math.round(p.rating || 0));
    return `<div class="featured-card" data-product="${p.id}">
      <div class="product-img-wrap">
        <img class="product-img" src="${img}" loading="lazy" alt="${p.title}" onerror="this.src='https://via.placeholder.com/600x400?text=Product'"/>
        ${p.badge ? `<div class="product-badge">${p.badge}</div>` : ""}
      </div>
      <div class="product-info">
        <div class="product-cat">${p.category || "Product"}</div>
        <div class="product-title">${p.title}</div>
        ${p.rating ? `<div class="product-rating">
          <span class="product-stars">${stars}</span>
          <span class="product-rt">${p.rating}</span>
          <span class="product-rc">(${p.rating_count || 0})</span>
        </div>` : ""}
        <div class="product-price">${p.price_text || ""}</div>
      </div>
    </div>`;
  },

  marketBtnHTML(cls, brand, sub, url) {
    return `<button class="market-btn ${cls}" data-url="${url}">
      <div class="market-content">
        <div class="market-brand">${brand}</div>
        <div class="market-sub">${sub}</div>
      </div>
      <div class="market-arrow">${ICONS.arrowRight}</div>
    </button>`;
  },
};

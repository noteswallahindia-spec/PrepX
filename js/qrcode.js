// ============================================
// SIMPLE QR CODE GENERATOR (via API)
// ============================================

const QRCode = {
  // Generate QR as data URL using free API
  async generate(text, size = 200) {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
    return url;
  },

  // Alternative: use an img tag directly (no fetch needed)
  getImageUrl(text, size = 200) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(text)}`;
  },
};

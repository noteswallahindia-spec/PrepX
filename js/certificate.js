// ============================================
// CERTIFICATE - Generate, Download, Share
// ============================================

const Certificate = {
  current: null,
  verifyBaseUrl: null, // set on init

  init() {
    this.verifyBaseUrl = window.location.origin + window.location.pathname.replace(/\/$/, "") + "#verify=";
  },

  // ============================================
  // GENERATE
  // ============================================
  async generate(resultData) {
    const r = resultData;
    const percent = r.totalMarks ? Math.round((r.score / r.totalMarks) * 100) : 0;

    let grade = "F";
    if (percent >= 90) grade = "A+";
    else if (percent >= 80) grade = "A";
    else if (percent >= 70) grade = "B+";
    else if (percent >= 60) grade = "B";
    else if (percent >= 50) grade = "C";
    else if (percent >= 40) grade = "D";

    // Generate verify code
    const verifyCode = this.genCode();

    // Build cert object
    const cert = {
      verify_code: verifyCode,
      student_name: State.profile?.name || "Student",
      exam_title: r.examTitle || "Test",
      subject: r.subject || "",
      score: r.score,
      total: r.totalMarks,
      percent,
      grade,
      issued_at: new Date().toISOString(),
    };

    this.current = cert;

    // Save to DB (best effort)
    if (!State.isGuest && State.user?.id) {
      try {
        const { data } = await supabase
          .from("certificates")
          .insert({
            user_id: State.user.id,
            verify_code: verifyCode,
            student_name: cert.student_name,
            exam_title: cert.exam_title,
            subject: cert.subject,
            score: cert.score,
            total: cert.total,
            percent: cert.percent,
            grade: cert.grade,
          })
          .select()
          .single();

        if (data) this.current.id = data.id;
      } catch (e) {
        console.warn("Cert save failed:", e);
      }
    } else {
      // Guest: save locally
      const list = JSON.parse(localStorage.getItem("prex_guest_certs") || "[]");
      list.unshift(cert);
      localStorage.setItem("prex_guest_certs", JSON.stringify(list.slice(0, 10)));
    }

    // Show cert screen
    this.show(cert);
  },

  genCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "PREX-";
    for (let i = 0; i < 10; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  },

  // ============================================
  // SHOW SCREEN
  // ============================================
  show(cert) {
    const today = new Date(cert.issued_at);
    const dateStr = today.getDate() + " " +
      today.toLocaleString("en-IN", { month: "long" }) + " " +
      today.getFullYear();

    const verifyUrl = this.verifyBaseUrl + cert.verify_code;

    setText("cert-name", cert.student_name);
    setText("cert-exam", cert.exam_title);
    setText("cert-subject", cert.subject);
    setText("cert-score", cert.score + " / " + cert.total);
    setText("cert-percent", cert.percent + "%");
    setText("cert-grade", cert.grade);
    setText("cert-date", dateStr);
    setText("cert-code", cert.verify_code);

    // QR
    const qrImg = document.getElementById("cert-qr");
    if (qrImg) qrImg.src = QRCode.getImageUrl(verifyUrl, 180);

    // Verify link
    const vlink = document.getElementById("cert-verify-link");
    if (vlink) vlink.textContent = "pariksha.app/verify/" + cert.verify_code;

    Screen.show("certificate");
  },

  // ============================================
  // DOWNLOAD PDF
  // ============================================
  async download() {
    if (!this.current) return;
    const c = this.current;

    if (typeof window.jspdf === "undefined" && typeof window.jsPDF === "undefined") {
      toast("PDF library load नहीं हुई, फिर कोशिश करो", "error");
      return;
    }

    const { jsPDF } = window.jspdf || window;
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    // Dimensions
    const W = 297;
    const H = 210;

    // Border background
    doc.setFillColor(247, 248, 252);
    doc.rect(0, 0, W, H, "F");

    // Outer border - purple
    doc.setDrawColor(108, 92, 231);
    doc.setLineWidth(1.5);
    doc.rect(10, 10, W - 20, H - 20);

    // Inner border - thin
    doc.setDrawColor(162, 155, 254);
    doc.setLineWidth(0.4);
    doc.rect(13, 13, W - 26, H - 26);

    // Header bar
    doc.setFillColor(108, 92, 231);
    doc.rect(13, 13, W - 26, 22, "F");

    // Logo text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, "bold");
    doc.text("PreX", W / 2, 27, { align: "center" });

    // Subtitle
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.text("AI TEST APP FOR STUDENTS", W / 2, 32, { align: "center" });

    // Title
    doc.setTextColor(108, 92, 231);
    doc.setFontSize(30);
    doc.setFont(undefined, "bold");
    doc.text("CERTIFICATE", W / 2, 55, { align: "center" });

    doc.setFontSize(11);
    doc.setFont(undefined, "normal");
    doc.setTextColor(122, 130, 153);
    doc.text("OF ACHIEVEMENT", W / 2, 61, { align: "center" });

    // "This is to certify"
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 80);
    doc.text("This is to certify that", W / 2, 78, { align: "center" });

    // Name
    doc.setFontSize(26);
    doc.setFont(undefined, "bold");
    doc.setTextColor(26, 29, 41);
    doc.text(c.student_name, W / 2, 92, { align: "center" });

    // Line under name
    doc.setDrawColor(108, 92, 231);
    doc.setLineWidth(0.5);
    const nameWidth = doc.getTextWidth(c.student_name);
    doc.line(W / 2 - nameWidth / 2 - 5, 95, W / 2 + nameWidth / 2 + 5, 95);

    // Body
    doc.setFontSize(11);
    doc.setFont(undefined, "normal");
    doc.setTextColor(60, 60, 80);
    doc.text("has successfully completed the test", W / 2, 105, { align: "center" });

    // Exam title
    doc.setFontSize(15);
    doc.setFont(undefined, "bold");
    doc.setTextColor(108, 92, 231);
    doc.text(c.exam_title, W / 2, 116, { align: "center" });

    if (c.subject) {
      doc.setFontSize(10);
      doc.setFont(undefined, "normal");
      doc.setTextColor(122, 130, 153);
      doc.text("Subject: " + c.subject, W / 2, 122, { align: "center" });
    }

    // Score box
    const boxY = 130;
    const boxW = 50;
    const boxH = 22;

    // Score
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(W / 2 - boxW - 10, boxY, boxW, boxH, 3, 3, "F");
    doc.setFontSize(8);
    doc.setTextColor(122, 130, 153);
    doc.text("SCORE", W / 2 - boxW / 2 - 10, boxY + 7, { align: "center" });
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.setTextColor(26, 29, 41);
    doc.text(c.score + " / " + c.total, W / 2 - boxW / 2 - 10, boxY + 16, { align: "center" });

    // Percent
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(W / 2 - boxW / 2, boxY, boxW, boxH, 3, 3, "F");
    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.setTextColor(122, 130, 153);
    doc.text("PERCENTAGE", W / 2, boxY + 7, { align: "center" });
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.setTextColor(0, 196, 140);
    doc.text(c.percent + "%", W / 2, boxY + 16, { align: "center" });

    // Grade
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(W / 2 + 10, boxY, boxW, boxH, 3, 3, "F");
    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.setTextColor(122, 130, 153);
    doc.text("GRADE", W / 2 + boxW / 2 + 10, boxY + 7, { align: "center" });
    doc.setFontSize(14);
    doc.setFont(undefined, "bold");
    doc.setTextColor(108, 92, 231);
    doc.text(c.grade, W / 2 + boxW / 2 + 10, boxY + 16, { align: "center" });

    // Date + Verify Code (bottom)
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.setTextColor(60, 60, 80);
    doc.text("Date: " + dateStr, 25, 175);
    doc.text("Verify Code: " + c.verify_code, 25, 181);

    // QR
    const qrUrl = QRCode.getImageUrl(this.verifyBaseUrl + c.verify_code, 200);
    try {
      const qrDataUrl = await this.urlToDataUrl(qrUrl);
      doc.addImage(qrDataUrl, "PNG", W - 45, 168, 30, 30);
    } catch {}

    // Signature
    doc.setDrawColor(60, 60, 80);
    doc.setLineWidth(0.3);
    doc.line(W - 90, 190, W - 30, 190);
    doc.setFontSize(9);
    doc.text("Authorized Signature", W - 60, 195, { align: "center" });

    // Footer
    doc.setFontSize(7.5);
    doc.setTextColor(180, 185, 199);
    doc.text("Generated by PreX • pariksha.app • " + c.verify_code, W / 2, 202, { align: "center" });

    // Save
    doc.save("PreX-Certificate-" + c.verify_code + ".pdf");
    toast("Certificate download हो गया ✅", "success");
  },

  async urlToDataUrl(url) {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },

  // ============================================
  // SHARE
  // ============================================
  shareWhatsApp() {
    if (!this.current) return;
    const c = this.current;
    const text =
      `🎓 *PreX Certificate*\n\n` +
      `नाम: ${c.student_name}\n` +
      `Test: ${c.exam_title}\n` +
      (c.subject ? `Subject: ${c.subject}\n` : "") +
      `Score: ${c.score}/${c.total} (${c.percent}%)\n` +
      `Grade: ${c.grade}\n\n` +
      `Verify: ${this.verifyBaseUrl}${c.verify_code}\n\n` +
      `आप भी test दो — pariksha.app`;

    const url = "https://wa.me/?text=" + encodeURIComponent(text);
    window.open(url, "_blank");
  },

  shareNative() {
    if (!this.current) return;
    const c = this.current;
    const text = `PreX Certificate - ${c.student_name} - ${c.score}/${c.total} (${c.grade})`;

    if (navigator.share) {
      navigator.share({
        title: "PreX Certificate",
        text: text,
        url: this.verifyBaseUrl + c.verify_code,
      }).catch(() => {});
    } else {
      this.copyLink();
    }
  },

  copyLink() {
    if (!this.current) return;
    const url = this.verifyBaseUrl + this.current.verify_code;
    navigator.clipboard.writeText(url).then(() => {
      toast("Link copy हो गया ✅", "success");
    }).catch(() => {
      toast("Copy नहीं हो सका", "error");
    });
  },
};

// ============================================
// EVENT WIRING
// ============================================
document.addEventListener("click", (e) => {
  if (e.target.closest("#btn-cert-download")) Certificate.download();
  if (e.target.closest("#btn-cert-whatsapp")) Certificate.shareWhatsApp();
  if (e.target.closest("#btn-cert-share")) Certificate.shareNative();
  if (e.target.closest("#btn-cert-copy")) Certificate.copyLink();
  if (e.target.closest("#btn-cert-home")) Screen.show("home");
  if (e.target.closest("#btn-cert-retake")) Screen.show("exam-setup");
});

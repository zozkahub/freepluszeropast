const CONFIG = { telegramUrl: "https://t.me/freepluszero", telegramHiddenKey: "freepluszero_hide_telegram_until" };
const $ = (id) => document.getElementById(id);
const els = {
  form: $("pasteForm"), body: $("textBody"), title: $("textTitle"), syntax: $("textSyntax"), expiry: $("textExpiry"),
  counter: $("textCounter"), status: $("editorStatus"), submit: $("submitButton"), clear: $("clearButton"),
  result: $("resultPanel"), url: $("shareUrl"), copy: $("copyButton"), open: $("openButton"), telegram: $("telegramShare"), whatsapp: $("whatsappShare"),
  toast: $("toast"), floating: $("floatingTelegram"), hideTelegram: $("hideTelegram")
};

/* Same behavior as the old script.js. Only addition: the modern template is
   bilingual, so any text this file writes into the DOM now picks EN or AR
   based on <html lang="...">, instead of being hardcoded to Arabic. */
const STR = {
  ar: {
    chars: (n) => `${n.toLocaleString("ar-EG")} حرف`,
    words: (n) => `${n.toLocaleString("ar-EG")} كلمة`,
    ready: "جاهز للحفظ",
    saving: "جارٍ إنشاء الرابط",
    saved: "تم الحفظ",
    failed: "تعذر الحفظ",
    savingBtn: "جارٍ الحفظ...",
    writeFirst: "اكتب النص أولًا",
    noLink: "لا يوجد رابط للنسخ",
    linkCopied: "تم نسخ الرابط",
    createdToast: "تم إنشاء صفحة المشاركة",
    failedToast: "تعذر إنشاء الرابط. جرّب مرة أخرى.",
    untitled: "نص مشترك"
  },
  en: {
    chars: (n) => `${n.toLocaleString("en-US")} characters`,
    words: (n) => `${n.toLocaleString("en-US")} words`,
    ready: "Ready to save",
    saving: "Creating link...",
    saved: "Saved",
    failed: "Save failed",
    savingBtn: "Saving...",
    writeFirst: "Write some text first",
    noLink: "No link to copy",
    linkCopied: "Link copied",
    createdToast: "Share page created",
    failedToast: "Could not create the link. Please try again.",
    untitled: "Shared text"
  }
};
function lang() { return document.documentElement.getAttribute("lang") === "ar" ? "ar" : "en"; }
function t() { return STR[lang()]; }

let currentUrl = "";
let toastTimer;
// Remember the button's original markup (two <span>s + arrow) so we can
// restore it exactly instead of overwriting it with a hardcoded string.
const submitDefaultHTML = els.submit.innerHTML;

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2400);
}
function updateCounter() {
  const value = els.body.value;
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  els.counter.textContent = t().chars(value.length);
  els.status.textContent = value ? t().words(words) : t().ready;
}
async function copy(value, message) {
  if (!value) return showToast(t().noLink);
  try { await navigator.clipboard.writeText(value); }
  catch {
    const field = document.createElement("textarea");
    field.value = value; field.style.cssText = "position:fixed;opacity:0";
    document.body.append(field); field.select(); document.execCommand("copy"); field.remove();
  }
  showToast(message);
}
function configureResult(paste) {
  // Exact same link shape as before: /p/{id} off the current origin.
  currentUrl = new URL(`/p/${paste.id}`, window.location.origin).href;
  els.url.value = currentUrl;
  const title = paste.title || t().untitled;
  els.telegram.href = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(title)}`;
  els.whatsapp.href = `https://wa.me/?text=${encodeURIComponent(`${title}\n${currentUrl}`)}`;
  els.result.hidden = false;
  els.status.textContent = t().saved;
  els.result.scrollIntoView({ behavior: "smooth", block: "nearest" });
}
async function submitPaste(event) {
  event.preventDefault();
  const text = els.body.value.trim();
  if (!text) { els.body.focus(); return showToast(t().writeFirst); }
  els.submit.disabled = true;
  els.submit.textContent = t().savingBtn;
  els.status.textContent = t().saving;
  try {
    // Same endpoint and payload as before.
    const response = await fetch("/api/pastes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, title: els.title.value.trim(), syntax: els.syntax.value, expiry: els.expiry.value }) });
    if (!response.ok) throw new Error("save failed");
    configureResult(await response.json());
    showToast(t().createdToast);
  } catch {
    els.status.textContent = t().failed;
    showToast(t().failedToast);
  } finally {
    els.submit.disabled = false;
    els.submit.innerHTML = submitDefaultHTML;
  }
}
function setupTelegram() {
  els.floating.querySelector("a").href = CONFIG.telegramUrl;
  if (Date.now() < Number(localStorage.getItem(CONFIG.telegramHiddenKey) || "0")) els.floating.hidden = true;
  els.hideTelegram.addEventListener("click", () => { localStorage.setItem(CONFIG.telegramHiddenKey, String(Date.now() + 3600000)); els.floating.hidden = true; });
}

// Re-render dynamic text (counter/status) if the language toggle fires.
window.fnLangChanged = updateCounter;

els.form.addEventListener("submit", submitPaste);
els.body.addEventListener("input", updateCounter);
els.clear.addEventListener("click", () => { els.form.reset(); els.result.hidden = true; currentUrl = ""; updateCounter(); els.body.focus(); });
els.copy.addEventListener("click", () => copy(currentUrl, t().linkCopied));
els.open.addEventListener("click", () => currentUrl && window.open(currentUrl, "_blank", "noopener"));
setupTelegram();
updateCounter();

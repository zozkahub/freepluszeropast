const CONFIG = { telegramUrl: "https://t.me/gumball_Season8", telegramHiddenKey: "freepluszero_hide_telegram_until" };
const $ = (id) => document.getElementById(id);
const els = {
  loading: $("loadingView"), view: $("pasteView"), notFound: $("notFoundView"),
  title: $("sharedTitle"), date: $("sharedDate"), views: $("sharedViews"), type: $("sharedType"),
  text: $("sharedText"), download: $("downloadButton"), copyText: $("copyTextButton"),
  telegram: $("telegramShare"), whatsapp: $("whatsappShare"),
  toast: $("toast"), floating: $("floatingTelegram"), hideTelegram: $("hideTelegram")
};

const STR = {
  ar: {
    untitled: "نص بدون عنوان",
    views: (n) => `${n.toLocaleString("ar-EG")} مشاهدة`,
    copied: "تم نسخ النص",
    downloaded: "تم تنزيل الملف",
    copyFailed: "تعذر نسخ النص"
  },
  en: {
    untitled: "Untitled note",
    views: (n) => `${n.toLocaleString("en-US")} views`,
    copied: "Text copied",
    downloaded: "File downloaded",
    copyFailed: "Could not copy text"
  }
};
function lang() { return document.documentElement.getAttribute("lang") === "ar" ? "ar" : "en"; }
function t() { return STR[lang()]; }

let toastTimer;
let currentPaste = null;

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2400);
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(lang() === "ar" ? "ar-EG" : "en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch { return ""; }
}

function renderPaste(paste) {
  currentPaste = paste;
  els.title.textContent = paste.title || t().untitled;
  els.date.textContent = formatDate(paste.createdAt);
  els.views.textContent = t().views(paste.views || 0);
  els.type.textContent = (paste.syntax || "text").toUpperCase();
  els.text.textContent = paste.text || "";
  els.text.classList.toggle("code-text", paste.syntax === "code" || paste.syntax === "json");

  const shareUrl = window.location.href;
  const title = paste.title || t().untitled;
  els.telegram.href = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
  els.whatsapp.href = `https://wa.me/?text=${encodeURIComponent(`${title}\n${shareUrl}`)}`;

  els.loading.hidden = true;
  els.view.hidden = false;
}

function showNotFound() {
  els.loading.hidden = true;
  els.notFound.hidden = false;
}

async function loadPaste() {
  // Reads the id straight from the URL, e.g. /p/AbC123 -> "AbC123"
  const id = window.location.pathname.split("/").filter(Boolean).pop();
  if (!id) return showNotFound();
  try {
    const response = await fetch(`/api/pastes/${id}`);
    if (!response.ok) throw new Error("not found");
    renderPaste(await response.json());
  } catch {
    showNotFound();
  }
}

function downloadText() {
  if (!currentPaste) return;
  const blob = new Blob([currentPaste.text || ""], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${(currentPaste.title || "paste").trim() || "paste"}.txt`;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast(t().downloaded);
}

async function copyText() {
  const value = currentPaste?.text || "";
  try { await navigator.clipboard.writeText(value); showToast(t().copied); }
  catch {
    try {
      const field = document.createElement("textarea");
      field.value = value; field.style.cssText = "position:fixed;opacity:0";
      document.body.append(field); field.select(); document.execCommand("copy"); field.remove();
      showToast(t().copied);
    } catch { showToast(t().copyFailed); }
  }
}

function setupTelegram() {
  els.floating.querySelector("a").href = CONFIG.telegramUrl;
  if (Date.now() < Number(localStorage.getItem(CONFIG.telegramHiddenKey) || "0")) els.floating.hidden = true;
  els.hideTelegram.addEventListener("click", () => { localStorage.setItem(CONFIG.telegramHiddenKey, String(Date.now() + 3600000)); els.floating.hidden = true; });
}

// Re-render with the new language's labels when the toggle fires.
window.fnLangChanged = function () {
  if (currentPaste) renderPaste(currentPaste);
};

els.download.addEventListener("click", downloadText);
els.copyText.addEventListener("click", copyText);
setupTelegram();
loadPaste();

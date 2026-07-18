const CONFIG = { telegramUrl: "https://t.me/gumball_Season8", telegramHiddenKey: "freepluszero_hide_telegram_until" };
const $ = (id) => document.getElementById(id);
const els = { loading: $("loadingView"), view: $("pasteView"), missing: $("notFoundView"), title: $("sharedTitle"), text: $("sharedText"), date: $("sharedDate"), views: $("sharedViews"), type: $("sharedType"), copy: $("copyTextButton"), download: $("downloadButton"), telegram: $("telegramShare"), whatsapp: $("whatsappShare"), toast: $("toast"), floating: $("floatingTelegram"), hideTelegram: $("hideTelegram") };
let paste;
let toastTimer;

function showToast(message) { clearTimeout(toastTimer); els.toast.textContent = message; els.toast.classList.add("show"); toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2400); }
async function copyText() {
  try { await navigator.clipboard.writeText(paste.text); } catch { const field = document.createElement("textarea"); field.value = paste.text; document.body.append(field); field.select(); document.execCommand("copy"); field.remove(); }
  showToast("تم نسخ النص");
}
function downloadText() {
  const blob = new Blob([paste.text], { type: "text/plain;charset=utf-8" });
  const href = URL.createObjectURL(blob); const link = document.createElement("a");
  link.href = href; link.download = `${(paste.title || "freepluszero-text").replace(/[\\/:*?"<>|]+/g, "-")}.txt`; link.click(); URL.revokeObjectURL(href);
}
function renderPaste(data) {
  paste = data;
  els.title.textContent = data.title || "نص بدون عنوان";
  els.text.textContent = data.text;
  els.date.textContent = new Date(data.createdAt).toLocaleString("ar-EG");
  els.views.textContent = `${data.views.toLocaleString("ar-EG")} مشاهدة`;
  els.type.textContent = data.syntax === "code" ? "كود" : data.syntax === "json" ? "JSON" : data.syntax === "markdown" ? "Markdown" : "نص عادي";
  els.text.classList.toggle("code-text", data.syntax === "code" || data.syntax === "json");
  const url = window.location.href;
  els.telegram.href = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(data.title || "نص مشترك")}`;
  els.whatsapp.href = `https://wa.me/?text=${encodeURIComponent(`${data.title || "نص مشترك"}\n${url}`)}`;
  document.title = `${data.title || "نص مشترك"} | freepluszero`;
  els.loading.hidden = true; els.view.hidden = false;
}
function setupTelegram() {
  els.floating.querySelector("a").href = CONFIG.telegramUrl;
  if (Date.now() < Number(localStorage.getItem(CONFIG.telegramHiddenKey) || "0")) els.floating.hidden = true;
  els.hideTelegram.addEventListener("click", () => { localStorage.setItem(CONFIG.telegramHiddenKey, String(Date.now() + 3600000)); els.floating.hidden = true; });
}
async function loadPaste() {
  const match = window.location.pathname.match(/^\/p\/([A-Za-z0-9_-]+)\/?$/);
  if (!match) throw new Error("Invalid path");
  const response = await fetch(`/api/pastes/${encodeURIComponent(match[1])}`);
  if (!response.ok) throw new Error("Not found");
  renderPaste(await response.json());
}
els.copy.addEventListener("click", copyText);
els.download.addEventListener("click", downloadText);
setupTelegram();
loadPaste().catch(() => { els.loading.hidden = true; els.missing.hidden = false; });

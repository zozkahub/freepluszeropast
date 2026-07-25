const CONFIG = { telegramUrl: "https://t.me/gumball_Season8", telegramHiddenKey: "freepluszero_hide_telegram_until" };
const $ = (id) => document.getElementById(id);
const els = { loading: $("loadingView"), view: $("pasteView"), missing: $("notFoundView"), title: $("sharedTitle"), text: $("sharedText"), date: $("sharedDate"), views: $("sharedViews"), type: $("sharedType"), copy: $("copyTextButton"), download: $("downloadButton"), telegram: $("telegramShare"), whatsapp: $("whatsappShare"), toast: $("toast"), floating: $("floatingTelegram"), hideTelegram: $("hideTelegram") };
const i18n = window.FPZ_I18N;
let paste;
let toastTimer;
function showToast(message) { clearTimeout(toastTimer); els.toast.textContent = message; els.toast.classList.add("show"); toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2400); }
async function copyText() {
  try { await navigator.clipboard.writeText(paste.text); } catch { const field = document.createElement("textarea"); field.value = paste.text; document.body.append(field); field.select(); document.execCommand("copy"); field.remove(); }
  showToast(i18n.t("copied"));
}
function downloadText() {
  const blob = new Blob([paste.text], { type: "text/plain;charset=utf-8" });
  const href = URL.createObjectURL(blob); const link = document.createElement("a");
  link.href = href; link.download = `${(paste.title || "freepluszero-text").replace(/[\\/:*?"<>|]+/g, "-")}.txt`; link.click(); URL.revokeObjectURL(href);
}
function renderPaste(data) {
  paste = data;
  els.title.textContent = data.title || i18n.t("untitled");
  els.text.textContent = data.text;
  els.date.textContent = new Date(data.createdAt).toLocaleString(i18n.t("locale"));
  els.views.textContent = i18n.formatViews(data.views);
  const syntaxDict = i18n.translations[i18n.getLang()].syntax;
  els.type.textContent = data.syntax === "code" ? syntaxDict.code : data.syntax === "json" ? syntaxDict.json : data.syntax === "markdown" ? syntaxDict.markdown : syntaxDict.plain;
  els.text.classList.toggle("code-text", data.syntax === "code" || data.syntax === "json");
  const url = window.location.href;
  const shareTitle = data.title || i18n.t("sharedFallback");
  els.telegram.href = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(shareTitle)}`;
  els.whatsapp.href = `https://wa.me/?text=${encodeURIComponent(`${shareTitle}\n${url}`)}`;
  document.title = `${shareTitle} | freepluszero`;
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
window.FPZ_ON_LANG_CHANGE = () => { if (paste) renderPaste(paste); };
loadPaste().catch(() => { els.loading.hidden = true; els.missing.hidden = false; });

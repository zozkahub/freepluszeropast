const CONFIG = { telegramUrl: "https://t.me/gumball_Season8", telegramHiddenKey: "freepluszero_hide_telegram_until" };
const $ = (id) => document.getElementById(id);
const els = {
  form: $("pasteForm"), body: $("textBody"), title: $("textTitle"), syntax: $("textSyntax"), expiry: $("textExpiry"),
  counter: $("textCounter"), status: $("editorStatus"), submit: $("submitButton"), clear: $("clearButton"),
  result: $("resultPanel"), url: $("shareUrl"), copy: $("copyButton"), open: $("openButton"), telegram: $("telegramShare"), whatsapp: $("whatsappShare"),
  toast: $("toast"), floating: $("floatingTelegram"), hideTelegram: $("hideTelegram")
};
let currentUrl = "";
let toastTimer;

function showToast(message) {
  clearTimeout(toastTimer);
  els.toast.textContent = message;
  els.toast.classList.add("show");
  toastTimer = setTimeout(() => els.toast.classList.remove("show"), 2400);
}

function updateCounter() {
  const value = els.body.value;
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;
  els.counter.textContent = `${value.length.toLocaleString("ar-EG")} حرف`;
  els.status.textContent = `${words.toLocaleString("ar-EG")} كلمة`;
}

async function copy(value, message) {
  if (!value) return showToast("لا يوجد رابط للنسخ");
  try { await navigator.clipboard.writeText(value); }
  catch {
    const field = document.createElement("textarea");
    field.value = value; field.style.cssText = "position:fixed;opacity:0";
    document.body.append(field); field.select(); document.execCommand("copy"); field.remove();
  }
  showToast(message);
}

function configureResult(paste) {
  currentUrl = new URL(`/p/${paste.id}`, window.location.origin).href;
  els.url.value = currentUrl;
  const title = paste.title || "نص مشترك";
  els.telegram.href = `https://t.me/share/url?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(title)}`;
  els.whatsapp.href = `https://wa.me/?text=${encodeURIComponent(`${title}\n${currentUrl}`)}`;
  els.result.hidden = false;
  els.status.textContent = "تم الحفظ";
  els.result.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function submitPaste(event) {
  event.preventDefault();
  const text = els.body.value.trim();
  if (!text) { els.body.focus(); return showToast("اكتب النص أولًا"); }
  els.submit.disabled = true;
  els.submit.innerHTML = "جارٍ الحفظ...";
  els.status.textContent = "جارٍ إنشاء الرابط";
  try {
    const response = await fetch("/api/pastes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, title: els.title.value.trim(), syntax: els.syntax.value, expiry: els.expiry.value }) });
    if (!response.ok) throw new Error("save failed");
    configureResult(await response.json());
    showToast("تم إنشاء صفحة المشاركة");
  } catch {
    els.status.textContent = "تعذر الحفظ";
    showToast("تعذر إنشاء الرابط. جرّب مرة أخرى.");
  } finally {
    els.submit.disabled = false;
    els.submit.innerHTML = 'إنشاء رابط المشاركة <span aria-hidden="true">←</span>';
  }
}

function setupTelegram() {
  els.floating.querySelector("a").href = CONFIG.telegramUrl;
  if (Date.now() < Number(localStorage.getItem(CONFIG.telegramHiddenKey) || "0")) els.floating.hidden = true;
  els.hideTelegram.addEventListener("click", () => { localStorage.setItem(CONFIG.telegramHiddenKey, String(Date.now() + 3600000)); els.floating.hidden = true; });
}

els.form.addEventListener("submit", submitPaste);
els.body.addEventListener("input", updateCounter);
els.clear.addEventListener("click", () => { els.form.reset(); els.result.hidden = true; currentUrl = ""; updateCounter(); els.body.focus(); });
els.copy.addEventListener("click", () => copy(currentUrl, "تم نسخ الرابط"));
els.open.addEventListener("click", () => currentUrl && window.open(currentUrl, "_blank", "noopener"));
setupTelegram();
updateCounter();

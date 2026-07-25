(function () {
  const STORAGE_KEY = "fpz_lang";

  const translations = {
    ar: {
      newPaste: "+ نص جديد",
      untitled: "نص بدون عنوان",
      sharedFallback: "نص مشترك",
      downloadTxt: "تنزيل TXT",
      copyText: "نسخ النص",
      copied: "تم نسخ النص",
      sharedVia: "تمت المشاركة عبر",
      telegram: "تليجرام",
      whatsapp: "واتساب",
      notFoundTitle: "هذا النص غير متاح",
      notFoundBody: "ربما انتهت مدة حفظه أو أن الرابط غير صحيح.",
      createNew: "إنشاء نص جديد",
      loading: "جارٍ فتح النص...",
      telegramTitle: "تليجرام freepluszero",
      hideTelegram: "إخفاء زر تليجرام",
      syntax: { code: "كود", json: "JSON", markdown: "Markdown", plain: "نص عادي" },
      viewsSuffix: "مشاهدة",
      locale: "ar-EG",
      dir: "rtl"
    },
    en: {
      newPaste: "+ New paste",
      untitled: "Untitled text",
      sharedFallback: "Shared text",
      downloadTxt: "Download TXT",
      copyText: "Copy text",
      copied: "Text copied",
      sharedVia: "Shared via",
      telegram: "Telegram",
      whatsapp: "WhatsApp",
      notFoundTitle: "This text isn't available",
      notFoundBody: "It may have expired, or the link is incorrect.",
      createNew: "Create new paste",
      loading: "Opening text...",
      telegramTitle: "freepluszero on Telegram",
      hideTelegram: "Hide Telegram button",
      syntax: { code: "Code", json: "JSON", markdown: "Markdown", plain: "Plain text" },
      viewsSuffix: "views",
      locale: "en-US",
      dir: "ltr"
    }
  };

  function getLang() {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === "en" || saved === "ar" ? saved : "ar";
  }

  function setLang(lang) {
    localStorage.setItem(STORAGE_KEY, lang);
  }

  function t(key) {
    return translations[getLang()][key];
  }

  function formatViews(count) {
    const dict = translations[getLang()];
    return `${count.toLocaleString(dict.locale)} ${dict.viewsSuffix}`;
  }

  function applyStaticText() {
    const lang = getLang();
    const dict = translations[lang];

    document.documentElement.lang = lang;
    document.documentElement.dir = dict.dir;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (typeof dict[key] === "string") el.textContent = dict[key];
    });

    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      el.getAttribute("data-i18n-attr").split(",").forEach((pair) => {
        const [attr, key] = pair.split(":");
        if (dict[key] !== undefined) el.setAttribute(attr, dict[key]);
      });
    });

    const toggle = document.getElementById("langToggle");
    if (toggle) toggle.textContent = lang === "ar" ? "EN" : "AR";
  }

  window.FPZ_I18N = { getLang, setLang, t, formatViews, translations, applyStaticText };

  document.addEventListener("DOMContentLoaded", () => {
    applyStaticText();
    const toggle = document.getElementById("langToggle");
    if (toggle) {
      toggle.addEventListener("click", () => {
        setLang(getLang() === "ar" ? "en" : "ar");
        applyStaticText();
        if (typeof window.FPZ_ON_LANG_CHANGE === "function") window.FPZ_ON_LANG_CHANGE();
      });
    }
  });
})();

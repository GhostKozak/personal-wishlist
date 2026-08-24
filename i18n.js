const TRANSLATIONS = {
  en: {
    // Stats & Summary
    totalPrice: "Total Wishlist",
    monthlyInstallment: "Monthly Installment",
    activeInstallments: "Active Installments",
    itemCount: "Item",
    itemsCount: "Items",
    budgetLimit: "Budget Limit",
    noBudget: "No budget set",
    budgetUsed: "%{percent} used (Remaining: {remaining} TL)",
    // Table & Statuses
    cash: "Cash",
    installment: "Installment",
    remainingMonths: "Remaining: {remaining} / {total} mos",
    installmentFinished: "Installment Finished 🎉",
    edit: "Edit",
    delete: "Delete",
    // Toast & Dialog Messages
    confirmDelete: "Are you sure you want to delete this item?",
    exportNoData: "No data to export!",
    importSuccess: "Data successfully loaded! 🎉",
    importInvalid: "Invalid file format!",
    importError: "Could not read JSON file!",
    // Live Rates
    ratesLive: "Live",
    ratesManual: "Manual",
    ratesFailed: "⚠️ Failed to fetch live rates!",
    ratesTooltipLive: "Rates are kept up to date via live API.",
    ratesTooltipManual: "Live rate connection failed! Using fixed/manual rates."
  },
  tr: {
    // Stats & Summary
    totalPrice: "Toplam İstek Listesi",
    monthlyInstallment: "Aylık Taksit",
    activeInstallments: "Aktif Taksitler",
    itemCount: "Ürün",
    itemsCount: "Ürün",
    budgetLimit: "Bütçe Limiti",
    noBudget: "Bütçe belirlenmedi",
    budgetUsed: "%{percent} kullanıldı (Kalan: {remaining} TL)",
    // Table & Statuses
    cash: "Peşin",
    installment: "Taksit",
    remainingMonths: "Kalan: {remaining} / {total} ay",
    installmentFinished: "Taksit Bitti 🎉",
    edit: "Düzenle",
    delete: "Sil",
    // Toast & Dialog Messages
    confirmDelete: "Bu ürünü silmek istediğinize emin misiniz?",
    exportNoData: "İndirilecek veri yok!",
    importSuccess: "Veriler başarıyla yüklendi! 🎉",
    importInvalid: "Geçersiz dosya biçimi!",
    importError: "JSON dosyası okunamadı!",
    // Live Rates
    ratesLive: "Canlı",
    ratesManual: "Manuel",
    ratesFailed: "⚠️ Canlı Kur Alınamadı!",
    ratesTooltipLive: "Kurlar canlı API üzerinden güncel tutuluyor.",
    ratesTooltipManual: "Canlı kur bağlantısı kurulamadı! Sabit/Manuel kurlar kullanılıyor."
  }
};


const t = (key, params = {}) => {
  let text = TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS['en'][key] || key;
  Object.entries(params).forEach(([k, v]) => {
    text = text.replace(`{${k}}`, v);
  });
  return text;
};

const updateStaticTranslations = () => {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (el.tagName === 'INPUT' && el.placeholder) {
      el.placeholder = t(key);
    } else {
      el.textContent = t(key);
    }
  });
};

const toggleLanguage = () => {
  currentLang = currentLang === 'en' ? 'tr' : 'en';
  localStorage.setItem('wishlist_lang', currentLang);
  updateStaticTranslations();
  renderWishlist();
  renderSummaryCards();
  renderPriorityChart();
}
const UI_LANG_TRIGGER = document.getElementById('btn-lang-toggle');

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
    altLink: "Alternative link",
    saveWishlist: "Save to Wishlist",
    addNewItem: "Add New Item",
    updateItem: "Update Item",
    cancel: "Cancel",
    appTitle: "Personal Wishlist",
    addNewItemButton: "+ Add New Item",
    toggleAnalytics: "📊 Analytics",
    toggleTheme: "🌙 | ☀️ Toggle Dark/Light Mode",
    toggleDarkMode: "🌙 Toggle Dark Mode",
    toggleLightMode: "☀️ Toggle Light Mode",
    languageToggle: "🌐 TR",
    modalTitle: "Add New Item",
    itemName: "Name :",
    itemLink: "Links :",
    itemPrice: "Price :",
    itemImportance: "Importance :",
    itemUrgency: "Urgency :",
    itemStatus: "Status :",
    itemPurchaseDate: "Purchase Date",
    itemInstallmentCount: "Installment Count :",
    itemNote: "Note :",
    itemNamePlaceholder: "Item name",
    mainLinkPlaceholder: "Main Link (https://...)",
    altLinkPlaceholder: "Alt Link (https://...)",
    budgetAndInstallmentSummary: "Budget AND Installment Summary",
    totalWishlistValue: "Total Wishlist Value",
    monthlyInstallmentTotal: "Montly Installment Total",
    installmentItems: "Installment Items",
    budgetLimitTitle: "Budget Limit",
    setBudgetTitle: "Set Budget",
    myWishlist: "My Wishlist",
    exportJson: "📥 Export JSON",
    importJson: "📤 Import JSON",
    searchPlaceholder: "Wishlist name or note content",
    all: "🏡 All",
    allPriorities: "🎯 All Priorities",
    payment: "Payment",
    priority: "Priority",
    status: "Status",
    actions: "Actions",
    emptyState: "Listenizde henüz bir ürün bulunmuyor veya arama kriterlerine uygun sonuç bulunamadı.",
    noItemsFound: "No items found matching your search.",
    rateStatusText: "(Güncelleniyor...)",
    manualRateTitle: "Kurları Manuel Düzenle",
    changeLanguageTitle: "Change Language",
    appFooter: "© 2026 Wishlist App",
    toastTitle: "Toast Title",
    toastMessage: "Lorem ipsum dolar",
    confirmDeleteMessage: "Emin misin?",
    cancelLabel: "İptal",
    confirmLabel: "Onayla",
    rateUsdLabel: "USD",
    rateEurLabel: "EUR",
    save: "Save",
    saveBudget: "Save Budget",
    setMonthlyTotalBudget: "Set Monthly / Total Budget",
    targetBudgetLabel: "Target Budget (TL):",
    targetBudgetPlaceholder: "e.g. 15000",
    statusWishlist: "💭 Wishlist",
    statusResearching: "🔍 Researching",
    statusPurchased: "✅ Purchased",
    statusCanceled: "❌ Canceled",
    priorityP1: "P1: Urgent & Important",
    priorityP2: "P2: Important",
    priorityP3: "P3: Urgent",
    priorityP4: "P4: Someday",
    // Toast & Dialog Messages
    confirmDelete: "Are you sure you want to delete this item?",
    exportNoData: "No data to export!",
    importSuccess: "Data successfully loaded! 🎉",
    importInvalid: "Invalid file format!",
    importError: "Could not read JSON file!",
    ratesManualSet: "Manually Set",
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
    altLink: "Alternatif bağlantı",
    saveWishlist: "İstek Listesine Kaydet",
    addNewItem: "Yeni Ürün Ekle",
    updateItem: "Ürünü Güncelle",
    cancel: "İptal",
    appTitle: "Kişisel İstek Listesi",
    addNewItemButton: "+ Yeni Ürün Ekle",
    toggleAnalytics: "📊 Analitik",
    toggleTheme: "🌙 | ☀️ Koyu/Açık Modu Değiştir",
    toggleDarkMode: "🌙 Koyu Modu Aç",
    toggleLightMode: "☀️ Açık Modu Aç",
    languageToggle: "🌐 TR",
    modalTitle: "Yeni Ürün Ekle",
    itemName: "Ad :",
    itemLink: "Bağlantılar :",
    itemPrice: "Fiyat :",
    itemImportance: "Önem :",
    itemUrgency: "Acil Durum :",
    itemStatus: "Durum :",
    itemPurchaseDate: "Satın Alma Tarihi",
    itemInstallmentCount: "Taksit Sayısı :",
    itemNote: "Not :",
    itemNamePlaceholder: "Ürün adı",
    mainLinkPlaceholder: "Ana Bağlantı (https://...)",
    altLinkPlaceholder: "Alternatif Bağlantı (https://...)",
    budgetAndInstallmentSummary: "Bütçe ve Taksit Özeti",
    totalWishlistValue: "Toplam İstek Listesi Değeri",
    monthlyInstallmentTotal: "Aylık Taksit Toplamı",
    installmentItems: "Taksitli Ürünler",
    budgetLimitTitle: "Bütçe Limiti",
    setBudgetTitle: "Bütçe Ayarla",
    myWishlist: "İstek Listem",
    exportJson: "📥 JSON Dışa Aktar",
    importJson: "📤 JSON İçe Aktar",
    searchPlaceholder: "İstek listesi adı veya not içeriği",
    all: "🏡 Tümü",
    allPriorities: "🎯 Tüm Öncelikler",
    payment: "Ödeme",
    priority: "Öncelik",
    status: "Durum",
    actions: "İşlemler",
    emptyState: "Listenizde henüz bir ürün bulunmuyor veya arama kriterlerine uygun sonuç bulunamadı.",
    noItemsFound: "Aramanıza uygun ürün bulunamadı.",
    rateStatusText: "(Güncelleniyor...)",
    manualRateTitle: "Kurları Manuel Düzenle",
    changeLanguageTitle: "Dili Değiştir",
    appFooter: "© 2026 İstek Listesi Uygulaması",
    toastTitle: "Bildirim Başlığı",
    toastMessage: "Lorem ipsum dolar",
    confirmDeleteMessage: "Emin misin?",
    cancelLabel: "İptal",
    confirmLabel: "Onayla",
    rateUsdLabel: "USD",
    rateEurLabel: "EUR",
    save: "Kaydet",
    saveBudget: "Bütçeyi Kaydet",
    setMonthlyTotalBudget: "Aylık / Toplam Bütçe Ayarla",
    targetBudgetLabel: "Hedef Bütçe (TL):",
    targetBudgetPlaceholder: "ör. 15000",
    statusWishlist: "💭 İstek Listesi",
    statusResearching: "🔍 Araştırılıyor",
    statusPurchased: "✅ Satın Alındı",
    statusCanceled: "❌ İptal Edildi",
    priorityP1: "P1: Acil ve Önemli",
    priorityP2: "P2: Önemli",
    priorityP3: "P3: Acil",
    priorityP4: "P4: Sonra",
    // Toast & Dialog Messages
    confirmDelete: "Bu ürünü silmek istediğinize emin misiniz?",
    exportNoData: "İndirilecek veri yok!",
    importSuccess: "Veriler başarıyla yüklendi! 🎉",
    importInvalid: "Geçersiz dosya biçimi!",
    importError: "JSON dosyası okunamadı!",
    ratesManualSet: "Manuel Ayarlandı",
    // Live Rates
    ratesLive: "Canlı",
    ratesManual: "Manuel",
    ratesFailed: "⚠️ Canlı Kur Alınamadı!",
    ratesTooltipLive: "Kurlar canlı API üzerinden güncel tutuluyor.",
    ratesTooltipManual: "Canlı kur bağlantısı kurulamadı! Sabit/Manuel kurlar kullanılıyor."
  }
};

const t = (key, params = {}) => {
  let text = TRANSLATIONS[currentLang]?.[key] || TRANSLATIONS.en[key] || key;
  Object.entries(params).forEach(([k, v]) => {
    text = text.replace(new RegExp(`\\{${k}\\}|%\\{${k}\\}`, 'g'), String(v));
  });
  return text;
};

const updateStaticTranslations = () => {
  const setTranslatedText = (el, value) => {
    const textNode = Array.from(el.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
    if (textNode) {
      textNode.textContent = value;
      return;
    }

    el.textContent = value;
  };

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (key) el.placeholder = t(key);
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.dataset.i18nTitle;
    if (key) el.title = t(key);
  });

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (el.dataset.i18nKeep === 'true' || el.dataset.i18nTitle) return;
    if (el.tagName === 'INPUT' && el.placeholder) {
      el.placeholder = t(key);
      return;
    }

    setTranslatedText(el, t(key));
  });
};

const toggleLanguage = () => {
  currentLang = currentLang === 'en' ? 'tr' : 'en';
  localStorage.setItem('wishlist_lang', currentLang);
  updateStaticTranslations();
  if (typeof updateThemeUI === 'function') {
    updateThemeUI(document.documentElement.getAttribute('data-theme') || 'dark');
  }
  renderWishlist();
  renderSummaryCards();
  renderPriorityChart();
}

UI_LANG_TRIGGER.addEventListener('click', toggleLanguage);
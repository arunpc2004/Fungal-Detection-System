// Multi-language Support
const translations = {
    en: {
        title: 'HEALTHY FRESH',
        subtitle: 'AI-powered fruit & vegetable quality inspection',
        analyze: 'Analyze',
        upload: 'Upload your item',
        selectImage: 'Select an Image',
        startCamera: 'Start Camera',
        capture: 'Capture',
        healthy: 'Healthy',
        diseased: 'Diseased',
        confidence: 'Confidence',
        result: 'Result'
    },
    ml: { // Malayalam
        title: 'ആരോഗ്യകരമായ പുതുമ',
        subtitle: 'AI-പവർഡ് പഴങ്ങളുടെയും പച്ചക്കറികളുടെയും ഗുണനിലവാര പരിശോധന',
        analyze: 'വിശകലനം ചെയ്യുക',
        upload: 'നിങ്ങളുടെ ഇനം അപ്‌ലോഡ് ചെയ്യുക',
        selectImage: 'ചിത്രം തിരഞ്ഞെടുക്കുക',
        startCamera: 'ക്യാമറ ആരംഭിക്കുക',
        capture: 'പകർത്തുക',
        healthy: 'ആരോഗ്യകരം',
        diseased: 'രോഗബാധിതം',
        confidence: 'ആത്മവിശ്വാസം',
        result: 'ഫലം'
    },
    kn: { // Kannada
        title: 'ಆರೋಗ್ಯಕರ ತಾಜಾ',
        subtitle: 'AI-ಚಾಲಿತ ಹಣ್ಣು ಮತ್ತು ತರಕಾರಿ ಗುಣಮಟ್ಟ ತಪಾಸಣೆ',
        analyze: 'ವಿಶ್ಲೇಷಿಸಿ',
        upload: 'ನಿಮ್ಮ ವಸ್ತುವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ',
        selectImage: 'ಚಿತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
        startCamera: 'ಕ್ಯಾಮೆರಾ ಪ್ರಾರಂಭಿಸಿ',
        capture: 'ಸೆರೆಹಿಡಿಯಿರಿ',
        healthy: 'ಆರೋಗ್ಯಕರ',
        diseased: 'ರೋಗಗ್ರಸ್ತ',
        confidence: 'ವಿಶ್ವಾಸ',
        result: 'ಫಲಿತಾಂಶ'
    },
    ta: { // Tamil
        title: 'ஆரோக்கியமான புதிய',
        subtitle: 'AI-இயங்கும் பழங்கள் மற்றும் காய்கறிகள் தர ஆய்வு',
        analyze: 'பகுப்பாய்வு செய்',
        upload: 'உங்கள் பொருளை பதிவேற்றவும்',
        selectImage: 'படத்தைத் தேர்ந்தெடுக்கவும்',
        startCamera: 'கேமராவைத் தொடங்கு',
        capture: 'பிடி',
        healthy: 'ஆரோக்கியமான',
        diseased: 'நோயுற்ற',
        confidence: 'நம்பிக்கை',
        result: 'முடிவு'
    },
    hi: { // Hindi
        title: 'स्वस्थ ताज़ा',
        subtitle: 'AI-संचालित फल और सब्जी गुणवत्ता निरीक्षण',
        analyze: 'विश्लेषण करें',
        upload: 'अपनी वस्तु अपलोड करें',
        selectImage: 'चित्र चुनें',
        startCamera: 'कैमरा शुरू करें',
        capture: 'कैप्चर करें',
        healthy: 'स्वस्थ',
        diseased: 'रोगग्रस्त',
        confidence: 'विश्वास',
        result: 'परिणाम'
    },
    tu: { // Tulu
        title: 'ಆರೋಗ್ಯಕರ ಹೊಸ',
        subtitle: 'AI-ಚಾಲಿತ ಹಣ್ಣು ಮತ್ತು ತರಕಾರಿ ಗುಣಮಟ್ಟ ಪರೀಕ್ಷೆ',
        analyze: 'ವಿಶ್ಲೇಷಣೆ ಮಲ್ಪುಲೆ',
        upload: 'ಈರೆನ ವಸ್ತು ಅಪ್‌ಲೋಡ್ ಮಲ್ಪುಲೆ',
        selectImage: 'ಚಿತ್ರ ಆಯ್ಕೆ ಮಲ್ಪುಲೆ',
        startCamera: 'ಕ್ಯಾಮೆರಾ ಶುರು ಮಲ್ಪುಲೆ',
        capture: 'ಪಿಡಿಪುಲೆ',
        healthy: 'ಆರೋಗ್ಯಕರ',
        diseased: 'ರೋಗ ಉಪ್ಪುನ',
        confidence: 'ನಂಬಿಕೆ',
        result: 'ಫಲಿತಾಂಶ'
    }
};

class LanguageSelector {
    constructor() {
        this.currentLang = localStorage.getItem('language') || 'en';
        this.init();
    }
    
    init() {
        this.createSelector();
        this.applyTranslations();
    }
    
    createSelector() {
        const selector = `
            <div class="lang-selector">
                <select id="languageSelect" onchange="window.i18n.changeLang(this.value)">
                    <option value="en" ${this.currentLang === 'en' ? 'selected' : ''}>English</option>
                    <option value="ml" ${this.currentLang === 'ml' ? 'selected' : ''}>മലയാളം</option>
                    <option value="kn" ${this.currentLang === 'kn' ? 'selected' : ''}>ಕನ್ನಡ</option>
                    <option value="ta" ${this.currentLang === 'ta' ? 'selected' : ''}>தமிழ்</option>
                    <option value="hi" ${this.currentLang === 'hi' ? 'selected' : ''}>हिंदी</option>
                    <option value="tu" ${this.currentLang === 'tu' ? 'selected' : ''}>ತುಳು</option>
                </select>
            </div>
        `;
        
        const nav = document.querySelector('.header-nav, .hero-menu');
        if (nav) nav.insertAdjacentHTML('beforeend', selector);
    }
    
    changeLang(lang) {
        this.currentLang = lang;
        localStorage.setItem('language', lang);
        this.applyTranslations();
    }
    
    applyTranslations() {
        const t = translations[this.currentLang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (t[key]) el.textContent = t[key];
        });
    }
    
    t(key) {
        return translations[this.currentLang][key] || translations.en[key] || key;
    }
}

// Initialize
window.i18n = new LanguageSelector();

// انتظر حتى يتم تحميل الصفحة بالكامل قبل تشغيل أي كود
document.addEventListener('DOMContentLoaded', function() {

    // --- تهيئة Firebase ---
    // هام: تأكد من أن هذه البيانات موجودة وصحيحة
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY", // ضع مفتاحك هنا
        authDomain: "YOUR_AUTH_DOMAIN",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_STORAGE_BUCKET",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    };

    // تهيئة Firebase وإنشاء اتصال بقاعدة البيانات
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // --- ربط عناصر نموذج التسجيل ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const providerServiceSelect = document.getElementById('providerService');
        const otherServiceGroup = document.getElementById('otherServiceGroup');

        // إظهار حقل "خدمة أخرى" عند الاختيار
        if (providerServiceSelect) {
            providerServiceSelect.addEventListener('change', function() {
                if (otherServiceGroup) {
                    otherServiceGroup.style.display = (this.value === 'أخرى') ? 'block' : 'none';
                }
            });
        }

        // التعامل مع حدث إرسال النموذج
        registerForm.addEventListener('submit', function(event) {
            event.preventDefault(); // منع التحديث التلقائي للصفحة
            handleSubmit(db); // استدعاء دالة الإرسال
        });
    }

    // --- ربط نماذج البحث ---
    const advancedSearchForm = document.getElementById('advancedSearchForm');
    if (advancedSearchForm) {
        advancedSearchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const filters = {
                service: document.getElementById('searchService').value,
                city: document.getElementById('searchCity').value.trim(),
            };
            searchProviders(db, filters);
            closeModal('searchModal');
        });
    }
});

// --- الدوال العامة (تبقى خارج addEventListener ليمكن استدعاؤها من HTML) ---

// دالة فتح وإغلاق القائمة المنسدلة
function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.classList.toggle('active');
    }
}

// دوال فتح وإغلاق النوافذ المنبثقة (Modals)
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

// دالة إرسال بيانات التسجيل (handleSubmit)
function handleSubmit(db) {
    const form = document.getElementById('registerForm');
    const successAlert = document.getElementById('registerSuccess');
    const errorAlert = document.getElementById('registerError');
    const submitButton = form.querySelector('button[type="submit"]');

    // تعطيل الزر وإظهار مؤشر التحميل
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التسجيل...';
    successAlert.style.display = 'none';
    errorAlert.style.display = 'none';

    // تجميع البيانات من النموذج
    const serviceSelect = document.getElementById('providerService');
    const serviceValue = serviceSelect.value === 'أخرى' ? document.getElementById('otherService').value : serviceSelect.value;
    
    const providerData = {
        name: document.getElementById('providerName').value,
        phone: document.getElementById('providerPhone').value,
        service: serviceValue,
        city: document.getElementById('providerCity').value,
        description: document.getElementById('providerDescription').value,
        experience: document.getElementById('providerExperience').value,
        approved: false, // القيمة الافتراضية للموافقة
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    };

    // إرسال البيانات إلى Firebase
    db.collection('providers').add(providerData)
        .then(() => {
            // عند النجاح
            form.style.display = 'none';
            successAlert.style.display = 'block';

            // إعادة النموذج لحالته الطبيعية بعد 3 ثوانٍ
            setTimeout(() => {
                closeModal('registerModal');
                form.reset();
                form.style.display = 'block';
                successAlert.style.display = 'none';
                document.getElementById('otherServiceGroup').style.display = 'none';
                submitButton.disabled = false;
                submitButton.innerHTML = '<i class="fas fa-user-plus"></i> تسجيل';
            }, 3000);
        })
        .catch((error) => {
            // عند الفشل
            console.error("Error writing document: ", error);
            errorAlert.style.display = 'block';
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-user-plus"></i> تسجيل';
        });
}

// --- دوال البحث (تبقى عامة) ---
function performSearch() {
    const mainSearchInput = document.getElementById('mainSearch');
    const query = mainSearchInput.value.trim();
    if (query) {
        // يجب تهيئة db هنا أيضاً أو تمريرها
        const db = firebase.firestore();
        searchProviders(db, { keyword: query });
    }
}

function searchByCategory(category) {
    const db = firebase.firestore();
    searchProviders(db, { service: category });
}

async function searchProviders(db, filters) {
    const searchResultsSection = document.getElementById('searchResults');
    const loadingIndicator = document.getElementById('loading');
    const providersList = document.getElementById('providersList');

    searchResultsSection.style.display = 'block';
    loadingIndicator.style.display = 'block';
    providersList.innerHTML = '';
    window.scrollTo({ top: searchResultsSection.offsetTop, behavior: 'smooth' });

    let query = db.collection('providers').where('approved', '==', true);
    if (filters.service) query = query.where('service', '==', filters.service);
    if (filters.city) query = query.where('city', '==', filters.city);

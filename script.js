// --- تعريف Supabase Client ---
const supabaseUrl = 'https://lzrzyjkzutlpwlxfnpxe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6cnp5amt6dXRscHdseGZucHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NTg2MDEsImV4cCI6MjA3NDUzNDYwMX0.3X9SVBgVSdaceVcTEIMPHznIHVqNfTk4yJRrBhtzKVo';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ========================================================
// --- دوال عامة قابلة للاستدعاء من HTML (onclick) ---
// ========================================================

function toggleMenu() { document.getElementById('navMenu').classList.toggle('active'); }
function openModal(modalId) { const modal = document.getElementById(modalId); if (modal) modal.style.display = 'flex'; }
function closeModal(modalId) { const modal = document.getElementById(modalId); if (modal) modal.style.display = 'none'; }
function openRegisterModal() { openModal('registerModal'); }
function openSearchModal() { openModal('searchModal'); }
function openAddPostModal() { openModal('addPostModal'); }

// ========================================================
// --- دوال البحث (مع أزرار الاتصال) ---
// ========================================================

async function searchProviders(filters = {}) {
    const resultsSection = document.getElementById('searchResults');
    const providersList = document.getElementById('providersList');
    const loading = document.getElementById('loading');

    resultsSection.style.display = 'block';
    loading.style.display = 'block';
    providersList.innerHTML = '';
    window.scrollTo({ top: resultsSection.offsetTop - 70, behavior: 'smooth' });

    let query = supabase.from('providers').select('*').eq('is_approved', true);

    if (filters.service) query = query.eq('service', filters.service);
    if (filters.keyword) query = query.or(`name.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%,service.ilike.%${filters.keyword}%`);

    const { data, error } = await query;
    loading.style.display = 'none';

    if (error) {
        providersList.innerHTML = '<p>حدث خطأ أثناء البحث.</p>';
        console.error(error);
    } else if (data.length === 0) {
        providersList.innerHTML = '<p>لا توجد نتائج تطابق بحثك.</p>';
    } else {
        data.forEach(provider => {
            // الرقم الكامل للواتساب (مفتاح الدولة + الرقم)
            const fullPhoneNumber = provider.phone;
            providersList.innerHTML += `
                <div class="provider-card">
                    <h3>${provider.name}</h3>
                    <p><strong>الخدمة:</strong> ${provider.service}</p>
                    <p><strong>المدينة:</strong> ${provider.city}</p>
                    <div class="provider-contact">
                        <a href="tel:${fullPhoneNumber}" class="btn btn-primary"><i class="fas fa-phone"></i> اتصال</a>
                        <a href="https://wa.me/${fullPhoneNumber}" target="_blank" class="btn btn-secondary"><i class="fab fa-whatsapp"></i> واتساب</a>
                    </div>
                </div>
            `;
        });
    }
}

function searchByCategory(category) { searchProviders({ service: category }); }

// ========================================================
// --- دوال المنشورات ---
// ========================================================

async function loadPosts() {
    const postsList = document.getElementById('postsList');
    const noPostsMessage = document.getElementById('noPostsMessage');
    
    const { data, error } = await supabase.from('posts').select('*').order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
        postsList.innerHTML = '';
        noPostsMessage.style.display = 'block';
        if(error) console.error('Error loading posts:', error);
        return;
    }
    
    noPostsMessage.style.display = 'none';
    postsList.innerHTML = '';
    data.forEach(post => {
        postsList.innerHTML += `
            <div class="post-item">
                <h4>${post.title}</h4>
                <small>بواسطة: ${post.author} - ${new Date(post.created_at).toLocaleDateString('ar')}</small>
                <p>${post.content}</p>
            </div>
        `;
    });
}

// ========================================================
// --- ربط الأحداث عند تحميل الصفحة ---
// ========================================================

document.addEventListener('DOMContentLoaded', () => {
    loadPosts();

    document.querySelector('.search-container .search-btn').addEventListener('click', () => {
        const query = document.getElementById('mainSearch').value;
        if (query) searchProviders({ keyword: query });
    });

    document.getElementById('advancedSearchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const filters = { service: document.getElementById('searchService').value, city: document.getElementById('searchCity').value };
        searchProviders(filters);
        closeModal('searchModal');
    });
    
    document.getElementById('otherServiceSearchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const filters = { keyword: document.getElementById('customService').value };
        searchProviders(filters);
        closeModal('otherServiceModal');
    });

    // --- ربط نموذج التسجيل (مع مفتاح الدولة) ---
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const successMsg = document.getElementById('registerSuccess');
        
        const countryCode = document.getElementById('countryCode').value;
        const phone = document.getElementById('providerPhone').value;
        const fullPhone = countryCode + phone; // دمج المفتاح مع الرقم

        const formData = {
            name: document.getElementById('provider

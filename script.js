// --- تعريف Supabase Client ---
const supabaseUrl = 'https://lzrzyjkzutlpwlxfnpxe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6cnp5amt6dXRscHdseGZucHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NTg2MDEsImV4cCI6MjA3NDUzNDYwMX0.3X9SVBgVSdaceVcTEIMPHznIHVqNfTk4yJRrBhtzKVo';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ========================================================
// --- دوال عامة قابلة للاستدعاء من HTML (onclick) ---
// ========================================================

function toggleMenu() {
    document.getElementById('navMenu').classList.toggle('active');
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// دوال مساعدة لفتح نوافذ معينة
function openRegisterModal() { openModal('registerModal'); }
function openSearchModal() { openModal('searchModal'); }
function openAddPostModal() { openModal('addPostModal'); }

// ========================================================
// --- دوال البحث ---
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

    if (filters.service) {
        query = query.eq('service', filters.service);
    }
    if (filters.keyword) {
        query = query.or(`name.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%,service.ilike.%${filters.keyword}%`);
    }

    const { data, error } = await query;
    loading.style.display = 'none';

    if (error) {
        providersList.innerHTML = '<p>حدث خطأ أثناء البحث.</p>';
        console.error(error);
    } else if (data.length === 0) {
        providersList.innerHTML = '<p>لا توجد نتائج تطابق بحثك.</p>';
    } else {
        data.forEach(provider => {
            providersList.innerHTML += `
                <div class="provider-card">
                    <h3>${provider.name}</h3>
                    <p><strong>الخدمة:</strong> ${provider.service}</p>
                    <p><strong>المدينة:</strong> ${provider.city}</p>
                </div>
            `;
        });
    }
}

function searchByCategory(category) {
    searchProviders({ service: category });
}

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
    // تحميل المنشورات عند بدء التشغيل
    loadPosts();

    // --- ربط نماذج البحث ---
    document.querySelector('.search-container .search-btn').addEventListener('click', () => {
        const query = document.getElementById('mainSearch').value;
        if (query) searchProviders({ keyword: query });
    });

    document.getElementById('advancedSearchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const filters = {
            service: document.getElementById('searchService').value,
            city: document.getElementById('searchCity').value
        };
        searchProviders(filters);
        closeModal('searchModal');
    });
    
    document.getElementById('otherServiceSearchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const filters = { keyword: document.getElementById('customService').value };
        searchProviders(filters);
        closeModal('otherServiceModal');
    });

    // --- ربط نموذج التسجيل ---
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const successMsg = document.getElementById('registerSuccess');
        const formData = {
            name: document.getElementById('providerName').value,
            phone: document.getElementById('providerPhone').value,
            service: document.getElementById('providerService').value === 'أخرى' ? document.getElementById('otherService').value : document.getElementById('providerService').value,
            city: document.getElementById('providerCity').value,
            is_approved: false
        };
        
        const { error } = await supabase.from('providers').insert([formData]);
        
        if (error) {
            alert('حدث خطأ أثناء التسجيل.');
            console.error(error);
        } else {
            successMsg.style.display = 'block';
            e.target.reset();
            setTimeout(() => {
                closeModal('registerModal');
                successMsg.style.display = 'none';
            }, 2500);
        }
    });
    
    // إظهار حقل "خدمة أخرى" عند الاختيار
    document.getElementById('providerService').addEventListener('change', function() {
        document.getElementById('otherServiceGroup').style.display = (this.value === 'أخرى') ? 'block' : 'none';
    });

    // --- ربط نموذج إضافة منشور ---
    document.getElementById('addPostForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const successMsg = document.getElementById('postSuccess');
        const postData = {
            author: document.getElementById('postAuthor').value,
            title: document.getElementById('postTitle').value,
            content: document.getElementById('postContent').value
        };

        const { error } = await supabase.from('posts').insert([postData]);

        if (error) {
            alert('حدث خطأ أثناء النشر.');
            console.error(error);
        } else {
            successMsg.style.display = 'block';
            e.target.reset();
            loadPosts(); // إعادة تحميل المنشورات
            setTimeout(() => {
                closeModal('addPostModal');
                successMsg.style.display = 'none';
            }, 2000);
        }
    });
});

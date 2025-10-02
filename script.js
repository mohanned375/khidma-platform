// --- تعريف Supabase Client ---
const supabaseUrl = 'https://lzrzyjkzutlpwlxfnpxe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6cnp5amt6dXRscHdseGZucHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NTg2MDEsImV4cCI6MjA3NDUzNDYwMX0.3X9SVBgVSdaceVcTEIMPHznIHVqNfTk4yJRrBhtzKVo';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ========================================================
// --- دوال عامة (يجب أن تكون هنا لتعمل onclick) ---
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

function searchByCategory(category) {
    searchProviders({ service: category });
}

// ========================================================
// --- دوال البحث وعرض النتائج ---
// ========================================================

async function searchProviders(filters = {}) {
    const resultsSection = document.getElementById('searchResults');
    const providersList = document.getElementById('providersList');
    const loading = document.getElementById('loading');

    resultsSection.style.display = 'block';
    loading.style.display = 'block';
    loading.textContent = 'جاري البحث...';
    providersList.innerHTML = '';
    window.scrollTo({ top: resultsSection.offsetTop - 70, behavior: 'smooth' });

    let query = supabase.from('providers').select('*').eq('is_approved', true);

    if (filters.service) query = query.eq('service', filters.service);
    if (filters.keyword) query = query.or(`name.ilike.%${filters.keyword}%,service.ilike.%${filters.keyword}%`);

    const { data, error } = await query;
    loading.style.display = 'none';

    if (error) {
        providersList.innerHTML = '<p>حدث خطأ أثناء البحث.</p>';
    } else if (data.length === 0) {
        providersList.innerHTML = '<p>لا توجد نتائج تطابق بحثك.</p>';
    } else {
        data.forEach(provider => {
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
// --- ربط الأحداث التي لا تحتاج إلى onclick ---
// ========================================================

document.addEventListener('DOMContentLoaded', () => {
    loadPosts();

    // --- ربط نماذج الإرسال (Submit) ---
    document.getElementById('mainSearchBtn').addEventListener('click', () => {
        const query = document.getElementById('mainSearch').value;
        if (query) searchProviders({ keyword: query });
    });

    document.getElementById('advancedSearchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        searchProviders({
            service: document.getElementById('searchService').value,
            city: document.getElementById('searchCity').value
        });
        closeModal('searchModal');
    });
    
    document.getElementById('otherServiceSearchForm').addEventListener('submit', (e) => {
        e.preventDefault();
        searchProviders({ keyword: document.getElementById('customService').value });
        closeModal('otherServiceModal');
    });

    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullPhone = document.getElementById('countryCode').value + document.getElementById('providerPhone').value;
        const formData = {
            name: document.getElementById('providerName').value,
            phone: fullPhone,
            service: document.getElementById('providerService').value === 'أخرى' ? document.getElementById('otherService').value : document.getElementById('providerService').value,
            city: document.getElementById('providerCity').value,
            is_approved: false
        };
        
        const { error } = await supabase.from('providers').insert([formData]);
        if (error) {
            alert('حدث خطأ أثناء التسجيل.');
        } else {
            document.getElementById('registerSuccess').style.display = 'block';
            e.target.reset();
            setTimeout(() => {
                closeModal('registerModal');
                document.getElementById('registerSuccess').style.display = 'none';
            }, 2500);
        }
    });
    
    document.getElementById('providerService').addEventListener('change', function() {
        document.getElementById('otherServiceGroup').style.display = (this.value === 'أخرى') ? 'block' : 'none';
    });

    // --- شكل الدالة الكاملة بعد الإصلاح ---
document.getElementById('addPostForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const postData = {
        author: document.getElementById('postAuthor').value,
        title: document.getElementById('postTitle').value,
        content: document.getElementById('postContent').value,
        created_at: new Date().toISOString() // <-- السطر المضاف
    };
    const { error } = await supabase.from('posts').insert([postData]);
    if (error) {
        alert('حدث خطأ أثناء النشر. يرجى المحاولة مرة أخرى.');
        console.error('Supabase post error:', error); // لإظهار الخطأ في الكونسول
    } else {
        document.getElementById('postSuccess').style.display = 'block';
        e.target.reset();
        loadPosts();
        setTimeout(() => {
            closeModal('addPostModal');
            document.getElementById('postSuccess').style.display = 'none';
        }, 2000);
    }
});
});


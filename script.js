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
// --- دوال المنشورات والتعليقات ---
// ========================================================

async function loadPosts() {
    const postsList = document.getElementById('postsList');
    const noPostsMessage = document.getElementById('noPostsMessage');
    
    const { data: posts, error } = await supabase
        .from('posts')
        .select(`
            *,
            comments (
                id,
                content,
                author,
                created_at
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading posts:', error);
        postsList.innerHTML = '<p style="color: red; text-align: center;">حدث خطأ في تحميل المنشورات.</p>';
        noPostsMessage.style.display = 'none';
        return;
    }

    if (!posts || posts.length === 0) {
        postsList.innerHTML = '';
        noPostsMessage.style.display = 'block';
        return;
    }
    
    noPostsMessage.style.display = 'none';
    postsList.innerHTML = '';

    posts.forEach(post => {
        const postElement = createPostElement(post);
        postsList.appendChild(postElement);
    });
}

// --- الدوال الجديدة التي تمت إضافتها هنا ---

function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post-item';
    postDiv.setAttribute('data-post-id', post.id);

    // --- السطر الجديد ---
    const postDate = new Date(post.created_at).toLocaleString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    const commentsCount = post.comments ? post.comments.length : 0;

    postDiv.innerHTML = `
        <div class="post-header">
            <div class="post-author">${post.author}</div>
            <div class="post-date">${postDate}</div>
        </div>
        <h4 class="post-title">${post.title}</h4>
        <p class="post-content">${post.content}</p>
        
        <div class="post-actions">
            <button class="comment-toggle-btn" onclick="toggleComments(${post.id})">
                <i class="fas fa-comments"></i>
                <span>التعليقات (${commentsCount})</span>
            </button>
        </div>

        <div class="comments-section" id="comments-section-${post.id}">
            <div class="comments-list" id="comments-list-${post.id}">
                ${post.comments && post.comments.length > 0 ? post.comments.map(createCommentElement).join('') : '<p class="no-comments">لا توجد تعليقات بعد. كن أول من يعلق!</p>'}
            </div>
            <div class="add-comment-form">
                <input type="text" id="comment-author-${post.id}" class="comment-input" placeholder="اسمك...">
                <input type="text" id="comment-content-${post.id}" class="comment-input" placeholder="اكتب تعليقك...">
                <button class="comment-submit-btn" onclick="addComment(${post.id})">نشر</button>
            </div>
        </div>
    `;
    return postDiv;
}

function createCommentElement(comment) {
const commentDate = new Date(comment.created_at).toLocaleTimeString('ar-EG', { hour: 'numeric', minute: '2-digit' });
    return `
        <div class="comment-item">
            <div class="comment-header">
                <span class="comment-author">${comment.author}</span>
                <span class="comment-date">${commentDate}</span>
            </div>
            <p class="comment-content">${comment.content}</p>
        </div>
    `;
}

function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-section-${postId}`);
    commentsSection.classList.toggle('active');
}

async function addComment(postId) {
    const authorInput = document.getElementById(`comment-author-${postId}`);
    const contentInput = document.getElementById(`comment-content-${postId}`);
    
    const author = authorInput.value.trim();
    const content = contentInput.value.trim();

    if (!author || !content) {
        alert('يرجى إدخال اسمك ومحتوى التعليق.');
        return;
    }

    const { data, error } = await supabase
        .from('comments')
        .insert([{ post_id: postId, author: author, content: content }])
        .select();

    if (error) {
        console.error('Error adding comment:', error);
        alert('حدث خطأ أثناء إضافة التعليق.');
    } else {
        const newComment = data[0];
        const commentsList = document.getElementById(`comments-list-${postId}`);
        
        const noCommentsMsg = commentsList.querySelector('.no-comments');
        if (noCommentsMsg) noCommentsMsg.remove();

        commentsList.innerHTML += createCommentElement(newComment);
        
        authorInput.value = '';
        contentInput.value = '';

        const toggleButton = document.querySelector(`#postsList [data-post-id='${postId}'] .comment-toggle-btn span`);
        const currentCount = parseInt(toggleButton.textContent.match(/\d+/)[0]);
        toggleButton.textContent = `التعليقات (${currentCount + 1})`;
    }
}

// ========================================================
// --- ربط الأحداث التي لا تحتاج إلى onclick ---
// ========================================================

// ========================================================
// --- ربط الأحداث التي لا تحتاج إلى onclick ---
// ========================================================

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. تحميل المنشورات مع الفلتر الافتراضي (الأحدث) عند فتح الصفحة ---
    loadPosts('latest');

    // --- 2. ربط زر الفلترة بدالة loadPosts ---
    const postsFilter = document.getElementById('postsFilter');
    if (postsFilter) {
        postsFilter.addEventListener('change', (e) => {
            loadPosts(e.target.value);
        });
    }

    // --- 3. بقية الدوال الخاصة بك كما هي دون تغيير ---
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

    document.getElementById('addPostForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const postData = {
            author: document.getElementById('postAuthor').value,
            title: document.getElementById('postTitle').value,
            content: document.getElementById('postContent').value
        };
        const { error } = await supabase.from('posts').insert([postData]);
        if (error) {
            alert('حدث خطأ أثناء النشر.');
        } else {
            document.getElementById('postSuccess').style.display = 'block';
            e.target.reset();
            // تحديث القائمة لعرض المنشور الجديد فورًا
            loadPosts(document.getElementById('postsFilter').value); 
            setTimeout(() => {
                closeModal('addPostModal');
                document.getElementById('postSuccess').style.display = 'none';
            }, 2000);
        }
    });
});


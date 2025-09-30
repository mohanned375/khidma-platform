// ==================================================================
//  ملف script.js - النسخة النهائية والمُجمعة
// ==================================================================

// --- 1. تهيئة Supabase (دائمًا في الأعلى) ---
const supabaseUrl = 'https://lzrzyjkzutlpwlxfnpxe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6cnp5amt6dXRscHdseGZucHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5NTg2MDEsImV4cCI6MjA3NDUzNDYwMX0.3X9SVBgVSdaceVcTEIMPHznIHVqNfTk4yJRrBhtzKVo';
// *** الإصلاح الأول: يجب استخدام supabase.createClient ***
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);


// ==================================================================
// --- 2. تعريف الدوال العامة التي يتم استدعاؤها من HTML (onclick) ---
// ==================================================================

/**
 * تبديل عرض القائمة المنسدلة على الهواتف.
 */
function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.classList.toggle('active');
    } else {
        console.error("Error: Element with id 'navMenu' not found.");
    }
}

/**
 * تفتح أي نافذة منبثقة (modal) بناءً على الـ id الخاص بها.
 * @param {string} modalId - الـ id الخاص بالنافذة المطلوب فتحها.
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex'; // استخدام flex لتوسيط المحتوى
    } else {
        console.error("Error: Modal with id '" + modalId + "' not found.");
    }
}

/**
 * تغلق أي نافذة منبثقة (modal) بناءً على الـ id الخاص بها.
 * @param {string} modalId - الـ id الخاص بالنافذة المطلوب إغلاقها.
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    } else {
        console.error("Error: Modal with id '" + modalId + "' not found.");
    }
}

// --- دوال مساعدة لفتح نوافذ معينة ---
function openRegisterModal() {
    openModal('registerModal');

    // --- هذا هو السطر الجديد الذي سيحل المشكلة ---
    // ابحث عن زر التسجيل وأعده إلى حالته الأصلية
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const submitButton = registerForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.innerHTML = '<i class="fas fa-user-plus"></i> <span>تسجيل مقدم خدمة</span>'; // أعد النص والأيقونة
        }
        registerForm.reset(); // قم بإفراغ الحقول أيضًا
    }
}


function openSearchModal() {
    openModal('searchModal');
}


// ==================================================================
// --- 3. الكود الذي يعمل بعد تحميل الصفحة بالكامل (مستمع واحد فقط) ---
// ==================================================================
document.addEventListener('DOMContentLoaded', function() {

    // --- الربط مع نموذج التسجيل ---
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const submitButton = registerForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = 'جاري التسجيل...';

            const registerSuccessAlert = document.getElementById('registerSuccess');
            const registerErrorAlert = document.getElementById('registerError');
            registerSuccessAlert.style.display = 'none';
            registerErrorAlert.style.display = 'none';

            const serviceSelect = document.getElementById('providerService');
            const serviceValue = serviceSelect.value === 'أخرى' ? document.getElementById('otherService').value : serviceSelect.value;

            const countryCode = document.getElementById(\'countryCode\').value;
            const phoneNumber = document.getElementById(\'providerPhone\').value;
            const fullPhoneNumber = countryCode + phoneNumber; // دمج مفتاح الدولة مع رقم الهاتف

            const providerData = {
                name: document.getElementById(\'providerName\').value,
                phone: fullPhoneNumber, // استخدام الرقم الكامل هنا
                service: serviceValue,
                city: document.getElementById(\'providerCity\').value,
                description: document.getElementById(\'providerDescription\').value,
                years_experience: document.getElementById(\'providerExperience\').value,
                is_approved: false
            };

            const { data, error } = await supabase
                .from('providers')
                .insert([providerData]);

            if (error) {
                console.error('Supabase error:', error.message);
                registerErrorAlert.textContent = 'حدث خطأ أثناء التسجيل: ' + error.message;
                registerErrorAlert.style.display = 'block';
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
            } else {
                console.log('Supabase success:', data);
                registerSuccessAlert.style.display = 'block';
                registerForm.reset();
                setTimeout(() => {
                    closeModal('registerModal');
                    registerSuccessAlert.style.display = 'none';
                }, 3000);
                // لا تقم بتعطيل الزر هنا، سيتم إعادة تعيينه عند فتح النموذج مرة أخرى
            }
        });
    }

    // --- الربط مع حقل "خدمة أخرى" في نموذج التسجيل ---
    const providerServiceSelect = document.getElementById('providerService');
    const otherServiceGroup = document.getElementById('otherServiceGroup');
    if (providerServiceSelect && otherServiceGroup) {
        providerServiceSelect.addEventListener('change', function() {
            otherServiceGroup.style.display = (this.value === 'أخرى') ? 'block' : 'none';
        });
    }

    // --- الربط مع عناصر HTML الخاصة بالبحث ---
    const mainSearchInput = document.getElementById('mainSearch');
    const mainSearchButton = document.querySelector('.search-container .search-btn');
    const advancedSearchForm = document.getElementById('advancedSearchForm');
    const otherServiceSearchForm = document.getElementById('otherServiceSearchForm');

    if (mainSearchButton && mainSearchInput) {
        mainSearchButton.addEventListener('click', () => performSearch(mainSearchInput.value));
    }
    if (advancedSearchForm) {
        advancedSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const filters = {
                service: document.getElementById('searchService').value,
                city: document.getElementById('searchCity').value.trim()
            };
            searchProviders(filters);
            closeModal('searchModal');
        });
    }
    if (otherServiceSearchForm) {
        otherServiceSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const filters = {
                keyword: document.getElementById('customService').value.trim(),
                city: document.getElementById('customCity').value.trim()
            };
            searchProviders(filters);
            closeModal('otherServiceModal');
        });
    }

}); // --- *** نهاية document.addEventListener الوحيد *** ---


// ==================================================================
// --- 4. وظائف البحث (تبقى خارج addEventListener) ---
// ==================================================================

function performSearch(query) {
    if (query && query.trim()) {
        searchProviders({ keyword: query.trim() });
    }
}

function searchByCategory(category) {
    searchProviders({ service: category });
}

async function searchProviders(filters) {
    const searchResultsSection = document.getElementById('searchResults');
    const providersList = document.getElementById('providersList');
    const loadingIndicator = document.getElementById('loading');

    if (!searchResultsSection || !providersList || !loadingIndicator) {
        console.error("خطأ: عناصر عرض نتائج البحث غير موجودة.");
        return;
    }

    searchResultsSection.style.display = 'block';
    loadingIndicator.style.display = 'block';
    providersList.innerHTML = '';
    window.scrollTo({ top: searchResultsSection.offsetTop, behavior: 'smooth' });

    let query = supabase
        .from('providers')
        .select('*')
        .eq('is_approved', true);

    if (filters.service) {
        query = query.eq('service', filters.service);
    }
    if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
    }
    if (filters.keyword) {
        query = query.or(`name.ilike.%${filters.keyword}%,description.ilike.%${filters.keyword}%,service.ilike.%${filters.keyword}%`);
    }

    const { data, error } = await query;

    loadingIndicator.style.display = 'none';

    if (error) {
        console.error('Supabase search error:', error.message);
        providersList.innerHTML = '<p class="error-message">حدث خطأ أثناء البحث.</p>';
    } else {
        displayResults(data); // استدعاء دالة العرض
    }
}

function displayResults(results) {
    const providersList = document.getElementById('providersList');
    if (!providersList) {
        console.error("Element with id 'providersList' not found.");
        return;
    }

    if (!results || results.length === 0) {
        providersList.innerHTML = '<p>لا توجد نتائج تطابق بحثك.</p>';
        return;
    }

    let content = '';
    results.forEach(provider => {
        content += `
            <div class="provider-card">
                <h3>${provider.name}</h3>
                <p><strong>الخدمة:</strong> ${provider.service}</p>
                <p><strong>المدينة:</strong> ${provider.city}</p>
                ${provider.years_experience ? `<p><strong>الخبرة:</strong> ${provider.years_experience} سنوات</p>` : ''}
                ${provider.description ? `<p>${provider.description}</p>` : ''}
                <div class="provider-contact">
                    <a href="tel:${provider.phone}" class="btn btn-primary"><i class="fas fa-phone"></i> اتصال</a>
                    <a href="https://wa.me/${provider.phone}" target="_blank" class="btn btn-secondary"><i class="fab fa-whatsapp"></i> واتساب</a>               </div>
            </div>
        `;
    });
    providersList.innerHTML = content;
}



// ===============================
// وظائف إدارة المنشورات
// ===============================

// فتح نموذج إضافة منشور
function openAddPostModal() {
    document.getElementById('addPostModal').style.display = 'block';
}

// تحميل المنشورات من قاعدة البيانات
async function loadPosts() {
    try {
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
            console.error('خطأ في تحميل المنشورات:', error);
            return;
        }

        displayPosts(posts || []);
    } catch (error) {
        console.error('خطأ في الاتصال بقاعدة البيانات:', error);
    }
}

// عرض المنشورات في الواجهة
function displayPosts(posts) {
    const postsList = document.getElementById('postsList');
    const noPostsMessage = document.getElementById('noPostsMessage');

    if (!posts || posts.length === 0) {
        noPostsMessage.style.display = 'block';
        postsList.innerHTML = '';
        postsList.appendChild(noPostsMessage);
        return;
    }

    noPostsMessage.style.display = 'none';
    postsList.innerHTML = '';

    posts.forEach(post => {
        const postElement = createPostElement(post);
        postsList.appendChild(postElement);
    });
}

// إنشاء عنصر منشور
function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post-item';
    postDiv.setAttribute('data-post-id', post.id);

    const postDate = new Date(post.created_at).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const commentsCount = post.comments ? post.comments.length : 0;

    postDiv.innerHTML = `
        <div class="post-header">
            <div class="post-author">${post.author}</div>
            <div class="post-date">${postDate}</div>
        </div>
        <div class="post-title">${post.title}</div>
        <div class="post-content">${post.content}</div>
        <div class="post-actions">
            <button class="post-action-btn" onclick="toggleComments(${post.id})">
                <i class="fas fa-comments"></i>
                <span>التعليقات (${commentsCount})</span>
            </button>
        </div>
        <div class="comments-section" id="comments-${post.id}">
            <div class="comments-list" id="comments-list-${post.id}">
                ${post.comments ? post.comments.map(comment => createCommentHTML(comment)).join('') : ''}
            </div>
            <div class="add-comment-form">
                <input type="text" class="comment-input" placeholder="اكتب تعليقك هنا..." id="comment-input-${post.id}">
                <button class="comment-submit-btn" onclick="addComment(${post.id})">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    `;

    return postDiv;
}

// إنشاء HTML للتعليق
function createCommentHTML(comment) {
    const commentDate = new Date(comment.created_at).toLocaleDateString('ar-SA', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    return `
        <div class="comment-item">
            <div class="comment-author">${comment.author}</div>
            <div class="comment-content">${comment.content}</div>
            <div class="comment-date">${commentDate}</div>
        </div>
    `;
}

// تبديل عرض التعليقات
function toggleComments(postId) {
    const commentsSection = document.getElementById(`comments-${postId}`);
    commentsSection.classList.toggle('show');
}

// إضافة تعليق جديد
async function addComment(postId) {
    const commentInput = document.getElementById(`comment-input-${postId}`);
    const content = commentInput.value.trim();

    if (!content) {
        alert('يرجى كتابة تعليق قبل الإرسال');
        return;
    }

    // طلب اسم المعلق
    const author = prompt('أدخل اسمك:');
    if (!author || !author.trim()) {
        alert('يرجى إدخال اسمك');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('comments')
            .insert([
                {
                    post_id: postId,
                    content: content,
                    author: author.trim(),
                    created_at: new Date().toISOString()
                }
            ])
            .select();

        if (error) {
            console.error('خطأ في إضافة التعليق:', error);
            alert('حدث خطأ أثناء إضافة التعليق');
            return;
        }

        // إضافة التعليق إلى الواجهة
        const commentsList = document.getElementById(`comments-list-${postId}`);
        const newCommentHTML = createCommentHTML(data[0]);
        commentsList.insertAdjacentHTML('beforeend', newCommentHTML);

        // تحديث عدد التعليقات
        const commentsButton = document.querySelector(`[onclick="toggleComments(${postId})"] span`);
        const currentCount = parseInt(commentsButton.textContent.match(/\d+/)[0]);
        commentsButton.textContent = `التعليقات (${currentCount + 1})`;

        // مسح حقل الإدخال
        commentInput.value = '';

        // عرض التعليقات إذا كانت مخفية
        const commentsSection = document.getElementById(`comments-${postId}`);
        if (!commentsSection.classList.contains('show')) {
            commentsSection.classList.add('show');
        }

    } catch (error) {
        console.error('خطأ في الاتصال بقاعدة البيانات:', error);
        alert('حدث خطأ في الاتصال بقاعدة البيانات');
    }
}

// معالج إرسال نموذج إضافة منشور
document.addEventListener('DOMContentLoaded', function() {
    const addPostForm = document.getElementById('addPostForm');
    if (addPostForm) {
        addPostForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const author = document.getElementById('postAuthor').value.trim();
            const title = document.getElementById('postTitle').value.trim();
            const content = document.getElementById('postContent').value.trim();

            if (!author || !title || !content) {
                alert('يرجى ملء جميع الحقول');
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('posts')
                    .insert([
                        {
                            author: author,
                            title: title,
                            content: content,
                            created_at: new Date().toISOString()
                        }
                    ])
                    .select();

                if (error) {
                    console.error('خطأ في إضافة المنشور:', error);
                    document.getElementById('postError').style.display = 'block';
                    document.getElementById('postSuccess').style.display = 'none';
                    return;
                }

                // عرض رسالة النجاح
                document.getElementById('postSuccess').style.display = 'block';
                document.getElementById('postError').style.display = 'none';

                // مسح النموذج
                addPostForm.reset();

                // إغلاق النموذج بعد ثانيتين
                setTimeout(() => {
                    closeModal('addPostModal');
                    document.getElementById('postSuccess').style.display = 'none';
                }, 2000);

                // إعادة تحميل المنشورات
                loadPosts();

            } catch (error) {
                console.error('خطأ في الاتصال بقاعدة البيانات:', error);
                document.getElementById('postError').style.display = 'block';
                document.getElementById('postSuccess').style.display = 'none';
            }
        });
    }

    // تحميل المنشورات عند تحميل الصفحة
    loadPosts();
});

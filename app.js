// Firebase Configuration
const firebaseConfig = {
    // Replace with your Firebase config
    apiKey: "your-api-key",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "your-app-id"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Global variables
let currentProviders = [];
let isAdminLoggedIn = false;

// Navigation functions
function showSection(sectionName) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.classList.add('fade-in');
    }
    
    // Close mobile menu if open
    closeMobileMenu();
    
    // Load data based on section
    if (sectionName === 'services') {
        loadAllProviders();
    } else if (sectionName === 'admin' && isAdminLoggedIn) {
        loadProviders();
    }
}

function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('active');
}

function closeMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.remove('active');
}

// Service provider registration
document.getElementById('serviceProviderForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('providerName').value,
        phone: document.getElementById('providerPhone').value,
        email: document.getElementById('providerEmail').value,
        service: document.getElementById('providerService').value,
        customService: document.getElementById('customService').value,
        location: document.getElementById('providerLocation').value,
        experience: parseInt(document.getElementById('providerExperience').value) || 0,
        description: document.getElementById('providerDescription').value,
        registrationDate: new Date().toISOString(),
        approved: true // Auto-approve for now
    };
    
    try {
        // Add to Firestore
        await db.collection('serviceProviders').add(formData);
        
        showNotification('تم التسجيل بنجاح! سيتم مراجعة بياناتك قريباً.', 'success');
        document.getElementById('serviceProviderForm').reset();
        
        // Show services section after successful registration
        setTimeout(() => {
            showSection('services');
        }, 2000);
        
    } catch (error) {
        console.error('Error adding document: ', error);
        showNotification('حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.', 'error');
    }
});

// Show/hide custom service field
document.getElementById('providerService').addEventListener('change', function() {
    const customServiceField = document.getElementById('customService').parentElement;
    if (this.value === 'other') {
        customServiceField.style.display = 'block';
        document.getElementById('customService').required = true;
    } else {
        customServiceField.style.display = 'none';
        document.getElementById('customService').required = false;
    }
});

// Search functionality
function searchServices() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const serviceCategories = document.querySelectorAll('.service-category');
    
    serviceCategories.forEach(category => {
        const categoryName = category.querySelector('h3').textContent.toLowerCase();
        const categoryDescription = category.querySelector('p').textContent.toLowerCase();
        
        if (categoryName.includes(searchTerm) || categoryDescription.includes(searchTerm)) {
            category.style.display = 'block';
            category.classList.add('fade-in');
        } else {
            category.style.display = 'none';
        }
    });
    
    // Also search in current providers
    if (currentProviders.length > 0) {
        const filteredProviders = currentProviders.filter(provider => 
            provider.name.toLowerCase().includes(searchTerm) ||
            provider.service.toLowerCase().includes(searchTerm) ||
            (provider.customService && provider.customService.toLowerCase().includes(searchTerm)) ||
            provider.location.toLowerCase().includes(searchTerm)
        );
        displayProviders(filteredProviders, 'نتائج البحث');
    }
}

// Load all providers for search
async function loadAllProviders() {
    try {
        const querySnapshot = await db.collection('serviceProviders')
            .where('approved', '==', true)
            .get();
        
        currentProviders = [];
        querySnapshot.forEach((doc) => {
            currentProviders.push({
                id: doc.id,
                ...doc.data()
            });
        });
    } catch (error) {
        console.error('Error loading providers: ', error);
    }
}

// Show service providers by category
async function showServiceProviders(category) {
    try {
        let query = db.collection('serviceProviders').where('approved', '==', true);
        
        if (category !== 'all') {
            query = query.where('service', '==', category);
        }
        
        const querySnapshot = await query.get();
        const providers = [];
        
        querySnapshot.forEach((doc) => {
            providers.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        const categoryNames = {
            'electricity': 'الكهرباء',
            'plumbing': 'السباكة',
            'mechanics': 'الميكانيكا',
            'carpentry': 'النجارة',
            'crafts': 'الأعمال الحرفية',
            'other': 'خدمات أخرى'
        };
        
        const title = categoryNames[category] || 'جميع الخدمات';
        displayProviders(providers, `مقدمو خدمة ${title}`);
        
    } catch (error) {
        console.error('Error loading providers: ', error);
        showNotification('حدث خطأ في تحميل البيانات', 'error');
    }
}

// Display providers
function displayProviders(providers, title) {
    const providersSection = document.getElementById('providersSection');
    const providersTitle = document.getElementById('providersTitle');
    const providersList = document.getElementById('providersList');
    
    providersTitle.textContent = title;
    providersList.innerHTML = '';
    
    if (providers.length === 0) {
        providersList.innerHTML = '<p style="text-align: center; color: #666;">لا توجد خدمات متاحة في هذه الفئة حالياً</p>';
    } else {
        providers.forEach(provider => {
            const providerCard = createProviderCard(provider, false);
            providersList.appendChild(providerCard);
        });
    }
    
    providersSection.style.display = 'block';
    providersSection.scrollIntoView({ behavior: 'smooth' });
}

// Create provider card
function createProviderCard(provider, isAdmin = false) {
    const card = document.createElement('div');
    card.className = isAdmin ? 'admin-provider-card' : 'provider-card';
    
    const serviceDisplay = provider.service === 'other' && provider.customService 
        ? provider.customService 
        : getServiceName(provider.service);
    
    const registrationDate = provider.registrationDate 
        ? new Date(provider.registrationDate).toLocaleDateString('ar-SA')
        : 'غير محدد';
    
    if (isAdmin) {
        card.innerHTML = `
            <div class="admin-provider-info">
                <h4>${provider.name}</h4>
                <p class="provider-info"><strong>الخدمة:</strong> ${serviceDisplay}</p>
                <p class="provider-info"><strong>الهاتف:</strong> ${provider.phone}</p>
                <p class="provider-info"><strong>المنطقة:</strong> ${provider.location}</p>
                <p class="provider-info"><strong>تاريخ التسجيل:</strong> ${registrationDate}</p>
                <p class="provider-info"><strong>الحالة:</strong> ${provider.approved ? 'مفعل' : 'في انتظار المراجعة'}</p>
            </div>
            <div class="admin-provider-actions">
                <button class="edit-btn" onclick="editProvider('${provider.id}')">تعديل</button>
                <button class="delete-btn" onclick="deleteProvider('${provider.id}')">حذف</button>
                <button class="${provider.approved ? 'delete-btn' : 'edit-btn'}" onclick="toggleProviderStatus('${provider.id}', ${!provider.approved})">
                    ${provider.approved ? 'إلغاء تفعيل' : 'تفعيل'}
                </button>
            </div>
        `;
    } else {
        card.innerHTML = `
            <h4>${provider.name}</h4>
            <p class="provider-info"><strong>الخدمة:</strong> ${serviceDisplay}</p>
            <p class="provider-info"><strong>المنطقة:</strong> ${provider.location}</p>
            <p class="provider-info"><strong>سنوات الخبرة:</strong> ${provider.experience} سنة</p>
            ${provider.description ? `<p class="provider-info"><strong>الوصف:</strong> ${provider.description}</p>` : ''}
            <div class="provider-actions">
                <a href="tel:${provider.phone}" class="call-btn">اتصال ${provider.phone}</a>
                ${provider.email ? `<button class="contact-btn" onclick="contactProvider('${provider.email}')">مراسلة</button>` : ''}
            </div>
        `;
    }
    
    return card;
}

// Get service name in Arabic
function getServiceName(service) {
    const serviceNames = {
        'electricity': 'الكهرباء',
        'plumbing': 'السباكة',
        'mechanics': 'الميكانيكا',
        'carpentry': 'النجارة',
        'crafts': 'الأعمال الحرفية',
        'other': 'خدمات أخرى'
    };
    return serviceNames[service] || service;
}

// Contact provider
function contactProvider(email) {
    window.open(`mailto:${email}?subject=استفسار عن خدماتكم&body=مرحباً، أود الاستفسار عن خدماتكم.`);
}

// Hide providers section
function hideProviders() {
    document.getElementById('providersSection').style.display = 'none';
}

// Admin functions
function adminLogin() {
    const password = document.getElementById('adminPassword').value;
    const correctPassword = 'admin123'; // Change this to a secure password
    
    if (password === correctPassword) {
        isAdminLoggedIn = true;
        document.getElementById('adminLogin').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        loadProviders();
        showNotification('تم تسجيل الدخول بنجاح', 'success');
    } else {
        showNotification('كلمة المرور غير صحيحة', 'error');
    }
}

function adminLogout() {
    isAdminLoggedIn = false;
    document.getElementById('adminLogin').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
    document.getElementById('adminPassword').value = '';
    showNotification('تم تسجيل الخروج', 'success');
}

// Load providers for admin
async function loadProviders() {
    if (!isAdminLoggedIn) return;
    
    try {
        const querySnapshot = await db.collection('serviceProviders').get();
        const providers = [];
        
        querySnapshot.forEach((doc) => {
            providers.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Update stats
        const today = new Date().toDateString();
        const newToday = providers.filter(p => 
            p.registrationDate && new Date(p.registrationDate).toDateString() === today
        ).length;
        
        document.getElementById('totalProviders').textContent = providers.length;
        document.getElementById('newProvidersToday').textContent = newToday;
        
        // Display providers
        const adminProviders = document.getElementById('adminProviders');
        adminProviders.innerHTML = '<h3>قائمة مقدمي الخدمات</h3>';
        
        if (providers.length === 0) {
            adminProviders.innerHTML += '<p>لا توجد مقدمي خدمات مسجلين حتى الآن</p>';
        } else {
            providers.forEach(provider => {
                const providerCard = createProviderCard(provider, true);
                adminProviders.appendChild(providerCard);
            });
        }
        
    } catch (error) {
        console.error('Error loading providers: ', error);
        showNotification('حدث خطأ في تحميل البيانات', 'error');
    }
}

// Toggle provider status
async function toggleProviderStatus(providerId, newStatus) {
    try {
        await db.collection('serviceProviders').doc(providerId).update({
            approved: newStatus
        });
        
        showNotification(`تم ${newStatus ? 'تفعيل' : 'إلغاء تفعيل'} مقدم الخدمة`, 'success');
        loadProviders(); // Reload the list
        
    } catch (error) {
        console.error('Error updating provider: ', error);
        showNotification('حدث خطأ في التحديث', 'error');
    }
}

// Delete provider
async function deleteProvider(providerId) {
    if (confirm('هل أنت متأكد من حذف هذا المقدم؟')) {
        try {
            await db.collection('serviceProviders').doc(providerId).delete();
            showNotification('تم حذف مقدم الخدمة', 'success');
            loadProviders(); // Reload the list
            
        } catch (error) {
            console.error('Error deleting provider: ', error);
            showNotification('حدث خطأ في الحذف', 'error');
        }
    }
}

// Edit provider (placeholder function)
function editProvider(providerId) {
    showNotification('ميزة التعديل قيد التطوير', 'info');
}

// Export data
async function exportData() {
    try {
        const querySnapshot = await db.collection('serviceProviders').get();
        const providers = [];
        
        querySnapshot.forEach((doc) => {
            providers.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        const dataStr = JSON.stringify(providers, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `service_providers_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        showNotification('تم تصدير البيانات بنجاح', 'success');
        
    } catch (error) {
        console.error('Error exporting data: ', error);
        showNotification('حدث خطأ في تصدير البيانات', 'error');
    }
}

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Show home section by default
    showSection('home');
    
    // Load all providers for search functionality
    loadAllProviders();
    
    // Add event listeners
    document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchServices();
        }
    });
    
    // Handle service selection change
    const serviceSelect = document.getElementById('providerService');
    if (serviceSelect) {
        serviceSelect.dispatchEvent(new Event('change'));
    }
});

// Handle online/offline status
window.addEventListener('online', function() {
    showNotification('تم استعادة الاتصال بالإنترنت', 'success');
});

window.addEventListener('offline', function() {
    showNotification('لا يوجد اتصال بالإنترنت', 'error');
});

// Handle form validation
function validateForm(form) {
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            field.style.borderColor = '#f44336';
            isValid = false;
        } else {
            field.style.borderColor = '#ddd';
        }
    });
    
    return isValid;
}

// Phone number validation
function validatePhoneNumber(phone) {
    const phoneRegex = /^(\+966|0)?[5][0-9]{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Email validation
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// اسم ذاكرة التخزين المؤقت (Cache)
const CACHE_NAME = 'khidma-platform-cache-v1';

// قائمة الملفات الأساسية التي سيتم تخزينها مؤقتًا
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/privacy.html',
  'https://mohanned375.github.io/khidma-platform/images/icon-192x192.png', // أيقونة 192
  'https://mohanned375.github.io/khidma-platform/images/icon-512x512',// أيقونة 512
];

// 1. حدث التثبيت (Install): يتم فيه تخزين الملفات الأساسية
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. حدث الجلب (Fetch): يتم فيه اعتراض طلبات الشبكة
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إذا وجدنا نسخة مخزنة مؤقتًا، نرجعها مباشرة
        if (response) {
          return response;
        }
        // إذا لم نجد، نذهب إلى الشبكة لجلبها
        return fetch(event.request);
      })
  );
});

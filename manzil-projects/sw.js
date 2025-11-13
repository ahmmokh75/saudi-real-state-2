// Service Worker للتحديث التلقائي
const CACHE_NAME = 'manzil-projects-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/manifest.json'
];

// التثبيت
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// التنشيط
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Removing Old Cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// الاستجابة للطلبات
self.addEventListener('fetch', event => {
  // تجاهل طلبات chrome-extension
  if (event.request.url.includes('chrome-extension')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إرجاع الملف المخبأ إذا وجد، أو جلب من الشبكة
        if (response) {
          return response;
        }
        
        return fetch(event.request).then(fetchResponse => {
          // لا تخبأ إذا لم تكن استجابة ناجحة
          if (!fetchResponse || fetchResponse.status !== 200) {
            return fetchResponse;
          }
          
          // تخبأ الملفات الجديدة
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
            
          return fetchResponse;
        });
      }).catch(() => {
        // العودة للصفحة الرئيسية إذا فشل كل شيء
        if (event.request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// الاستماع للتحديثات من الصفحة
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
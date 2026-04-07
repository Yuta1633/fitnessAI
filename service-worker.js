const CACHE_NAME = 'fitai-v50';
const PRECACHE_URLS = [
  '/',
  '/prompts.js',
  '/nutrition-db.js'
];

// インストール時にキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// 古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// フェッチ戦略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 外部オリジン（Supabase・CDN等）は常にネットワーク直通
  if (url.origin !== self.location.origin) {
    return; // service worker を素通りさせる
  }

  // /api/ はネットワーク優先
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(JSON.stringify({ error: 'オフラインです' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // 認証・設定ファイルは常にネットワーク優先（キャッシュしない）
  if (['/supabase.js', '/script.js', '/index.html'].some(p => url.pathname === p)) {
    event.respondWith(fetch(request));
    return;
  }

  // 静的アセットはキャッシュ優先
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) {
        // バックグラウンドで更新
        fetch(request).then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME).then(cache => cache.put(request, response));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(request).then(response => {
        if (response.ok && request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

// プッシュ通知の受信
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'フィットネスAIコーチ';
  const options = {
    body: data.body || '今日もトレーニングの時間です',
    icon: '/manifest.json',
    badge: '/manifest.json',
    vibrate: [100, 50, 100]
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// 通知クリック
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow('/'));
});

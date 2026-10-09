// 주식 각도기: 오프라인 지원. 화면(index.html, 리포트판 reports/)과 자료 파일(*.json)은 늘 새로 받아 보고, 안 되면 마지막에 받은 것을 보여 준다.
// v3(10-14): 리포트판이 생겨 '/'로 끝나는 주소를 모두 index.html 하나로 저장하던 것을 주소(경로)마다 따로 저장한다.
// v4(10-17): 앱 이름을 '주식 각도기'(띄어쓰기)로 바꿔, 저장해 둔 manifest를 새로 받게 한다.
const CACHE = 'stock-gakdogi-v4';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isPage = req.mode === 'navigate' || req.url.endsWith('/') || req.url.endsWith('index.html') || /\.json(\?|$)/.test(req.url);
  if (isPage) {
    // 화면은 새것 먼저 (매일 갱신되므로). 저장 이름은 물음표 뒤를 뺀 경로, '/'로 끝나면 그 폴더의 index.html
    let key = new URL(req.url).pathname;
    if (key.endsWith('/')) key += 'index.html';
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
      return res;
    }).catch(() => caches.match(key)));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});

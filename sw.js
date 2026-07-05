const CACHE = 'retirement-planner-v3.1.0';
const ASSETS = [
  './', './index.html', './src/app.js', './src/styles.css', './public/manifest.json',
  './data/assumptions.json', './data/loans.json', './data/portfolio.json', './data/scenarios.json',
  './src/engines/loanEngine.js', './src/engines/portfolioEngine.js', './src/engines/withdrawalEngine.js',
  './src/engines/simulationEngine.js', './src/engines/optimizer.js', './src/components/chart.js',
  './src/utils/format.js', './src/utils/storage.js'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});

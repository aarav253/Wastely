// Minimal service worker so Wastely is installable as a PWA.
// Hand-written instead of vite-plugin-pwa, whose generateSW step was failing
// on Vercel's build machine. It deliberately caches nothing.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  // Leave API calls, non-GET requests, and other origins (Supabase, fonts)
  // entirely to the browser -- classification results must never be cached.
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }
  // Same-origin page/asset loads: straight network passthrough, no caching.
  event.respondWith(fetch(event.request));
});

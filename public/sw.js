// Obra Clara service worker.
//
// - Offline: precaches the whole built app (list injected at build time by
//   scripts/build-sw.mjs) and serves it when there is no signal. The data
//   itself is kept by the page (localStorage + outbox), never by this worker.
// - Push: shows the daily reminder and opens the app when it is tapped.
//
// In `pnpm dev` the placeholders below are not replaced, so nothing is cached
// and hot reload keeps working.

const BUILD_ID = "__BUILD_ID__";
const PRECACHE = self.__PRECACHE || [];
const DEV = BUILD_ID.startsWith("__");
const SHELL_CACHE = `obra-clara-shell-${BUILD_ID}`;
const FONT_CACHE = "obra-clara-fonts";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      if (!DEV) {
        const cache = await caches.open(SHELL_CACHE);
        await cache.addAll(PRECACHE);
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("obra-clara-shell-") && k !== SHELL_CACHE)
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET" || DEV) return;
  const url = new URL(request.url);

  // Google Fonts: cache-first, they never change for a given URL.
  if (
    url.hostname === "fonts.googleapis.com" ||
    url.hostname === "fonts.gstatic.com"
  ) {
    event.respondWith(cacheFirst(FONT_CACHE, request));
    return;
  }

  if (url.origin !== self.location.origin) return;
  // Data goes through the page's own offline layer.
  if (url.pathname.startsWith("/api/")) return;

  // Page loads: try the network (fresh deploys), fall back to the cached app.
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(SHELL_CACHE);
          return (
            (await cache.match("/index.html")) ||
            (await cache.match("/")) ||
            Response.error()
          );
        }
      })(),
    );
    return;
  }

  // Hashed assets and icons: cache-first.
  event.respondWith(cacheFirst(SHELL_CACHE, request));
});

async function cacheFirst(cacheName, request) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok || response.type === "opaque") {
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("push", (event) => {
  let data = {
    title: "Obra Clara",
    body: "Tienes tareas por revisar.",
    url: "/",
  };
  try {
    data = { ...data, ...event.data.json() };
  } catch {
    if (event.data) data.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag,
      data: { url: data.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/", self.location.origin)
    .href;
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if (client.url.startsWith(self.location.origin)) {
            client.navigate(url);
            return client.focus();
          }
        }
        return self.clients.openWindow(url);
      }),
  );
});

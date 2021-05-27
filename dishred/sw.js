// because of the security sandbox,
// this randomly has to be in the root folder
// instead of nicely organized in the js/ folder.
// whatever!

importScripts('js/cache-polyfill.js');

function tryCache(cache, prefix) {
  var ret = cache.addAll([
    prefix + "assets/josefin-latin.woff2",
    prefix + "assets/josefin-latin-ext.woff2",
    prefix + "assets/josefin-vietnamese.woff2",
    prefix + "",
    prefix + "index.html",
    prefix + "assets/google-10000-english-no-swears.txt",
    prefix + "assets/icon-192x192.png",
    prefix + "assets/icon-256x256.png",
    prefix + "assets/icon-384x384.png",
    prefix + "assets/icon-512x512.png",
    prefix + "js/utils.js?cb=1z2gs2032",
    prefix + "js/main.js?cb=33z6sn3z46",
  ])
    .then(() => console.log("Strategy with prefix " + prefix + " succeeded"))
    .catch(() => console.log("Strategy with prefix " + prefix + " failed."));
  return ret;
}

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("dishred").then((cache) => {
      // i can't believe there isn't a better way to do this.
      tryCache(cache, "bac3700/dishred/");
      tryCache(cache, "dishred/");
      tryCache(cache, "");
    })
  );
});

self.addEventListener('fetch', function(event) {
  console.log(event.request.url);
 
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );
 });
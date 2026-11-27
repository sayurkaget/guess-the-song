/* Permanently redirect legacy hosts and renamed mini-game slugs to their
   canonical tuneup.my.id URLs while leaving preview hosts untouched. */
const LEGACY_HOSTS = new Set(['tuneup.pages.dev', 'www.tuneup.my.id']);
const CANONICAL_HOST = 'tuneup.my.id';
const LEGACY_PATHS = Object.freeze({
  '/mv-spot': '/mv-frame',
  '/mv-spot/': '/mv-frame',
  '/hairspot': '/hair-peek',
  '/hairspot/': '/hair-peek'
});

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const hostChanged = LEGACY_HOSTS.has(url.hostname.toLowerCase());
  const mappedPath = LEGACY_PATHS[url.pathname.toLowerCase()];
  if (hostChanged || mappedPath) {
    if (hostChanged) {
      url.protocol = 'https:';
      url.hostname = CANONICAL_HOST;
    }
    if (mappedPath) url.pathname = mappedPath;
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}

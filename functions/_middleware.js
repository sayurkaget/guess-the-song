/* Permanently redirect the legacy Cloudflare Pages subdomain to the canonical
   custom domain while leaving preview deployments and tuneup.my.id untouched. */
const LEGACY_HOSTS = new Set(['tuneup.pages.dev', 'www.tuneup.my.id']);
const CANONICAL_HOST = 'tuneup.my.id';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (LEGACY_HOSTS.has(url.hostname.toLowerCase())) {
    url.protocol = 'https:';
    url.hostname = CANONICAL_HOST;
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}

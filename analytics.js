/* Owner analytics. Disabled until a real GA4 measurement ID is configured. */
(function () {
  'use strict';
  const id = document.querySelector('meta[name="ga-measurement-id"]')?.content.trim() || '';
  const enabled = /^G-[A-Z0-9]+$/.test(id) && location.hostname === 'namethetrack.netlify.app';
  const events = new Set(['game_start', 'custom_start', 'daily_complete', 'challenge_copy', 'result_copy']);
  window.PlayerAnalytics = {
    event(name, data = {}) {
      if (!enabled || !events.has(name)) return;
      // Explicit fields only: no guesses, search text, email or feedback content.
      const params = {};
      if (['daily', 'challenge', 'custom', 'regular'].includes(data.mode)) params.game_mode = data.mode;
      if (typeof data.won === 'boolean') params.result = data.won ? 'won' : 'lost';
      if (Number.isInteger(data.attempts) && data.attempts >= 1 && data.attempts <= 5) params.attempts = data.attempts;
      window.gtag('event', name, params);
    }
  };
  if (!enabled) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id, {
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    page_location: location.origin + location.pathname
  });
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id);
  document.head.appendChild(script);
})();

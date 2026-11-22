/* Feedback stays in the form until the server confirms receipt. */
(function () {
  'use strict';
  const $ = (sel) => document.querySelector(sel);
  const form = $('#feedbackForm');
  const fields = $('#feedbackFields');
  const message = $('#feedbackMessage');
  const status = $('#feedbackStatus');
  const button = $('#sendFeedback');
  const reason = $('#feedbackReason');
  const category = $('#feedbackCategory');
  const emailInput = $('#feedbackEmail');
  const catPills = $('#feedbackCategoryPills');
  const reasonPills = $('#feedbackReasonPills');
  const charCount = $('#feedbackCharCount');
  const songChip = $('#fbSongChip');
  const songChipText = $('#fbSongChipText');
  const emailToggle = $('#fbEmailToggle');
  const emailPanel = $('#fbEmailPanel');
  const reasons = { audio: 'Audio does not play', live: 'Live version', title: 'Wrong song title or artist', other: 'Other song issue' };
  const draftFields = ['feedbackMessage', 'feedbackDetails', 'feedbackEmail', 'feedbackCategory', 'feedbackReason'];
  const drafts = new Map();
  let draftKey = 'general', songReport = false;
  let sending = false;

  const tr = (k, fb) => {
    const I18N = window.TuneUpI18n;
    return (I18N && typeof I18N.t === 'function') ? I18N.t(k) : fb;
  };

  function syncCharCount() {
    if (!charCount) return;
    const max = (message && message.maxLength > 0) ? message.maxLength : 1000;
    const len = (message && typeof message.value === 'string') ? message.value.length : 0;
    charCount.textContent = len + ' / ' + max;
    if (charCount.classList) charCount.classList.toggle('is-near', len >= Math.floor(max * 0.9));
  }

  function syncPlaceholder() {
    if (!message || typeof message.placeholder === 'undefined') return;
    if (songReport) {
      message.placeholder = tr('fbReportPh', 'Optional notes about the audio or song info…');
      return;
    }
    const cat = (category && category.value) || 'bug';
    if (cat === 'song') message.placeholder = tr('fbSongPh', 'Drop the song title & artist you would love to see…');
    else if (cat === 'other') message.placeholder = tr('fbIdeaPh', 'Share a feature idea or anything we can make better…');
    else message.placeholder = tr('fbBugPh', 'What happened? Tell us what you were playing…');
  }

  function syncPills() {
    const cat = (category && category.value) || 'bug';
    if (catPills && typeof catPills.querySelectorAll === 'function') {
      for (const b of catPills.querySelectorAll('[data-cat]')) {
        const on = b.dataset.cat === cat;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    }
    const rVal = (reason && reason.value) || '';
    if (reasonPills && typeof reasonPills.querySelectorAll === 'function') {
      for (const b of reasonPills.querySelectorAll('[data-reason]')) {
        const on = b.dataset.reason === rVal;
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      }
    }
    syncPlaceholder();
  }

  function syncSongChip(details, report) {
    if (!songChip || !songChipText) return;
    if (!report) { songChip.hidden = true; songChipText.textContent = ''; return; }
    const m = String(details || '').match(/^Song:\s*(.+)$/m);
    const label = m ? m[1].trim() : String(details || '').split('\n')[0].trim();
    songChipText.textContent = label;
    songChip.hidden = !label;
  }

  function setEmailExpanded(open) {
    if (!emailPanel || !emailToggle) return;
    emailPanel.hidden = !open;
    if (typeof emailToggle.setAttribute === 'function') emailToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (emailToggle.classList) emailToggle.classList.toggle('is-open', !!open);
  }

  function show(details, report) {
    $('#feedbackModal').hidden = false;
    if (sending) return;
    const key = report ? 'song:' + details : 'general';
    if (key !== draftKey) {
      drafts.set(draftKey, draftFields.map((id) => $('#' + id).value));
      form.reset();
      const saved = drafts.get(key);
      if (saved) draftFields.forEach((id, i) => { $('#' + id).value = saved[i]; });
      else $('#feedbackDetails').value = details || '';
      draftKey = key;
    } else if (!message.value && !report) {
      $('#feedbackDetails').value = details || '';
    }
    songReport = report;
    $('#feedbackTitle').textContent = report ? tr('fbReportTitle', 'Report this song') : tr('feedbackTitle', 'Send feedback');
    $('#feedbackIntro').textContent = report
      ? tr('fbReportIntro', 'Pick what is wrong with this track. Recording details attach automatically.')
      : tr('feedbackIntro', 'Bugs, song requests, or ideas — we read every note.');
    $('#feedbackReasonField').hidden = !report;
    reason.disabled = !report;
    reason.required = report;
    $('#feedbackCategoryField').hidden = report;
    $('#feedbackMessageLabel').textContent = report ? tr('fbNotesOpt', 'Notes (optional)') : tr('fbMsgLbl', 'Message');
    message.required = !report;
    message.minLength = report ? 0 : 5;
    message.maxLength = 1000;
    message.setCustomValidity('');
    reason.setCustomValidity('');
    status.textContent = '';
    status.className = '';
    syncSongChip($('#feedbackDetails').value, report);
    setEmailExpanded(!!(emailInput && emailInput.value && emailInput.value.trim()));
    syncPills();
    syncCharCount();
    if (form.hasAttribute('data-netlify')) {
      status.textContent = tr('fbUnavailable', 'Feedback is temporarily unavailable. Please come back later.');
      status.className = 'feedback-error';
    }
    const focusTarget = report
      ? (reasonPills && typeof reasonPills.querySelector === 'function' ? reasonPills.querySelector('.fb-pill') : reason)
      : (catPills && typeof catPills.querySelector === 'function' ? message : category);
    if (focusTarget && typeof focusTarget.focus === 'function') focusTarget.focus();
  }

  window.PlayerFeedback = {
    open(details) { show(details, false); },
    openSong(details) { show(details, true); },
    syncLang() { syncPills(); syncCharCount(); }
  };

  if (catPills && typeof catPills.addEventListener === 'function') {
    catPills.addEventListener('click', (e) => {
      const btn = e.target && typeof e.target.closest === 'function' ? e.target.closest('[data-cat]') : null;
      if (!btn || !category) return;
      category.value = btn.dataset.cat;
      syncPills();
    });
  }
  if (reasonPills && typeof reasonPills.addEventListener === 'function') {
    reasonPills.addEventListener('click', (e) => {
      const btn = e.target && typeof e.target.closest === 'function' ? e.target.closest('[data-reason]') : null;
      if (!btn || !reason) return;
      reason.value = btn.dataset.reason;
      reason.setCustomValidity('');
      syncPills();
    });
  }
  if (emailToggle && typeof emailToggle.addEventListener === 'function') {
    emailToggle.addEventListener('click', () => {
      const next = !!(emailPanel && emailPanel.hidden);
      setEmailExpanded(next);
      if (next && emailInput && typeof emailInput.focus === 'function') emailInput.focus();
    });
  }

  reason.addEventListener('change', () => { reason.setCustomValidity(''); syncPills(); });
  message.addEventListener('input', () => { message.setCustomValidity(''); syncCharCount(); });
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (sending) return;
    if (form.hasAttribute('data-netlify')) {
      status.textContent = 'Feedback is temporarily unavailable. Your message has not been sent.';
      status.className = 'feedback-error';
      return;
    }
    if (songReport && !reasons[reason.value]) {
      reason.setCustomValidity('Choose what is wrong with this song.');
      if (reasonPills && typeof reasonPills.scrollIntoView === 'function') {
        status.textContent = tr('fbPickReason', 'Please pick what is wrong with this song.');
        status.className = 'feedback-error';
      }
      form.reportValidity();
      return;
    }
    reason.setCustomValidity('');
    message.setCustomValidity(songReport || message.value.trim().length >= 5 ? '' : 'Please write at least 5 characters.');
    if (!form.reportValidity()) return;
    const body = new URLSearchParams(new FormData(form));
    body.set('message', message.value.trim());
    if (songReport) {
      body.set('category', 'bug');
      body.set('message', '[Song report: ' + reasons[reason.value] + ']' + (message.value.trim() ? '\n' + message.value.trim() : ''));
    }
    sending = true;
    fields.disabled = true;
    button.textContent = tr('fbSending', 'Sending…');
    status.textContent = tr('fbSendingNote', 'Sending your feedback…');
    status.className = '';
    try {
      const response = await fetch(form.getAttribute('action'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
        signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) throw new Error('Submission failed');
      if (form.hasAttribute('data-feedback-api') && (await response.json()).ok !== true) {
        throw new Error('Submission not confirmed');
      }
      form.reset();
      if (songReport) $('#feedbackDetails').value = body.get('game-details');
      drafts.delete(draftKey);
      setEmailExpanded(false);
      syncPills();
      syncCharCount();
      status.textContent = tr('fbSent', 'Thanks! Your feedback has been sent.');
      status.className = 'feedback-success';
    } catch (error) {
      status.textContent = tr('fbSendFail', 'Could not send your feedback. Your message is still here — please try again.');
      status.className = 'feedback-error';
    } finally {
      sending = false;
      fields.disabled = false;
      button.textContent = tr('sendFeedback', 'Send feedback');
    }
  });
})();

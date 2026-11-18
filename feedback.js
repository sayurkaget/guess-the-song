/* Feedback stays in the form until the server confirms receipt. */
(function () {
  'use strict';
  const form = document.querySelector('#feedbackForm');
  const fields = document.querySelector('#feedbackFields');
  const message = document.querySelector('#feedbackMessage');
  const status = document.querySelector('#feedbackStatus');
  const button = document.querySelector('#sendFeedback');
  const reason = document.querySelector('#feedbackReason');
  const reasons = { audio:'Audio does not play', live:'Live version', title:'Wrong song title or artist', other:'Other song issue' };
  const draftFields = ['feedbackMessage','feedbackDetails','feedbackEmail','feedbackCategory','feedbackReason'];
  const drafts = new Map();
  let draftKey = 'general', songReport = false;
  let sending = false;
  function show(details, report) {
    document.querySelector('#feedbackModal').hidden = false;
    if (sending) return;
    const key = report ? 'song:' + details : 'general';
    if (key !== draftKey) {
      drafts.set(draftKey, draftFields.map(id => document.querySelector('#'+id).value));
      form.reset();
      const saved = drafts.get(key);
      if (saved) draftFields.forEach((id,i) => document.querySelector('#'+id).value = saved[i]);
      else document.querySelector('#feedbackDetails').value = details || '';
      draftKey = key;
    } else if (!message.value && !report) document.querySelector('#feedbackDetails').value = details || '';
    songReport = report;
    document.querySelector('#feedbackTitle').textContent = report ? 'Report this song' : 'Send feedback';
    document.querySelector('#feedbackIntro').textContent = report ? 'What is wrong with this song? Its details are included below.' : 'Found a bug, missing a song, or have an idea? Let us know.';
    document.querySelector('#feedbackReasonField').hidden = !report;
    reason.disabled = !report; reason.required = report;
    document.querySelector('#feedbackCategoryField').hidden = report;
    document.querySelector('#feedbackMessageLabel').textContent = report ? 'Notes (optional)' : 'Message';
    message.required = !report; message.minLength = report ? 0 : 5; message.maxLength = report ? 2900 : 3000;
    message.setCustomValidity(''); reason.setCustomValidity('');
    status.textContent = ''; status.className = '';
    if (form.hasAttribute('data-netlify')) {
      status.textContent = 'Feedback is temporarily unavailable. Please come back later.';
      status.className = 'feedback-error';
    }
    (report ? reason : document.querySelector('#feedbackCategory')).focus();
  }
  window.PlayerFeedback = {
    open(details) { show(details, false); },
    openSong(details) { show(details, true); }
  };
  reason.addEventListener('change', () => reason.setCustomValidity(''));
  message.addEventListener('input', () => message.setCustomValidity(''));
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
      form.reportValidity(); return;
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
    sending = true; fields.disabled = true; button.textContent = 'Sending…';
    status.textContent = 'Sending your feedback…'; status.className = '';
    try {
      const response = await fetch(form.getAttribute('action'), {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(), signal: AbortSignal.timeout(15000)
      });
      if (!response.ok) throw new Error('Submission failed');
      if (form.hasAttribute('data-feedback-api') && (await response.json()).ok !== true) {
        throw new Error('Submission not confirmed');
      }
      form.reset();
      if (songReport) document.querySelector('#feedbackDetails').value = body.get('game-details');
      drafts.delete(draftKey);
      status.textContent = 'Thanks! Your feedback has been sent.';
      status.className = 'feedback-success';
    } catch (error) {
      status.textContent = 'Could not send your feedback. Your message is still here — please try again.';
      status.className = 'feedback-error';
    } finally {
      sending = false; fields.disabled = false; button.textContent = 'Send feedback';
    }
  });
})();
